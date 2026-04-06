/**
 * cupomService.js
 * Gerencia criação, validação e aplicação de cupons.
 * RF0044, RN0036, RN0037, RN0047
 */
const pool = require('../db/config');

const CupomService = {

  /**
   * Valida se um cupom pode ser usado por um cliente para determinado total.
   * RN0037: valida veracidade do cupom.
   */
  async validar(codigo, clienteId, totalPedido) {
    const [[cupom]] = await pool.execute(
      `SELECT * FROM cupons WHERE codigo = UPPER(?) AND ativo = 1`,
      [codigo]
    );

    if (!cupom) return { valido: false, motivo: 'Cupom inválido ou expirado.' };

    // Verificar validade da data
    if (cupom.validade && new Date(cupom.validade) < new Date()) {
      return { valido: false, motivo: 'Cupom expirado.' };
    }

    // Verificar limite de usos
    if (cupom.usos_maximos !== null && cupom.usos_atuais >= cupom.usos_maximos) {
      return { valido: false, motivo: 'Cupom atingiu o limite de usos.' };
    }

    // Se for cupom pessoal (troca/abandono), verificar se pertence ao cliente
    if (cupom.cliente_id && cupom.cliente_id !== parseInt(clienteId)) {
      return { valido: false, motivo: 'Cupom não pertence a este cliente.' };
    }

    // Verificar se o cliente já usou este cupom
    const [[usoAnterior]] = await pool.execute(
      'SELECT id FROM cupons_uso WHERE cupom_id = ? AND cliente_id = ?',
      [cupom.id, clienteId]
    );
    if (usoAnterior) {
      return { valido: false, motivo: 'Você já utilizou este cupom.' };
    }

    // Calcular valor de desconto
    let desconto = 0;
    if (cupom.tipo === 'percentual') {
      desconto = totalPedido * (cupom.valor / 100);
    } else {
      desconto = Math.min(cupom.valor, totalPedido);
    }

    return {
      valido: true,
      cupom: {
        id:      cupom.id,
        codigo:  cupom.codigo,
        tipo:    cupom.tipo,
        valor:   cupom.valor,
        descricao: cupom.descricao,
      },
      desconto: parseFloat(desconto.toFixed(2)),
    };
  },

  /**
   * Registra o uso de um cupom (dentro de transação externa).
   * @param {object} conexao - conexão com transação aberta
   */
  async aplicar(cupomId, pedidoId, clienteId, valorDescontado, conexao) {
    await conexao.execute(
      `INSERT INTO cupons_uso (cupom_id, pedido_id, cliente_id, valor_descontado)
       VALUES (?, ?, ?, ?)`,
      [cupomId, pedidoId, clienteId, valorDescontado]
    );
    await conexao.execute(
      'UPDATE cupons SET usos_atuais = usos_atuais + 1 WHERE id = ?',
      [cupomId]
    );
  },

  /**
   * Admin cria um cupom manual. RF0044
   */
  async gerar({ codigo, tipo, valor, usos_maximos, validade, descricao, cliente_id }) {
    if (!codigo || !tipo || !valor) throw new Error('Código, tipo e valor são obrigatórios.');

    const [result] = await pool.execute(
      `INSERT INTO cupons (codigo, tipo, valor, usos_maximos, validade, descricao, origem, cliente_id)
       VALUES (UPPER(?), ?, ?, ?, ?, ?, 'admin', ?)`,
      [codigo, tipo, valor, usos_maximos || null, validade || null, descricao || null, cliente_id || null]
    );
    return { id: result.insertId, codigo: codigo.toUpperCase() };
  },

  /**
   * Gera cupom de troca automaticamente após devolução. RN0036
   * Chamado dentro de transação externa.
   */
  async gerarTroca(clienteId, valor, trocaId, conexao) {
    const codigo = 'TROCA-' + trocaId + '-' + Date.now().toString(36).toUpperCase();
    const validade = new Date();
    validade.setDate(validade.getDate() + 90); // 90 dias de validade

    const [result] = await conexao.execute(
      `INSERT INTO cupons (codigo, tipo, valor, usos_maximos, validade, descricao, origem, cliente_id)
       VALUES (?, 'fixo', ?, 1, ?, 'Cupom de troca automático', 'troca', ?)`,
      [codigo, valor, validade.toISOString().split('T')[0], clienteId]
    );
    return { id: result.insertId, codigo };
  },

  /**
   * Gera cupom de abandono de carrinho (3% para clientes Iniciante). RN0047
   * Chamado dentro de transação externa.
   */
  async gerarAbandonoCarrinho(clienteId, conexao) {
    const codigo = 'VOLTA-' + clienteId + '-' + Date.now().toString(36).toUpperCase();
    const validade = new Date();
    validade.setDate(validade.getDate() + 7); // 7 dias para usar

    // Verificar se já existe cupom de abandono ativo para este cliente
    const [[existente]] = await conexao.execute(
      `SELECT id FROM cupons WHERE cliente_id = ? AND origem = 'abandono_carrinho' AND ativo = 1 AND (validade IS NULL OR validade >= CURDATE())`,
      [clienteId]
    );
    if (existente) return null; // Não gerar duplicata

    const [result] = await conexao.execute(
      `INSERT INTO cupons (codigo, tipo, valor, usos_maximos, validade, descricao, origem, cliente_id)
       VALUES (?, 'percentual', 3.00, 1, ?, 'Desconto especial por carrinho abandonado', 'abandono_carrinho', ?)`,
      [codigo, validade.toISOString().split('T')[0], clienteId]
    );
    return { id: result.insertId, codigo, clienteId };
  },

  /**
   * Lista todos os cupons (admin).
   */
  async listar() {
    const [cupons] = await pool.execute(
      `SELECT c.*, cl.nome AS cliente_nome
       FROM cupons c
       LEFT JOIN clientes cl ON cl.id = c.cliente_id
       ORDER BY c.criado_em DESC`
    );
    return cupons;
  },
};

module.exports = CupomService;
