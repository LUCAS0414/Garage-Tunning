require('dotenv').config();
const pool = require('./db/config');

async function seedVendas() {
  const conexao = await pool.getConnection();
  try {
    console.log('Iniciando preenchimento de vendas...');

    //Obter clientes
    const [clientes] = await conexao.execute('SELECT id FROM clientes');
    if (!clientes.length) {
      console.log('Nenhum cliente encontrado. Crie um cliente primeiro.');
      return;
    }

    //Obter enderecos
    const [enderecos] = await conexao.execute('SELECT id, cliente_id FROM enderecos_cliente');
    if (!enderecos.length) {
      console.log('Nenhum endereco encontrado. Certifique-se de que há endereços.');
      return;
    }

    //Obter produtos
    const [produtos] = await conexao.execute('SELECT id, preco_venda FROM produtos');
    if (!produtos.length) {
      console.log('Nenhum produto encontrado. Cadastre produtos primeiro.');
      return;
    }

    //Data atual
    const hoje = new Date();
    // 13 meses atrás
    const dataInicio = new Date();
    dataInicio.setMonth(hoje.getMonth() - 13);

    const totalDias = Math.floor((hoje - dataInicio) / (1000 * 60 * 60 * 24));
    
    const STATUS_DISPONIVEIS = ['ENTREGUE', 'EM TRANSPORTE', 'APROVADO', 'EM PROCESSAMENTO'];

    const NUM_PEDIDOS = 200;

    await conexao.beginTransaction();

    for (let i = 0; i < NUM_PEDIDOS; i++) {
      //Aleatórios
      const cliente = clientes[Math.floor(Math.random() * clientes.length)];
      let endereco = enderecos.find(e => e.cliente_id === cliente.id);
      if (!endereco) {
        endereco = enderecos[Math.floor(Math.random() * enderecos.length)];
      }

      const diasAleatorios = Math.floor(Math.random() * totalDias);
      const dataPedido = new Date(dataInicio.getTime() + diasAleatorios * 24 * 60 * 60 * 1000);
      const dataFormatada = dataPedido.toISOString().slice(0, 19).replace('T', ' ');

      const codigo = `GT-${dataPedido.getFullYear()}-${String(i+1000).padStart(4, '0')}`;

      const numItens = Math.floor(Math.random() * 3) + 1;
      let subtotal = 0;
      const itensPedido = [];
      
      //Evitar duplicar
      const produtosEscolhidos = new Set();

      for (let j = 0; j < numItens; j++) {
        let produto;
        do {
          produto = produtos[Math.floor(Math.random() * produtos.length)];
        } while (produtosEscolhidos.has(produto.id));
        produtosEscolhidos.add(produto.id);

        const qtde = Math.floor(Math.random() * 3) + 1;
        const preco = parseFloat(produto.preco_venda);
        subtotal += qtde * preco;

        itensPedido.push({ id: produto.id, qtde, preco });
      }

      const frete = 50.0;
      const valorTotal = subtotal + frete;
      const status = STATUS_DISPONIVEIS[Math.floor(Math.random() * STATUS_DISPONIVEIS.length)];
      const pagamentoDados = JSON.stringify({ metodo: "CARTAO_CREDITO" });

      // Inserir pedido
      const [pedRes] = await conexao.execute(
        `INSERT INTO pedidos (codigo_pedido, usuario_id, endereco_entrega_id, valor_frete, valor_total, status, metodo_pagamento, pagamento_dados, data_pedido)
         VALUES (?, ?, ?, ?, ?, ?, 'CARTAO_CREDITO', ?, ?)`,
        [codigo, cliente.id, endereco.id, frete, valorTotal, status, pagamentoDados, dataFormatada]
      );
      const pedidoId = pedRes.insertId;

      // Inserir itens
      for (const item of itensPedido) {
        await conexao.execute(
          `INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario)
           VALUES (?, ?, ?, ?)`,
          [pedidoId, item.id, item.qtde, item.preco]
        );
      }
    }

    await conexao.commit();
    console.log(`Sucesso! ${NUM_PEDIDOS} pedidos gerados retroativamente em até 13 meses.`);
  } catch (err) {
    await conexao.rollback();
    console.error('Erro ao gerar vendas:', err);
  } finally {
    conexao.release();
    process.exit();
  }
}

seedVendas();
