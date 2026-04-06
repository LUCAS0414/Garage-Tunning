/**
 * admin-produtos.js
 * Gerencia o cadastro, edição, ativação/inativação e listagem de produtos.
 * Consome: GET/POST /api/produtos  |  PUT /api/produtos/:id  |  DELETE /api/produtos/:id
 */
document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();

  // Botão Novo Produto
  document.getElementById('btnNovoProduto')?.addEventListener('click', () => {
    produtoEditandoId = null;
    document.getElementById('formProduto').reset();
    document.getElementById('modalProdTitulo').textContent = 'Novo Produto';
    document.getElementById('entradaEstoqueArea').style.display = 'none';
    document.getElementById('motivoInativacaoArea').style.display = 'none';
    document.getElementById('calcCusto').textContent  = 'R$ 0,00';
    document.getElementById('calcVenda').textContent  = 'R$ 0,00';
    abrirModal('modalProduto');
  });

  // Submit do form de produto
  document.getElementById('formProduto')?.addEventListener('submit', salvarProduto);

  // Cálculo de preço em tempo real
  document.getElementById('prodCusto')?.addEventListener('input', atualizarCalculo);
  document.getElementById('prodGrupoPrecificacao')?.addEventListener('change', atualizarCalculo);

  // Mostrar motivo ao inativar
  document.getElementById('prodStatus')?.addEventListener('change', function () {
    document.getElementById('motivoInativacaoArea').style.display =
      this.value === 'inativo' ? 'block' : 'none';
  });

  // Confirmar inativação via modal
  document.getElementById('btnConfirmarInativar')?.addEventListener('click', confirmarInativar);

  // Filtros
  ['prodBusca', 'prodFiltroCategoria', 'prodFiltroStatus'].forEach(id => {
    document.getElementById(id)?.addEventListener('input',  () => carregarProdutos());
    document.getElementById(id)?.addEventListener('change', () => carregarProdutos());
  });
});

//Estado local
let produtoEditandoId  = null;
let produtoInativandoId = null;

const MARKUP = { standard: 0.40, premium: 0.60, competitivo: 0.25, personalizado: 0 };

// Carregar produtos da API
async function carregarProdutos() {
  const busca     = document.getElementById('prodBusca')?.value || '';
  const categoria = document.getElementById('prodFiltroCategoria')?.value || '';
  const statusFil = document.getElementById('prodFiltroStatus')?.value || '';

  // Montar query string
  const qs = new URLSearchParams();
  if (busca)     qs.set('busca', busca);
  if (categoria) qs.set('categoria', categoria);
  qs.set('limite', 100);
  // Admin precisa ver inativos também — usar rota geral com flag
  if (statusFil === 'inativo') qs.set('apenasAtivos', 'false');

  try {
    const res  = await fetch(`/api/produtos?${qs}`);
    const json = await res.json();

    // API retorna { produtos: [], total } ou array (compatibilidade)
    const lista = Array.isArray(json) ? json : (json.produtos || []);

    // Filtro local de status (API só tem status 1/0, filtro front)
    const filtrada = statusFil
      ? lista.filter(p => statusFil === 'ativo' ? p.status == 1 : p.status == 0)
      : lista;

    renderizarTabela(filtrada);
    atualizarStats(lista);
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
  }
}

//Stats
function atualizarStats(produtos) {
  document.getElementById('statTotal').textContent        = produtos.length;
  document.getElementById('statAtivos').textContent       = produtos.filter(p => p.status == 1).length;
  document.getElementById('statInativos').textContent     = produtos.filter(p => p.status == 0).length;
  document.getElementById('statBaixoEstoque').textContent = produtos.filter(p => p.estoque_atual <= 3).length;
}

