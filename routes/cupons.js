const express      = require('express');
const router       = express.Router();
const CupomService = require('../services/cupomService');

// POST /api/cupons/validar
// Body: { codigo, clienteId, total }
router.post('/validar', async (req, res) => {
  const { codigo, clienteId, total } = req.body;
  if (!codigo) return res.status(400).json({ valido: false, motivo: 'Código do cupom não informado.' });

  try {
    const resultado = await CupomService.validar(codigo, clienteId || 0, parseFloat(total) || 0);
    if (!resultado.valido) {
      return res.status(400).json(resultado);
    }
    res.json(resultado);
  } catch (err) {
    console.error('[POST /api/cupons/validar]', err.message);
    res.status(500).json({ valido: false, motivo: 'Erro ao validar cupom.' });
  }
});

module.exports = router;
