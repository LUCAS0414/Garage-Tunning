
document.addEventListener('DOMContentLoaded', function() {

  // Cupons válidos (futuro: buscar do backend GET /api/cupons/validar/:codigo)
  const CUPONS = {
    'GARAGE10': { desconto: 0.10, tipo: 'percentual', desc: '10% de desconto' },
    'PRIMEIRACOMPRA': { desconto: 0.15, tipo: 'percentual', desc: '15% na primeira compra' },
    'FRETE0': { desconto: 50, tipo: 'fixo', desc: 'R$ 50,00 de desconto' },
  };

  let cupomAtivo = null;

  // ---- ADICIONAR ITEM DEMO (se carrinho vazio) ---- //
  if (Carrinho.itens.length === 0) {
    // Adicionar itens demo para visualização
    Carrinho.adicionar(DadosMock.produtos[0], 1);
    Carrinho.adicionar(DadosMock.produtos[1], 2);
  }

  // ---- RENDERIZAR CARRINHO ---- //
  function renderizar() {
    const itens = Carrinho.itens;
    const carrinhoItens = document.getElementById('carrinhoItens');
    const carrinhoVazio = document.getElementById('carrinhoVazio');
    const carrinhoLayout = document.getElementById('carrinhoLayout');

    if (itens.length === 0) {
      carrinhoLayout.style.display = 'none';
      carrinhoVazio.style.display = 'block';
      return;
    }

    carrinhoLayout.style.display = 'grid';
    carrinhoVazio.style.display = 'none';

    // Renderizar itens
    carrinhoItens.innerHTML = itens.map(item => {
      const emoji = item.categoria === 'JDM' ? '🇯🇵' : item.categoria === 'Americanos' ? '🇺🇸' : item.categoria === 'Italianos' ? '🇮🇹' : '🇩🇪';
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
            <span class="carrinho-item__preco">R$ ${(item.preco * item.quantidade).toLocaleString('pt-BR')}</span>
            <div class="item-qty">
              <button class="qty-btn" data-acao="diminuir" data-id="${item.id}">−</button>
              <input type="number" value="${item.quantidade}" min="1" max="${item.estoque}" data-id="${item.id}" data-acao="qty">
              <button class="qty-btn" data-acao="aumentar" data-id="${item.id}">+</button>
            </div>
            <button class="item-remover" data-acao="remover" data-id="${item.id}">🗑 Remover</button>
          </div>
        </div>
      `;
    }).join('');

    // Renderizar resumo
    const subtotal = Carrinho.totalValor;
    const frete = subtotal >= 500 ? 0 : 49.90;
    let desconto = 0;

    if (cupomAtivo) {
      if (cupomAtivo.tipo === 'percentual') desconto = subtotal * cupomAtivo.desconto;
      else desconto = cupomAtivo.desconto;
    }

    const total = subtotal + frete - desconto;

    document.getElementById('resumoLinhas').innerHTML = `
      <div class="resumo-linha"><span>Subtotal (${Carrinho.totalItens} itens)</span><span>R$ ${subtotal.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>
      <div class="resumo-linha"><span>Frete</span><span>${frete === 0 ? '<span style="color:var(--cor-primaria)">Grátis</span>' : 'R$ ' + frete.toFixed(2)}</span></div>
      ${desconto > 0 ? `<div class="resumo-linha desconto"><span>Desconto (${cupomAtivo.desc})</span><span>- R$ ${desconto.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>` : ''}
    `;

    document.getElementById('resumoTotal').innerHTML = `
      <span>Total</span>
      <strong>R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong>
    `;

    // Mostrar timer de bloqueio
    document.getElementById('avisoBloqueio').style.display = 'flex';
  }

  // ---- EVENTOS DOS ITENS (delegação) ---- //
  document.getElementById('carrinhoItens')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-acao]');
    if (!btn) return;
    const acao = btn.dataset.acao;
    const id = btn.dataset.id;

    if (acao === 'remover') {
      Carrinho.remover(id);
      renderizar();
    } else if (acao === 'diminuir') {
      const item = Carrinho.itens.find(i => i.id === id);
      if (item && item.quantidade > 1) {
        Carrinho.atualizarQuantidade(id, item.quantidade - 1);
        renderizar();
      }
    } else if (acao === 'aumentar') {
      const item = Carrinho.itens.find(i => i.id === id);
      if (item && item.quantidade < item.estoque) {
        Carrinho.atualizarQuantidade(id, item.quantidade + 1);
        renderizar();
      }
    }
  });

  document.getElementById('carrinhoItens')?.addEventListener('change', (e) => {
    const input = e.target.closest('[data-acao="qty"]');
    if (!input) return;
    const id = input.dataset.id;
    const item = Carrinho.itens.find(i => i.id === id);
    let qty = parseInt(input.value);
    if (item) {
      qty = Math.max(1, Math.min(qty, item.estoque));
      Carrinho.atualizarQuantidade(id, qty);
      renderizar();
    }
  });

  // ---- CUPOM ---- //
  document.getElementById('btnAplicarCupom')?.addEventListener('click', () => {
    const codigo = document.getElementById('cupomInput').value.trim().toUpperCase();
    const feedbackEl = document.getElementById('cupomFeedback');

    if (!codigo) return;

    if (CUPONS[codigo]) {
      cupomAtivo = CUPONS[codigo];
      feedbackEl.style.display = 'block';
      feedbackEl.innerHTML = `<span class="alerta alerta-sucesso">✓ Cupom aplicado: ${cupomAtivo.desc}</span>`;
      renderizar();
    } else {
      feedbackEl.style.display = 'block';
      feedbackEl.innerHTML = `<span class="alerta alerta-erro">⚠ Cupom inválido ou expirado</span>`;
    }
  });

  // ---- TIMER DE BLOQUEIO (simulado - 15 minutos) ---- //
  // Futuro: integrar com sistema de reserva de estoque no backend
  let tempoRestante = 15 * 60; // 15 minutos em segundos

  const timer = setInterval(() => {
    tempoRestante--;
    const min = Math.floor(tempoRestante / 60);
    const seg = tempoRestante % 60;
    const timerEl = document.getElementById('timerBloqueio');
    if (timerEl) {
      timerEl.textContent = `${String(min).padStart(2,'0')}:${String(seg).padStart(2,'0')}`;

      if (tempoRestante <= 120) timerEl.style.color = 'var(--cor-erro)'; // Vermelho nos últimos 2min
      else if (tempoRestante <= 300) timerEl.style.color = 'var(--cor-destaque)';
    }

    if (tempoRestante <= 0) {
      clearInterval(timer);
      // Futuro: liberar reserva e notificar usuário
      const notif = document.getElementById('notificacaoExpiracao');
      if (notif) {
        notif.style.display = 'block';
        notif.innerHTML = `<div class="alerta alerta-erro">⚠ Sua reserva expirou. Por favor, verifique a disponibilidade dos itens.</div>`;
      }
    }
  }, 1000);

  // Renderizar inicial
  renderizar();
});
