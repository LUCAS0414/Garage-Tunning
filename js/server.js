const express = require('express');
const ProdutoService = require('./services/produtosService');
const app = express();
app.use(express.json());

app.post('/api/produtos', async (req, res) => {
  try {
    const novoProd = await ProdutoService.criar(req.body);
    res.status(201).json({ id: novoProd.insertId });
  } catch (err) {
    res.status(500).send("Erro ao salvar");
  }
});