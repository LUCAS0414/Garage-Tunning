/**
 * checkout.js
 * Carrega endereços e cartões do cliente da API.
 * Envia pedido real para POST /api/pedidos.
 */
document.addEventListener('DOMContentLoaded', async function() {

  const usuario = JSON.parse(localStorage.getItem('garage_user') || '{}');

  if (!usuario.id) { window.location.href = 'login.html'; return; }

  let cupomAtivo = null;

  // ---- CARREGAR ENDEREÇOS E CARTÕES ----
  async function carregarDadosCheckout() {
    try {
      const resp = await fetch(`/api/clientes/${usuario.id}`);
      if (!resp.ok) throw new Error('Falha ao carregar dados.');
      const dados = await resp.json();

      // Preencher endereços
      const enderecoArea = document.getElementById('enderecoOpcoes');
      if (enderecoArea && dados.enderecos && dados.enderecos.length > 0) {
        enderecoArea.innerHTML = dados.enderecos.map((end, i) => `
          <label class="checkout-opcao">
            <input type="radio" name="endereco" value="${end.id}" ${i === 0 ? 'checked' : ''}>
            <div class="checkout-opcao__info">
              <strong>${end.identificacao}</strong>
              <span>${end.logradouro}, ${end.numero} — ${end.bairro}, ${end.cidade}/${end.estado}</span>
              <span class="texto-muted texto-pequeno">CEP: ${end.cep}</span>
            </div>
          </label>`).join('');
      } else if (enderecoArea) {
        enderecoArea.innerHTML = `<p class="texto-muted">Nenhum endereço cadastrado. <a href="perfil.html#enderecos">Adicione um endereço</a> antes de finalizar.</p>`;
      }

      // Preencher cartões
      const cartaoArea = document.getElementById('cartaoOpcoes');
      if (cartaoArea && dados.cartoes && dados.cartoes.length > 0) {
        cartaoArea.innerHTML = dados.cartoes.map((c, i) => `
          <label class="checkout-opcao">
            <input type="radio" name="cartao" value="${c.id}" ${i === 0 ? 'checked' : ''}>
            <div class="checkout-opcao__info">
              <strong>${c.bandeira}</strong> •••• ${String(c.numero_cartao).slice(-4)}
              ${c.is_preferencial ? '<span style="color:var(--cor-primaria)"> ★ Principal</span>' : ''}
              <span class="texto-muted texto-pequeno">${c.nome_impresso}</span>
            </div>
          </label>`).join('');
        cartaoArea.innerHTML += `
          <label class="checkout-opcao">
            <input type="radio" name="cartao" value="novo">
            <div class="checkout-opcao__info"><strong>+ Novo cartão</strong></div>
          </label>`;
      } else if (cartaoArea) {
        cartaoArea.innerHTML = `
          <label class="checkout-opcao">
            <input type="radio" name="cartao" value="novo" checked>
            <div class="checkout-opcao__info"><strong>+ Adicionar cartão</strong></div>
          </label>`;
        const form = document.getElementById('novoCartaoForm');
        if (form) form.style.display = 'block';
      }
    } catch (err) {
      console.error('Erro ao carregar dados do checkout:', err);
    }
  }

  await carregarDadosCheckout();

  // ---- RENDERIZAR RESUMO ----
  function renderizarResumo() {
    const itens         = Carrinho.itens;
    const checkoutItens = document.getElementById('checkoutItens');
    if (!checkoutItens) return;

    if (itens.length === 0) {
      window.location.href = 'carrinho.html';
      return;
    }

    checkoutItens.innerHTML = itens.map(item => {
      const emoji = item.categoria === 'JDM' ? '🇯🇵' : item.categoria === 'Americanos' ? '🇺🇸'
                  : item.categoria === 'Italianos' ? '🇮🇹' : item.categoria === 'Alemães' ? '🇩🇪' : '🔧';
      return `
        <div class="checkout-item-linha">
          <div class="checkout-item-img">${emoji}</div>
          <div class="checkout-item-nome">${item.nome} <span class="texto-muted">x${item.quantidade}</span></div>
          <div class="checkout-item-preco">R$ ${(item.preco * item.quantidade).toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
        </div>`;
    }).join('');

    atualizarCalculo();
  }

  function atualizarCalculo() {
    const subtotal = Carrinho.totalValor;
    const frete    = subtotal >= 500 ? 0 : 49.90;
    let desconto   = 0;
    if (cupomAtivo) {
      desconto = cupomAtivo.tipo === 'percentual'
        ? subtotal * cupomAtivo.desconto
        : cupomAtivo.desconto;
    }
    const total = Math.max(0, subtotal + frete - desconto);

    const calc = document.getElementById('checkoutCalc');
    if (!calc) return;
    calc.innerHTML = `
      <div class="resumo-linha"><span>Subtotal</span><span>R$ ${subtotal.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>
      <div class="resumo-linha"><span>Frete</span><span>${frete === 0 ? '<span style="color:var(--cor-primaria)">Grátis</span>' : 'R$ ' + frete.toFixed(2)}</span></div>
      ${desconto > 0 ? `<div class="resumo-linha" style="color:var(--cor-primaria)"><span>Desconto</span><span>- R$ ${desconto.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>` : ''}
      <div class="resumo-linha total"><span>Total</span><strong>R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong></div>`;
  }

  // Mostrar form novo cartão
  document.addEventListener('change', (e) => {
    if (e.target.name === 'cartao') {
      const form = document.getElementById('novoCartaoForm');
      if (form) form.style.display = e.target.value === 'novo' ? 'block' : 'none';
    }
  });

  if (document.getElementById('checkoutCartaoNum')) {
    mascaraCartao(document.getElementById('checkoutCartaoNum'));
  }

  // ---- APLICAR CUPOM ----
  document.getElementById('btnAplicarCupomCheckout')?.addEventListener('click', async () => {
    const codigo     = document.getElementById('checkoutCupom')?.value.trim().toUpperCase();
    const feedbackEl = document.getElementById('checkoutCupomFeedback');
    if (!feedbackEl) return;
    feedbackEl.style.display = 'block';
    if (!codigo) return;

    try {
      const resp = await fetch('/api/cupons/validar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, clienteId: usuario.id, total: Carrinho.totalValor }),
      });
      const resultado = await resp.json();
      if (resp.ok && resultado.valido) {
        const c = resultado.cupom;
        cupomAtivo = {
          desconto: c.tipo === 'percentual' ? c.valor / 100 : c.valor,
          tipo:     c.tipo,
          codigo:   c.codigo,
        };
        feedbackEl.innerHTML = `<div class="alerta alerta-sucesso">✓ ${c.tipo === 'percentual' ? c.valor + '%' : 'R$ ' + c.valor} de desconto aplicado!</div>`;
        atualizarCalculo();
      } else {
        feedbackEl.innerHTML = `<div class="alerta alerta-erro">⚠ ${resultado.motivo || 'Cupom inválido'}</div>`;
      }
    } catch (err) {
      feedbackEl.innerHTML = `<div class="alerta alerta-erro">⚠ Erro ao validar cupom</div>`;
    }
  });

  // ---- CONFIRMAR PEDIDO ----
  document.getElementById('btnConfirmarPedido')?.addEventListener('click', async () => {
    const endereco = document.querySelector('[name="endereco"]:checked');
    const cartao   = document.querySelector('[name="cartao"]:checked');

    if (!endereco) { alert('Selecione um endereço de entrega.'); return; }
    if (!cartao)   { alert('Selecione uma forma de pagamento.');  return; }

    const btnTexto = document.getElementById('btnConfTexto');
    const btnLoad  = document.getElementById('btnConfLoad');
    const btn      = document.getElementById('btnConfirmarPedido');
    btnTexto.style.display = 'none';
    btnLoad.style.display  = 'flex';
    btn.disabled           = true;

    try {
      const subtotal = Carrinho.totalValor;
      const frete    = subtotal >= 500 ? 0 : 49.90;

      const payload = {
        usuarioId:   usuario.id,
        enderecoId:  parseInt(endereco.value),
        frete,
        cupomCodigo: cupomAtivo ? document.getElementById('checkoutCupom')?.value.trim().toUpperCase() : null,
        itens: Carrinho.itens.map(i => ({
          produtoId:  i.id,
          quantidade: i.quantidade,
        })),
      };

      const resp    = await fetch('/api/pedidos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const resultado = await resp.json();

      if (resp.ok) {
        document.getElementById('numPedidoGerado').textContent = '#' + resultado.codigo;
        Carrinho.limpar();
        abrirModal('modalConfirmacao');
      } else {
        alert('Erro ao criar pedido: ' + (resultado.error || 'Tente novamente.'));
      }
    } catch (err) {
      console.error('Erro ao confirmar pedido:', err);
      alert('Erro de conexão. Tente novamente.');
    } finally {
      btnTexto.style.display = 'inline';
      btnLoad.style.display  = 'none';
      btn.disabled           = false;
    }
  });

  renderizarResumo();
});
