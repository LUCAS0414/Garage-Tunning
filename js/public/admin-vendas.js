
document.addEventListener('DOMContentLoaded', function() {

  // Status disponíveis e transições
  const STATUS = {
    'em-processamento': { label: 'Em Processamento', badge: 'status-em-processamento', proximos: ['aprovada', 'reprovada'] },
    'aprovada': { label: 'Aprovada', badge: 'status-aprovada', proximos: ['em-transporte'] },
    'reprovada': { label: 'Reprovada', badge: 'status-reprovada', proximos: [] },
    'em-transporte': { label: 'Em Transporte', badge: 'status-em-transporte', proximos: ['entregue'] },
    'entregue': { label: 'Entregue', badge: 'status-entregue', proximos: ['em-troca'] },
    'em-troca': { label: 'Em Troca', badge: 'status-em-troca', proximos: ['troca-autorizada', 'entregue'] },
    'troca-autorizada': { label: 'Troca Autorizada', badge: 'status-troca-autorizada', proximos: ['trocado'] },
    'trocado': { label: 'Trocado', badge: 'status-trocado', proximos: [] },
  };

  // Pedidos mockados (futuro: GET /api/admin/pedidos)
  let pedidos = [
    { id: 'GT-2024-0043', cliente: 'Ana Silva', email: 'ana@email.com', data: '2024-12-18', itens: [{ nome: 'Kit Turbo T3/T4', qty: 1, preco: 5490 }], total: 5490, status: 'em-processamento', pagamento: 'VISA ****4242' },
    { id: 'GT-2024-0042', cliente: 'Carlos Tuner', email: 'carlos@tuner.com', data: '2024-12-12', itens: [{ nome: 'Suspensão Coilover', qty: 1, preco: 3890 }], total: 3890, status: 'em-transporte', pagamento: 'PIX' },
    { id: 'GT-2024-0041', cliente: 'Marcos R.', email: 'marcos@email.com', data: '2024-12-10', itens: [{ nome: 'Rodas Rays 57DR', qty: 4, preco: 8900 }], total: 35600, status: 'aprovada', pagamento: 'MASTER ****5555' },
    { id: 'GT-2024-0038', cliente: 'Carlos Tuner', email: 'carlos@tuner.com', data: '2024-11-28', itens: [{ nome: 'Spoiler Carbon', qty: 1, preco: 1290 }, { nome: 'Cold Air Intake', qty: 1, preco: 780 }], total: 2070, status: 'entregue', pagamento: 'VISA ****4242' },
    { id: 'GT-2024-0031', cliente: 'Carlos Tuner', email: 'carlos@tuner.com', data: '2024-11-15', itens: [{ nome: 'Kit Turbo T3/T4', qty: 1, preco: 5490 }], total: 5490, status: 'em-troca', pagamento: 'VISA ****4242', motivoTroca: 'Produto com defeito' },
    { id: 'GT-2024-0025', cliente: 'Julia M.', email: 'julia@email.com', data: '2024-11-02', itens: [{ nome: 'Molas Esportivas', qty: 4, preco: 890 }], total: 3560, status: 'reprovada', pagamento: 'VISA ****1111' },
  ];

  let pedidoSelecionadoId = null;

  // ---- STATS ---- //
  function atualizarStats() {
    document.getElementById('statPedidos').textContent = pedidos.length;
    document.getElementById('statProcessando').textContent = pedidos.filter(p => p.status === 'em-processamento').length;
    document.getElementById('statTransporte').textContent = pedidos.filter(p => p.status === 'em-transporte').length;
    document.getElementById('statTrocas').textContent = pedidos.filter(p => p.status === 'em-troca' || p.status === 'troca-autorizada').length;
  }

  // ---- RENDERIZAR TABELA ---- //
  function renderizarTabela() {
    const busca = document.getElementById('vendaBusca')?.value.toLowerCase() || '';
    const statusFiltro = document.getElementById('vendaFiltroStatus')?.value || '';

    const lista = pedidos.filter(p => {
      const matchBusca = !busca || p.id.toLowerCase().includes(busca) || p.cliente.toLowerCase().includes(busca) || p.email.toLowerCase().includes(busca);
      const matchStatus = !statusFiltro || p.status === statusFiltro;
      return matchBusca && matchStatus;
    });

    const tbody = document.getElementById('tabelaVendasBody');
    if (!tbody) return;

    tbody.innerHTML = lista.map(p => {
      const statusInfo = STATUS[p.status];
      return `
        <tr>
          <td><strong style="font-family:var(--fonte-mono);">#${p.id}</strong></td>
          <td>
            <div style="font-family:var(--fonte-destaque); font-size:0.9rem;">${p.cliente}</div>
            <div class="texto-muted texto-pequeno">${p.email}</div>
          </td>
          <td><span class="texto-mono texto-pequeno">${new Date(p.data).toLocaleDateString('pt-BR')}</span></td>
          <td class="texto-pequeno texto-muted">${p.itens.length} item${p.itens.length > 1 ? 's' : ''}</td>
          <td><strong style="color:var(--cor-primaria);">R$ ${p.total.toLocaleString('pt-BR')}</strong></td>
          <td><span class="badge ${statusInfo?.badge || ''}">${statusInfo?.label || p.status}</span></td>
          <td>
            <button class="btn btn-outline btn-sm" data-acao="detalhe" data-id="${p.id}">Ver</button>
          </td>
        </tr>
      `;
    }).join('');

    atualizarStats();
  }

  // ---- ABRIR DETALHES ---- //
  document.getElementById('tabelaVendasBody')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-acao="detalhe"]');
    if (!btn) return;
    const id = btn.dataset.id;
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido) return;
    pedidoSelecionadoId = id;
    abrirDetalhe(pedido);
  });

  function abrirDetalhe(pedido) {
    document.getElementById('modalPedidoTitulo').textContent = `#${pedido.id}`;
    const statusInfo = STATUS[pedido.status];

    // Conteúdo
    const itensHTML = pedido.itens.map(i =>
      `<div class="pedido-item-linha" style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--cor-borda);font-size:0.85rem;">
        <span>${i.nome} x${i.qty}</span>
        <span>R$ ${(i.preco * i.qty).toLocaleString('pt-BR')}</span>
      </div>`
    ).join('');

    document.getElementById('modalPedidoConteudo').innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;">
        <div>
          <div class="texto-muted texto-pequeno">Cliente</div>
          <strong>${pedido.cliente}</strong> — ${pedido.email}
        </div>
        <div>
          <div class="texto-muted texto-pequeno">Data</div>
          <span>${new Date(pedido.data).toLocaleDateString('pt-BR')}</span>
        </div>
        <div>
          <div class="texto-muted texto-pequeno">Pagamento</div>
          <span>${pedido.pagamento}</span>
        </div>
        <div>
          <div class="texto-muted texto-pequeno">Status Atual</div>
          <span class="badge ${statusInfo?.badge || ''}">${statusInfo?.label || pedido.status}</span>
        </div>
      </div>
      <div style="margin-bottom:1rem;">${itensHTML}</div>
      <div style="text-align:right;font-family:var(--fonte-titulo);font-size:1.3rem;color:var(--cor-primaria);">
        Total: R$ ${pedido.total.toLocaleString('pt-BR')}
      </div>
    `;

    // Ações baseadas no status
    const proximos = statusInfo?.proximos || [];
    const acoes = document.getElementById('acoesPedido');
    if (acoes) {
      acoes.innerHTML = proximos.map(s => `
        <button class="btn btn-outline btn-sm" data-novo-status="${s}">
          → ${STATUS[s]?.label || s}
        </button>
      `).join('') || `<span class="texto-muted texto-pequeno">Nenhuma ação disponível</span>`;
    }

    // Área de troca
    const trocaArea = document.getElementById('trocaArea');
    const recArea = document.getElementById('recebimentoArea');
    if (trocaArea) trocaArea.style.display = pedido.status === 'em-troca' ? 'block' : 'none';
    if (recArea) recArea.style.display = pedido.status === 'troca-autorizada' ? 'block' : 'none';
    if (pedido.motivoTroca && document.getElementById('motivoTroca')) {
      document.getElementById('motivoTroca').value = pedido.motivoTroca;
    }

    abrirModal('modalPedido');
  }

  // ---- MUDAR STATUS ---- //
  document.getElementById('acoesPedido')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-novo-status]');
    if (!btn) return;
    const novoStatus = btn.dataset.novoStatus;
    const pedido = pedidos.find(p => p.id === pedidoSelecionadoId);
    if (!pedido) return;
    pedido.status = novoStatus;
    renderizarTabela();
    abrirDetalhe(pedido);
    Carrinho._mostrarFeedback(`Status atualizado: ${STATUS[novoStatus]?.label}`);
  });

  // Autorizar troca
  document.getElementById('btnAutorizarTroca')?.addEventListener('click', () => {
    const pedido = pedidos.find(p => p.id === pedidoSelecionadoId);
    if (!pedido) return;
    pedido.status = 'troca-autorizada';
    renderizarTabela();
    abrirDetalhe(pedido);
    Carrinho._mostrarFeedback('Troca autorizada!');
  });

  document.getElementById('btnNegarTroca')?.addEventListener('click', () => {
    const pedido = pedidos.find(p => p.id === pedidoSelecionadoId);
    if (!pedido) return;
    pedido.status = 'entregue';
    renderizarTabela();
    fecharModal('modalPedido');
    Carrinho._mostrarFeedback('Solicitação de troca negada.');
  });

  document.getElementById('btnConfirmarRecebimento')?.addEventListener('click', () => {
    const pedido = pedidos.find(p => p.id === pedidoSelecionadoId);
    if (!pedido) return;
    pedido.status = 'trocado';
    renderizarTabela();
    fecharModal('modalPedido');
    Carrinho._mostrarFeedback('Recebimento confirmado. Pedido marcado como Trocado!');
  });

  // ---- GERAR CUPOM ---- //
  document.getElementById('btnGerarCupom')?.addEventListener('click', () => abrirModal('modalCupom'));

  document.getElementById('btnGerarCodigoCupom')?.addEventListener('click', () => {
    const codigo = 'GARAGE' + Math.random().toString(36).substr(2,4).toUpperCase();
    document.getElementById('cupomCodigo').value = codigo;
  });

  document.getElementById('btnSalvarCupom')?.addEventListener('click', () => {
    const codigo = document.getElementById('cupomCodigo').value.trim().toUpperCase();
    const tipo = document.getElementById('cupomTipo').value;
    const valor = document.getElementById('cupomValor').value;

    if (!codigo || !valor) { alert('Preencha o código e o valor'); return; }

    const preview = document.getElementById('cupomPreview');
    const previewTexto = document.getElementById('cupomPreviewTexto');
    if (preview && previewTexto) {
      const descStr = tipo === 'percentual' ? `${valor}% de desconto` : `R$ ${valor} de desconto`;
      previewTexto.textContent = `${codigo} — ${descStr}`;
      preview.style.display = 'block';
    }

    Carrinho._mostrarFeedback(`Cupom ${codigo} criado!`);
    setTimeout(() => fecharModal('modalCupom'), 1500);
  });

  // ---- FILTROS ---- //
  ['vendaBusca','vendaFiltroStatus'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderizarTabela);
    document.getElementById(id)?.addEventListener('change', renderizarTabela);
  });

  renderizarTabela();
});
