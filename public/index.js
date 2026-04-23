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


  // Cards sem badges (preco_original e is_novo removidos do schema)
  function gerarProdutoCardHTML(produto) {
    return `
      <div class="produto-card" data-id="${produto.id}" data-categoria="${produto.categoria}">
        <div class="produto-card__imagem">
          <div class="img-placeholder">
            <span>${produto.categoria === 'JDM' ? 'JP' : produto.categoria === 'Americanos' ? 'US' :
                   produto.categoria === 'Italianos' ? 'IT' : produto.categoria === 'Alemães' ? 'AL' : 'PC'}</span>
          </div>
        </div>
        <div class="produto-card__info">
          <div class="produto-card__categoria">${produto.categoria}</div>
          <div class="produto-card__nome">${produto.nome}</div>
          <div class="produto-card__codigo">#${produto.codigo}</div>
          <div class="produto-card__preco">R$ ${produto.preco.toLocaleString('pt-BR')}</div>
        </div>
        <div class="produto-card__acoes">
          <a href="produto.html?id=${produto.id}" class="btn btn-primario btn-sm w-100">Ver Produto</a>
        </div>
      </div>`;
  }


  //Preencher
  function preencherCarrossel(trackId, produtos) {
    const track = document.getElementById(trackId);
    if (!track) return;
    track.innerHTML = produtos.map(gerarProdutoCardHTML).join('');
  }

  // Schema novo: sem preco_original, is_novo, imagem_url
  function mapearProduto(p) {
    return {
      id:       p.id,
      codigo:   p.codigo,
      nome:     p.nome,
      categoria: p.categoria,
      preco:    parseFloat(p.preco_venda),
      estoque:  p.estoque_atual,
    };
  }

  // Busca produtos da API real e preenche os carrosseis
  async function carregarProdutos() {
    let todosProdutos = [];
    try {
      const resp = await fetch('/api/produtos?limite=100');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const dados = await resp.json();
      todosProdutos = (dados.produtos || []).map(mapearProduto);
    } catch (err) {
      console.error('Erro ao buscar produtos da API:', err);
      // fallback: usa DadosMock se a API falhar
      todosProdutos = (typeof DadosMock !== 'undefined') ? DadosMock.produtos : [];
    }

    const jdm        = todosProdutos.filter(p => p.categoria === 'JDM');
    const americanos = todosProdutos.filter(p => p.categoria === 'Americanos');
    const italianos  = todosProdutos.filter(p => p.categoria === 'Italianos');
    const alemaes    = todosProdutos.filter(p => p.categoria === 'Alemães');
    const pecas      = todosProdutos.filter(p => p.categoria === 'Peças');
    const destaques  = todosProdutos.filter(p => p.novo || p.precoOriginal).slice(0, 8);

    preencherCarrossel('trackDestaque', destaques);
    preencherCarrossel('trackJDM', jdm);
    preencherCarrossel('trackAmericanos', americanos);
    preencherCarrossel('trackItalianos', italianos);
    preencherCarrossel('trackAlemaes', alemaes);
    preencherCarrossel('trackPecas', pecas);

    // Contadores por categoria
    document.querySelectorAll('[data-cat]').forEach(el => {
      const cat = el.dataset.cat;
      const qtd = todosProdutos.filter(p => p.categoria === cat).length;
      el.textContent = `${qtd} produtos`;
    });

    // Iniciar carrosseis após preencher os dados
    setTimeout(() => {
      new Carrossel('#carrosselDestaque', { itensPorVista: 4 });
      new Carrossel('#carrosselJDM', { itensPorVista: 4, intervalo: 3500 });
      new Carrossel('#carrosselAmericanos', { itensPorVista: 4, intervalo: 3800 });
      new Carrossel('#carrosselItalianos', { itensPorVista: 4, intervalo: 4200 });
      new Carrossel('#carrosselAlemaes', { itensPorVista: 4, intervalo: 3600 });
    }, 100);

    // Evento de adicionar ao carrinho
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-acao="adicionar"]');
      if (btn) {
        const card = btn.closest('.produto-card');
        const produtoId = parseInt(card?.dataset.id);
        const produto = todosProdutos.find(p => p.id === produtoId || p.id === card?.dataset.id);
        if (produto) Carrinho.adicionar(produto);
      }
    });
  }

  carregarProdutos();

});
