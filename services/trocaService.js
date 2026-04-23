// trocaService.js
// Schema novo: solicitacoes_troca (id, pedido_id, produto_id, quantidade, motivo, status, data_solicitacao)
// Removidos: trocas, itens_troca — agora 1 tabela flat com produto_id direto
// Status: 'PENDENTE', 'AUTORIZADO', 'NEGADO', 'RECEBIDO'
const pool = require('../db/config');
const EstoqueService = require('./estoqueService');

const TrocaService = {

  // Cliente solicita troca de um produto de um pedido.
  async solicitar(usuarioId, pedidoId, produtoId, quantidade, motivo) {
    if (!motivo) throw new Error('Informe o motivo da troca.');

    const [[pedido]] = await pool.execute(
      "SELECT id, status FROM pedidos WHERE id = ? AND usuario_id = ?",
      [pedidoId, usuarioId]
    );
    if (!pedido) throw new Error('Pedido não encontrado.');
    if (pedido.status !== 'ENTREGUE') {
      throw new Error('Somente pedidos com status "ENTREGUE" podem ser trocados.');
    }

    // Verificar se o produto pertence ao pedido
    const [[itemPedido]] = await pool.execute(
      'SELECT id FROM pedido_itens WHERE pedido_id = ? AND produto_id = ?',
      [pedidoId, produtoId]
    );
    if (!itemPedido) throw new Error('Produto não pertence a este pedido.');

    const [result] = await pool.execute(
      `INSERT INTO solicitacoes_troca (pedido_id, produto_id, quantidade, motivo, status)
       VALUES (?, ?, ?, ?, 'PENDENTE')`,
      [pedidoId, produtoId, quantidade || 1, motivo]
    );

    await pool.execute(
      "UPDATE pedidos SET status = 'EM TROCA' WHERE id = ?", [pedidoId]
    );

    return { trocaId: result.insertId, status: 'PENDENTE' };
  },

  // Lista todas as trocas para o admin.
  async listarAdmin(filtros = {}) {
    const { status } = filtros;
    const params    = [];
    const condicoes = ['1=1'];

    if (status) { condicoes.push('st.status = ?'); params.push(status); }

    const [trocas] = await pool.execute(
      `SELECT st.id, st.status, st.motivo, st.quantidade, st.data_solicitacao,
              p.codigo_pedido,
              cl.nome AS cliente_nome, cl.email AS cliente_email,
              pr.nome AS produto_nome, pr.codigo AS produto_codigo
       FROM solicitacoes_troca st
       JOIN pedidos  p  ON p.id  = st.pedido_id
       JOIN clientes cl ON cl.id = p.usuario_id
       JOIN produtos pr ON pr.id = st.produto_id
       WHERE ${condicoes.join(' AND ')}
       ORDER BY st.data_solicitacao DESC`,
      params
    );
    return trocas;
  },

  // Admin autoriza a troca.
  async autorizar(trocaId) {
    const [[troca]] = await pool.execute('SELECT * FROM solicitacoes_troca WHERE id = ?', [trocaId]);
    if (!troca) throw new Error('Troca não encontrada.');
    if (troca.status !== 'PENDENTE') throw new Error('Apenas trocas PENDENTES podem ser autorizadas.');

    await pool.execute(
      "UPDATE solicitacoes_troca SET status = 'AUTORIZADO' WHERE id = ?", [trocaId]
    );
    await pool.execute(
      "UPDATE pedidos SET status = 'TROCA AUTORIZADA' WHERE id = ?", [troca.pedido_id]
    );
    return { autorizado: true };
  },

  // Admin nega a troca.
  async negar(trocaId) {
    const [[troca]] = await pool.execute('SELECT * FROM solicitacoes_troca WHERE id = ?', [trocaId]);
    if (!troca) throw new Error('Troca não encontrada.');

    await pool.execute(
      "UPDATE solicitacoes_troca SET status = 'NEGADO' WHERE id = ?", [trocaId]
    );
    await pool.execute(
      "UPDATE pedidos SET status = 'ENTREGUE' WHERE id = ?", [troca.pedido_id]
    );
    return { negado: true };
  },

  // Admin confirma recebimento dos itens devolvidos.
  async confirmarRecebimento(trocaId, retornarEstoque = false) {
    const conexao = await pool.getConnection();
    try {
      await conexao.beginTransaction();

      const [[troca]] = await conexao.execute(
        'SELECT * FROM solicitacoes_troca WHERE id = ?', [trocaId]
      );
      if (!troca)                       throw new Error('Troca não encontrada.');
      if (troca.status !== 'AUTORIZADO') throw new Error('A troca deve estar autorizada primeiro.');

      if (retornarEstoque) {
        await EstoqueService.reentrada(troca.produto_id, troca.quantidade, conexao);
      }

      await conexao.execute(
        "UPDATE solicitacoes_troca SET status = 'RECEBIDO' WHERE id = ?", [trocaId]
      );
      await conexao.execute(
        "UPDATE pedidos SET status = 'TROCADO' WHERE id = ?", [troca.pedido_id]
      );

      await conexao.commit();
      return { recebido: true };
    } catch (err) {
      await conexao.rollback();
      throw err;
    } finally {
      conexao.release();
    }
  },
};

module.exports = TrocaService;
