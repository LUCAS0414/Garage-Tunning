/**
 * trocaService.js
 * Gerencia o fluxo de trocas de itens.
 * RF0040, RF0041, RF0042, RF0043, RN0036
 */
const pool = require('../db/config');
const EstoqueService = require('./estoqueService');
const CupomService   = require('./cupomService');

const TrocaService = {

  /**
   * Cliente solicita troca de itens de um pedido. RF0040
   * O pedido deve estar com status "entregue".
   */
  async solicitar(clienteId, pedidoId, itens, motivo) {
    if (!itens || itens.length === 0) throw new Error('Selecione ao menos um item para troca.');
    if (!motivo)                       throw new Error('Informe o motivo da troca.');

    const conexao = await pool.getConnection();
    try {
      await conexao.beginTransaction();

      // Verificar se o pedido pertence ao cliente e está entregue
      const [[pedido]] = await conexao.execute(
        "SELECT id, status FROM pedidos WHERE id = ? AND cliente_id = ?",
        [pedidoId, clienteId]
      );
      if (!pedido) throw new Error('Pedido não encontrado.');
      if (pedido.status !== 'entregue') {
        throw new Error('Somente pedidos com status "Entregue" podem ser trocados.');
      }

      // Criar a troca
      const [trocaResult] = await conexao.execute(
        `INSERT INTO trocas (pedido_id, cliente_id, motivo, status)
         VALUES (?, ?, ?, 'solicitada')`,
        [pedidoId, clienteId, motivo]
      );
      const trocaId = trocaResult.insertId;

      // Inserir itens da troca
      for (const item of itens) {
        // Verificar se o item pertence ao pedido
        const [[itemPedido]] = await conexao.execute(
          'SELECT id FROM itens_pedido WHERE id = ? AND pedido_id = ?',
          [item.itemPedidoId, pedidoId]
        );
        if (!itemPedido) throw new Error(`Item ${item.itemPedidoId} não pertence a este pedido.`);

        await conexao.execute(
          'INSERT INTO itens_troca (troca_id, item_pedido_id, quantidade) VALUES (?, ?, ?)',
          [trocaId, item.itemPedidoId, item.quantidade || 1]
        );
      }

      // Atualizar status do pedido para "em-troca"
      await conexao.execute(
        "UPDATE pedidos SET status = 'em-troca', atualizado_em = NOW() WHERE id = ?",
        [pedidoId]
      );

      await conexao.commit();
      return { trocaId, status: 'solicitada' };
    } catch (err) {
      await conexao.rollback();
      throw err;
    } finally {
      conexao.release();
    }
  },

  /**
   * Lista todas as trocas para o admin. RF0041
   */
  async listarAdmin(filtros = {}) {
    const { status } = filtros;
    const params = [];
    const condicoes = ['1=1'];

    if (status) {
      condicoes.push('t.status = ?');
      params.push(status);
    }

    const [trocas] = await pool.execute(
      `SELECT t.id, t.status, t.motivo, t.criado_em, t.atualizado_em,
              p.codigo AS pedido_codigo,
              c.nome AS cliente_nome, c.email AS cliente_email
       FROM trocas t
       JOIN pedidos p  ON p.id  = t.pedido_id
       JOIN clientes c ON c.id  = t.cliente_id
       WHERE ${condicoes.join(' AND ')}
       ORDER BY t.criado_em DESC`,
      params
    );

    // Buscar itens de cada troca
    for (const troca of trocas) {
      const [itens] = await pool.execute(
        `SELECT it.quantidade, ip.nome_produto, ip.codigo_produto, ip.preco_unitario
         FROM itens_troca it
         JOIN itens_pedido ip ON ip.id = it.item_pedido_id
         WHERE it.troca_id = ?`,
        [troca.id]
      );
      troca.itens = itens;
    }

    return trocas;
  },

  /**
   * Admin autoriza a troca. RF0042
   */
  async autorizar(trocaId, adminId) {
    const [[troca]] = await pool.execute(
      "SELECT * FROM trocas WHERE id = ?",
      [trocaId]
    );
    if (!troca)                    throw new Error('Troca não encontrada.');
    if (troca.status !== 'solicitada') throw new Error('Apenas trocas "solicitadas" podem ser autorizadas.');

    await pool.execute(
      "UPDATE trocas SET status = 'autorizada', admin_id = ?, atualizado_em = NOW() WHERE id = ?",
      [adminId || null, trocaId]
    );

    await pool.execute(
      "UPDATE pedidos SET status = 'troca-autorizada', atualizado_em = NOW() WHERE id = ?",
      [troca.pedido_id]
    );

    return { autorizado: true };
  },

  /**
   * Admin nega a solicitação de troca.
   */
  async negar(trocaId, adminId) {
    const [[troca]] = await pool.execute('SELECT * FROM trocas WHERE id = ?', [trocaId]);
    if (!troca) throw new Error('Troca não encontrada.');

    await pool.execute(
      "UPDATE trocas SET status = 'negada', admin_id = ?, atualizado_em = NOW() WHERE id = ?",
      [adminId || null, trocaId]
    );
    // Voltar status do pedido para "entregue"
    await pool.execute(
      "UPDATE pedidos SET status = 'entregue', atualizado_em = NOW() WHERE id = ?",
      [troca.pedido_id]
    );

    return { negado: true };
  },

  /**
   * Admin confirma recebimento dos itens devolvidos. RF0043
   * Decide se os itens voltam ao estoque (RN0036: gera cupom de troca).
   *
   * @param {boolean} retornarEstoque - true: reinsere no estoque; false: descarta
   */
  async confirmarRecebimento(trocaId, adminId, retornarEstoque = false) {
    const conexao = await pool.getConnection();
    try {
      await conexao.beginTransaction();

      const [[troca]] = await conexao.execute('SELECT * FROM trocas WHERE id = ?', [trocaId]);
      if (!troca)                     throw new Error('Troca não encontrada.');
      if (troca.status !== 'autorizada') throw new Error('A troca deve estar autorizada primeiro.');

      // Buscar itens da troca
      const [itensTroca] = await conexao.execute(
        `SELECT it.quantidade, ip.produto_id, ip.preco_unitario
         FROM itens_troca it
         JOIN itens_pedido ip ON ip.id = it.item_pedido_id
         WHERE it.troca_id = ?`,
        [trocaId]
      );

      let valorTotal = 0;

      // Calcular valor e opcionalmente reentrar estoque
      for (const item of itensTroca) {
        valorTotal += parseFloat(item.preco_unitario) * item.quantidade;
        if (retornarEstoque) {
          await EstoqueService.reentrada(item.produto_id, item.quantidade, trocaId, conexao);
        }
      }

      // Gerar cupom de troca para o cliente (RN0036)
      const cupom = await CupomService.gerarTroca(troca.cliente_id, valorTotal, trocaId, conexao);

      // Atualizar troca
      await conexao.execute(
        `UPDATE trocas
         SET status = 'recebida', retornar_estoque = ?, cupom_gerado_id = ?, atualizado_em = NOW()
         WHERE id = ?`,
        [retornarEstoque ? 1 : 0, cupom.id, trocaId]
      );

      // Atualizar pedido para "trocado"
      await conexao.execute(
        "UPDATE pedidos SET status = 'trocado', atualizado_em = NOW() WHERE id = ?",
        [troca.pedido_id]
      );

      await conexao.commit();
      return { recebido: true, cupomGerado: cupom };
    } catch (err) {
      await conexao.rollback();
      throw err;
    } finally {
      conexao.release();
    }
  },
};

module.exports = TrocaService;
