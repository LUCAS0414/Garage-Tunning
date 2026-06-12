const db = require('../db/config.js');

function mapCatToId(cat) {
  const map = { 'JDM': 8, 'Americanos': 9, 'Italianos': 10, 'Alemães': 11 };
  return map[cat] || 1;
}

const CASE_CATEGORIA = `CASE
    WHEN categoria_id = 1  THEN 'Peças'
    WHEN categoria_id = 8  THEN 'JDM'
    WHEN categoria_id = 9  THEN 'Americanos'
    WHEN categoria_id = 10 THEN 'Italianos'
    WHEN categoria_id = 11 THEN 'Alemães'
    ELSE 'Peças'
  END AS categoria`;

const ProdutoService = {

  async criar(dados) {
    const markupMap = { A: 0.60, B: 0.40, C: 0.25 };
    const fator     = markupMap[dados.grupo_precificacao] || 0.40;
    const precoVenda = dados.preco_venda || (dados.preco_custo * (1 + fator));

    const [result] = await db.execute(
      `INSERT INTO produtos (codigo, nome, descricao, categoria_id, grupo_precificacao, preco_custo, preco_venda, estoque_atual)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [dados.codigo, dados.nome, dados.descricao || null, mapCatToId(dados.categoria),
       dados.grupo_precificacao || 'B', dados.preco_custo, precoVenda, dados.estoque_atual || 0]
    );
    return result;
  },

  async listar({ categoria, busca, pagina = 1, limite = 20, apenasAtivos = true } = {}) {
    const offset    = (pagina - 1) * limite;
    const params    = [];
    const condicoes = [];

    if (apenasAtivos) condicoes.push('status = 1');
    if (categoria) {
      if (categoria === 'Peças' || categoria === 'produtos' || categoria === 'Produtos') {
        condicoes.push('categoria_id = 1');
      } else {
        condicoes.push('categoria_id = ?');
        params.push(mapCatToId(categoria));
      }
    }
    if (busca) {
      condicoes.push('(nome LIKE ? OR codigo LIKE ?)');
      params.push(`%${busca}%`, `%${busca}%`);
    }

    const where = condicoes.length ? 'WHERE ' + condicoes.join(' AND ') : '';

    const [produtos] = await db.execute(
      `SELECT id, codigo, nome, ${CASE_CATEGORIA},
              preco_custo, preco_venda, estoque_atual, grupo_precificacao, status
       FROM produtos ${where} ORDER BY nome LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );
    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM produtos ${where}`, params
    );
    return { produtos, total, pagina, limite };
  },

  async buscarPorId(id) {
    const [[produto]] = await db.execute(
      `SELECT id, codigo, nome, descricao, ${CASE_CATEGORIA},
              grupo_precificacao, preco_custo, preco_venda,
              estoque_atual, status, data_cadastro
       FROM produtos WHERE id = ?`, [id]
    );
    if (!produto) throw new Error('Produto não encontrado.');
    return produto;
  },

  async atualizar(id, dados) {
    const campos  = [];
    const valores = [];
    const permitidos = ['nome', 'descricao', 'categoria', 'grupo_precificacao',
                        'preco_custo', 'preco_venda', 'estoque_atual', 'status'];

    for (const campo of permitidos) {
      if (dados[campo] !== undefined) {
        if (campo === 'categoria') {
          campos.push('categoria_id = ?');
          valores.push(mapCatToId(dados[campo]));
          continue;
        }
        if (campo === 'preco_custo' && dados.grupo_precificacao) {
          const fator = { A: 0.60, B: 0.40, C: 0.25 }[dados.grupo_precificacao] || 0.40;
          campos.push('preco_venda = ?');
          valores.push(dados.preco_custo * (1 + fator));
        }
        campos.push(`${campo} = ?`);
        valores.push(dados[campo]);
      }
    }
    if (campos.length === 0) throw new Error('Nenhum campo para atualizar.');
    valores.push(id);
    const [result] = await db.execute(`UPDATE produtos SET ${campos.join(', ')} WHERE id = ?`, valores);
    if (result.affectedRows === 0) throw new Error('Produto não encontrado.');
    return { mensagem: 'Produto atualizado com sucesso.' };
  },

  async remover(id) {
    const [result] = await db.execute('UPDATE produtos SET status = 0 WHERE id = ?', [id]);
    if (result.affectedRows === 0) throw new Error('Produto não encontrado.');
    return { mensagem: 'Produto removido com sucesso.' };
  },
};

module.exports = ProdutoService;
