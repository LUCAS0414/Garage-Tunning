document.addEventListener('DOMContentLoaded', function() {

  let cupomAtivo = null;

  function renderizar() {
    const itens          = Carrinho.itens;
    const carrinhoItens  = document.getElementById('carrinhoItens');
    const carrinhoVazio  = document.getElementById('carrinhoVazio');
    const carrinhoLayout = document.getElementById('carrinhoLayout');

    if (itens.length === 0) {
      carrinhoLayout.style.display = 'none';
      carrinhoVazio.style.display  = 'block';
      return;
    }

    carrinhoLayout.style.display = 'grid';
    carrinhoVazio.style.display  = 'none';

    carrinhoItens.innerHTML = itens.map(item => {
      const emoji = item.categoria === 'JDM' ? '🇯🇵' : item.categoria === 'Americanos' ? '🇺🇸'
                  : item.categoria === 'Italianos' ? '🇮🇹' : item.categoria === 'Alemães' ? '🇩🇪' : '🔧';
      return `
        <div class="carrinho-item" data-id="${item.id}">
          <div class="carrinho-item__imagem">${emoji}</div>
          <div class="carrinho-item__info">
            <div class="carrinho-item__cat">${item.categoria}</div>
            <div class="carrinho-item__nome">${item.nome}</div>
            <div class="carrinho-item__codigo">#${item.codigo}</div>
            <div class="carrinho-item__estoque">
              <span class="estoque-dot" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--cor-primaria);margin-right:4px;"></span>
              ${item.estoque} unidades disponíveis
            </div>
          </div>
          <div class="carrinho-item__acoes">
            <span class="carrinho-item__preco">R$ ${(item.preco * item.quantidade).toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
            <div class="item-qty">
              <button class="qty-btn" data-acao="diminuir" data-id="${item.id}">−</button>
              <input type="number" value="${item.quantidade}" min="1" max="${item.estoque}" data-id="${item.id}" data-acao="qty">
              <button class="qty-btn" data-acao="aumentar" data-id="${item.id}">+</button>
            </div>
            <button class="item-remover" data-acao="remover" data-id="${item.id}">🗑 Remover</button>
          </div>
        </div>`;
    }).join('');

    // Cálculos
    const subtotal = Carrinho.totalValor;
    const frete    = subtotal >= 500 ? 0 : 49.90;
    let desconto   = 0;

    if (cupomAtivo) {
      desconto = cupomAtivo.tipo === 'percentual'
        ? subtotal * cupomAtivo.desconto
        : cupomAtivo.desconto;
    }

    const total = subtotal + frete - desconto;

    document.getElementById('resumoLinhas').innerHTML = `
      <div class="resumo-linha"><span>Subtotal (${Carrinho.totalItens} itens)</span><span>R$ ${subtotal.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>
      <div class="resumo-linha"><span>Frete</span><span>${frete === 0 ? '<span style="color:var(--cor-primaria)">Grátis</span>' : 'R$ ' + frete.toFixed(2)}</span></div>
      ${desconto > 0 ? `<div class="resumo-linha desconto"><span>Desconto (cupom)</span><span>- R$ ${desconto.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>` : ''}`;

    document.getElementById('resumoTotal').innerHTML = `
      <span>Total</span>
      <strong>R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong>`;

    const aviso = document.getElementById('avisoBloqueio');
    if (aviso) aviso.style.display = 'flex';
  }

  // Eventos dos itens
  document.getElementById('carrinhoItens')?.addEventListener('click', (e) => {
    const btn  = e.target.closest('[data-acao]');
    if (!btn)  return;
    const acao = btn.dataset.acao;
    const id   = btn.dataset.id;

    if (acao === 'remover') {
      Carrinho.remover(id); renderizar();
    } else if (acao === 'diminuir') {
      const item = Carrinho.itens.find(i => String(i.id) === String(id));
      if (item && item.quantidade > 1) { Carrinho.atualizarQuantidade(id, item.quantidade - 1); renderizar(); }
    } else if (acao === 'aumentar') {
      const item = Carrinho.itens.find(i => String(i.id) === String(id));
      if (item) {
        const max = item.estoque != null ? item.estoque : Infinity;
        if (item.quantidade < max) { Carrinho.atualizarQuantidade(id, item.quantidade + 1); renderizar(); }
      }
    }
  });

  document.getElementById('carrinhoItens')?.addEventListener('change', (e) => {
    const input = e.target.closest('[data-acao="qty"]');
    if (!input) return;
    const id   = input.dataset.id;
    const item = Carrinho.itens.find(i => String(i.id) === String(id));
    if (item) {
      const qty = Math.max(1, Math.min(parseInt(input.value) || 1, item.estoque));
      Carrinho.atualizarQuantidade(id, qty);
      renderizar();
    }
  });

  // Cupom via API
  document.getElementById('btnAplicarCupom')?.addEventListener('click', async () => {
    const codigo     = document.getElementById('cupomInput').value.trim().toUpperCase();
    const feedbackEl = document.getElementById('cupomFeedback');
    if (!codigo) return;

    try {
      const usuario   = JSON.parse(localStorage.getItem('garage_user') || '{}');
      const clienteId = usuario.id || 0;

      const resp = await fetch('/api/cupons/validar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, clienteId, total: Carrinho.totalValor }),
      });
      const resultado = await resp.json();

      if (resp.ok && resultado.valido) {
        // Resposta: resultado.cupom.{tipo, valor}
        const cupomData = resultado.cupom;
        cupomAtivo = {
          desconto: cupomData.tipo === 'percentual' ? cupomData.valor / 100 : cupomData.valor,
          tipo:     cupomData.tipo,
        };
        feedbackEl.style.display = 'block';
        feedbackEl.innerHTML = `<span class="alerta alerta-sucesso">✓ Cupom aplicado: ${cupomData.tipo === 'percentual' ? cupomData.valor + '%' : 'R$ ' + cupomData.valor} de desconto</span>`;
        renderizar();
      } else {
        feedbackEl.style.display = 'block';
        feedbackEl.innerHTML = `<span class="alerta alerta-erro">⚠ ${resultado.motivo || 'Cupom inválido ou expirado'}</span>`;
      }
    } catch (err) {
      console.error('Erro ao validar cupom:', err);
      feedbackEl.style.display = 'block';
      feedbackEl.innerHTML = `<span class="alerta alerta-erro">⚠ Erro ao validar cupom. Tente novamente.</span>`;
    }
  });

  // Timer visual (sem reserva server-side — apenas UX)
  let tempoRestante = 15 * 60;
  const timer = setInterval(() => {
    tempoRestante--;
    const timerEl = document.getElementById('timerBloqueio');
    if (timerEl) {
      const min = Math.floor(tempoRestante / 60);
      const seg = tempoRestante % 60;
      timerEl.textContent = `${String(min).padStart(2,'0')}:${String(seg).padStart(2,'0')}`;
      if (tempoRestante <= 120)     timerEl.style.color = 'var(--cor-erro)';
      else if (tempoRestante <= 300) timerEl.style.color = 'var(--cor-destaque)';
    }
    if (tempoRestante <= 0) {
      clearInterval(timer);
      const notif = document.getElementById('notificacaoExpiracao');
      if (notif) {
        notif.style.display = 'block';
        notif.innerHTML = `<div class="alerta alerta-erro">⚠ Sessão expirada. Verifique a disponibilidade dos itens antes de finalizar.</div>`;
      }
    }
  }, 1000);

  renderizar();
});
