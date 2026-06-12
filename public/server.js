
const express  = require('express');
const cors     = require('cors');
const bcrypt   = require('bcrypt');
const path     = require('path');

const pool           = require('./db/config.js');
const ClienteService = require('./services/clienteServices');
const ProdutoService = require('./services/produtosService');
const CarrinhoService= require('./services/carrinhoService');
const CupomService   = require('./services/cupomService');
const PedidoService  = require('./services/pedidoService');
const TrocaService   = require('./services/trocaService');
const AdminService   = require('./services/adminService');
const { iniciarJobReservas, iniciarJobAbandonoCarrinho } = require('./services/jobs');

const app = express();
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos (front-end)
const ROOT = path.join(__dirname, '..');
app.use('/html', express.static(path.join(ROOT, 'html')));
app.use('/css',  express.static(path.join(ROOT, 'css')));
app.use('/js/public', express.static(path.join(__dirname, 'public')));

// PRODUTOS

// Listar produtos com filtros (categoria, busca, paginação)
app.get('/api/produtos', async (req, res) => {
  try {
    const { categoria, busca, pagina, limite } = req.query;
    const dados = await ProdutoService.listar({
      categoria,
      busca,
      pagina:  pagina  ? parseInt(pagina)  : 1,
      limite:  limite  ? parseInt(limite)  : 20,
      apenasAtivos: true,
    });
    res.json(dados);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar produtos', detalhe: err.message });
  }
});

