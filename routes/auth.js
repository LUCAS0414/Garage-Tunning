const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const pool    = require('../db/config');

// POST /api/login
// Body: { email, senha }
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios.' });

  try {
    const [[cliente]] = await pool.execute(
      `SELECT id, codigo_cliente, nome, email, senha_hash, genero,
              data_nascimento, cpf, telefone_tipo, telefone_ddd, telefone_numero,
              ranking, pontos_garagem, status
       FROM clientes WHERE email = ?`,
      [email]
    );

    if (!cliente) return res.status(401).json({ error: 'Email ou senha incorretos.' });
    if (cliente.status === 0) return res.status(403).json({ error: 'Conta inativada.' });

    const senhaOk = await bcrypt.compare(senha, cliente.senha_hash);
    if (!senhaOk) return res.status(401).json({ error: 'Email ou senha incorretos.' });

    const { senha_hash, ...dadosPublicos } = cliente;
    res.json({ ...dadosPublicos, tipo: 'CLIENTE' });
  } catch (err) {
    console.error('[POST /api/login]', err.message);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// POST /api/cadastro
// Body: { nome, email, cpf, dataNascimento, genero, senha, logradouro, numero, cep, bairro, cidade, estado, telefone_tipo, telefone_ddd, telefone_numero }
router.post('/cadastro', async (req, res) => {
  const {
    nome, email, cpf, dataNascimento, genero, senha,
    logradouro, numero, cep, bairro, cidade, estado,
    telefone_tipo, telefone_ddd, telefone_numero,
  } = req.body;

  if (!nome || !email || !cpf || !senha) {
    return res.status(400).json({ error: 'Nome, email, CPF e senha são obrigatórios.' });
  }

  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();

    // Verificar duplicidade
    const [[emailExiste]] = await conexao.execute(
      'SELECT id FROM clientes WHERE email = ?', [email]
    );
    if (emailExiste) {
      await conexao.rollback();
      return res.status(409).json({ error: 'E-mail já cadastrado.' });
    }
    const [[cpfExiste]] = await conexao.execute(
      'SELECT id FROM clientes WHERE cpf = ?', [cpf]
    );
    if (cpfExiste) {
      await conexao.rollback();
      return res.status(409).json({ error: 'CPF já cadastrado.' });
    }

    const senhaHash     = await bcrypt.hash(senha, 10);
    const codigoCliente = 'CLI-' + Date.now().toString(36).toUpperCase();

    const [result] = await conexao.execute(
      `INSERT INTO clientes
         (codigo_cliente, nome, genero, data_nascimento, cpf,
          telefone_tipo, telefone_ddd, telefone_numero,
          email, senha_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codigoCliente, nome, genero || 'Nao Informado',
        dataNascimento || null, cpf,
        telefone_tipo || 'Celular', telefone_ddd || '', telefone_numero || '',
        email, senhaHash,
      ]
    );

    const clienteId = result.insertId;

    // Endereço principal se fornecido
    if (logradouro && bairro && cidade && estado) {
      await conexao.execute(
        `INSERT INTO enderecos_cliente
           (cliente_id, identificacao, tipo_endereco, tipo_residencia, tipo_logradouro,
            logradouro, numero, bairro, cep, cidade, estado, pais)
         VALUES (?, 'Endereço Principal', 'AMBOS', 'NAO_INFORMADO', 'NAO_INFORMADO', ?, ?, ?, ?, ?, ?, 'Brasil')`,
        [clienteId, logradouro, numero || 'S/N', bairro, cep || '', cidade, estado]
      );
    }

    await conexao.commit();
    res.status(201).json({ id: clienteId, codigo_cliente: codigoCliente, nome, email });
  } catch (err) {
    await conexao.rollback();
    console.error('[POST /api/cadastro]', err.message);
    res.status(500).json({ error: 'Erro ao criar cadastro.' });
  } finally {
    conexao.release();
  }
});

module.exports = router;
