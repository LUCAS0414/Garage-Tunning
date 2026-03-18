document.addEventListener('DOMContentLoaded', function() {

  //Hero Slide
  let slideAtual = 0;
  const slides = document.querySelectorAll('.hero__slide');
  const dots = document.querySelectorAll('.hero__dot');
  const progressBar = document.getElementById('heroProgress');
  const DURACAO_SLIDE = 5000;
  let progressoAtual = 0;
  let timerProgresso;
  let timerSlide;

  function irParaSlide(idx) {
    slides[slideAtual].classList.remove('ativo');
    dots[slideAtual]?.classList.remove('ativo');

    slideAtual = (idx + slides.length) % slides.length;

    slides[slideAtual].classList.add('ativo');
    dots[slideAtual]?.classList.add('ativo');

    resetarProgresso();
  }

  //retorno
  function resetarProgresso() {
    clearInterval(timerProgresso);
    clearTimeout(timerSlide);
    progressoAtual = 0;
    if (progressBar) progressBar.style.width = '0%';

    timerProgresso = setInterval(() => {
      progressoAtual += 100 / (DURACAO_SLIDE / 100);
      if (progressBar) progressBar.style.width = Math.min(progressoAtual, 100) + '%';
    }, 100);

    timerSlide = setTimeout(() => irParaSlide(slideAtual + 1), DURACAO_SLIDE);
  }

  document.getElementById('heroPrev')?.addEventListener('click', () => irParaSlide(slideAtual - 1));
  document.getElementById('heroNext')?.addEventListener('click', () => irParaSlide(slideAtual + 1));

  dots.forEach(dot => {
    dot.addEventListener('click', () => irParaSlide(parseInt(dot.dataset.idx)));
  });

  // Iniciar
  if (slides.length > 0) resetarProgresso();


  //Cards
  function gerarProdutoCardHTML(produto) {
    const badgeHTML = produto.novo
      ? `<span class="produto-card__badge produto-card__badge--novo">NOVO</span>`
      : produto.precoOriginal
        ? `<span class="produto-card__badge produto-card__badge--oferta">OFERTA</span>`
        : '';

    const precoOriginalHTML = produto.precoOriginal
      ? `<span class="produto-card__preco-original">R$ ${produto.precoOriginal.toLocaleString('pt-BR')}</span>`
      : '';

    return `
      <div class="produto-card" data-id="${produto.id}" data-categoria="${produto.categoria}">
        <div class="produto-card__imagem">
          <div class="img-placeholder">
            <span>${produto.categoria === 'JDM' ? 'JP' : produto.categoria === 'Americanos' ? 'US' : produto.
            categoria === 'Italianos' ? 'IT' : produto.
            categoria === 'Alemães' ? 'AL' : 'PC'}</span>
          </div>
          ${badgeHTML}
        </div>
        <div class="produto-card__info">
          <div class="produto-card__categoria">${produto.categoria}</div>
          <div class="produto-card__nome">${produto.nome}</div>
          <div class="produto-card__codigo">#${produto.codigo}</div>
          <div class="produto-card__preco">
            ${precoOriginalHTML}
            R$ ${produto.preco.toLocaleString('pt-BR')}
          </div>
        </div>
        <div class="produto-card__acoes">
          <a href="produto.html?id=${produto.id}" class="btn btn-primario btn-sm w-100">Ver Produto</a>
        </div>
      </div>
    `;
  }


  //Preencher
  function preencherCarrossel(trackId, produtos) {
    const track = document.getElementById(trackId);
    if (!track) return;
    track.innerHTML = produtos.map(gerarProdutoCardHTML).join('');
  }

  const todosProdutos = DadosMock.produtos;
  const jdm = todosProdutos.filter(p => p.categoria === 'JDM');
  const americanos = todosProdutos.filter(p => p.categoria === 'Americanos');
  const italianos = todosProdutos.filter(p => p.categoria === 'Italianos');
  const alemaes = todosProdutos.filter(p => p.categoria === 'Alemães');
  const pecas = todosProdutos.filter(p => p.categoria === 'Peças');
  const destaques = todosProdutos.filter(p => p.novo || p.precoOriginal).slice(0, 8);

  preencherCarrossel('trackDestaque', destaques);
  preencherCarrossel('trackJDM', jdm);
  preencherCarrossel('trackAmericanos', americanos);
  preencherCarrossel('trackItalianos', italianos);
  preencherCarrossel('trackAlemaes', alemaes);
  preencherCarrossel('trackPecas', pecas);



  //Iniciação
  setTimeout(() => {
    new Carrossel('#carrosselDestaque', { itensPorVista: 4 });
    new Carrossel('#carrosselJDM', { itensPorVista: 4, intervalo: 3500 });
    new Carrossel('#carrosselAmericanos', { itensPorVista: 4, intervalo: 3800 });
    new Carrossel('#carrosselItalianos', { itensPorVista: 4, intervalo: 4200 });
    new Carrossel('#carrosselAlemaes', { itensPorVista: 4, intervalo: 3600 });
  }, 100);


  //Contadores
  document.querySelectorAll('[data-cat]').forEach(el => {
    const cat = el.dataset.cat;
    const qtd = todosProdutos.filter(p => p.categoria === cat).length;
    el.textContent = `${qtd} produtos`;
  });


  //Add carrinho evento
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-acao="adicionar"]');
    if (btn) {
      const card = btn.closest('.produto-card');
      const id = card?.dataset.id;
      const produto = DadosMock.produtos.find(p => p.id === id);
      if (produto) Carrinho.adicionar(produto);
    }
  });

});
