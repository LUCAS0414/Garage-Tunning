/**
 * admin-vendas.js
 * Schema novo: pedidos usa codigo_pedido, usuario_id, valor_total, data_pedido.
 * Status em MAIÚSCULO: 'EM PROCESSAMENTO', 'APROVADO', 'REPROVADO', 'EM TRANSPORTE',
 *                      'ENTREGUE', 'EM TROCA', 'TROCA AUTORIZADA', 'TROCADO'
 * Tabela de itens: pedido_itens (sem nome_produto — precisa JOIN com produtos).
 */
document.addEventListener('DOMContentLoaded', async function() {

  const STATUS = {
    'EM PROCESSAMENTO': { label: 'Em Processamento', badge: 'status-em-processamento', proximos: ['APROVADO', 'REPROVADO'] },
    'APROVADO':         { label: 'Aprovado',          badge: 'status-aprovada',         proximos: ['EM TRANSPORTE'] },
    'REPROVADO':        { label: 'Reprovado',         badge: 'status-reprovada',         proximos: [] },
    'EM TRANSPORTE':    { label: 'Em Transporte',     badge: 'status-em-transporte',     proximos: ['ENTREGUE'] },
    'ENTREGUE':         { label: 'Entregue',          badge: 'status-entregue',          proximos: ['EM TROCA'] },
    'EM TROCA':         { label: 'Em Troca',          badge: 'status-em-troca',          proximos: ['TROCA AUTORIZADA', 'ENTREGUE'] },
    'TROCA AUTORIZADA': { label: 'Troca Autorizada',  badge: 'status-troca-autorizada',  proximos: ['TROCADO'] },
    'TROCADO':          { label: 'Trocado',           badge: 'status-trocado',           proximos: [] },
  };

  let pedidos = [];
  try {
    const resp = await fetch('/api/admin/pedidos?limite=100');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const dados = await resp.json();

    // Mapear campos do novo schema
    pedidos = (dados.pedidos || []).map(p => ({
      id:        p.codigo_pedido || `GT-${p.id}`,
      pedidoId:  p.id,
      cliente:   p.cliente_nome  || 'Cliente',
      email:     p.cliente_email || '',
      data:      p.data_pedido,
      itens:     (p.itens || []).map(i => ({
        nome:  i.nome_produto || i.nome || 'Produto',
        qty:   i.quantidade,
        preco: parseFloat(i.preco_unitario || 0),
      })),
      total:     parseFloat(p.valor_total),
      status:    p.status,
    }));
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
    pedidos = [];
  }

  let pedidoSelecionadoId = null;

  function atualizarStats() {
    document.getElementById('statPedidos').textContent    = pedidos.length;
    document.getElementById('statProcessando').textContent = pedidos.filter(p => p.status === 'EM PROCESSAMENTO').length;
    document.getElementById('statTransporte').textContent  = pedidos.filter(p => p.status === 'EM TRANSPORTE').length;
    document.getElementById('statTrocas').textContent      = pedidos.filter(p => p.status === 'EM TROCA' || p.status === 'TROCA AUTORIZADA').length;
  }

  function renderizarTabela() {
    const busca       = document.getElementById('vendaBusca')?.value.toLowerCase() || '';
    const statusFiltro = document.getElementById('vendaFiltroStatus')?.value || '';

    const lista = pedidos.filter(p => {
      const matchBusca   = !busca || p.id.toLowerCase().includes(busca) || p.cliente.toLowerCase().includes(busca) || p.email.toLowerCase().includes(busca);
      const matchStatus  = !statusFiltro || p.status === statusFiltro;
      return matchBusca && matchStatus;
    });

    const tbody = document.getElementById('tabelaVendasBody');
    if (!tbody) return;

    tbody.innerHTML = lista.map(p => {
      const statusInfo = STATUS[p.status] || { label: p.status, badge: '' };
      return `
        <tr>
          <td><strong style="font-family:var(--fonte-mono);">#${p.id}</strong></td>
          <td>
            <div style="font-family:var(--fonte-destaque);font-size:0.9rem;">${p.cliente}</div>
            <div class="texto-muted texto-pequeno">${p.email}</div>
          </td>
          <td><span class="texto-mono texto-pequeno">${new Date(p.data).toLocaleDateString('pt-BR')}</span></td>
          <td class="texto-pequeno texto-muted">${p.itens.length} item${p.itens.length !== 1 ? 's' : ''}</td>
          <td><strong style="color:var(--cor-primaria);">R$ ${p.total.toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong></td>
          <td><span class="badge ${statusInfo.badge}">${statusInfo.label}</span></td>
          <td><button class="btn btn-outline btn-sm" data-acao="detalhe" data-id="${p.id}">Ver</button></td>
        </tr>`;
    }).join('');

    atualizarStats();
  }

  document.getElementById('tabelaVendasBody')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-acao="detalhe"]');
    if (!btn) return;
    const pedido = pedidos.find(p => p.id === btn.dataset.id);
    if (!pedido) return;
    pedidoSelecionadoId = btn.dataset.id;
    abrirDetalhe(pedido);
  });

  function abrirDetalhe(pedido) {
    document.getElementById('modalPedidoTitulo').textContent = `#${pedido.id}`;
    const statusInfo = STATUS[pedido.status] || { label: pedido.status, badge: '' };

    const itensHTML = pedido.itens.map(i =>
      `<div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--cor-borda);font-size:0.85rem;">
        <span>${i.nome} x${i.qty}</span>
        <span>R$ ${(i.preco * i.qty).toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
      </div>`
    ).join('');

    document.getElementById('modalPedidoConteudo').innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;">
        <div><div class="texto-muted texto-pequeno">Cliente</div><strong>${pedido.cliente}</strong> — ${pedido.email}</div>
        <div><div class="texto-muted texto-pequeno">Data</div><span>${new Date(pedido.data).toLocaleDateString('pt-BR')}</span></div>
        <div><div class="texto-muted texto-pequeno">Status</div><span class="badge ${statusInfo.badge}">${statusInfo.label}</span></div>
      </div>
      <div style="margin-bottom:1rem;">${itensHTML}</div>
      <div style="text-align:right;font-family:var(--fonte-titulo);font-size:1.3rem;color:var(--cor-primaria);">
        Total: R$ ${pedido.total.toLocaleString('pt-BR', {minimumFractionDigits:2})}
      </div>`;

    const proximos = STATUS[pedido.status]?.proximos || [];
    const acoes    = document.getElementById('acoesPedido');
    if (acoes) {
      acoes.innerHTML = proximos.map(s =>
        `<button class="btn btn-outline btn-sm" data-novo-status="${s}">→ ${STATUS[s]?.label || s}</button>`
      ).join('') || `<span class="texto-muted texto-pequeno">Nenhuma ação disponível</span>`;
    }

    const trocaArea = document.getElementById('trocaArea');
    const recArea   = document.getElementById('recebimentoArea');
    if (trocaArea) trocaArea.style.display = pedido.status === 'EM TROCA'         ? 'block' : 'none';
    if (recArea)   recArea.style.display   = pedido.status === 'TROCA AUTORIZADA' ? 'block' : 'none';

    if (pedido.status === 'EM TROCA' || pedido.status === 'TROCA AUTORIZADA') {
      fetch(`/api/admin/trocas?status=`)
        .then(r => r.json())
        .then(trocas => {
          const troca = trocas.find(t => t.codigo_pedido === pedido.id.replace(/^GT-\d+-?/, '') || String(t.codigo_pedido) === String(pedido.id));
          const el = document.getElementById('motivoTroca');
          if (el) el.value = troca?.motivo || '(motivo não encontrado)';
        })
        .catch(() => {
          const el = document.getElementById('motivoTroca');
          if (el) el.value = '(erro ao buscar motivo)';
        });
    }

    abrirModal('modalPedido');
  }

  // Mudar status — persiste na API
  document.getElementById('acoesPedido')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-novo-status]');
    if (!btn) return;
    const novoStatus = btn.dataset.novoStatus;
    const pedido = pedidos.find(p => p.id === pedidoSelecionadoId);
    if (!pedido) return;

    try {
      const resp = await fetch(`/api/admin/pedidos/${pedido.pedidoId}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      Carrinho._mostrarFeedback('Erro ao atualizar status.');
      return;
    }

    pedido.status = novoStatus;
    renderizarTabela();
    abrirDetalhe(pedido);
    Carrinho._mostrarFeedback(`Status: ${STATUS[novoStatus]?.label}`);
  });

  // Autorizar troca
  document.getElementById('btnAutorizarTroca')?.addEventListener('click', async () => {
    const pedido = pedidos.find(p => p.id === pedidoSelecionadoId);
    if (!pedido) return;
    try {
      await fetch(`/api/admin/trocas/pedido/${pedido.pedidoId}/autorizar`, { method: 'PUT' });
    } catch (err) { console.error(err); }
    pedido.status = 'TROCA AUTORIZADA';
    renderizarTabela(); abrirDetalhe(pedido);
    Carrinho._mostrarFeedback('Troca autorizada!');
  });

  document.getElementById('btnNegarTroca')?.addEventListener('click', async () => {
    const pedido = pedidos.find(p => p.id === pedidoSelecionadoId);
    if (!pedido) return;
    try {
      await fetch(`/api/admin/trocas/pedido/${pedido.pedidoId}/negar`, { method: 'PUT' });
    } catch (err) { console.error(err); }
    pedido.status = 'ENTREGUE';
    renderizarTabela(); fecharModal('modalPedido');
    Carrinho._mostrarFeedback('Troca negada.');
  });

  document.getElementById('btnConfirmarRecebimento')?.addEventListener('click', async () => {
    const pedido = pedidos.find(p => p.id === pedidoSelecionadoId);
    if (!pedido) return;
    try {
      const resp = await fetch(`/api/admin/trocas/pedido/${pedido.pedidoId}/recebimento`,{method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({retornarEstoque: false}),
      });
      if (!resp.ok){
        const err = await resp.json();
        Carrinho._mostrarFeedback('Erro: ' + (err.error || 'Falha ao confirmar recebimento.'));
        return;
      }
    } catch (err) { 
      console.error(err);
      Carrinho._mostrarFeedback('Erro de conexão ao confirmar recebimento.');
      return;
    }
    pedido.status = 'TROCADO';
    renderizarTabela(); fecharModal('modalPedido');
    Carrinho._mostrarFeedback('Recebimento confirmado! Cupom gerado para o cliente.');
  });

  // Cupom manual (admin)
  document.getElementById('btnGerarCupom')?.addEventListener('click', () => abrirModal('modalCupom'));

  document.getElementById('btnGerarCodigoCupom')?.addEventListener('click', () => {
    document.getElementById('cupomCodigo').value = 'GARAGE' + Math.random().toString(36).substr(2,4).toUpperCase();
  });

  document.getElementById('btnSalvarCupom')?.addEventListener('click', async () => {
    const codigo    = document.getElementById('cupomCodigo').value.trim().toUpperCase();
    const tipo      = document.getElementById('cupomTipo').value;
    const valor     = parseFloat(document.getElementById('cupomValor').value);
    const validade  = document.getElementById('cupomValidade')?.value || null;

    if (!codigo || !valor) { alert('Preencha o código e o valor'); return; }

    try {
      const resp = await fetch('/api/admin/cupons', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, tipo, valor, data_validade: validade }),
      });
      if (!resp.ok) throw new Error();
      Carrinho._mostrarFeedback(`Cupom ${codigo} criado!`);
      setTimeout(() => fecharModal('modalCupom'), 1500);
    } catch {
      alert('Erro ao criar cupom.');
    }
  });

  ['vendaBusca','vendaFiltroStatus'].forEach(id => {
    document.getElementById(id)?.addEventListener('input',  renderizarTabela);
    document.getElementById(id)?.addEventListener('change', renderizarTabela);
  });

  renderizarTabela();
});
