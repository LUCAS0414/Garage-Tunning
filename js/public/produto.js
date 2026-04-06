document.addEventListener('DOMContentLoaded', function() {

  //CAPTURA PARÂMETRO DA URL (GET ID)
  const params = new URLSearchParams(window.location.search);
  
  // Se o paramétro 'id' não existir, usamos um item "Mock" como Fallback: 'p001'
  const produtoId = params.get('id') || 'p001';

  //BUSCA DO PRODUTO NA BASE DE DADOS 
  // Futuramente isso enviará dados pegando via fetch API: GET /api/produtos/:id 
  const produto = DadosMock.produtos.find(p => p.id === produtoId) || DadosMock.produtos[0];

  // PREENCHIMENTO INTERATIVO DA FICHA HTML DOM
  if (produto) {
    // SEO visual tag `<title>`
    document.title = `${produto.nome} | The Garage`;
    
    // Títulos textuais da vitrine e dos links (bread Nome / bread Cat)
    document.getElementById('produtoNome').textContent = produto.nome;
    document.getElementById('breadNome').textContent = produto.nome;
    document.getElementById('breadCat').textContent = produto.categoria;
    document.getElementById('produtoPreco').textContent = `R$ ${produto.preco.toLocaleString('pt-BR')}`;
    document.getElementById('specCodigo').textContent = produto.codigo;

    // Lógica do Estoque e Avisos Críticos (Vermelho/Aviso)
    const estoqueTexto = document.getElementById('estoqueTexto');
    const estoqueDot   = document.querySelector('.estoque-dot');
    
    if (produto.estoque <= 3) {
      estoqueTexto.textContent = `Apenas ${produto.estoque} unidades!`;
      estoqueDot.classList.add('baixo'); // Troca pra alerta CSS laranja
    } else if (produto.estoque === 0) {
      estoqueTexto.textContent = 'Esgotado';
      estoqueDot.classList.add('esgotado'); // CSS Vermelho apagado
    } else {
      estoqueTexto.textContent = `${produto.estoque} unidades disponíveis`;
    }

    // Proibe o cliente comprar mais que o estoque inteiro
    document.getElementById('qtyInput').setAttribute('max', produto.estoque);
    document.getElementById('qtyMaxHint').textContent = `Máx. ${produto.estoque} por pedido`;

    // Atualiza Layout de Preços Riscados de Lançamento se ele existir (PrecoOriginal != Null)
    if (produto.precoOriginal) {
      document.getElementById('precOriginalArea').style.display = 'flex';
      document.getElementById('precoOriginal').textContent = `R$ ${produto.precoOriginal.toLocaleString('pt-BR')}`;
    }
  }

  //GALERIA DE CARROUSSEL THUMBNAILS (IMAGENS)
  // Mostra as pequenas imagens ao lado clicáveis
  const thumbs = document.querySelectorAll('.produto-galeria__thumb');
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      // Retira a borda vermelha/ativa de todas
      thumbs.forEach(t => t.classList.remove('ativo'));
      // Atribui classe CSS específica em quem recebeu o click
      thumb.classList.add('ativo');
      // TODO: implementar a chamada para popular o container 'galeriaMain' com imagem real
    });
  });

  //BOTÕES DE GERÊNCIA DE QUANTIDADES 
  const qtyInput = document.getElementById('qtyInput');
  const qtyMax = produto?.estoque || 10;

  // Clica no menos = diminui (respeitando valor não negativo) minimo é 1 ou seja (Math.max 1)
  document.getElementById('qtyMinus')?.addEventListener('click', () => {
    const v = parseInt(qtyInput.value) - 1;
    qtyInput.value = Math.max(1, v);
  });

  // Clica no mais = aumenta na caixa de texto limitando no valor estipulado em `qtyMax` (Math.min)
  document.getElementById('qtyPlus')?.addEventListener('click', () => {
    const v = parseInt(qtyInput.value) + 1;
    qtyInput.value = Math.min(qtyMax, v);
  });

  // Regra de inserção manual de digitação (Se pessoa preencher número que não existe vai ser forçada pra max e min)
  qtyInput?.addEventListener('change', () => {
    let v = parseInt(qtyInput.value);
    if (isNaN(v) || v < 1) v = 1;
    if (v > qtyMax) v = qtyMax;
    qtyInput.value = v;
  });

  // ADICIONAR ITEM CARRINHO EVENTO NO BOTÃO
  // Ao clicar enviaremos os dados pro Carrinho Local que farão push do produto em sí.
  document.getElementById('btnAddCarrinho')?.addEventListener('click', () => {
    if (!produto) return;
    const qty = parseInt(qtyInput.value);
    
    // Chama modulo global `carrinho.js/global.js` (Carrinho.adicionar)
    Carrinho.adicionar(produto, qty);
  });

  // COMPRAR AGORA (EXPRESS RÁPIDO EVENTO NO BOTÃO)
  // Adiciona ao carrinho e imediatamente redireciona a pagina checkout forçando a URL.
  document.getElementById('btnComprarAgora')?.addEventListener('click', () => {
    if (!produto) return;
    const qty = parseInt(qtyInput.value);
    Carrinho.adicionar(produto, qty);
    window.location.href = 'checkout.html';
  });

  // Instancia a função de abrir Abas de Visualização do arquivo `global.js`.
  initTabs('.produto-detalhes');

});
