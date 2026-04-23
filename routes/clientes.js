const express        = require('express');
const router         = express.Router();
const bcrypt         = require('bcrypt');
const pool           = require('../db/config');
const ClienteService = require('../services/clienteServices');

// GET /api/clientes/:id — perfil completo com endereços e cartões
router.get('/:id', async (req, res) => {
  try {
    const cliente = await ClienteService.buscarPorId(req.params.id);
    res.json(cliente);
  } catch (err) {
    const status = err.message.includes('não encontrado') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

// PUT /api/clientes/:id — atualizar dados pessoais
router.put('/:id', async (req, res) => {
  try {
    const resultado = await ClienteService.atualizar(req.params.id, req.body);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/clientes/:id/senha — alterar senha
router.put('/:id/senha', async (req, res) => {
  const { novaSenha } = req.body;
  if (!novaSenha || novaSenha.length < 6) {
    return res.status(400).json({ error: 'Senha muito curta (mínimo 6 caracteres).' });
  }
  try {
    const resultado = await ClienteService.alterarSenha(req.params.id, novaSenha);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/clientes/:id/conta — inativar conta
router.delete('/:id/conta', async (req, res) => {
  try {
    const resultado = await ClienteService.inativar(req.params.id);
    res.json(resultado);
  } catch (err) {
    const status = err.message.includes('não encontrado') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

// ---- ENDEREÇOS ----

// GET /api/clientes/:id/enderecos
router.get('/:id/enderecos', async (req, res) => {
  try {
    const enderecos = await ClienteService.listarEnderecos(req.params.id);
    res.json(enderecos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clientes/:id/enderecos
router.post('/:id/enderecos', async (req, res) => {
  try {
    const resultado = await ClienteService.adicionarEndereco(req.params.id, req.body);
    res.status(201).json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/clientes/:id/enderecos/:endId
router.delete('/:id/enderecos/:endId', async (req, res) => {
  try {
    const resultado = await ClienteService.removerEndereco(req.params.endId, req.params.id);
    res.json(resultado);
  } catch (err) {
    const status = err.message.includes('não encontrado') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

// ---- CARTÕES ----

// POST /api/clientes/:id/cartoes
router.post('/:id/cartoes', async (req, res) => {
  const { numero_cartao, nome_impresso, bandeira, is_preferencial } = req.body;
  if (!numero_cartao || !nome_impresso) {
    return res.status(400).json({ error: 'Número e nome do cartão são obrigatórios.' });
  }
  try {
    const [result] = await pool.execute(
      `INSERT INTO cartoes_cliente (cliente_id, numero_cartao, nome_impresso, bandeira, cvv, is_preferencial)
       VALUES (?, ?, ?, ?, '', ?)`,
      [req.params.id, numero_cartao.replace(/\D/g,''), nome_impresso,
       bandeira || 'VISA', is_preferencial ? 1 : 0]
    );
    res.status(201).json({ id: result.insertId, mensagem: 'Cartão adicionado.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/clientes/:id/cartoes/:cartaoId
router.delete('/:id/cartoes/:cartaoId', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM cartoes_cliente WHERE id = ? AND cliente_id = ?',
      [req.params.cartaoId, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Cartão não encontrado.' });
    res.json({ mensagem: 'Cartão removido.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
