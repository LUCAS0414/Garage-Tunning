const express        = require('express');
const router         = express.Router();
const bcrypt         = require('bcrypt');
const pool           = require('../db/config');
const ClienteService = require('../services/clienteServices');

// GET /api/clientes/:id — perfil completo com endereços e cartões
// Também suporta :id como e-mail (ex: /api/clientes/abner@gmail.com)
router.get('/:id', async (req, res) => {
  try {
    const cliente = await ClienteService.buscarPorId(req.params.id);
    res.json(cliente);
  } catch (err) {
    const status = err.message.includes('não encontrado') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

// GET /api/clientes/:id/pedidos — pedidos do cliente (suporta ID numérico ou e-mail)
router.get('/:id/pedidos', async (req, res) => {
  const PedidoService = require('../services/pedidoService');
  try {
    let clienteId = req.params.id;

    // Se o parâmetro parece um e-mail, resolve para o ID numérico primeiro
    if (clienteId.includes('@')) {
      const [[cliente]] = await pool.execute(
        'SELECT id FROM clientes WHERE email = ?', [clienteId]
      );
      if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado.' });
      clienteId = cliente.id;
    }

    const pedidos = await PedidoService.listarPorCliente(clienteId);
    res.json(pedidos);
  } catch (err) {
    console.error('[GET /api/clientes/:id/pedidos]', err.message);
    res.status(500).json({ error: err.message });
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
