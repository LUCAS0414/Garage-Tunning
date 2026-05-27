const express      = require('express');
const router       = express.Router();
const TrocaService = require('../services/trocaService');

// POST /api/trocas
// Body novo:    { clienteId, pedidoId, itens: [{produtoId, quantidade}], motivo }
// Body legado:  { clienteId, pedidoId, produtoId, quantidade, motivo }
router.post('/', async (req, res) => {
  const { clienteId, pedidoId, itens, produtoId, quantidade, motivo } = req.body;

  if (!clienteId || !pedidoId || !motivo) {
    return res.status(400).json({ error: 'clienteId, pedidoId e motivo são obrigatórios.' });
  }

  // Normaliza para array
  const listaItens = Array.isArray(itens) && itens.length > 0
    ? itens
    : [{ produtoId, quantidade: quantidade || 1 }];

  if (listaItens.some(i => !i.produtoId)) {
    return res.status(400).json({ error: 'Cada item precisa ter produtoId.' });
  }

  try {
    const resultados = [];
    for (const item of listaItens) {
      const r = await TrocaService.solicitar(
        clienteId, pedidoId, item.produtoId, item.quantidade || 1, motivo
      );
      resultados.push(r);
    }
    res.status(201).json(resultados.length === 1 ? resultados[0] : resultados);
  } catch (err) {
    console.error('[POST /api/trocas]', err.message);
    const status = err.message.includes('não encontrado') ||
                   err.message.includes('não pertence')  ||
                   err.message.includes('ENTREGUE') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;