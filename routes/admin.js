const express        = require('express');
const router         = express.Router();
const bcrypt         = require('bcrypt');
const pool           = require('../db/config');
const PedidoService  = require('../services/pedidoService');
const TrocaService   = require('../services/trocaService');
const CupomService   = require('../services/cupomService');
const AdminService   = require('../services/adminService');

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios.' });

  try {
    const [[admin]] = await pool.execute(
      `SELECT id, nome, email, senha_hash, status, is_admin FROM clientes WHERE email = ? AND is_admin = 1`,
      [email]
    );

    if (!admin) return res.status(401).json({ error: 'Email ou senha incorretos.' });
    if (admin.status === 0) return res.status(403).json({ error: 'Conta inativada.' });

    const senhaOk = await bcrypt.compare(senha, admin.senha_hash);
    if (!senhaOk) return res.status(401).json({ error: 'Email ou senha incorretos.' });

    const { senha_hash, is_admin, ...dadosPublicos } = admin;
    res.json({ ...dadosPublicos, tipo: 'ADMIN', isAdmin: true });
  } catch (err) {
    console.error('[POST /api/admin/login]', err.message);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// DASHBOARD
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await AdminService.estatisticasDashboard();
    res.json(stats);
  } catch (err) {
    console.error('[GET /api/admin/dashboard]', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/distribuicao-status', async (req, res) => {
  try {
    const dados = await AdminService.distribuicaoStatus();
    res.json(dados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/historico-vendas', async (req, res) => {
  try {
    const hoje    = new Date().toISOString().split('T')[0];
    const seteDias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const {
      dataInicio   = seteDias,
      dataFim      = hoje,
      agrupamento  = 'dia',
    } = req.query;
    const resultado = await AdminService.historicoVendas(dataInicio, dataFim, agrupamento);
    res.json(resultado);
  } catch (err) {
    console.error('[GET /api/admin/historico-vendas]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PEDIDOS

router.get('/pedidos', async (req, res) => {
  try {
    const { status, busca, pagina = 1, limite = 20 } = req.query;
    const resultado = await PedidoService.listarAdmin({
      status:  status || null,
      busca:   busca  || null,
      pagina:  parseInt(pagina),
      limite:  parseInt(limite),
    });

    // Carregar itens de cada pedido para o admin-vendas.js
    for (const pedido of resultado.pedidos) {
      const [itens] = await pool.execute(
        `SELECT pi.quantidade, pi.preco_unitario,
                pr.nome AS nome_produto, pr.codigo AS codigo_produto
         FROM pedido_itens pi
         JOIN produtos pr ON pr.id = pi.produto_id
         WHERE pi.pedido_id = ?`,
        [pedido.id]
      );
      pedido.itens = itens;
    }
    res.json(resultado);
  } catch (err) {
    console.error('[GET /api/admin/pedidos]', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/pedidos/:id', async (req, res) => {
  try {
    const pedido = await PedidoService.detalhe(req.params.id);
    res.json(pedido);
  } catch (err) {
    const status = err.message.includes('não encontrado') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.put('/pedidos/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status é obrigatório.' });
  try {
    const resultado = await PedidoService.atualizarStatus(req.params.id, status);
    res.json(resultado);
  } catch (err) {
    const code = err.message.includes('inválida') || err.message.includes('não encontrado') ? 400 : 500;
    res.status(code).json({ error: err.message });
  }
});

// TROCAS
router.get('/trocas', async (req, res) => {
  try {
    const trocas = await TrocaService.listarAdmin({ status: req.query.status || null });
    res.json(trocas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/trocas/:trocaId/autorizar', async (req, res) => {
  try {
    const resultado = await TrocaService.autorizar(req.params.trocaId);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/trocas/:trocaId/negar', async (req, res) => {
  try {
    const resultado = await TrocaService.negar(req.params.trocaId);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/trocas/:trocaId/recebimento', async (req, res) => {
  try {
    const resultado = await TrocaService.confirmarRecebimento(
      req.params.trocaId,
      req.body.retornarEstoque === true
    );
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Atalhos para autorizar/negar troca por pedido_id (usado em admin-vendas.js)
router.put('/trocas/pedido/:pedidoId/autorizar', async (req, res) => {
  try {
    // Buscar troca pelo pedido
    const [[troca]] = await pool.execute(
      "SELECT id FROM solicitacoes_troca WHERE pedido_id = ? AND status = 'PENDENTE' LIMIT 1",
      [req.params.pedidoId]
    );
    if (!troca) return res.status(404).json({ error: 'Troca pendente não encontrada.' });
    const resultado = await TrocaService.autorizar(troca.id);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/trocas/pedido/:pedidoId/negar', async (req, res) => {
  try {
    const [[troca]] = await pool.execute(
      "SELECT id FROM solicitacoes_troca WHERE pedido_id = ? AND status = 'PENDENTE' LIMIT 1",
      [req.params.pedidoId]
    );
    if (!troca) return res.status(404).json({ error: 'Troca não encontrada.' });
    const resultado = await TrocaService.negar(troca.id);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/trocas/pedido/:pedidoId/recebimento', async (req, res) => {
  try {
    const [[troca]] = await pool.execute(
       "SELECT id, status FROM solicitacoes_troca WHERE pedido_id = ? AND status IN ('PENDENTE', 'AUTORIZADO') LIMIT 1",
      [req.params.pedidoId]
    );
    if (!troca) return res.status(404).json({ error: 'Troca não encontrada.' });
    if (troca.status === 'PENDENTE') {
      await TrocaService.autorizar(troca.id);
    }
    const resultado = await TrocaService.confirmarRecebimento(troca.id, req.body.retornarEstoque === true);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// CUPONS

router.get('/cupons', async (req, res) => {
  try {
    const cupons = await CupomService.listar();
    res.json(cupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cupons', async (req, res) => {
  try {
    const resultado = await CupomService.gerar(req.body);
    res.status(201).json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/cupons/:id', async (req, res) => {
  const { status } = req.body;
  if (status === undefined) return res.status(400).json({ error: 'Status é obrigatório.' });
  try {
    await pool.execute('UPDATE cupons SET status = ? WHERE id = ?', [status ? 1 : 0, req.params.id]);
    res.json({ mensagem: 'Cupom atualizado.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CLIENTES (lista para admin)
router.get('/clientes', async (req, res) => {
  try {
    const { busca, pagina = 1, limite = 20 } = req.query;
    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    const params = [];
    let where = '1=1';

    if (busca) {
      where += ' AND (nome LIKE ? OR email LIKE ? OR cpf LIKE ?)';
      const like = `%${busca}%`;
      params.push(like, like, like);
    }

    const [clientes] = await pool.execute(
      `SELECT id, codigo_cliente, nome, email, cpf, ranking, pontos_garagem, status, data_cadastro
       FROM clientes WHERE ${where} ORDER BY data_cadastro DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limite), offset]
    );
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM clientes WHERE ${where}`, params
    );
    res.json({ clientes, total, pagina: parseInt(pagina), limite: parseInt(limite) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PRODUTOS (admin — sem restrição de apenasAtivos)
router.get('/produtos', async (req, res) => {
  try {
    const ProdutoService = require('../services/produtosService');
    const resultado = await ProdutoService.listar({
      categoria:    req.query.categoria || null,
      busca:        req.query.busca     || null,
      pagina:       parseInt(req.query.pagina  || 1),
      limite:       parseInt(req.query.limite  || 100),
      apenasAtivos: false,
    });
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
