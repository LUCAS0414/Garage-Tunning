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
  document.getElementById('specCodigo').textContent   = produto.codigo;

  // Preço de (10% mais caro)
  const precoDe = (produto.preco * 1.1).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById('precoOriginal').textContent = `R$ ${precoDe}`;

  // Preço por (preço real)
  document.getElementById('produtoPreco').textContent = `R$ ${produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // PARCELAMENTO 12X
  const preco12x = (produto.preco / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const elParcelamento = document.querySelector('.produto-parcelamento strong');
  if (elParcelamento) {
    elParcelamento.textContent = `R$ ${preco12x}`;
  }

  // Preço pix (5% de desconto)
  const precoPix = (produto.preco * 0.95).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const elPix = document.querySelector('.produto-pix strong');
  if (elPix) {
    elPix.textContent = `R$ ${precoPix}`;
  }

  // Descrição real do banco de dados
  const elDesc = document.querySelector('.produto-descricao-texto');
  if (elDesc) {
    if (produto.descricao) {
      const paragrafos = produto.descricao
        .split(/\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 0)
        .map(p => `<p>${p}</p>`)
        .join('');
      elDesc.innerHTML = `
        <h3>Sobre o Produto</h3>
        ${paragrafos}
      `;
    } else {
      elDesc.innerHTML = `
        <h3>Sobre o Produto</h3>
        <p>Sem descrição cadastrada.</p>
      `;
    }
  }

  // ESTOQUE
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

  // CONTROLES DE QUANTIDADE
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
