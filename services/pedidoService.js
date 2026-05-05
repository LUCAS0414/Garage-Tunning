const pool        = require('../db/config');
const EstoqueService = require('./estoqueService');
const CupomService   = require('./cupomService');

async function gerarCodigoPedido(conexao) {
  const ano = new Date().getFullYear();
  const [[row]] = await conexao.execute(
    'SELECT codigo_pedido FROM pedidos WHERE codigo_pedido LIKE ? ORDER BY id DESC LIMIT 1', 
    [`GT-${ano}-%`]
  );
  
  let proximo = 1;
  if (row && row.codigo_pedido) {
    const partes = row.codigo_pedido.split('-');
    if (partes.length === 3) {
      proximo = parseInt(partes[2], 10) + 1;
    }
  }
  return `GT-${ano}-${String(proximo).padStart(4, '0')}`;
}

const PedidoService = {

  async criar(dados) {
    const { usuarioId, enderecoId, frete = 0, cupomCodigo, itens = [] } = dados;

    if (!itens.length) throw new Error('Nenhum item no pedido.');

    const conexao = await pool.getConnection();
    try {
      await conexao.beginTransaction();

      // 1) Calcular subtotal e validar estoque
      let subtotal = 0;
      for (const item of itens) {
        const [[prod]] = await conexao.execute(
          'SELECT id, nome, estoque_atual, preco_venda FROM produtos WHERE id = ? AND status = 1 FOR UPDATE',
          [item.produtoId]
        );
        if (!prod) throw new Error(`Produto ${item.produtoId} não encontrado ou inativo.`);
        if (prod.estoque_atual < item.quantidade) {
          throw new Error(`Estoque insuficiente: ${prod.nome}. Disponível: ${prod.estoque_atual}.`);
        }
        // Usa preço atual do banco (confiável) em vez do preço enviado pelo front
        item._preco = parseFloat(prod.preco_venda);
        subtotal += item._preco * item.quantidade;
      }

      // 2) Aplicar cupom
      let desconto   = 0;
      let cupomDados = null;
      if (cupomCodigo) {
        const val = await CupomService.validar(cupomCodigo, usuarioId, subtotal + frete);
        if (!val.valido) throw new Error(`Cupom inválido: ${val.motivo}`);
        desconto   = val.desconto;
        cupomDados = val.cupom;
      }

      const valorTotal = Math.max(0, subtotal + parseFloat(frete) - desconto);
      const codigo     = await gerarCodigoPedido(conexao);

      // 3) Inserir pedido
     const { pagamento = {} } = dados;
     const metodoPag = pagamento.metodo || 'CARTAO_CREDITO';

      // Validação do pagamento com 2 cartões (RN0034)
      if (metodoPag === 'DOIS_CARTOES') {
        if (pagamento.valor1 < 10) throw new Error('Valor mínimo por cartão é R$ 10,00 (RN0034).');
        if (pagamento.valor2 < 10) throw new Error('Valor mínimo por cartão é R$ 10,00 (RN0034).');
        const somaCartoes = pagamento.valor1 + pagamento.valor2;
        if (Math.abs(somaCartoes - valorTotal) > 0.01) throw new Error('A soma dos cartões não bate com o total do pedido.');
      }

      const [pedRes] = await conexao.execute(
        `INSERT INTO pedidos (codigo_pedido, usuario_id, endereco_entrega_id, cupom_id, valor_frete, valor_total, status, metodo_pagamento, pagamento_dados)
        VALUES (?, ?, ?, ?, ?, ?, 'EM PROCESSAMENTO', ?, ?)`,
        [codigo, usuarioId, enderecoId, cupomDados?.id || null, frete, valorTotal, metodoPag, JSON.stringify(pagamento)]
      );
      const pedidoId = pedRes.insertId;

      // 4) Inserir itens e dar baixa no estoque
      for (const item of itens) {
        await conexao.execute(
          `INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario)
           VALUES (?, ?, ?, ?)`,
          [pedidoId, item.produtoId, item.quantidade, item._preco]
        );
        await EstoqueService.darBaixa(item.produtoId, item.quantidade, conexao);
      }

      // 5) Aplicar cupom (desativar se for de uso único)
      if (cupomDados) await CupomService.aplicar(cupomDados.id, conexao);

      await conexao.commit();
      return { pedidoId, codigo, status: 'EM PROCESSAMENTO', valorTotal, subtotal, desconto, frete };
    } catch (err) {
      await conexao.rollback();
      throw err;
    } finally {
      conexao.release();
    }
  },

  // Lista pedidos de um cliente com itens.
  async listarPorCliente(usuarioId) {
    const [pedidos] = await pool.execute(
      `SELECT p.id, p.codigo_pedido, p.status, p.valor_frete, p.valor_total,
              p.data_pedido, e.logradouro, e.numero, e.bairro, e.cidade, e.estado, e.cep
       FROM pedidos p
       JOIN enderecos_cliente e ON e.id = p.endereco_entrega_id
       WHERE p.usuario_id = ?
       ORDER BY p.data_pedido DESC`,
      [usuarioId]
    );
    for (const pedido of pedidos) {
      const [itens] = await pool.execute(
        `SELECT pi.produto_id, pi.quantidade, pi.preco_unitario,
                pr.nome AS nome_produto, pr.codigo AS codigo_produto
         FROM pedido_itens pi
         JOIN produtos pr ON pr.id = pi.produto_id
         WHERE pi.pedido_id = ?`,
        [pedido.id]
      );
      pedido.itens = itens;
    }
    return pedidos;
  },

  // Detalhe completo de um pedido.
  async detalhe(pedidoId) {
    const [[pedido]] = await pool.execute(
      `SELECT p.*, cl.nome AS cliente_nome, cl.email AS cliente_email,
              e.logradouro, e.numero, e.bairro, e.cidade, e.estado, e.cep
       FROM pedidos p
       JOIN clientes cl ON cl.id = p.usuario_id
       JOIN enderecos_cliente e ON e.id = p.endereco_entrega_id
       WHERE p.id = ?`,
      [pedidoId]
    );
    if (!pedido) throw new Error('Pedido não encontrado.');

    const [itens] = await pool.execute(
      `SELECT pi.*, pr.nome AS nome_produto, pr.codigo AS codigo_produto
       FROM pedido_itens pi
       JOIN produtos pr ON pr.id = pi.produto_id
       WHERE pi.pedido_id = ?`,
      [pedidoId]
    );
    const [trocas] = await pool.execute(
      'SELECT * FROM solicitacoes_troca WHERE pedido_id = ?', [pedidoId]
    );
    return { ...pedido, itens, trocas };
  },

  // Lista pedidos para o admin com filtros.
  async listarAdmin(filtros = {}) {
    const { status, busca, pagina = 1, limite = 20 } = filtros;
    const offset    = (pagina - 1) * limite;
    const params    = [];
    const condicoes = ['1=1'];

    if (status) { condicoes.push('p.status = ?'); params.push(status); }
    if (busca)  {
      condicoes.push('(p.codigo_pedido LIKE ? OR cl.nome LIKE ? OR cl.email LIKE ?)');
      const like = `%${busca}%`;
      params.push(like, like, like);
    }
    const where = condicoes.join(' AND ');

    const [pedidos] = await pool.execute(
      `SELECT p.id, p.codigo_pedido, p.status, p.valor_frete, p.valor_total,
              p.data_pedido, cl.nome AS cliente_nome, cl.email AS cliente_email,
              (SELECT COUNT(*) FROM pedido_itens pi WHERE pi.pedido_id = p.id) AS total_itens
       FROM pedidos p
       JOIN clientes cl ON cl.id = p.usuario_id
       WHERE ${where}
       ORDER BY p.data_pedido DESC
       LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM pedidos p JOIN clientes cl ON cl.id = p.usuario_id WHERE ${where}`,
      params
    );
    return { pedidos, total, pagina, limite };
  },

  // Atualiza status do pedido (admin).
  async atualizarStatus(pedidoId, novoStatus) {
    const TRANSICOES = {
      'EM PROCESSAMENTO': ['APROVADO', 'REPROVADO'],
      'APROVADO':         ['EM TRANSPORTE'],
      'EM TRANSPORTE':    ['ENTREGUE'],
      'ENTREGUE':         ['EM TROCA'],
      'EM TROCA':         ['TROCA AUTORIZADA', 'ENTREGUE'],
      'TROCA AUTORIZADA': ['TROCADO'],
    };
    const [[pedido]] = await pool.execute('SELECT id, status FROM pedidos WHERE id = ?', [pedidoId]);
    if (!pedido) throw new Error('Pedido não encontrado.');
    const permitidos = TRANSICOES[pedido.status] || [];
    if (!permitidos.includes(novoStatus)) {
      throw new Error(`Transição inválida: ${pedido.status} → ${novoStatus}.`);
    }
    await pool.execute('UPDATE pedidos SET status = ? WHERE id = ?', [novoStatus, pedidoId]);
    return { atualizado: true, status: novoStatus };
  },
};

module.exports = PedidoService;