document.addEventListener('DOMContentLoaded', function() {

  //Id via URL
  const params = new URLSearchParams(window.location.search);
  const produtoId = params.get('id') || 'p001';

  // Busca
  const produto = DadosMock.produtos.find(p => p.id === produtoId) || DadosMock.produtos[0];

  //Preenchimento
  if (produto) {
    document.title = `${produto.nome} | The Garage`;
    document.getElementById('produtoNome').textContent = produto.nome;
    document.getElementById('breadNome').textContent = produto.nome;
    document.getElementById('breadCat').textContent = produto.categoria;
    document.getElementById('produtoPreco').textContent = `R$ ${produto.preco.toLocaleString('pt-BR')}`;
    document.getElementById('specCodigo').textContent = produto.codigo;

    // Estoque
    const estoqueTexto = document.getElementById('estoqueTexto');
    const estoqueDot = document.querySelector('.estoque-dot');
    if (produto.estoque <= 3) {
      estoqueTexto.textContent = `Apenas ${produto.estoque} unidades!`;
      estoqueDot.classList.add('baixo');
    } else if (produto.estoque === 0) {
      estoqueTexto.textContent = 'Esgotado';
      estoqueDot.classList.add('esgotado');
    } else {
      estoqueTexto.textContent = `${produto.estoque} unidades disponíveis`;
    }

    document.getElementById('qtyInput').setAttribute('max', produto.estoque);
    document.getElementById('qtyMaxHint').textContent = `Máx. ${produto.estoque} por pedido`;

    // Preço original
    if (produto.precoOriginal) {
      document.getElementById('precOriginalArea').style.display = 'flex';
      document.getElementById('precoOriginal').textContent = `R$ ${produto.precoOriginal.toLocaleString('pt-BR')}`;
    }
  }

  //Imagens
  const thumbs = document.querySelectorAll('.produto-galeria__thumb');
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('ativo'));
      thumb.classList.add('ativo');
      //colocar imagens reais
    });
  });

  //Quantidade
  const qtyInput = document.getElementById('qtyInput');
  const qtyMax = produto?.estoque || 10;

  document.getElementById('qtyMinus')?.addEventListener('click', () => {
    const v = parseInt(qtyInput.value) - 1;
    qtyInput.value = Math.max(1, v);
  });

  document.getElementById('qtyPlus')?.addEventListener('click', () => {
    const v = parseInt(qtyInput.value) + 1;
    qtyInput.value = Math.min(qtyMax, v);
  });

  qtyInput?.addEventListener('change', () => {
    let v = parseInt(qtyInput.value);
    if (isNaN(v) || v < 1) v = 1;
    if (v > qtyMax) v = qtyMax;
    qtyInput.value = v;
  });

  //add carrinho
  document.getElementById('btnAddCarrinho')?.addEventListener('click', () => {
    if (!produto) return;
    const qty = parseInt(qtyInput.value);
    Carrinho.adicionar(produto, qty);
  });

  //Comprar agora
  document.getElementById('btnComprarAgora')?.addEventListener('click', () => {
    if (!produto) return;
    const qty = parseInt(qtyInput.value);
    Carrinho.adicionar(produto, qty);
    window.location.href = 'checkout.html';
  });

  //abas
  initTabs('.produto-detalhes');

});