//Renderizar tabela
function renderizarTabela(produtos) {
  const tbody = document.getElementById('tabelaProdutosBody');
  if (!tbody) return;

  if (!produtos || produtos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--cor-texto-muted);padding:2rem;">Nenhum produto encontrado.</td></tr>`;
    return;
  }

  const catCor = { JDM: 'verde', Americanos: 'laranja', Italianos: 'azul', Alemães: 'amarelo', Peças: 'cinza' };

  tbody.innerHTML = produtos.map(p => {
    const ativo       = p.status == 1;
    const estoqueClass= p.estoque_atual === 0 ? 'estoque-zerado'
                      : p.estoque_atual  <= 3  ? 'estoque-baixo' : 'estoque-ok';
    const statusBadge = ativo
      ? `<span class="badge badge-verde">Ativo</span>`
      : `<span class="badge badge-cinza">Inativo</span>`;
    const cor = catCor[p.categoria] || 'cinza';

    return `
      <tr class="${ativo ? '' : 'inativo'}">
        <td><strong style="font-family:var(--fonte-destaque);font-size:0.9rem;">${p.nome}</strong></td>
        <td><span style="font-family:var(--fonte-mono);font-size:0.75rem;color:var(--cor-texto-muted);">${p.codigo}</span></td>
        <td><span class="badge badge-${cor}">${p.categoria}</span></td>
        <td>R$ ${Number(p.preco_custo || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
        <td style="color:var(--cor-primaria);font-weight:600;">R$ ${Number(p.preco_venda || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
        <td><span class="estoque-badge ${estoqueClass}">${p.estoque_atual} un.</span></td>
        <td>${statusBadge}</td>
        <td>
          <div class="tabela-acoes">
            <button class="btn btn-outline btn-sm" data-acao="editar"   data-id="${p.id}" title="Editar">✏️</button>
            ${ativo
              ? `<button class="btn btn-danger btn-sm"  data-acao="inativar" data-id="${p.id}" title="Inativar">🚫</button>`
              : `<button class="btn btn-outline btn-sm" data-acao="ativar"   data-id="${p.id}" title="Ativar" style="border-color:var(--cor-primaria);color:var(--cor-primaria);">✓ Ativar</button>`
            }
          </div>
        </td>
      </tr>`;
  }).join('');

  // Delegação de eventos
  tbody.replaceWith(tbody.cloneNode(true)); // remove listeners antigos
  const novoTbody = document.getElementById('tabelaProdutosBody');
  novoTbody.addEventListener('click', handleTabelaClick);
}

//Ações da tabela
async function handleTabelaClick(e) {
  const btn = e.target.closest('[data-acao]');
  if (!btn) return;
  const acao = btn.dataset.acao;
  const id   = btn.dataset.id;

  if (acao === 'editar') {
    await abrirFormEditar(id);
  } else if (acao === 'inativar') {
    produtoInativandoId = id;
    abrirModal('modalInativar');
  } else if (acao === 'ativar') {
    await alterarStatusProduto(id, 1);
  }
}

//Abrir form de edição
async function abrirFormEditar(id) {
  try {
    const res = await fetch(`/api/produtos/${id}`);
    const p   = await res.json();

    produtoEditandoId = id;
    document.getElementById('modalProdTitulo').textContent = 'Editar Produto';

    document.getElementById('prodNome').value              = p.nome            || '';
    document.getElementById('prodCodigo').value            = p.codigo          || '';
    document.getElementById('prodCategoria').value         = p.categoria       || '';
    document.getElementById('prodGrupoPrecificacao').value = p.grupo_precificacao || 'standard';
    document.getElementById('prodCusto').value             = p.preco_custo     || '';
    document.getElementById('prodVenda').value             = p.preco_venda     || '';
    document.getElementById('prodPrecoOriginal').value     = p.preco_original  || '';
    document.getElementById('prodDescricao').value         = p.descricao       || '';
    document.getElementById('prodEstoque').value           = p.estoque_atual   || 0;
    document.getElementById('prodEstoqueMin').value        = p.estoque_minimo  || 0;
    document.getElementById('prodPesoKg').value            = p.peso_kg         || '';
    document.getElementById('prodImagemUrl').value         = p.imagem_url      || '';
    document.getElementById('prodIsNovo').checked          = p.is_novo == 1;
    document.getElementById('prodStatus').value            = p.status == 1 ? 'ativo' : 'inativo';
    document.getElementById('motivoInativacaoArea').style.display = p.status == 0 ? 'block' : 'none';
    document.getElementById('entradaEstoqueArea').style.display   = 'block';

    atualizarCalculo();
    abrirModal('modalProduto');
  } catch (err) {
    console.error('Erro ao carregar produto:', err);
  }
}

