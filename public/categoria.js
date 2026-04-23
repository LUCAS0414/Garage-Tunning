document.addEventListener('DOMContentLoaded', async function() {

  // Detectar categoria pela URL
  const pagina = window.location.pathname.split('/').pop();
  let categoriaId = 'JDM';
  if      (pagina.includes('americanos')) categoriaId = 'Americanos';
  else if (pagina.includes('italianos'))  categoriaId = 'Italianos';
  else if (pagina.includes('alemaes'))    categoriaId = 'Alemães';
  else if (pagina.includes('pecas'))      categoriaId = 'Peças';

  let filtros = {
    texto: '', precoMin: 0, precoMax: 999999999,
    disponivel: true, ordem: 'relevancia',
  };

  // Mapeia campos da API para o formato esperado pelo template
  // Schema novo: sem preco_original, is_novo, imagem_url, peso_kg
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

  let todosProdutos = [];
  try {
    const resp = await fetch(`/api/produtos?categoria=${encodeURIComponent(categoriaId)}&limite=100`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const dados = await resp.json();
    todosProdutos = (dados.produtos || []).map(mapearProduto);
  } catch (err) {
    console.error('Erro ao buscar produtos da API:', err);
  }

  document.getElementById('catTotalProd').textContent = todosProdutos.length;

  // Carrossel hero
  const trackHero = document.getElementById('trackCatHero');
  if (trackHero) {
    trackHero.innerHTML = todosProdutos.map(p => gerarCardHTML(p)).join('');
    setTimeout(() => new Carrossel('#carrosselCatHero', { itensPorVista: 2, intervalo: 3500 }), 100);
  }

  function gerarCardHTML(produto) {
    const emoji = categoriaId === 'JDM' ? 'JP' : categoriaId === 'Americanos' ? 'US'
                : categoriaId === 'Italianos' ? 'IT' : categoriaId === 'Alemães' ? 'AL' : 'PC';
    return `
      <div class="produto-card" data-id="${produto.id}">
        <div class="produto-card__imagem">
          <div class="img-placeholder"><span>${emoji}</span></div>
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

  function aplicarFiltros() {
    let resultados = [...todosProdutos];
    if (filtros.texto) {
      resultados = resultados.filter(p =>
        p.nome.toLowerCase().includes(filtros.texto.toLowerCase()) ||
        p.codigo.toLowerCase().includes(filtros.texto.toLowerCase())
      );
    }
    resultados = resultados.filter(p => p.preco >= filtros.precoMin && p.preco <= filtros.precoMax);
    if (filtros.disponivel) resultados = resultados.filter(p => p.estoque > 0);
    if (filtros.ordem === 'menor-preco') resultados.sort((a,b) => a.preco - b.preco);
    else if (filtros.ordem === 'maior-preco') resultados.sort((a,b) => b.preco - a.preco);

    const grid = document.getElementById('catProdutosGrid');
    if (grid) {
      grid.innerHTML = resultados.length === 0
        ? `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--cor-texto-muted);">
             <h3>Nenhum produto encontrado</h3><p>Tente ajustar os filtros</p>
           </div>`
        : resultados.map(gerarCardHTML).join('');
    }
    const contador = document.getElementById('contadorResultados');
    if (contador) contador.textContent = `${resultados.length} produto${resultados.length !== 1 ? 's' : ''} encontrado${resultados.length !== 1 ? 's' : ''}`;
  }

  document.getElementById('filtroTexto')?.addEventListener('input', function() {
    filtros.texto = this.value; aplicarFiltros();
  });
  document.getElementById('filtroOrdem')?.addEventListener('change', function() {
    filtros.ordem = this.value; aplicarFiltros();
  });
  document.getElementById('btnAplicarFiltros')?.addEventListener('click', () => {
    filtros.precoMin  = parseInt(document.getElementById('filtroPrecoMin')?.value  || 0)     || 0;
    filtros.precoMax  = parseInt(document.getElementById('filtroPrecoMax')?.value  || 99999999) || 99999999;
    filtros.disponivel = document.getElementById('filtroDisponivel')?.checked;
    aplicarFiltros();
  });
  document.getElementById('btnLimparFiltros')?.addEventListener('click', () => {
    filtros = { texto: '', precoMin: 0, precoMax: 99999999, disponivel: true, ordem: 'relevancia' };
    document.querySelectorAll('.cat-filtros input, .cat-filtros select').forEach(el => {
      if (el.type === 'checkbox') el.checked = el.id === 'filtroDisponivel';
      else el.value = el.tagName === 'SELECT' ? 'relevancia' : '';
    });
    aplicarFiltros();
  });

  aplicarFiltros();
});
