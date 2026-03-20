document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos(); 

    document.getElementById('formProduto').addEventListener('submit', salvarProduto);
});

async function carregarProdutos() {
    try {
        const response = await fetch('/api/produtos');
        const produtos = await response.json();
        renderizarTabela(produtos);
    } catch (erro) {
        console.error("Erro ao buscar produtos:", erro);
    }
}

function renderizarTabela(produtos) {
    const tbody = document.getElementById('tbodyProdutos');
    tbody.innerHTML = ''; // Limpa a tabela antes de renderizar

    produtos.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td>${p.codigo}</td>
                <td>${p.nome}</td>
                <td>R$ ${p.preco_venda}</td>
                <td>${p.estoque_atual}</td>
                <td><span class="badge ${p.status === 'ativo' ? 'bg-success' : 'bg-danger'}">${p.status}</span></td>
                <td>
                    <button onclick="editarProduto(${p.id})">Editar</button>
                    <button onclick="alterarStatus(${p.id})">Inativar</button>
                </td>
            </tr>
        `;
    });
}

async function salvarProduto(e) {
    e.preventDefault();
    const dados = {
        codigo: document.getElementById('prodCodigo').value,
        nome: document.getElementById('prodNome').value,
        preco_custo: document.getElementById('prodCusto').value,
        grupo_precificacao: document.getElementById('prodGrupo').value,
        estoque_atual: document.getElementById('prodEstoque').value
    };

    const response = await fetch('/api/produtos', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(dados)
    });

    if(response.ok) {
        alert("Produto salvo!");
        fecharModal('modalProduto');
        carregarProdutos(); // Atualiza a tabela automaticamente
    }
}
/*
document.addEventListener('DOMContentLoaded', function() {
  const db = require('./db');

  // Estado local de produtos (futuro: GET /api/admin/produtos)
  let produtos = [...DadosMock.produtos].map(p => ({ ...p, status: 'ativo', custo: Math.round(p.preco * 0.55) }));
  let produtoEditandoId = null;
  let produtoInativandoId = null;

  const MARKUP = { standard: 0.40, premium: 0.60, competitivo: 0.25, personalizado: 0 };

  // ---- STATS ---- //
  function atualizarStats() {
    document.getElementById('statTotal').textContent = produtos.length;
    document.getElementById('statAtivos').textContent = produtos.filter(p => p.status === 'ativo').length;
    document.getElementById('statInativos').textContent = produtos.filter(p => p.status === 'inativo').length;
    document.getElementById('statBaixoEstoque').textContent = produtos.filter(p => p.estoque <= 3).length;
  }

  // ---- RENDERIZAR TABELA ---- //
  function renderizarTabela() {
    const busca = document.getElementById('prodBusca')?.value.toLowerCase() || '';
    const catFiltro = document.getElementById('prodFiltroCategoria')?.value;
    const statusFiltro = document.getElementById('prodFiltroStatus')?.value;

    let lista = produtos.filter(p => {
      const matchBusca = !busca || p.nome.toLowerCase().includes(busca) || p.codigo.toLowerCase().includes(busca);
      const matchCat = !catFiltro || p.categoria === catFiltro;
      const matchStatus = !statusFiltro || p.status === statusFiltro;
      return matchBusca && matchCat && matchStatus;
    });

    const tbody = document.getElementById('tabelaProdutosBody');
    if (!tbody) return;

    tbody.innerHTML = lista.map(p => {
      const estoqueClass = p.estoque === 0 ? 'estoque-zerado' : p.estoque <= 3 ? 'estoque-baixo' : 'estoque-ok';
      const statusBadge = p.status === 'ativo'
        ? `<span class="badge badge-verde">Ativo</span>`
        : `<span class="badge badge-cinza">Inativo</span>`;

      return `
        <tr class="${p.status === 'inativo' ? 'inativo' : ''}">
          <td><strong style="font-family:var(--fonte-destaque);font-size:0.9rem;">${p.nome}</strong></td>
          <td><span style="font-family:var(--fonte-mono);font-size:0.75rem;color:var(--cor-texto-muted);">${p.codigo}</span></td>
          <td><span class="badge badge-${p.categoria === 'JDM' ? 'verde' : p.categoria === 'Americanos' ? 'laranja' : p.categoria === 'Italianos' ? 'azul' : 'amarelo'}">${p.categoria}</span></td>
          <td>R$ ${p.custo.toLocaleString('pt-BR')}</td>
          <td>R$ ${p.preco.toLocaleString('pt-BR')}</td>
          <td><span class="estoque-badge ${estoqueClass}">${p.estoque} un.</span></td>
          <td>${statusBadge}</td>
          <td>
            <div class="tabela-acoes">
              <button class="btn btn-outline btn-sm" data-acao="editar" data-id="${p.id}" title="Editar">✏️</button>
              <button class="btn btn-outline btn-sm" data-acao="estoque" data-id="${p.id}" title="Entrada de Estoque">📦</button>
              ${p.status === 'ativo'
                ? `<button class="btn btn-danger btn-sm" data-acao="inativar" data-id="${p.id}" title="Inativar">🚫</button>`
                : `<button class="btn btn-outline btn-sm" data-acao="ativar" data-id="${p.id}" title="Ativar" style="border-color:var(--cor-primaria);color:var(--cor-primaria);">✓ Ativar</button>`
              }
            </div>
          </td>
        </tr>
      `;
    }).join('');

    atualizarStats();
  }

  // ---- EVENTOS TABELA (delegação) ---- //
  document.getElementById('tabelaProdutosBody')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-acao]');
    if (!btn) return;
    const acao = btn.dataset.acao;
    const id = btn.dataset.id;
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;

    if (acao === 'editar') {
      produtoEditandoId = id;
      document.getElementById('modalProdTitulo').textContent = 'Editar Produto';
      document.getElementById('prodNome').value = produto.nome;
      document.getElementById('prodCodigo').value = produto.codigo;
      document.getElementById('prodCategoria').value = produto.categoria;
      document.getElementById('prodCusto').value = produto.custo;
      document.getElementById('prodVenda').value = produto.preco;
      document.getElementById('prodEstoque').value = produto.estoque;
      document.getElementById('prodStatus').value = produto.status;
      document.getElementById('entradaEstoqueArea').style.display = 'block';
      document.getElementById('motivoInativacaoArea').style.display = produto.status === 'inativo' ? 'block' : 'none';
      atualizarCalculo();
      abrirModal('modalProduto');
    } else if (acao === 'estoque') {
      produtoEditandoId = id;
      document.getElementById('modalProdTitulo').textContent = `Entrada de Estoque - ${produto.nome}`;
      document.getElementById('entradaEstoqueArea').style.display = 'block';
      abrirModal('modalProduto');
    } else if (acao === 'inativar') {
      produtoInativandoId = id;
      abrirModal('modalInativar');
    } else if (acao === 'ativar') {
      produto.status = 'ativo';
      renderizarTabela();
      Carrinho._mostrarFeedback(`${produto.nome} ativado!`);
    }
  });

  // ---- CÁLCULO DE PREÇO ---- //
  function atualizarCalculo() {
    const custo = parseFloat(document.getElementById('prodCusto')?.value) || 0;
    const grupo = document.getElementById('prodGrupoPrecificacao')?.value || 'standard';
    const markup = MARKUP[grupo] || 0;
    const sugerido = custo * (1 + markup);

    document.getElementById('calcCusto').textContent = `R$ ${custo.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
    document.getElementById('calcMarkupPct').textContent = (markup * 100).toFixed(0);
    document.getElementById('calcMarkup').textContent = `R$ ${(custo * markup).toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
    document.getElementById('calcVenda').textContent = `R$ ${sugerido.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;

    // Preencher campo de venda com sugerido se estiver vazio
    const vendaInput = document.getElementById('prodVenda');
    if (vendaInput && !vendaInput.value) {
      vendaInput.value = sugerido.toFixed(2);
    }
  }

  document.getElementById('prodCusto')?.addEventListener('input', atualizarCalculo);
  document.getElementById('prodGrupoPrecificacao')?.addEventListener('change', atualizarCalculo);

  // ---- STATUS INATIVAÇÃO ---- //
  document.getElementById('prodStatus')?.addEventListener('change', function() {
    document.getElementById('motivoInativacaoArea').style.display = this.value === 'inativo' ? 'block' : 'none';
  });

  // ---- CONFIRMAR INATIVAÇÃO ---- //
  document.getElementById('btnConfirmarInativar')?.addEventListener('click', () => {
    const motivo = document.getElementById('motivoInativarModal')?.value;
    if (!motivo) { alert('Selecione um motivo'); return; }
    const produto = produtos.find(p => p.id === produtoInativandoId);
    if (produto) {
      produto.status = 'inativo';
      produto.motivoInativacao = motivo;
      renderizarTabela();
      fecharModal('modalInativar');
      Carrinho._mostrarFeedback(`${produto.nome} inativado!`);
    }
  });

  // ---- SUBMIT FORM PRODUTO ---- //
  document.getElementById('formProduto')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const dados = {
      nome: document.getElementById('prodNome').value,
      codigo: document.getElementById('prodCodigo').value || gerarCodigo('GT'),
      categoria: document.getElementById('prodCategoria').value,
      custo: parseFloat(document.getElementById('prodCusto').value),
      preco: parseFloat(document.getElementById('prodVenda').value),
      precoOriginal: parseFloat(document.getElementById('prodPrecoOriginal').value) || null,
      estoque: parseInt(document.getElementById('prodEstoque').value),
      status: document.getElementById('prodStatus').value,
      novo: false,
    };

    if (produtoEditandoId) {
      // Editar existente
      const idx = produtos.findIndex(p => p.id === produtoEditandoId);
      if (idx >= 0) produtos[idx] = { ...produtos[idx], ...dados };
    } else {
      // Novo produto
      dados.id = 'p_' + Date.now();
      produtos.push(dados);
    }

    fecharModal('modalProduto');
    renderizarTabela();
    Carrinho._mostrarFeedback('Produto salvo com sucesso!');
    this.reset();
    produtoEditandoId = null;
  });

  // ---- NOVO PRODUTO ---- //
  document.getElementById('btnNovoProduto')?.addEventListener('click', () => {
    produtoEditandoId = null;
    document.getElementById('formProduto').reset();
    document.getElementById('modalProdTitulo').textContent = 'Novo Produto';
    document.getElementById('entradaEstoqueArea').style.display = 'none';
    document.getElementById('motivoInativacaoArea').style.display = 'none';
    document.getElementById('calcCusto').textContent = 'R$ 0,00';
    document.getElementById('calcVenda').textContent = 'R$ 0,00';
    abrirModal('modalProduto');
  });

  // ---- FILTROS ---- //
  ['prodBusca','prodFiltroCategoria','prodFiltroStatus'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderizarTabela);
    document.getElementById(id)?.addEventListener('change', renderizarTabela);
  });

  // Iniciar
  renderizarTabela();
});
*/