/*
  estoqueService.js
  Gerencia reservas temporárias e movimentação real de estoque.
  RN0031, RN0032, RN0044, RNF0045, RF0053, RF0054
 */
const pool = require('../db/config');

const EstoqueService = {

  /*
    Cria ou atualiza uma reserva temporária de estoque.
    O produto fica indisponível para outros clientes pelo tempo parametrizado.
    RN0044 / RNF0045
   */
  async reservar(produtoId, clienteId, quantidade, minutosReserva = 15) {
    const conexao = await pool.getConnection();
    try {
      await conexao.beginTransaction();

      // Calcular estoque líquido (descontando reservas de OUTROS clientes)
      const [[{ estoque }]] = await conexao.execute(
        'SELECT estoque_atual FROM produtos WHERE id = ? AND status = 1 FOR UPDATE',
        [produtoId]
      );
      if (estoque === undefined) throw new Error('Produto não encontrado ou inativo.');

      const [[{ reservado }]] = await conexao.execute(
        `SELECT COALESCE(SUM(r.quantidade), 0) AS reservado
         FROM reservas_estoque r
         WHERE r.produto_id = ? AND r.cliente_id != ? AND r.expira_em > NOW()`,
        [produtoId, clienteId]
      );

      const disponivel = estoque - reservado;
      if (disponivel < quantidade) {
        throw new Error(`Estoque insuficiente. Disponível: ${disponivel} unidade(s).`);
      }

      // Upsert da reserva para este cliente
      const expiraEm = new Date(Date.now() + minutosReserva * 60 * 1000);
      await conexao.execute(
        `INSERT INTO reservas_estoque (produto_id, cliente_id, quantidade, expira_em)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE quantidade = ?, expira_em = ?`,
        [produtoId, clienteId, quantidade, expiraEm, quantidade, expiraEm]
      );

      await conexao.commit();
      return { reservado: true, expiraEm };
    } catch (err) {
      await conexao.rollback();
      throw err;
    } finally {
      conexao.release();
    }
  },

  //Libera a reserva de um produto para um cliente.
  async liberarReserva(produtoId, clienteId) {
    await pool.execute(
      'DELETE FROM reservas_estoque WHERE produto_id = ? AND cliente_id = ?',
      [produtoId, clienteId]
    );
  },

  // Libera todas as reservas de um cliente (ao limpar carrinho ou finalizar pedido).
  async liberarTodasReservas(clienteId) {
    await pool.execute(
      'DELETE FROM reservas_estoque WHERE cliente_id = ?',
      [clienteId]
    );
  },

  /*
  Dá baixa real no estoque após confirmação de venda.
    Deve ser chamado dentro de uma transação externa.
    RF0053
  */
  async darBaixa(produtoId, quantidade, pedidoId, conexao) {
    const [[produto]] = await conexao.execute(
      'SELECT estoque_atual FROM produtos WHERE id = ? FOR UPDATE',
      [produtoId]
    );
    if (!produto) throw new Error(`Produto ${produtoId} não encontrado.`);
    if (produto.estoque_atual < quantidade) {
      throw new Error(`Estoque insuficiente para o produto ${produtoId}.`);
    }

    const novoEstoque = produto.estoque_atual - quantidade;
    await conexao.execute(
      'UPDATE produtos SET estoque_atual = ? WHERE id = ?',
      [novoEstoque, produtoId]
    );

    await conexao.execute(
      `INSERT INTO logs_estoque
         (produto_id, tipo, quantidade, estoque_antes, estoque_depois, referencia_id)
       VALUES (?, 'venda', ?, ?, ?, ?)`,
      [produtoId, -quantidade, produto.estoque_atual, novoEstoque, pedidoId]
    );
  },

  /*
   Reinserção de produto ao estoque após troca autorizada pelo admin.
   Deve ser chamado dentro de uma transação externa.
   RF0054
  */
  async reentrada(produtoId, quantidade, trocaId, conexao) {
    const [[produto]] = await conexao.execute(
      'SELECT estoque_atual FROM produtos WHERE id = ? FOR UPDATE',
      [produtoId]
    );
    if (!produto) throw new Error(`Produto ${produtoId} não encontrado.`);

    const novoEstoque = produto.estoque_atual + quantidade;
    await conexao.execute(
      'UPDATE produtos SET estoque_atual = ? WHERE id = ?',
      [novoEstoque, produtoId]
    );

    await conexao.execute(
      `INSERT INTO logs_estoque
         (produto_id, tipo, quantidade, estoque_antes, estoque_depois, referencia_id)
       VALUES (?, 'troca_entrada', ?, ?, ?, ?)`,
      [produtoId, quantidade, produto.estoque_atual, novoEstoque, trocaId]
    );
  },

  /*
   Job: expira reservas vencidas e remove os itens do carrinho.
   Deve ser chamado periodicamente (ex: a cada minuto). RN0044/RNF0045
   */
  async expirarReservasAntigas() {
    const conexao = await pool.getConnection();
    try {
      await conexao.beginTransaction();

      // Buscar reservas expiradas
      const [reservasExpiradas] = await conexao.execute(
        'SELECT produto_id, cliente_id, quantidade FROM reservas_estoque WHERE expira_em < NOW()'
      );

      for (const r of reservasExpiradas) {
        // Remover item do carrinho do cliente
        await conexao.execute(
          'DELETE FROM carrinho WHERE cliente_id = ? AND produto_id = ?',
          [r.cliente_id, r.produto_id]
        );
      }

      // Deletar as reservas expiradas
      const [result] = await conexao.execute(
        'DELETE FROM reservas_estoque WHERE expira_em < NOW()'
      );

      await conexao.commit();
      if (result.affectedRows > 0) {
        console.log(`[JOB] ${result.affectedRows} reserva(s) expirada(s) liberada(s).`);
      }
      return result.affectedRows;
    } catch (err) {
      await conexao.rollback();
      console.error('[JOB] Erro ao expirar reservas:', err.message);
      return 0;
    } finally {
      conexao.release();
    }
  },
};

module.exports = EstoqueService;
