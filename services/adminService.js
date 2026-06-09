// adminService.js
// Schema novo: pedidos usa data_pedido, valor_total, usuario_id, codigo_pedid
const pool = require('../db/config');

const AdminService = {

  async estatisticasDashboard() {
    const [[stats]] = await pool.execute(`
      SELECT
        (SELECT COUNT(*) FROM pedidos)                                                    AS total_pedidos,
        (SELECT COUNT(*) FROM pedidos WHERE status = 'EM PROCESSAMENTO')                 AS em_processamento,
        (SELECT COUNT(*) FROM pedidos WHERE status = 'APROVADO')                         AS aprovadas,
        (SELECT COUNT(*) FROM pedidos WHERE status = 'EM TRANSPORTE')                    AS em_transporte,
        (SELECT COUNT(*) FROM pedidos WHERE status IN ('EM TROCA','TROCA AUTORIZADA'))   AS em_troca,
        (SELECT COUNT(*) FROM pedidos WHERE status = 'ENTREGUE')                         AS entregues,
        (SELECT COALESCE(SUM(valor_total), 0) FROM pedidos WHERE status != 'REPROVADO')  AS receita_total,
        (SELECT COUNT(*) FROM produtos WHERE estoque_atual = 0)                          AS sem_estoque,
        (SELECT COUNT(*) FROM clientes WHERE status = 1)                                 AS clientes_ativos
    `);
    return stats;
  },

  async historicoVendas(dataInicio, dataFim, agrupamento = 'dia') {
    let formatoData, groupBy;
    switch (agrupamento) {
      case 'semana':
        formatoData = "DATE_FORMAT(p.data_pedido, '%Y-W%u')";
        groupBy     = "YEARWEEK(p.data_pedido, 1)";
        break;
      case 'mes':
        formatoData = "DATE_FORMAT(p.data_pedido, '%Y-%m')";
        groupBy     = "DATE_FORMAT(p.data_pedido, '%Y-%m')";
        break;
      default:
        formatoData = "DATE_FORMAT(p.data_pedido, '%Y-%m-%d')";
        groupBy     = "DATE(p.data_pedido)";
    }

    const [linhas] = await pool.execute(
      `SELECT ${formatoData} AS periodo,
              COUNT(*)       AS total_pedidos,
              SUM(p.valor_total) AS receita,
              AVG(p.valor_total) AS ticket_medio
       FROM pedidos p
       WHERE p.status NOT IN ('REPROVADO')
         AND p.data_pedido BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
       GROUP BY ${groupBy}
       ORDER BY MIN(p.data_pedido)`,
      [dataInicio, dataFim]
    );

    const [porCategoria] = await pool.execute(
      `SELECT
         CASE
           WHEN pr.categoria_id = 1  THEN 'Peças'
           WHEN pr.categoria_id = 8  THEN 'JDM'
           WHEN pr.categoria_id = 9  THEN 'Americanos'
           WHEN pr.categoria_id = 10 THEN 'Italianos'
           WHEN pr.categoria_id = 11 THEN 'Alemães'
           ELSE 'Peças'
         END AS categoria,
         COUNT(DISTINCT p.id) AS pedidos,
         SUM(pi.quantidade)   AS unidades,
         SUM(pi.quantidade * pi.preco_unitario) AS receita
       FROM pedido_itens pi
       JOIN pedidos  p  ON p.id  = pi.pedido_id
       JOIN produtos pr ON pr.id = pi.produto_id
       WHERE p.status NOT IN ('REPROVADO')
         AND p.data_pedido BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
       GROUP BY categoria ORDER BY receita DESC`,
      [dataInicio, dataFim]
    );

    const [topProdutos] = await pool.execute(
      `SELECT pr.nome, pr.codigo,
         CASE
           WHEN pr.categoria_id = 1  THEN 'Peças'
           WHEN pr.categoria_id = 8  THEN 'JDM'
           WHEN pr.categoria_id = 9  THEN 'Americanos'
           WHEN pr.categoria_id = 10 THEN 'Italianos'
           WHEN pr.categoria_id = 11 THEN 'Alemães'
           ELSE 'Peças'
         END AS categoria,
         SUM(pi.quantidade) AS unidades,
         SUM(pi.quantidade * pi.preco_unitario) AS receita
       FROM pedido_itens pi
       JOIN pedidos  p  ON p.id  = pi.pedido_id
       JOIN produtos pr ON pr.id = pi.produto_id
       WHERE p.status NOT IN ('REPROVADO')
         AND p.data_pedido BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
       GROUP BY pi.produto_id ORDER BY unidades DESC LIMIT 10`,
      [dataInicio, dataFim]
    );

    const [linhasPorCategoria] = await pool.execute(
      `SELECT ${formatoData} AS periodo,
         CASE
           WHEN pr.categoria_id = 1  THEN 'Peças'
           WHEN pr.categoria_id = 8  THEN 'JDM'
           WHEN pr.categoria_id = 9  THEN 'Americanos'
           WHEN pr.categoria_id = 10 THEN 'Italianos'
           WHEN pr.categoria_id = 11 THEN 'Alemães'
           ELSE 'Peças'
         END AS categoria,
         SUM(pi.quantidade)   AS unidades,
         SUM(pi.quantidade * pi.preco_unitario) AS receita
       FROM pedido_itens pi
       JOIN pedidos  p  ON p.id  = pi.pedido_id
       JOIN produtos pr ON pr.id = pi.produto_id
       WHERE p.status NOT IN ('REPROVADO')
         AND p.data_pedido BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
       GROUP BY ${groupBy}, categoria
       ORDER BY MIN(p.data_pedido), categoria`,
      [dataInicio, dataFim]
    );

    return { linhas, porCategoria, topProdutos, linhasPorCategoria };
  },

  async distribuicaoStatus() {
    const [dados] = await pool.execute(
      'SELECT status, COUNT(*) AS total FROM pedidos GROUP BY status ORDER BY total DESC'
    );
    return dados;
  },
};

module.exports = AdminService;
