const pool = require('../db/config');
const EstoqueService = require('./estoqueService');
const CupomService   = require('./cupomService');

// Gera código único estilo GT-2026-0001
async function gerarCodigoPedido(conexao) {
  const ano = new Date().getFullYear();
  const [[{ total }]] = await conexao.execute(
    'SELECT COUNT(*) AS total FROM pedidos WHERE YEAR(criado_em) = ?',
    [ano]
  );
  const seq = String(total + 1).padStart(4, '0');
  return `GT-${ano}-${seq}`;
}

const PedidoService = {

  /**
   * Cria um pedido completo a partir do carrinho do cliente.
   * Toda a operação ocorre em uma única transação.
   *
   * @param {object} dados
   *   - clienteId     {number}   ID do cliente
   *   - enderecoId    {number}   ID do endereço de entrega
   *   - pagamentos    {Array}    [{ tipo:'cartao'|'boleto'|'pix', cartaoId?, valor }]
   *   - cupomCodigo   {string?}  Código do cupom (opcional)
   *   - frete         {number}   Valor do frete calculado
   */
  async criar(dados) {
    const { clienteId, enderecoId, pagamentos = [], cupomCodigo, frete = 0 } = dados;

    // Validações mínimas de cartão (RN0034/RN0035)
    const [[cfgMin]] = await pool.execute(
      "SELECT valor FROM configuracoes WHERE chave = 'min_valor_cartao'"
    );
    const minCartao = cfgMin ? parseFloat(cfgMin.valor) : 10;

    const conexao = await pool.getConnection();
    try {
      await conexao.beginTransaction();

      // 1) Buscar itens do carrinho com lock
      const [itensCarrinho] = await conexao.execute(
        `SELECT c.produto_id, c.quantidade,
                p.nome, p.codigo, p.preco_venda, p.estoque_atual
         FROM carrinho c
         JOIN produtos p ON p.id = c.produto_id
         WHERE c.cliente_id = ?
         FOR UPDATE`,
        [clienteId]
      );

      if (itensCarrinho.length === 0) throw new Error('Carrinho vazio.');

      // 2) Calcular subtotal
      let subtotal = 0;
      for (const item of itensCarrinho) {
        if (item.estoque_atual < item.quantidade) {
          throw new Error(`Estoque insuficiente: ${item.nome}.`);
        }
        subtotal += parseFloat(item.preco_venda) * item.quantidade;
      }

      // 3) Aplicar cupom se houver
      let desconto   = 0;
      let cupomDados = null;
      if (cupomCodigo) {
        const valResult = await CupomService.validar(cupomCodigo, clienteId, subtotal + frete);
        if (!valResult.valido) throw new Error(`Cupom inválido: ${valResult.motivo}`);
        desconto   = valResult.desconto;
        cupomDados = valResult.cupom;
      }

      const total = Math.max(0, subtotal + frete - desconto);

      // 4) Validar pagamentos (RN0034/RN0035)
      const totalPagamentos = pagamentos.reduce((s, p) => s + parseFloat(p.valor), 0);
      if (Math.abs(totalPagamentos - total) > 0.01) {
        throw new Error(`Soma dos pagamentos (R$ ${totalPagamentos.toFixed(2)}) não bate com o total (R$ ${total.toFixed(2)}).`);
      }

      const cartoesValidos = pagamentos.filter(p => p.tipo === 'cartao');
      for (const pag of cartoesValidos) {
        // RN0035: mínimo R$10 por cartão, exceto se o restante após cupom for menor
        if (cartoesValidos.length > 1 && pag.valor < minCartao && total >= minCartao) {
          throw new Error(`Valor mínimo por cartão é R$ ${minCartao.toFixed(2)}.`);
        }
      }

      // 5) Gerar código do pedido
      const codigo = await gerarCodigoPedido(conexao);

      // 6) Inserir pedido
      const [pedidoResult] = await conexao.execute(
        `INSERT INTO pedidos (codigo, cliente_id, endereco_id, status, subtotal, desconto, frete, total, cupom_id)
         VALUES (?, ?, ?, 'em-processamento', ?, ?, ?, ?, ?)`,
        [codigo, clienteId, enderecoId, subtotal, desconto, frete, total, cupomDados?.id || null]
      );
      const pedidoId = pedidoResult.insertId;

      // 7) Inserir itens e dar baixa no estoque
      for (const item of itensCarrinho) {
        const subItem = parseFloat(item.preco_venda) * item.quantidade;
        await conexao.execute(
          `INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, codigo_produto, quantidade, preco_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [pedidoId, item.produto_id, item.nome, item.codigo, item.quantidade, item.preco_venda, subItem]
        );
        await EstoqueService.darBaixa(item.produto_id, item.quantidade, pedidoId, conexao);
      }

      // 8) Registrar pagamentos e simular aprovação (RN0037/RN0038)
      for (const pag of pagamentos) {
        // Simulação: 90% aprovação para cartão, boleto/pix sempre aprovado
        const aprovado = pag.tipo === 'cartao' ? Math.random() < 0.9 : true;
        const status   = aprovado ? 'aprovado' : 'reprovado';
        const codTrx   = 'TRX-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();

        await conexao.execute(
          `INSERT INTO pagamentos_pedido (pedido_id, tipo, cartao_id, valor, status, codigo_transacao)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [pedidoId, pag.tipo, pag.cartaoId || null, pag.valor, status, codTrx]
        );
      }

      // 9) Verificar se todos os pagamentos foram aprovados e atualizar status do pedido
      const [pagamentosResult] = await conexao.execute(
        'SELECT status FROM pagamentos_pedido WHERE pedido_id = ?',
        [pedidoId]
      );
      const todosAprovados = pagamentosResult.every(p => p.status === 'aprovado');
      const algumReprovado = pagamentosResult.some(p => p.status === 'reprovado');
      const novoStatusPedido = algumReprovado ? 'reprovada' : 'aprovada';

      await conexao.execute(
        'UPDATE pedidos SET status = ? WHERE id = ?',
        [novoStatusPedido, pedidoId]
      );

      // Se reprovado: reverter baixa de estoque
      if (algumReprovado) {
        for (const item of itensCarrinho) {
          await conexao.execute(
            'UPDATE produtos SET estoque_atual = estoque_atual + ? WHERE id = ?',
            [item.quantidade, item.produto_id]
          );
          await conexao.execute(
            `UPDATE logs_estoque SET observacao = 'Revertido - pagamento reprovado'
             WHERE produto_id = ? AND referencia_id = ? AND tipo = 'venda'`,
            [item.produto_id, pedidoId]
          );
        }
      }

      // 10) Aplicar cupom (registrar uso)
      if (cupomDados) {
        await CupomService.aplicar(cupomDados.id, pedidoId, clienteId, desconto, conexao);
      }

      // 11) Limpar carrinho e reservas
      await conexao.execute('DELETE FROM carrinho WHERE cliente_id = ?', [clienteId]);
      await conexao.execute('DELETE FROM reservas_estoque WHERE cliente_id = ?', [clienteId]);

      await conexao.commit();

      return {
        pedidoId,
        codigo,
        status:       novoStatusPedido,
        total,
        subtotal,
        desconto,
        frete,
        pagamentos:   pagamentosResult,
      };
    } catch (err) {
      await conexao.rollback();
      throw err;
    } finally {
      conexao.release();
    }
  },

  // Lista todos os pedidos de um cliente com itens.
  async listarPorCliente(clienteId) {
    const [pedidos] = await pool.execute(
      `SELECT p.id, p.codigo, p.status, p.subtotal, p.desconto, p.frete, p.total,
              p.criado_em, p.atualizado_em,
              e.logradouro, e.numero, e.bairro, e.cidade, e.estado, e.cep
       FROM pedidos p
       JOIN enderecos_cliente e ON e.id = p.endereco_id
       WHERE p.cliente_id = ?
       ORDER BY p.criado_em DESC`,
      [clienteId]
    );

    for (const pedido of pedidos) {
      const [itens] = await pool.execute(
        'SELECT * FROM itens_pedido WHERE pedido_id = ?',
        [pedido.id]
      );
      const [pagamentos] = await pool.execute(
        'SELECT tipo, valor, status, codigo_transacao FROM pagamentos_pedido WHERE pedido_id = ?',
        [pedido.id]
      );
      pedido.itens = itens;
      pedido.pagamentos = pagamentos;
    }

    return pedidos;
  },

  // Retorna detalhes completos de um pedido (admin ou cliente).
  async detalhe(pedidoId) {
    const [[pedido]] = await pool.execute(
      `SELECT p.*, c.nome AS cliente_nome, c.email AS cliente_email,
              e.logradouro, e.numero, e.bairro, e.cidade, e.estado, e.cep
       FROM pedidos p
       JOIN clientes c ON c.id = p.cliente_id
       JOIN enderecos_cliente e ON e.id = p.endereco_id
       WHERE p.id = ?`,
      [pedidoId]
    );
    if (!pedido) throw new Error('Pedido não encontrado.');

    const [itens] = await pool.execute(
      'SELECT * FROM itens_pedido WHERE pedido_id = ?',
      [pedidoId]
    );
    const [pagamentos] = await pool.execute(
      'SELECT * FROM pagamentos_pedido WHERE pedido_id = ?',
      [pedidoId]
    );

    const [trocas] = await pool.execute(
      'SELECT * FROM trocas WHERE pedido_id = ?',
      [pedidoId]
    );

    return { ...pedido, itens, pagamentos, trocas };
  },

  // Lista todos os pedidos para o admin com filtros.
  async listarAdmin(filtros = {}) {
    const { status, busca, pagina = 1, limite = 20 } = filtros;
    const offset = (pagina - 1) * limite;
    const params = [];
    const condicoes = ['1=1'];

    if (status) {
      condicoes.push('p.status = ?');
      params.push(status);
    }
    if (busca) {
      condicoes.push('(p.codigo LIKE ? OR c.nome LIKE ? OR c.email LIKE ?)');
      const like = `%${busca}%`;
      params.push(like, like, like);
    }

    const where = condicoes.join(' AND ');

    const [pedidos] = await pool.execute(
      `SELECT p.id, p.codigo, p.status, p.total, p.frete, p.desconto,
              p.criado_em, p.atualizado_em,
              c.nome AS cliente_nome, c.email AS cliente_email,
              (SELECT COUNT(*) FROM itens_pedido ip WHERE ip.pedido_id = p.id) AS total_itens
       FROM pedidos p
       JOIN clientes c ON c.id = p.cliente_id
       WHERE ${where}
       ORDER BY p.criado_em DESC
       LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM pedidos p
       JOIN clientes c ON c.id = p.cliente_id
       WHERE ${where}`,
      params
    );

    return { pedidos, total, pagina, limite };
  },

  /*
    Atualiza o status do pedido (admin). RF0038, RF0039
    Transições válidas definidas conforme regras de negócio.
   */
  async atualizarStatus(pedidoId, novoStatus) {
    const TRANSICOES_VALIDAS = {
      'em-processamento': ['aprovada', 'reprovada'],
      'aprovada':         ['em-transporte'],
      'em-transporte':    ['entregue'],
      'entregue':         ['em-troca'],
      'em-troca':         ['troca-autorizada', 'entregue'],
      'troca-autorizada': ['trocado'],
    };

    const [[pedido]] = await pool.execute(
      'SELECT id, status FROM pedidos WHERE id = ?',
      [pedidoId]
    );
    if (!pedido) throw new Error('Pedido não encontrado.');

    const permitidos = TRANSICOES_VALIDAS[pedido.status] || [];
    if (!permitidos.includes(novoStatus)) {
      throw new Error(`Transição inválida: ${pedido.status} → ${novoStatus}.`);
    }

    await pool.execute(
      'UPDATE pedidos SET status = ?, atualizado_em = NOW() WHERE id = ?',
      [novoStatus, pedidoId]
    );
    return { atualizado: true, status: novoStatus };
  },
};

module.exports = PedidoService;
