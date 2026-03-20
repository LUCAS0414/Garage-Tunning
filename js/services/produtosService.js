const db = require('../db/config.js');

const ProdutoService = {
  async criar(dados) {
    // Implementação da RN05 antes de salvar
    const markupMap = { standard: 0.40, premium: 0.60, competitivo: 0.25 };
    const fator = markupMap[dados.grupo_precificacao] || 0;
    const precoVendaCalculado = dados.preco_custo * (1 + fator);

    const sql = `INSERT INTO produtos (codigo, nome, preco_custo, preco_venda, estoque_atual) 
                 VALUES (?, ?, ?, ?, ?)`;
    
    const [result] = await db.execute(sql, [
      dados.codigo, 
      dados.nome, 
      dados.preco_custo, 
      precoVendaCalculado, 
      dados.estoque_atual
    ]);
    return result;
  }
};

module.exports = ProdutoService;