// Salvar produto (criar ou editar)
async function salvarProduto(e) {
  e.preventDefault();

  const dados = {
    nome:               document.getElementById('prodNome').value.trim(),
    codigo:             document.getElementById('prodCodigo').value.trim() || gerarCodigo('GT'),
    categoria:          document.getElementById('prodCategoria').value,
    grupo_precificacao: document.getElementById('prodGrupoPrecificacao').value,
    preco_custo:        parseFloat(document.getElementById('prodCusto').value)         || 0,
    preco_venda:        parseFloat(document.getElementById('prodVenda').value)         || 0,
    preco_original:     parseFloat(document.getElementById('prodPrecoOriginal').value) || null,
    descricao:          document.getElementById('prodDescricao').value.trim()          || null,
    estoque_atual:      parseInt(document.getElementById('prodEstoque').value)         || 0,
    estoque_minimo:     parseInt(document.getElementById('prodEstoqueMin').value)      || 0,
    peso_kg:            parseFloat(document.getElementById('prodPesoKg').value)        || 0.5,
    imagem_url:         document.getElementById('prodImagemUrl').value.trim()          || null,
    is_novo:            document.getElementById('prodIsNovo').checked ? 1 : 0,
    status:             document.getElementById('prodStatus').value === 'ativo'  ? 1 : 0,
  };

  if (!dados.nome || !dados.categoria) {
    alert('Nome e categoria são obrigatórios.');
    return;
  }

  try {
    let res;
    if (produtoEditandoId) {
      res = await fetch(`/api/produtos/${produtoEditandoId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(dados),
      });
    } else {
      res = await fetch('/api/produtos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(dados),
      });
    }

    if (res.ok) {
      fecharModal('modalProduto');
      Carrinho._mostrarFeedback(produtoEditandoId ? 'Produto atualizado!' : 'Produto cadastrado!');
      produtoEditandoId = null;
      carregarProdutos();
    } else {
      const err = await res.json();
      alert('Erro: ' + (err.error || err.detalhe || 'Tente novamente.'));
    }
  } catch (err) {
    console.error('Erro ao salvar produto:', err);
    alert('Erro de conexão com o servidor.');
  }
}

//Confirmar inativação 
async function confirmarInativar() {
  const motivo = document.getElementById('motivoInativarModal')?.value;
  if (!motivo) { alert('Selecione um motivo.'); return; }
  await alterarStatusProduto(produtoInativandoId, 0);
  fecharModal('modalInativar');
}

async function alterarStatusProduto(id, status) {
  try {
    const res = await fetch(`/api/produtos/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    });
    if (res.ok) {
      Carrinho._mostrarFeedback(status === 1 ? 'Produto ativado!' : 'Produto inativado!');
      carregarProdutos();
    } else {
      const err = await res.json();
      alert('Erro: ' + (err.error || 'Tente novamente.'));
    }
  } catch (err) {
    console.error('Erro ao alterar status:', err);
  }
}

//Cálculo visual de preço 
function atualizarCalculo() {
  const custo   = parseFloat(document.getElementById('prodCusto')?.value) || 0;
  const grupo   = document.getElementById('prodGrupoPrecificacao')?.value || 'standard';
  const markup  = MARKUP[grupo] ?? 0;
  const sugerido= custo * (1 + markup);

  document.getElementById('calcCusto').textContent    = `R$ ${custo.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
  document.getElementById('calcMarkupPct').textContent= (markup * 100).toFixed(0);
  document.getElementById('calcMarkup').textContent   = `R$ ${(custo * markup).toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
  document.getElementById('calcVenda').textContent    = `R$ ${sugerido.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;

  const vendaInput = document.getElementById('prodVenda');
  if (vendaInput && !vendaInput.value) vendaInput.value = sugerido.toFixed(2);
}