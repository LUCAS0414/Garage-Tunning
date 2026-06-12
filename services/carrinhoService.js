const pool = require('../db/config');

const CarrinhoService = {
  
  async validarItens(itens) {
    const problemas = [];
    for (const item of itens) {
      const [[produto]] = await pool.execute(
        'SELECT id, nome, estoque_atual, status FROM produtos WHERE id = ?',
        [item.produtoId]
      );
      if (!produto || produto.status !== 1) {
        problemas.push({ produtoId: item.produtoId, motivo: 'Produto indisponível.' });
      } else if (produto.estoque_atual < item.quantidade) {
        problemas.push({
          produtoId: item.produtoId,
          nome: produto.nome,
          motivo: `Estoque insuficiente. Disponível: ${produto.estoque_atual}.`,
          disponivel: produto.estoque_atual,
        });
      }
    }
    return { valido: problemas.length === 0, problemas };
  },

  // Busca dados atualizados de produto para exibição no carrinho.
  async dadosProduto(produtoId) {
    const [[produto]] = await pool.execute(
      'SELECT id, codigo, nome, preco_venda AS preco, estoque_atual, status FROM produtos WHERE id = ?',
      [produtoId]
    );
    if (!produto) throw new Error('Produto não encontrado.');
    return produto;
  },
};

module.exports = CarrinhoService;
