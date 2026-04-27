const express      = require('express');
const router       = express.Router();
const TrocaService = require('../services/trocaService');

// POST /api/trocas — Cliente solicita troca de um produto entregue
// Body: { clienteId, pedidoId, produtoId, quantidade, motivo }
router.post('/', async (req, res) => {
  const { clienteId, pedidoId, produtoId, quantidade, motivo } = req.body;

  if (!clienteId || !pedidoId || !produtoId || !motivo) {
    return res.status(400).json({
      error: 'clienteId, pedidoId, produtoId e motivo são obrigatórios.',
    });
  }

  try {
    const resultado = await TrocaService.solicitar(
      clienteId,
      pedidoId,
      produtoId,
      quantidade || 1,
      motivo
    );
    res.status(201).json(resultado);
  } catch (err) {
    console.error('[POST /api/trocas]', err.message);
    const status = err.message.includes('não encontrado') ||
                   err.message.includes('não pertence') ||
                   err.message.includes('ENTREGUE') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
