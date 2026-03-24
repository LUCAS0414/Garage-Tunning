const express   = require('express');
const cors      = require('cors');
const bcrypt    = require('bcrypt');
const pool      = require('../js/db/config.js');
const ClienteService  = require('./services/clienteServices');
const ProdutoService  = require('./services/produtosService');

const app = express();
app.use(cors());
app.use(express.json());

//  PRODUTOS
app.post('/api/produtos', async (req, res) => {
  try {
    const novo = await ProdutoService.criar(req.body);
    res.status(201).json({ id: novo.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar produto', detalhe: err.message });
  }
});

//  CADASTRO (cria cliente + endereço numa transação)
app.post('/api/cadastro', async (req, res) => {
  const { nome, email, cpf, dataNascimento, genero, senha,
          logradouro, numero, cep, bairro, cidade, estado,
          telefone_tipo, telefone_ddd, telefone_numero } = req.body;

  if (dataNascimento) {
    const hoje = new Date();
    const dtNasc = new Date(dataNascimento);
    let idade = hoje.getFullYear() - dtNasc.getFullYear();
    const m = hoje.getMonth() - dtNasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < dtNasc.getDate())) {
      idade--;
    }
    if (idade < 18) {
      return res.status(400).json({ error: 'É necessário ter 18 anos ou mais para se cadastrar.' });
    }
  }

  let conexao;
  try {
    conexao = await pool.getConnection();
    await conexao.beginTransaction();

    const senhaHash      = await bcrypt.hash(senha, await bcrypt.genSalt(10));
    const codigoCliente  = 'CLI-' + Date.now().toString(36).toUpperCase();

    const [resultCli] = await conexao.execute(
      `INSERT INTO clientes (codigo_cliente, nome, email, cpf, data_nascimento, genero, senha_hash, telefone_tipo, telefone_ddd, telefone_numero)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigoCliente, nome, email, cpf, dataNascimento, genero, senhaHash, telefone_tipo || 'Celular', telefone_ddd || '', telefone_numero || '']
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

    const usuario  = usuarios[0];
    const senhaOk  = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaOk) return res.status(401).json({ error: 'Email ou senha incorretos.' });

    res.json({ id: usuario.id, nome: usuario.nome, email: usuario.email, ranking: usuario.ranking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao fazer login', detalhe: error.message });
  }
});

// ================================================================
//  CLIENTES — CRUD
// ================================================================

// Buscar perfil completo (dados + endereços + cartões)
app.get('/api/clientes/:id', async (req, res) => {
  try {
    const dados = await ClienteService.buscarPorId(req.params.id);
    res.json(dados);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Atualizar dados básicos (nome, gênero, telefone)
app.put('/api/clientes/:id', async (req, res) => {
  try {
    const resultado = await ClienteService.atualizar(req.params.id, req.body);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Alterar senha
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

// Inativar conta (soft delete)
app.delete('/api/clientes/:id', async (req, res) => {
  try {
    const resultado = await ClienteService.inativar(req.params.id);
    res.json(resultado);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// ================================================================
//  ENDEREÇOS — CRUD
// ================================================================

// Listar endereços do cliente
app.get('/api/clientes/:id/enderecos', async (req, res) => {
  try {
    const enderecos = await ClienteService.listarEnderecos(req.params.id);
    res.json(enderecos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Adicionar endereço
app.post('/api/clientes/:id/enderecos', async (req, res) => {
  try {
    const resultado = await ClienteService.adicionarEndereco(req.params.id, req.body);
    res.status(201).json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Atualizar endereço
app.put('/api/clientes/:id/enderecos/:endId', async (req, res) => {
  try {
    const resultado = await ClienteService.atualizarEndereco(req.params.endId, req.params.id, req.body);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Remover endereço
app.delete('/api/clientes/:id/enderecos/:endId', async (req, res) => {
  try {
    const resultado = await ClienteService.removerEndereco(req.params.endId, req.params.id);
    res.json(resultado);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// ================================================================
//  CARTÕES — CRUD
// ================================================================

// Listar cartões
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

// Adicionar cartão
app.post('/api/clientes/:id/cartoes', async (req, res) => {
  const { numero_cartao, nome_impresso, bandeira, is_preferencial } = req.body;
  const clienteId = req.params.id;
  const conexao = await pool.getConnection();
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

// Remover cartão
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

// ================================================================
app.listen(3000, () => console.log('Servidor rodando na porta 3000'));