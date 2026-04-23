const express        = require('express');
const router         = express.Router();
const PedidoService  = require('../services/pedidoService');

// POST /api/pedidos
// Body: { usuarioId, enderecoId, frete, cupomCodigo?, itens: [{produtoId, quantidade}] }
router.post('/', async (req, res) => {
  try {
    const resultado = await PedidoService.criar(req.body);
    res.status(201).json(resultado);
  } catch (err) {
    console.error('[POST /api/pedidos]', err.message);
    const status = err.message.includes('insuficiente') || err.message.includes('inválido') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

// GET /api/pedidos/:usuarioId — pedidos do cliente
router.get('/:usuarioId', async (req, res) => {
  try {
    const pedidos = await PedidoService.listarPorCliente(req.params.usuarioId);
    res.json(pedidos);
  } catch (err) {
    console.error('[GET /api/pedidos/:usuarioId]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pedidos/detalhe/:id — detalhe de um pedido
router.get('/detalhe/:id', async (req, res) => {
  try {
    const pedido = await PedidoService.detalhe(req.params.id);
    res.json(pedido);
  } catch (err) {
    const status = err.message.includes('não encontrado') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
