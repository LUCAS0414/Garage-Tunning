document.addEventListener('DOMContentLoaded', async function() {

  //URL categoria
  const pagina = window.location.pathname.split('/').pop();
  let categoriaId = 'JDM';
  if (pagina.includes('americanos')) categoriaId = 'Americanos';
  else if (pagina.includes('italianos')) categoriaId = 'Italianos';
  else if (pagina.includes('alemaes')) categoriaId = 'Alemães';
  else if (pagina.includes('pecas')) categoriaId = 'Peças';

  //Teste filtro
  let filtros = {
    texto: '',
    precoMin: 0,
    precoMax: 999999999,
    disponivel: true,
    novos: false,
    ofertas: false,
    ordem: 'relevancia',
  };

  // Mapeia campos da API para o formato esperado pelo template
  function mapearProduto(p) {
    return {
      id:            p.id,
      codigo:        p.codigo,
      nome:          p.nome,
      categoria:     p.categoria,
      preco:         parseFloat(p.preco_venda),
      precoOriginal: p.preco_original ? parseFloat(p.preco_original) : null,
      estoque:       p.estoque_atual,
      novo:          p.is_novo === 1 || p.is_novo === true,
      imagem_url:    p.imagem_url || null,
    };
  }

  // Buscar produtos da API real
  let todosProdutos = [];
  try {
    const resp = await fetch(`/api/produtos?categoria=${encodeURIComponent(categoriaId)}&limite=100`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const dados = await resp.json();
    todosProdutos = (dados.produtos || []).map(mapearProduto);
  } catch (err) {
    console.error('Erro ao buscar produtos da API:', err);
    // Fallback: usa DadosMock se a API falhar
    if (typeof DadosMock !== 'undefined') {
      todosProdutos = DadosMock.produtos.filter(p => p.categoria === categoriaId);
    }
  }

  document.getElementById('catTotalProd').textContent = todosProdutos.length;

  //Carrossel
  const trackHero = document.getElementById('trackCatHero');
  if (trackHero) {
    trackHero.innerHTML = todosProdutos.map(p => gerarCardHTML(p)).join('');
    setTimeout(() => new Carrossel('#carrosselCatHero', { itensPorVista: 2, intervalo: 3500 }), 100);
  }

  //Grid 
  function gerarCardHTML(produto) {
    const badge = produto.novo ? `<span class="produto-card__badge produto-card__badge--novo">NOVO</span>` : produto.precoOriginal ? `<span class="produto-card__badge produto-card__badge--oferta">OFERTA</span>` : '';
    const precoOrig = produto.precoOriginal ? `<span class="produto-card__preco-original">R$ ${produto.precoOriginal.toLocaleString('pt-BR')}</span>` : '';
    const emoji = categoriaId === 'JDM' ? 'JP' : categoriaId === 'Americanos' ? 'US' : categoriaId === 'Italianos' ? 'IT' : categoriaId === 'Alemães' ? 'AL' : 'PC';
    return `
      <div class="produto-card" data-id="${produto.id}">
        <div class="produto-card__imagem">
          <div class="img-placeholder"><span>${emoji}</span></div>
          ${badge}
        </div>
        <div class="produto-card__info">
          <div class="produto-card__categoria">${produto.categoria}</div>
          <div class="produto-card__nome">${produto.nome}</div>
          <div class="produto-card__codigo">#${produto.codigo}</div>
          <div class="produto-card__preco">${precoOrig} R$ ${produto.preco.toLocaleString('pt-BR')}</div>
        </div>
        <div class="produto-card__acoes">
          <a href="produto.html?id=${produto.id}" class="btn btn-primario btn-sm w-100">Ver Produto</a>
        </div>
      </div>
    `;
  }

  function aplicarFiltros() {
    let resultados = [...todosProdutos];

    //Texto
    if (filtros.texto) {
      resultados = resultados.filter(p =>
        p.nome.toLowerCase().includes(filtros.texto.toLowerCase()) ||
        p.codigo.toLowerCase().includes(filtros.texto.toLowerCase())
      );
    }

    //Preço
    resultados = resultados.filter(p => p.preco >= filtros.precoMin && p.preco <= filtros.precoMax);

    //Estoque
    if (filtros.disponivel) resultados = resultados.filter(p => p.estoque > 0);

    //Novos
    if (filtros.novos) resultados = resultados.filter(p => p.novo);

    //Ofertas
    if (filtros.ofertas) resultados = resultados.filter(p => p.precoOriginal);

    //Ordenação
    if (filtros.ordem === 'menor-preco') resultados.sort((a,b) => a.preco - b.preco);
    else if (filtros.ordem === 'maior-preco') resultados.sort((a,b) => b.preco - a.preco);
    else if (filtros.ordem === 'novidade') resultados.sort((a,b) => (b.novo?1:0) - (a.novo?1:0));

    //Atualizar grid
    const grid = document.getElementById('catProdutosGrid');
    if (grid) {
      if (resultados.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--cor-texto-muted);">
          <div style="font-size:3rem; margin-bottom:1rem;"><i class="fas fa-search"></i></div>
          <h3>Nenhum produto encontrado</h3>
          <p>Tente ajustar os filtros</p>
        </div>`;
      } else {
        grid.innerHTML = resultados.map(gerarCardHTML).join('');
      }
    }

    // Contador
    const contador = document.getElementById('contadorResultados');
    if (contador) contador.textContent = `${resultados.length} produto${resultados.length !== 1 ? 's' : ''} encontrado${resultados.length !== 1 ? 's' : ''}`;
  }

  //Eventos
  document.getElementById('filtroTexto')?.addEventListener('input', function() {
    filtros.texto = this.value;
    aplicarFiltros();
  });

  document.getElementById('filtroOrdem')?.addEventListener('change', function() {
    filtros.ordem = this.value;
    aplicarFiltros();
  });

  document.getElementById('btnAplicarFiltros')?.addEventListener('click', () => {
    filtros.precoMin = parseInt(document.getElementById('filtroPrecoMin')?.value || 0) || 0;
    filtros.precoMax = parseInt(document.getElementById('filtroPrecoMax')?.value || 99999) || 99999;
    filtros.disponivel = document.getElementById('filtroDisponivel')?.checked;
    filtros.novos = document.getElementById('filtroNovos')?.checked;
    filtros.ofertas = document.getElementById('filtroOfertas')?.checked;
    aplicarFiltros();
  });

  document.getElementById('btnLimparFiltros')?.addEventListener('click', () => {
    filtros = { texto: '', precoMin: 0, precoMax: 99999, disponivel: true, novos: false, ofertas: false, ordem: 'relevancia' };
    document.querySelectorAll('.cat-filtros input, .cat-filtros select').forEach(el => {
      if (el.type === 'checkbox') el.checked = el.id === 'filtroDisponivel';
      else if (el.type === 'number' || el.type === 'text') el.value = '';
      else if (el.tagName === 'SELECT') el.value = 'relevancia';
    });
    aplicarFiltros();
  });

  // Render inicial
  aplicarFiltros();
});
