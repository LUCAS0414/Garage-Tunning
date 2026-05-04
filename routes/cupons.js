const express      = require('express');
const router       = express.Router();
const CupomService = require('../services/cupomService');
const pool         = require('../db/config');

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

// GET /api/cupons/meus?clienteId=X
// Retorno de todos os cupons vinculados ao cliente
router.get('/meus', async (req, res) => {
  const { clienteId } = req.query;
  if (!clienteId) return res.status(400).json({ error: 'clienteId é obrigatório.' });

  try {
    const [cupons] = await pool.execute(
      `SELECT id, codigo, valor, tipo_cupom, data_validade, status
       FROM cupons
       WHERE usuario_id = ?
       ORDER BY id DESC`,
      [clienteId]
    );
    res.json(cupons);
  } catch (err) {
    console.error('[GET /api/cupons/meus]', err.message);
    res.status(500).json({ error: 'Erro ao buscar cupons.' });
  }
});

module.exports = router;
