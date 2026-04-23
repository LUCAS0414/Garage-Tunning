// estoqueService.js
// Schema novo: reservas_estoque, carrinho e logs_estoque foram removidos.
// Apenas darBaixa() e reentrada() permanecem (sem log de movimentação).
const pool = require('../db/config');

const EstoqueService = {

  // Dá baixa no estoque após confirmação de venda.
  // Deve ser chamado dentro de uma transação externa.
  async darBaixa(produtoId, quantidade, conexao) {
    const [[produto]] = await conexao.execute(
      'SELECT estoque_atual FROM produtos WHERE id = ? FOR UPDATE', [produtoId]
    );
    if (!produto) throw new Error(`Produto ${produtoId} não encontrado.`);
    if (produto.estoque_atual < quantidade) {
      throw new Error(`Estoque insuficiente para o produto ${produtoId}.`);
    }
    await conexao.execute(
      'UPDATE produtos SET estoque_atual = estoque_atual - ? WHERE id = ?',
      [quantidade, produtoId]
    );
  },

  // Reinserção de produto ao estoque após troca.
  // Deve ser chamado dentro de uma transação externa.
  async reentrada(produtoId, quantidade, conexao) {
    const [[produto]] = await conexao.execute(
      'SELECT id FROM produtos WHERE id = ? FOR UPDATE', [produtoId]
    );
    if (!produto) throw new Error(`Produto ${produtoId} não encontrado.`);
    await conexao.execute(
      'UPDATE produtos SET estoque_atual = estoque_atual + ? WHERE id = ?',
      [quantidade, produtoId]
    );
  },

  // Verifica disponibilidade sem reservar (usado no checkout).
  async verificarDisponibilidade(produtoId, quantidade) {
    const [[produto]] = await pool.execute(
      'SELECT estoque_atual FROM produtos WHERE id = ? AND status = 1', [produtoId]
    );
    if (!produto) throw new Error('Produto não encontrado ou inativo.');
    if (produto.estoque_atual < quantidade) {
      throw new Error(`Estoque insuficiente. Disponível: ${produto.estoque_atual} unidade(s).`);
    }
    return true;
  },
};

module.exports = EstoqueService;
