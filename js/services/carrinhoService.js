/**
 * carrinhoService.js
 * Gerencia o carrinho persistido no banco de dados.
 * RF0031, RF0032, RN0031, RN0032, RN0044
 */
const pool = require('../db/config');
const EstoqueService = require('./estoqueService');

const CarrinhoService = {

  /**
   * Retorna os itens do carrinho de um cliente com dados reais dos produtos.
   */
  async obter(clienteId) {
    const [itens] = await pool.execute(
      `SELECT
         c.produto_id,
         c.quantidade,
         c.adicionado_em,
         p.codigo,
         p.nome,
         p.preco_venda AS preco,
         p.preco_original,
         p.categoria,
         p.estoque_atual,
         p.peso_kg,
         p.imagem_url,
         p.status AS produto_status,
         -- Estoque real disponível = estoque_atual - reservas de OUTROS clientes
         (p.estoque_atual - COALESCE((
           SELECT SUM(r2.quantidade)
           FROM reservas_estoque r2
           WHERE r2.produto_id = c.produto_id
             AND r2.cliente_id != c.cliente_id
             AND r2.expira_em > NOW()
         ), 0)) AS estoque_disponivel,
         -- Tempo restante da reserva deste cliente (em segundos)
         GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(),
           (SELECT r3.expira_em FROM reservas_estoque r3
            WHERE r3.produto_id = c.produto_id AND r3.cliente_id = c.cliente_id
            LIMIT 1)
         )) AS reserva_segundos
       FROM carrinho c
       JOIN produtos p ON p.id = c.produto_id
       WHERE c.cliente_id = ?
       ORDER BY c.adicionado_em DESC`,
      [clienteId]
    );
    return itens;
  },

  /**
   * Adiciona produto ao carrinho e cria reserva de estoque.
   * RN0031: impede adição se sem estoque.
   * RN0044: cria bloqueio temporário.
   */
  async adicionar(clienteId, produtoId, quantidade) {
    // Buscar tempo de reserva configurado
    const [[cfg]] = await pool.execute(
      "SELECT valor FROM configuracoes WHERE chave = 'tempo_reserva_minutos'"
    );
    const minutosReserva = cfg ? parseInt(cfg.valor) : 15;

    // Tentar reservar — isso valida o estoque e cria o bloqueio
    const reserva = await EstoqueService.reservar(produtoId, clienteId, quantidade, minutosReserva);

    // Upsert no carrinho
    await pool.execute(
      `INSERT INTO carrinho (cliente_id, produto_id, quantidade)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         quantidade = ?,
         atualizado_em = CURRENT_TIMESTAMP`,
      [clienteId, produtoId, quantidade, quantidade]
    );

    return { adicionado: true, reserva };
  },

  /**
   * Atualiza a quantidade de um item no carrinho e revalida a reserva.
   * RF0032
   */
  async atualizarQuantidade(clienteId, produtoId, novaQuantidade) {
    if (novaQuantidade < 1) throw new Error('Quantidade mínima é 1.');

    const [[cfg]] = await pool.execute(
      "SELECT valor FROM configuracoes WHERE chave = 'tempo_reserva_minutos'"
    );
    const minutosReserva = cfg ? parseInt(cfg.valor) : 15;

    // Atualizar reserva (valida o estoque)
    await EstoqueService.reservar(produtoId, clienteId, novaQuantidade, minutosReserva);

    const [result] = await pool.execute(
      'UPDATE carrinho SET quantidade = ?, atualizado_em = NOW() WHERE cliente_id = ? AND produto_id = ?',
      [novaQuantidade, clienteId, produtoId]
    );
    if (result.affectedRows === 0) throw new Error('Item não encontrado no carrinho.');
    return { atualizado: true };
  },

  /**
   * Remove um item do carrinho e libera sua reserva.
   */
  async remover(clienteId, produtoId) {
    await EstoqueService.liberarReserva(produtoId, clienteId);
    const [result] = await pool.execute(
      'DELETE FROM carrinho WHERE cliente_id = ? AND produto_id = ?',
      [clienteId, produtoId]
    );
    if (result.affectedRows === 0) throw new Error('Item não encontrado no carrinho.');
    return { removido: true };
  },

  /**
   * Limpa todo o carrinho e libera todas as reservas do cliente.
   */
  async limpar(clienteId) {
    await EstoqueService.liberarTodasReservas(clienteId);
    await pool.execute('DELETE FROM carrinho WHERE cliente_id = ?', [clienteId]);
    return { limpo: true };
  },

  /**
   * Verifica se todos os itens do carrinho ainda têm estoque suficiente.
   * Usado ao iniciar o checkout — RN0032.
   * Retorna lista de problemas encontrados.
   */
  async verificarValidade(clienteId) {
    const itens = await this.obter(clienteId);
    const problemas = [];

    for (const item of itens) {
      if (item.produto_status !== 1) {
        problemas.push({ produtoId: item.produto_id, nome: item.nome, motivo: 'Produto indisponível.' });
      } else if (item.estoque_disponivel < item.quantidade) {
        problemas.push({
          produtoId: item.produto_id,
          nome: item.nome,
          motivo: `Estoque insuficiente. Disponível: ${item.estoque_disponivel}.`,
          disponivel: item.estoque_disponivel,
        });
      }
    }

    return { valido: problemas.length === 0, problemas, itens };
  },
};

module.exports = CarrinhoService;
