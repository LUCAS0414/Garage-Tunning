const express       = require('express');
const router        = express.Router();
const ProdutoService = require('../services/produtosService');

router.get('/', async (req, res) => {
  try {
    const {
      categoria,
      busca,
      pagina    = 1,
      limite    = 20,
      apenasAtivos = 'true',
    } = req.query;

    const resultado = await ProdutoService.listar({
      categoria:    categoria || null,
      busca:        busca     || null,
      pagina:       parseInt(pagina),
      limite:       parseInt(limite),
      apenasAtivos: apenasAtivos !== 'false',
    });
    res.json(resultado);
  } catch (err) {
    console.error('[GET /api/produtos]', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const produto = await ProdutoService.buscarPorId(req.params.id);
    res.json(produto);
  } catch (err) {
    const status = err.message.includes('não encontrado') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await ProdutoService.criar(req.body);
    res.status(201).json({ id: result.insertId, mensagem: 'Produto criado com sucesso.' });
  } catch (err) {
    console.error('[POST /api/produtos]', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const resultado = await ProdutoService.atualizar(req.params.id, req.body);
    res.json(resultado);
  } catch (err) {
    const status = err.message.includes('não encontrado') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const resultado = await ProdutoService.remover(req.params.id);
    res.json(resultado);
  } catch (err) {
    const status = err.message.includes('não encontrado') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