// DETALHE DO PRODUTO
app.get('/api/produtos/:id', async (req, res) => {
  try {
    const produto = await ProdutoService.buscarPorId(req.params.id);
    res.json(produto);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// CRIAR PRODUTO (ADMIN)
app.post('/api/produtos', async (req, res) => {
  try {
    const novo = await ProdutoService.criar(req.body);
    res.status(201).json({ id: novo.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar produto', detalhe: err.message });
  }
});

// ATUALIZAR PRODUTO (ADMIN)
app.put('/api/produtos/:id', async (req, res) => {
  try {
    const resultado = await ProdutoService.atualizar(req.params.id, req.body);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Remover produto - soft delete (admin)
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const resultado = await ProdutoService.remover(req.params.id);
    res.json(resultado);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Carrinho  (rf0031, rf0032, rn0031, rn0032, rn0044)

// VER CARRINHO
app.get('/api/carrinho/:clienteId', async (req, res) => {
  try {
    const itens = await CarrinhoService.obter(req.params.clienteId);
    res.json(itens);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar carrinho', detalhe: err.message });
  }
});

// Adicionar item ao carrinho
app.post('/api/carrinho/:clienteId', async (req, res) => {
  try {
    const { produtoId, quantidade } = req.body;
    if (!produtoId) return res.status(400).json({ error: 'produtoId é obrigatório.' });
    const resultado = await CarrinhoService.adicionar(
      req.params.clienteId, produtoId, quantidade || 1
    );
    res.status(201).json(resultado);
  } catch (err) {
    // Rn0031: estoque insuficiente retorna 409
    const status = err.message.includes('Estoque') ? 409 : 400;
    res.status(status).json({ error: err.message });
  }
});

// Atualizar quantidade de item no carrinho (rf0032)
app.put('/api/carrinho/:clienteId/:produtoId', async (req, res) => {
  try {
    const { quantidade } = req.body;
    if (!quantidade) return res.status(400).json({ error: 'quantidade é obrigatória.' });
    const resultado = await CarrinhoService.atualizarQuantidade(
      req.params.clienteId, req.params.produtoId, parseInt(quantidade)
    );
    res.json(resultado);
  } catch (err) {
    const status = err.message.includes('Estoque') ? 409 : 400;
    res.status(status).json({ error: err.message });
  }
});

// Remover item do carrinho
app.delete('/api/carrinho/:clienteId/:produtoId', async (req, res) => {
  try {
    const resultado = await CarrinhoService.remover(req.params.clienteId, req.params.produtoId);
    res.json(resultado);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// LIMPAR CARRINHO INTEIRO
app.delete('/api/carrinho/:clienteId', async (req, res) => {
  try {
    const resultado = await CarrinhoService.limpar(req.params.clienteId);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validar disponibilidade dos itens do carrinho (antes do checkout — rn0032)
app.get('/api/carrinho/:clienteId/validar', async (req, res) => {
  try {
    const resultado = await CarrinhoService.verificarValidade(req.params.clienteId);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FRETE (RF0034)

// Calcular frete com base nos itens do carrinho e no cep
app.post('/api/frete/calcular', async (req, res) => {
  try {
    const { clienteId, enderecoId } = req.body;

    // Buscar configuração de frete
    const [[cfgGratis]] = await pool.execute(
      "SELECT valor FROM configuracoes WHERE chave = 'frete_gratis_acima'"
    );
    const [[cfgFixo]] = await pool.execute(
      "SELECT valor FROM configuracoes WHERE chave = 'frete_fixo'"
    );
    const limiteGratis = cfgGratis ? parseFloat(cfgGratis.valor) : 500;
    const freteFixo    = cfgFixo   ? parseFloat(cfgFixo.valor)   : 49.90;

    // Buscar itens do carrinho para calcular subtotal
    const itens = await CarrinhoService.obter(clienteId);
    if (itens.length === 0) return res.json({ frete: 0, motivo: 'Carrinho vazio' });

    const subtotal = itens.reduce((s, i) => s + parseFloat(i.preco) * i.quantidade, 0);

    // Lógica de frete: grátis acima do limiar, fixo abaixo
    // (em produção: integrar com api dos correios via cep e peso total)
    const pesoTotal = itens.reduce((s, i) => s + parseFloat(i.peso_kg || 0.5) * i.quantidade, 0);
    let frete = subtotal >= limiteGratis ? 0 : freteFixo;

    // Ajuste por peso (simplificado: r$2 por kg acima de 10kg)
    if (pesoTotal > 10 && frete > 0) {
      frete += (pesoTotal - 10) * 2;
    }

    res.json({
      frete:        parseFloat(frete.toFixed(2)),
      subtotal:     parseFloat(subtotal.toFixed(2)),
      pesoTotal:    parseFloat(pesoTotal.toFixed(2)),
      freteGratis:  subtotal >= limiteGratis,
      limiteGratis,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao calcular frete', detalhe: err.message });
  }
});

// Cupons (rf0044, rn0036, rn0037, rn0047)

// Validar cupom antes de aplicar
app.post('/api/cupons/validar', async (req, res) => {
  try {
    const { codigo, clienteId, total } = req.body;
    if (!codigo || !clienteId || total === undefined) {
      return res.status(400).json({ error: 'codigo, clienteId e total são obrigatórios.' });
    }
    const resultado = await CupomService.validar(codigo, clienteId, total);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao validar cupom', detalhe: err.message });
  }
});

// Admin: criar cupom manual
app.post('/api/admin/cupons', async (req, res) => {
  try {
    const resultado = await CupomService.gerar(req.body);
    res.status(201).json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: listar todos os cupons
app.get('/api/admin/cupons', async (req, res) => {
  try {
    const cupons = await CupomService.listar();
    res.json(cupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pedidos (rf0033, rf0037, rf0038, rf0039, rn0034, rn0035)

// Finalizar compra (checkout completo)
app.post('/api/pedidos', async (req, res) => {
  try {
    const resultado = await PedidoService.criar(req.body);
    res.status(201).json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Pedidos do cliente (meus pedidos)
app.get('/api/pedidos/cliente/:clienteId', async (req, res) => {
  try {
    const pedidos = await PedidoService.listarPorCliente(req.params.clienteId);
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Detalhe de um pedido específico
app.get('/api/pedidos/:pedidoId', async (req, res) => {
  try {
    const pedido = await PedidoService.detalhe(req.params.pedidoId);
    res.json(pedido);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Admin: listar todos os pedidos com filtros
app.get('/api/admin/pedidos', async (req, res) => {
  try {
    const { status, busca, pagina, limite } = req.query;
    const dados = await PedidoService.listarAdmin({
      status,
      busca,
      pagina:  pagina  ? parseInt(pagina)  : 1,
      limite:  limite  ? parseInt(limite)  : 20,
    });
    res.json(dados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: atualizar status do pedido (despachar, confirmar entrega, etc.)
app.patch('/api/admin/pedidos/:pedidoId/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status é obrigatório.' });
    const resultado = await PedidoService.atualizarStatus(req.params.pedidoId, status);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Trocas (rf0040, rf0041, rf0042, rf0043, rn0036)

// CLIENTE SOLICITA TROCA

app.post('/api/trocas', async (req, res) => {
  try {
    const { clienteId, pedidoId, produtoId, quantidade, motivo } = req.body;
    if (!clienteId || !pedidoId || !produtoId || !motivo) {
      return res.status(400).json({ error: 'clienteId, pedidoId, produtoId e motivo são obrigatórios.' });
    }
// Rotas do banco de dados corrigidas
    const resultado = await TrocaService.solicitar(clienteId, pedidoId, produtoId, quantidade || 1, motivo);
    res.status(201).json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ADMIN: LISTAR TROCAS
app.get('/api/admin/trocas', async (req, res) => {
  try {
    const trocas = await TrocaService.listarAdmin({ status: req.query.status });
    res.json(trocas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: autorizar troca (rf0042)
app.patch('/api/admin/trocas/:trocaId/autorizar', async (req, res) => {
  try {
    const resultado = await TrocaService.autorizar(req.params.trocaId, req.body.adminId);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ADMIN: NEGAR TROCA
app.patch('/api/admin/trocas/:trocaId/negar', async (req, res) => {
  try {
    const resultado = await TrocaService.negar(req.params.trocaId, req.body.adminId);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: confirmar recebimento dos itens devolvidos (rf0043)
app.patch('/api/admin/trocas/:trocaId/receber', async (req, res) => {
  try {
    const { adminId, retornarEstoque } = req.body;
    const resultado = await TrocaService.confirmarRecebimento(
      req.params.trocaId,
      adminId,
      retornarEstoque === true || retornarEstoque === 'true'
    );
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Análise / admin (rf0055, rnf0043)

// DASHBOARD STATS
app.get('/api/admin/stats', async (req, res) => {
  try {
    const stats = await AdminService.estatisticasDashboard();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Histórico de vendas para gráfico de linhas
app.get('/api/admin/analise', async (req, res) => {
  try {
    const { inicio, fim, agrupamento } = req.query;
    // Padrão: últimos 30 dias
    const dataFim    = fim    || new Date().toISOString().split('T')[0];
    const dataInicio = inicio || (() => {
      const d = new Date(); d.setDate(d.getDate() - 30);
      return d.toISOString().split('T')[0];
    })();
    const dados = await AdminService.historicoVendas(dataInicio, dataFim, agrupamento || 'dia');
    res.json(dados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DISTRIBUIÇÃO POR STATUS
app.get('/api/admin/analise/status', async (req, res) => {
  try {
    const dados = await AdminService.distribuicaoStatus();
    res.json(dados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CADASTRO
app.post('/api/cadastro', async (req, res) => {
  const { nome, email, cpf, dataNascimento, genero, senha,
          logradouro, numero, cep, bairro, cidade, estado,
          telefone_tipo, telefone_ddd, telefone_numero } = req.body;

  if (dataNascimento) {
    const hoje  = new Date();
    const dtNasc= new Date(dataNascimento);
    let idade   = hoje.getFullYear() - dtNasc.getFullYear();
    const m     = hoje.getMonth() - dtNasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < dtNasc.getDate())) idade--;
    if (idade < 18) {
      return res.status(400).json({ error: 'É necessário ter 18 anos ou mais para se cadastrar.' });
    }
  }

  let conexao;
  try {
    conexao = await pool.getConnection();
    await conexao.beginTransaction();

    const senhaHash     = await bcrypt.hash(senha, await bcrypt.genSalt(10));
    const codigoCliente = 'CLI-' + Date.now().toString(36).toUpperCase();

    const [resultCli] = await conexao.execute(
      `INSERT INTO clientes (codigo_cliente, nome, email, cpf, data_nascimento, genero, senha_hash, telefone_tipo, telefone_ddd, telefone_numero)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigoCliente, nome, email, cpf, dataNascimento, genero, senhaHash,
       telefone_tipo || 'Celular', telefone_ddd || '', telefone_numero || '']
    );
    const clienteId = resultCli.insertId;

    await conexao.execute(
      `INSERT INTO enderecos_cliente
         (cliente_id, identificacao, tipo_endereco, tipo_residencia, tipo_logradouro,
          logradouro, numero, bairro, cep, cidade, estado, pais, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clienteId, 'Endereço Principal', 'AMBOS', 'NAO_INFORMADO', 'NAO_INFORMADO',
       logradouro, numero, bairro, cep, cidade, estado, 'Brasil', '']
    );

    await conexao.commit();
    res.status(201).json({ message: 'Usuário cadastrado com sucesso!', id: clienteId });
  } catch (error) {
    if (conexao) await conexao.rollback();
    console.error(error);
    res.status(500).json({ error: 'Erro ao cadastrar', detalhe: error.message });
  } finally {
    if (conexao) conexao.release();
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios.' });

  try {
    const [usuarios] = await pool.execute(
      'SELECT id, nome, email, senha_hash, ranking FROM clientes WHERE email = ? AND status = TRUE',
      [email]
    );
    if (usuarios.length === 0) return res.status(401).json({ error: 'Email ou senha incorretos.' });

    const usuario = usuarios[0];
    const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaOk) return res.status(401).json({ error: 'Email ou senha incorretos.' });

    res.json({ id: usuario.id, nome: usuario.nome, email: usuario.email, ranking: usuario.ranking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao fazer login', detalhe: error.message });
  }
});

// CLIENTES — CRUD
app.get('/api/clientes/:id', async (req, res) => {
  try {
    const dados = await ClienteService.buscarPorId(req.params.id);
    res.json(dados);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

app.put('/api/clientes/:id', async (req, res) => {
  try {
    const resultado = await ClienteService.atualizar(req.params.id, req.body);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/clientes/:id/senha', async (req, res) => {
  try {
    const { novaSenha } = req.body;
    if (!novaSenha) return res.status(400).json({ error: 'novaSenha é obrigatório.' });
    const resultado = await ClienteService.alterarSenha(req.params.id, novaSenha);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/clientes/:id', async (req, res) => {
  try {
    const resultado = await ClienteService.inativar(req.params.id);
    res.json(resultado);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// ENDEREÇOS — CRUD
app.get('/api/clientes/:id/enderecos', async (req, res) => {
  try {
    const enderecos = await ClienteService.listarEnderecos(req.params.id);
    res.json(enderecos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clientes/:id/enderecos', async (req, res) => {
  try {
    const resultado = await ClienteService.adicionarEndereco(req.params.id, req.body);
    res.status(201).json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/clientes/:id/enderecos/:endId', async (req, res) => {
  try {
    const resultado = await ClienteService.atualizarEndereco(req.params.endId, req.params.id, req.body);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/clientes/:id/enderecos/:endId', async (req, res) => {
  try {
    const resultado = await ClienteService.removerEndereco(req.params.endId, req.params.id);
    res.json(resultado);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// CARTÕES — CRUD
app.get('/api/clientes/:id/cartoes', async (req, res) => {
  try {
    const [cartoes] = await pool.execute(
      'SELECT id, numero_cartao, nome_impresso, bandeira, is_preferencial FROM cartoes_cliente WHERE cliente_id = ?',
      [req.params.id]
    );
    res.json(cartoes);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar cartões', detalhe: err.message });
  }
});

app.post('/api/clientes/:id/cartoes', async (req, res) => {
  const { numero_cartao, nome_impresso, bandeira, is_preferencial } = req.body;
  const clienteId = req.params.id;
  const conexao   = await pool.getConnection();
  try {
    await conexao.beginTransaction();
    if (is_preferencial) {
      await conexao.execute(
        'UPDATE cartoes_cliente SET is_preferencial = 0 WHERE cliente_id = ?', [clienteId]
      );
    }
    const [result] = await conexao.execute(
      'INSERT INTO cartoes_cliente (cliente_id, numero_cartao, nome_impresso, bandeira, is_preferencial) VALUES (?, ?, ?, ?, ?)',
      [clienteId, numero_cartao, nome_impresso, bandeira, is_preferencial ? 1 : 0]
    );
    await conexao.commit();
    res.status(201).json({ message: 'Cartão adicionado com sucesso!', id: result.insertId });
  } catch (err) {
    await conexao.rollback();
    res.status(500).json({ error: 'Erro ao adicionar cartão', detalhe: err.message });
  } finally {
    conexao.release();
  }
});

app.delete('/api/clientes/:id/cartoes/:cartaoId', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM cartoes_cliente WHERE id = ? AND cliente_id = ?',
      [req.params.cartaoId, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Cartão não encontrado.' });
    res.json({ message: 'Cartão removido com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover cartão', detalhe: err.message });
  }
});

// Iniciar servidor + jobs
const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
  console.log(`\n🚗 Garage-Tunning API rodando na porta ${PORTA}`);
  console.log(`   http://localhost:${PORTA}/api/produtos\n`);

  // INICIAR JOBS AUTOMÁTICOS
  iniciarJobReservas();
  iniciarJobAbandonoCarrinho();
});