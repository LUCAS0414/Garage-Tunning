

document.addEventListener('DOMContentLoaded', function() {

  // Cupons validados via API (não mais hardcoded)

  let cupomAtivo = null;

  //RENDERIZAR O CARRINHO
  function renderizar() {
    const itens = Carrinho.itens;
    const carrinhoItens = document.getElementById('carrinhoItens');
    const carrinhoVazio = document.getElementById('carrinhoVazio');
    const carrinhoLayout = document.getElementById('carrinhoLayout');

    // Se o carrinho estiver vazio, mostra o aviso de "Carrinho Vazio"
    if (itens.length === 0) {
      carrinhoLayout.style.display = 'none';
      carrinhoVazio.style.display = 'block';
      return;
    }

    // Layout visivel
    carrinhoLayout.style.display = 'grid';
    carrinhoVazio.style.display = 'none';

    //RENDERIZAR ITENS HTML
    carrinhoItens.innerHTML = itens.map(item => {
      // Define a bandeira de acordo com a categoria
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
            
            <!-- Botões de controle de Quantidade -->
            <div class="item-qty">
              <button class="qty-btn" data-acao="diminuir" data-id="${item.id}">−</button>
              <input type="number" value="${item.quantidade}" min="1" max="${item.estoque}" data-id="${item.id}" data-acao="qty">
              <button class="qty-btn" data-acao="aumentar" data-id="${item.id}">+</button>
            </div>
            
            <!-- Botão de exclusão -->
            <button class="item-remover" data-acao="remover" data-id="${item.id}">🗑 Remover</button>
          </div>
        </div>
      `;
    }).join('');

    //CALCULOS TOTAIS
    const subtotal = Carrinho.totalValor; 
    const frete = subtotal >= 500 ? 0 : 49.90; // Regra de frete grátis
    let desconto = 0;

    // Verificação de cupon e aplicação
    if (cupomAtivo) {
      if (cupomAtivo.tipo === 'percentual') {
        desconto = subtotal * cupomAtivo.desconto; // ex: subtotal x 0.10
      } else {
        desconto = cupomAtivo.desconto; // ex: 50 fixo
      }
    }

    const total = subtotal + frete - desconto;

    // ATUALIZAÇÃO DO VALOR
    document.getElementById('resumoLinhas').innerHTML = `
      <div class="resumo-linha"><span>Subtotal (${Carrinho.totalItens} itens)</span><span>R$ ${subtotal.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>
      <div class="resumo-linha"><span>Frete</span><span>${frete === 0 ? '<span style="color:var(--cor-primaria)">Grátis</span>' : 'R$ ' + frete.toFixed(2)}</span></div>
      ${desconto > 0 ? `<div class="resumo-linha desconto"><span>Desconto (${cupomAtivo.desc})</span><span>- R$ ${desconto.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>` : ''}
    `;

    document.getElementById('resumoTotal').innerHTML = `
      <span>Total</span>
      <strong>R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong>
    `;

    // Mostra o cronômetro visual
    document.getElementById('avisoBloqueio').style.display = 'flex';
  }

  //EVENTOS DOS ITENS DO CARRINHO
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
      qty = Math.max(1, Math.min(qty, item.estoque)); // limitação da quantidade
      Carrinho.atualizarQuantidade(id, qty);
      renderizar();
    }
  });

  //CUPOM DE DESCONTO — Validação via API
  document.getElementById('btnAplicarCupom')?.addEventListener('click', async () => {
    const codigo = document.getElementById('cupomInput').value.trim().toUpperCase();
    const feedbackEl = document.getElementById('cupomFeedback');

    if (!codigo) return;

    try {
      // Buscar clienteId do localStorage (se logado)
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      const clienteId = usuario.id || 0;
      const subtotal = Carrinho.totalValor;

      const resp = await fetch('/api/cupons/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, clienteId, total: subtotal }),
      });

      const resultado = await resp.json();

      if (resp.ok && resultado.valido) {
        cupomAtivo = {
          desconto: resultado.tipo === 'percentual' ? resultado.valor / 100 : resultado.valor,
          tipo: resultado.tipo,
          desc: resultado.descricao || `${resultado.tipo === 'percentual' ? resultado.valor + '%' : 'R$ ' + resultado.valor} de desconto`,
        };
        feedbackEl.style.display = 'block';
        feedbackEl.innerHTML = `<span class="alerta alerta-sucesso">✓ Cupom aplicado: ${cupomAtivo.desc}</span>`;
        renderizar();
      } else {
        feedbackEl.style.display = 'block';
        feedbackEl.innerHTML = `<span class="alerta alerta-erro">⚠ ${resultado.error || 'Cupom inválido ou expirado'}</span>`;
      }
    } catch (err) {
      console.error('Erro ao validar cupom:', err);
      feedbackEl.style.display = 'block';
      feedbackEl.innerHTML = `<span class="alerta alerta-erro">⚠ Erro ao validar cupom. Tente novamente.</span>`;
    }
  });

  //TIMER DE BLOQUEIO / RESERVA (Simulado - 15 Minutos)
  // Conta regressivamente 15 minutos até 0 para reservar os itens no front.
  // Quando chega a zero, muda a caixa de notificação avisando comleta inatividade.
  // (Observação: O backend agora possui um tempo de reserva real. O cronômetro pode
  //  refletir o tempo que vem da API no futuro).
  let tempoRestante = 15 * 60; // 15 minutos em segundos

  const timer = setInterval(() => {
    tempoRestante--;
    const min = Math.floor(tempoRestante / 60);
    const seg = tempoRestante % 60;
    
    const timerEl = document.getElementById('timerBloqueio');
    if (timerEl) {
      timerEl.textContent = `${String(min).padStart(2,'0')}:${String(seg).padStart(2,'0')}`;

      // Quando faltar apenas 2 minutos, fica vermelho para causar urgência
      if (tempoRestante <= 120) timerEl.style.color = 'var(--cor-erro)';
      else if (tempoRestante <= 300) timerEl.style.color = 'var(--cor-destaque)';
    }

    if (tempoRestante <= 0) {
      clearInterval(timer);
      const notif = document.getElementById('notificacaoExpiracao');
      if (notif) {
        notif.style.display = 'block';
        notif.innerHTML = `<div class="alerta alerta-erro">⚠ Sua reserva expirou. Por favor, verifique a disponibilidade dos itens.</div>`;
      }
    }
  }, 1000); // 1000ms = 1 segundo de verificação

  // Aciona a primeira renderização do template ao carregar o script final
  renderizar();
});
