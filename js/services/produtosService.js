const db = require('../db/config.js');

const ProdutoService = {

  //Cria produto aplicando markup conforme grupo de precificação.
   
  async criar(dados) {
    const markupMap  = { standard: 0.40, premium: 0.60, competitivo: 0.25 };
    const fator      = markupMap[dados.grupo_precificacao] || 0;
    const precoVenda = dados.preco_custo * (1 + fator);

    const sql = `
      INSERT INTO produtos
        (codigo, nome, descricao, categoria, grupo_precificacao,
         preco_custo, preco_venda, preco_original, estoque_atual,
         estoque_minimo, peso_kg, is_novo, imagem_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await db.execute(sql, [
      dados.codigo,
      dados.nome,
      dados.descricao      || null,
      dados.categoria      || 'Peças',
      dados.grupo_precificacao || 'standard',
      dados.preco_custo,
      dados.preco_venda    || precoVenda,
      dados.preco_original || null,
      dados.estoque_atual  || 0,
      dados.estoque_minimo || 0,
      dados.peso_kg        || 0.5,
      dados.is_novo        ? 1 : 0,
      dados.imagem_url     || null,
    ]);
    return result;
  },

  // Lista produtos com filtros opcionais e paginação.
  async listar({ categoria, busca, pagina = 1, limite = 20, apenasAtivos = true } = {}) {
    const offset    = (pagina - 1) * limite;
    const params    = [];
    const condicoes = [];

    if (apenasAtivos) { condicoes.push('status = 1'); }
    if (categoria)    { condicoes.push('categoria = ?'); params.push(categoria); }
    if (busca)        {
      condicoes.push('(nome LIKE ? OR codigo LIKE ?)');
      params.push(`%${busca}%`, `%${busca}%`);
    }

    const where = condicoes.length ? 'WHERE ' + condicoes.join(' AND ') : '';

    const [produtos] = await db.execute(
      `SELECT id, codigo, nome, categoria, preco_venda, preco_original,
              estoque_atual, is_novo, imagem_url, grupo_precificacao
       FROM produtos ${where}
       ORDER BY nome
       LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM produtos ${where}`,
      params
    );

    return { produtos, total, pagina, limite };
  },

  // Retorna produto por ID ou código.
  async buscarPorId(id) {
    const [[produto]] = await db.execute(
      `SELECT id, codigo, nome, descricao, categoria, grupo_precificacao,
              preco_venda, preco_original, estoque_atual, peso_kg,
              is_novo, imagem_url, status, criado_em
       FROM produtos WHERE id = ?`,
      [id]
    );
    if (!produto) throw new Error('Produto não encontrado.');
    return produto;
  },

  // Atualiza produto (admin).
  async atualizar(id, dados) {
    const permitidos = [
      'nome','descricao','categoria','grupo_precificacao',
      'preco_custo','preco_venda','preco_original',
      'estoque_atual','estoque_minimo','peso_kg',
      'is_novo','imagem_url','status',
    ];

    const campos  = [];
    const valores = [];

    for (const campo of permitidos) {
      if (dados[campo] !== undefined) {
        // Recalcular preço de venda se mudar custo/grupo
        if (campo === 'preco_custo' && dados.grupo_precificacao) {
          const markupMap = { standard: 0.40, premium: 0.60, competitivo: 0.25 };
          const fator     = markupMap[dados.grupo_precificacao] || 0;
          campos.push('preco_venda = ?');
          valores.push(dados.preco_custo * (1 + fator));
        }
        campos.push(`${campo} = ?`);
        valores.push(dados[campo]);
      }
    }

    if (campos.length === 0) throw new Error('Nenhum campo para atualizar.');
    valores.push(id);

    const [result] = await db.execute(
      `UPDATE produtos SET ${campos.join(', ')} WHERE id = ?`,
      valores
    );
    if (result.affectedRows === 0) throw new Error('Produto não encontrado.');
    return { mensagem: 'Produto atualizado com sucesso.' };
  },

  // Remove produto (soft delete: status = 0).
  async remover(id) {
    const [result] = await db.execute(
      'UPDATE produtos SET status = 0 WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) throw new Error('Produto não encontrado.');
    return { mensagem: 'Produto removido com sucesso.' };
  },
};

module.exports = ProdutoService;