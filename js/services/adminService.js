
const pool = require('../db/config');

const AdminService = {

  /**
   * Retorna stats do dashboard: contadores rápidos.
   */
  async estatisticasDashboard() {
    const [[stats]] = await pool.execute(`
      SELECT
        (SELECT COUNT(*) FROM pedidos)                                          AS total_pedidos,
        (SELECT COUNT(*) FROM pedidos WHERE status = 'em-processamento')        AS em_processamento,
        (SELECT COUNT(*) FROM pedidos WHERE status = 'aprovada')                AS aprovadas,
        (SELECT COUNT(*) FROM pedidos WHERE status = 'em-transporte')           AS em_transporte,
        (SELECT COUNT(*) FROM pedidos WHERE status IN ('em-troca','troca-autorizada')) AS em_troca,
        (SELECT COUNT(*) FROM pedidos WHERE status = 'entregue')                AS entregues,
        (SELECT COALESCE(SUM(total), 0) FROM pedidos WHERE status != 'reprovada') AS receita_total,
        (SELECT COUNT(*) FROM produtos WHERE estoque_atual = 0)                 AS sem_estoque,
        (SELECT COUNT(*) FROM clientes WHERE status = 1)                        AS clientes_ativos
    `);
    return stats;
  },

  /**
   * Histórico de vendas com agrupamento por período. RF0055 / RNF0043
   * @param {string} dataInicio - YYYY-MM-DD
   * @param {string} dataFim    - YYYY-MM-DD
   * @param {string} agrupamento - 'dia' | 'semana' | 'mes'
   */
  async historicoVendas(dataInicio, dataFim, agrupamento = 'dia') {
    let formatoData, groupBy;

    switch (agrupamento) {
      case 'semana':
        formatoData = "DATE_FORMAT(p.criado_em, '%Y-W%u')";
        groupBy     = "YEARWEEK(p.criado_em, 1)";
        break;
      case 'mes':
        formatoData = "DATE_FORMAT(p.criado_em, '%Y-%m')";
        groupBy     = "DATE_FORMAT(p.criado_em, '%Y-%m')";
        break;
      default: // dia
        formatoData = "DATE_FORMAT(p.criado_em, '%Y-%m-%d')";
        groupBy     = "DATE(p.criado_em)";
    }

    const [linhas] = await pool.execute(
      `SELECT
         ${formatoData}         AS periodo,
         COUNT(*)               AS total_pedidos,
         SUM(p.total)           AS receita,
         AVG(p.total)           AS ticket_medio
       FROM pedidos p
       WHERE p.status NOT IN ('reprovada')
         AND p.criado_em BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
       GROUP BY ${groupBy}
       ORDER BY MIN(p.criado_em)`,
      [dataInicio, dataFim]
    );

    // Estatísticas por categoria no período
    const [porCategoria] = await pool.execute(
      `SELECT
         pr.categoria,
         COUNT(DISTINCT p.id)   AS pedidos,
         SUM(ip.quantidade)     AS unidades,
         SUM(ip.subtotal)       AS receita
       FROM itens_pedido ip
       JOIN pedidos p   ON p.id  = ip.pedido_id
       JOIN produtos pr ON pr.id = ip.produto_id
       WHERE p.status NOT IN ('reprovada')
         AND p.criado_em BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
       GROUP BY pr.categoria
       ORDER BY receita DESC`,
      [dataInicio, dataFim]
    );

    // Produtos mais vendidos no período
    const [topProdutos] = await pool.execute(
      `SELECT
         pr.nome, pr.codigo, pr.categoria,
         SUM(ip.quantidade) AS unidades,
         SUM(ip.subtotal)   AS receita
       FROM itens_pedido ip
       JOIN pedidos p   ON p.id  = ip.pedido_id
       JOIN produtos pr ON pr.id = ip.produto_id
       WHERE p.status NOT IN ('reprovada')
         AND p.criado_em BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
       GROUP BY ip.produto_id
       ORDER BY unidades DESC
       LIMIT 10`,
      [dataInicio, dataFim]
    );

    return { linhas, porCategoria, topProdutos };
  },

  /**
   * Retorna distribuição de pedidos por status (para gráfico de pizza/barras).
   */
  async distribuicaoStatus() {
    const [dados] = await pool.execute(
      `SELECT status, COUNT(*) AS total
       FROM pedidos
       GROUP BY status
       ORDER BY total DESC`
    );
    return dados;
  },
};

module.exports = AdminService;
