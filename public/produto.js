document.addEventListener('DOMContentLoaded', async function() {

  const params    = new URLSearchParams(window.location.search);
  const produtoId = params.get('id');
  if (!produtoId) { console.error('Nenhum ID de produto na URL.'); return; }

  // Schema novo: sem preco_original, is_novo, imagem_url, peso_kg
  let produto = null;
  try {
    const resp = await fetch(`/api/produtos/${produtoId}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const dados = await resp.json();
    produto = {
      id:       dados.id,
      codigo:   dados.codigo,
      nome:     dados.nome,
      categoria: dados.categoria,
      descricao: dados.descricao,
      preco:    parseFloat(dados.preco_venda),
      estoque:  dados.estoque_atual,
    };
  } catch (err) {
    console.error('Erro ao buscar produto da API:', err);
  }

  if (!produto) { console.error('Produto não encontrado.'); return; }

  document.title = `${produto.nome} | The Garage`;
  document.getElementById('produtoNome').textContent  = produto.nome;
  document.getElementById('breadNome').textContent    = produto.nome;
  document.getElementById('breadCat').textContent     = produto.categoria;
  document.getElementById('produtoPreco').textContent = `R$ ${produto.preco.toLocaleString('pt-BR')}`;
  document.getElementById('specCodigo').textContent   = produto.codigo;

  // Estoque
  const estoqueTexto = document.getElementById('estoqueTexto');
  const estoqueDot   = document.querySelector('.estoque-dot');
  if (produto.estoque === 0) {
    estoqueTexto.textContent = 'Esgotado';
    estoqueDot?.classList.add('esgotado');
  } else if (produto.estoque <= 3) {
    estoqueTexto.textContent = `Apenas ${produto.estoque} unidades!`;
    estoqueDot?.classList.add('baixo');
  } else {
    estoqueTexto.textContent = `${produto.estoque} unidades disponíveis`;
  }

  document.getElementById('qtyInput')?.setAttribute('max', produto.estoque);
  document.getElementById('qtyMaxHint').textContent = `Máx. ${produto.estoque} por pedido`;

  // Controles de quantidade
  const qtyInput = document.getElementById('qtyInput');
  const qtyMax   = produto.estoque || 1;

  document.getElementById('qtyMinus')?.addEventListener('click', () => {
    qtyInput.value = Math.max(1, parseInt(qtyInput.value) - 1);
  });
  document.getElementById('qtyPlus')?.addEventListener('click', () => {
    qtyInput.value = Math.min(qtyMax, parseInt(qtyInput.value) + 1);
  });
  qtyInput?.addEventListener('change', () => {
    let v = parseInt(qtyInput.value);
    if (isNaN(v) || v < 1) v = 1;
    if (v > qtyMax) v = qtyMax;
    qtyInput.value = v;
  });

  document.getElementById('btnAddCarrinho')?.addEventListener('click', () => {
    if (!produto) return;
    Carrinho.adicionar(produto, parseInt(qtyInput.value));
  });

  document.getElementById('btnComprarAgora')?.addEventListener('click', () => {
    if (!produto) return;
    Carrinho.adicionar(produto, parseInt(qtyInput.value));
    window.location.href = 'checkout.html';
  });

  initTabs('.produto-detalhes');
});
