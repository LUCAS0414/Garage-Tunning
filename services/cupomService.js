// cupomService.js
// Schema novo da tabela cupons: id, codigo, valor, tipo_cupom, data_validade, status, usuario_id
// Removidos: usos_maximos, usos_atuais, descricao, origem, ativo, cliente_id
// Removida tabela: cupons_uso
const pool = require('../db/config');

const CupomService = {

  async validar(codigo, clienteId, totalPedido) {
    const [[cupom]] = await pool.execute(
      `SELECT * FROM cupons WHERE codigo = UPPER(?) AND status = 1`, [codigo]
    );
    if (!cupom) return { valido: false, motivo: 'Cupom inválido ou expirado.' };

    // Verificar validade — coluna: data_validade
    if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) {
      return { valido: false, motivo: 'Cupom expirado.' };
    }

    // Cupom pessoal — coluna: usuario_id
    if (cupom.usuario_id && cupom.usuario_id !== parseInt(clienteId)) {
      return { valido: false, motivo: 'Cupom não pertence a este cliente.' };
    }

    // tipo_cupom em MAIÚSCULO no banco — normalizar
    const tipoNorm = (cupom.tipo_cupom || '').toLowerCase();
    let desconto = 0;
    if (tipoNorm === 'percentual') {
      desconto = totalPedido * (cupom.valor / 100);
    } else {
      desconto = Math.min(cupom.valor, totalPedido);
    }

    return {
      valido: true,
      cupom: {
        id:     cupom.id,
        codigo: cupom.codigo,
        tipo:   tipoNorm,
        valor:  cupom.valor,
      },
      desconto: parseFloat(desconto.toFixed(2)),
    };
  },

  // Admin cria cupom manual.
  async gerar({ codigo, tipo, valor, data_validade, usuario_id }) {
    if (!codigo || !tipo || !valor) throw new Error('Código, tipo e valor são obrigatórios.');
    const [result] = await pool.execute(
      `INSERT INTO cupons (codigo, valor, tipo_cupom, data_validade, status, usuario_id)
       VALUES (UPPER(?), ?, UPPER(?), ?, 1, ?)`,
      [codigo, valor, tipo, data_validade || null, usuario_id || null]
    );
    return { id: result.insertId, codigo: codigo.toUpperCase() };
  },

  // Inativa cupom após uso (chamado dentro de transação externa).
  // Como não existe mais tabela cupons_uso, apenas desativa o cupom
  // se for de uso único (usuario_id preenchido).
  async aplicar(cupomId, conexao) {
    const [[cupom]] = await conexao.execute(
      'SELECT usuario_id FROM cupons WHERE id = ?', [cupomId]
    );
    // Cupom pessoal (usuario_id preenchido): desativar após uso
    if (cupom && cupom.usuario_id) {
      await conexao.execute(
        'UPDATE cupons SET status = 0 WHERE id = ?', [cupomId]
      );
    }
  },

  // Lista todos os cupons (admin).
  async listar() {
    const [cupons] = await pool.execute(
      `SELECT c.*, cl.nome AS usuario_nome
       FROM cupons c
       LEFT JOIN clientes cl ON cl.id = c.usuario_id
       ORDER BY c.id DESC`
    );
    return cupons;
  },
};

module.exports = CupomService;
