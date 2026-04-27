
document.addEventListener('DOMContentLoaded', function() {

  const CUPONS = {
    'GARAGE10': { desconto: 0.10, tipo: 'percentual', desc: '10% de desconto' },
    'PRIMEIRACOMPRA': { desconto: 0.15, tipo: 'percentual', desc: '15% na primeira compra' },
  };
  let cupomAtivo = null;

  // Renderizar itens do carrinho no resumo
  function renderizarResumo() {
    const itens = Carrinho.itens;
    const checkoutItens = document.getElementById('checkoutItens');

    if (!checkoutItens) return;

    checkoutItens.innerHTML = itens.map(item => {
      const emoji = item.categoria === 'JDM' ? '🇯🇵' : item.categoria === 'Americanos' ? '🇺🇸' : item.categoria === 'Italianos' ? '🇮🇹' : '🇩🇪';
      return `
        <div class="checkout-item-linha">
          <div class="checkout-item-img">${emoji}</div>
          <div class="checkout-item-nome">${item.nome} <span class="texto-muted">x${item.quantidade}</span></div>
          <div class="checkout-item-preco">R$ ${(item.preco * item.quantidade).toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
        </div>
      `;
    }).join('');

    atualizarCalculo();
  }

  function atualizarCalculo() {
    const subtotal = Carrinho.totalValor;
    const frete = subtotal >= 500 ? 0 : 49.90;
    let desconto = 0;
    if (cupomAtivo) {
      desconto = cupomAtivo.tipo === 'percentual' ? subtotal * cupomAtivo.desconto : cupomAtivo.desconto;
    }
    const total = subtotal + frete - desconto;

    const calc = document.getElementById('checkoutCalc');
    if (!calc) return;
    calc.innerHTML = `
      <div class="resumo-linha"><span>Subtotal</span><span>R$ ${subtotal.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>
      <div class="resumo-linha"><span>Frete</span><span>${frete === 0 ? '<span style="color:var(--cor-primaria)">Grátis</span>' : 'R$ ' + frete.toFixed(2)}</span></div>
      ${desconto > 0 ? `<div class="resumo-linha" style="color:var(--cor-primaria)"><span>Desconto</span><span>- R$ ${desconto.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>` : ''}
      <div class="resumo-linha total"><span>Total</span><strong>R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong></div>
    `;
  }

  // Mostrar form de novo cartão
  document.querySelectorAll('[name="cartao"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const form = document.getElementById('novoCartaoForm');
      if (form) form.style.display = radio.value === 'novo' ? 'block' : 'none';
    });
  });

  // Máscara cartão
  if (document.getElementById('checkoutCartaoNum')) mascaraCartao(document.getElementById('checkoutCartaoNum'));

  // Cupom
  document.getElementById('btnAplicarCupomCheckout')?.addEventListener('click', () => {
    const codigo = document.getElementById('checkoutCupom').value.trim().toUpperCase();
    const feedbackEl = document.getElementById('checkoutCupomFeedback');
    feedbackEl.style.display = 'block';
    if (CUPONS[codigo]) {
      cupomAtivo = CUPONS[codigo];
      feedbackEl.innerHTML = `<div class="alerta alerta-sucesso">✓ ${cupomAtivo.desc}</div>`;
      atualizarCalculo();
    } else {
      feedbackEl.innerHTML = `<div class="alerta alerta-erro">⚠ Cupom inválido</div>`;
    }
  });

  // Confirmar pedido
  document.getElementById('btnConfirmarPedido')?.addEventListener('click', () => {
    const endereco = document.querySelector('[name="endereco"]:checked');
    const cartao = document.querySelector('[name="cartao"]:checked');

    if (!endereco) { alert('Selecione um endereço'); return; }
    if (!cartao) { alert('Selecione uma forma de pagamento'); return; }

    const btnTexto = document.getElementById('btnConfTexto');
    const btnLoad = document.getElementById('btnConfLoad');
    const btn = document.getElementById('btnConfirmarPedido');
    btnTexto.style.display = 'none';
    btnLoad.style.display = 'flex';
    btn.disabled = true;

    // Futuro: fetch POST /api/pedidos/criar com dados do pedido
    setTimeout(() => {
      const numPedido = '#GT-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random()*9000)+1000);
      document.getElementById('numPedidoGerado').textContent = numPedido;
      Carrinho.limpar();
      abrirModal('modalConfirmacao');
      btnTexto.style.display = 'inline';
      btnLoad.style.display = 'none';
      btn.disabled = false;
    }, 1800);
  });

  renderizarResumo();
});
