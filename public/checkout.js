/**
 * checkout.js
 * Carrega endereços e cartões do cliente da API.
 * Envia pedido real para POST /api/pedidos.
 */
document.addEventListener('DOMContentLoaded', async function() {

  const usuario = JSON.parse(localStorage.getItem('garage_user') || '{}');

  if (!usuario.id) { window.location.href = 'login.html'; return; }

  let cupomAtivo = null;

// MÉTODO DE PAGAMENTO ATIVO
  let metodoPagamento = 'cartao';

  document.querySelectorAll('.metodo-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.metodo-tab').forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      metodoPagamento = btn.dataset.metodo;

      document.getElementById('metodoCartao').style.display  = metodoPagamento === 'cartao'  ? 'block' : 'none';
      document.getElementById('metodoPix').style.display     = metodoPagamento === 'pix'     ? 'block' : 'none';
      document.getElementById('metodoBoleto').style.display  = metodoPagamento === 'boleto'  ? 'block' : 'none';
      document.getElementById('metodoDebito').style.display  = metodoPagamento === 'debito'  ? 'block' : 'none';
    });
  });

  document.getElementById('usarSegundoCartao')?.addEventListener('change', (e) => {
    document.getElementById('segundoCartaoArea').style.display = e.target.checked ? 'block' : 'none';
  });

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

 // Preencher cartões — HTML para o 1º slot (name="cartao")
      const opcoesCartaoHTML = dados.cartoes && dados.cartoes.length > 0
        ? dados.cartoes.map((c, i) => `
            <label class="checkout-opcao">
              <input type="radio" name="cartao" value="${c.id}" ${i === 0 ? 'checked' : ''}>
              <div class="checkout-opcao__info">
                <strong>${c.bandeira}</strong> •••• ${String(c.numero_cartao).slice(-4)}
                ${c.is_preferencial ? '<span style="color:var(--cor-primaria)"> ★ Principal</span>' : ''}
                <span class="texto-muted texto-pequeno">${c.nome_impresso}</span>
              </div>
            </label>`).join('')
        : '';

      // HTML para o 2º slot — OBRIGATÓRIO usar name="cartao2" para ser grupo separado
      const opcoesCartao2HTML = dados.cartoes && dados.cartoes.length > 0
        ? dados.cartoes.map(c => `
            <label class="checkout-opcao">
              <input type="radio" name="cartao2" value="${c.id}">
              <div class="checkout-opcao__info">
                <strong>${c.bandeira}</strong> •••• ${String(c.numero_cartao).slice(-4)}
                ${c.is_preferencial ? '<span style="color:var(--cor-primaria)"> ★ Principal</span>' : ''}
                <span class="texto-muted texto-pequeno">${c.nome_impresso}</span>
              </div>
            </label>`).join('')
        : '';

      const cartaoArea = document.getElementById('cartaoOpcoes');
      if (cartaoArea) {
        cartaoArea.innerHTML = opcoesCartaoHTML + `
          <label class="checkout-opcao">
            <input type="radio" name="cartao" value="novo" ${!opcoesCartaoHTML ? 'checked' : ''}>
            <div class="checkout-opcao__info"><strong>+ ${opcoesCartaoHTML ? 'Novo cartão' : 'Adicionar cartão'}</strong></div>
          </label>`;
        if (!opcoesCartaoHTML) {
          const form = document.getElementById('novoCartaoForm');
          if (form) form.style.display = 'block';
        }
      }

      // Popular 2º cartão com HTML próprio (name="cartao2") — grupos completamente separados
      const cartaoArea2 = document.getElementById('cartaoOpcoes2');
      if (cartaoArea2) {
        cartaoArea2.innerHTML = opcoesCartao2HTML + `
          <label class="checkout-opcao">
            <input type="radio" name="cartao2" value="novo2">
            <div class="checkout-opcao__info"><strong>+ Outro cartão</strong></div>
          </label>`;
        // Nenhum pré-selecionado no 2º slot — usuário precisa escolher ativamente
        cartaoArea2.querySelectorAll('[name="cartao2"]').forEach(r => r.checked = false);
      }

      const debitoArea = document.getElementById('cartaoDebitoOpcoes');
      if (debitoArea) {
        debitoArea.innerHTML = opcoesCartaoHTML + `
          <label class="checkout-opcao">
            <input type="radio" name="cartaoDebito" value="novoDebito" ${!opcoesCartaoHTML ? 'checked' : ''}>
            <div class="checkout-opcao__info"><strong>+ Cartão de débito</strong></div>
          </label>`;
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

  // Mostrar form novo cartão (1º cartão)
  document.addEventListener('change', (e) => {
    if (e.target.name === 'cartao') {
      const form = document.getElementById('novoCartaoForm');
      if (form) form.style.display = e.target.value === 'novo' ? 'block' : 'none';
    }
    // Mostrar form novo cartão (2º cartão)
    if (e.target.name === 'cartao2') {
      const form2 = document.getElementById('novoCartaoForm2');
      if (form2) form2.style.display = e.target.value === 'novo2' ? 'block' : 'none';
    }
  });

  // Atualizar valor do 2º cartão automaticamente
  document.getElementById('valorCartao1')?.addEventListener('input', () => {
    const subtotal        = Carrinho.totalValor;
    const frete           = subtotal >= 500 ? 0 : 49.90;
    let desconto          = 0;
    if (cupomAtivo) {
      desconto = cupomAtivo.tipo === 'percentual'
        ? subtotal * cupomAtivo.desconto
        : cupomAtivo.desconto;
    }
    const totalComDesconto = Math.max(0, subtotal + frete - desconto);
    const valor1 = parseFloat(document.getElementById('valorCartao1').value) || 0;
    const valor2 = Math.max(0, totalComDesconto - valor1);
    const labelValor2 = document.getElementById('labelValorCartao2');
    if (labelValor2) labelValor2.textContent = 'R$ ' + valor2.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
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
    if (!endereco) { alert('Selecione um endereço de entrega.'); return; }

    // ---- Calcular total real com desconto ----
    const subtotal         = Carrinho.totalValor;
    const frete            = subtotal >= 500 ? 0 : 49.90;
    let   desconto         = 0;

    if (cupomAtivo) {
      desconto = cupomAtivo.tipo === 'percentual'
        ? subtotal * cupomAtivo.desconto
        : cupomAtivo.desconto;
    }

    const totalComDesconto = Math.max(0, subtotal + frete - desconto);
    const temCupom         = cupomAtivo && desconto > 0;

    // ---- Montar objeto pagamento ----
    let pagamento;

    if (metodoPagamento === 'pix') {
      pagamento = { metodo: 'PIX' };

    } else if (metodoPagamento === 'boleto') {
      pagamento = { metodo: 'BOLETO' };

    } else if (metodoPagamento === 'debito') {
      const cartaoD = document.querySelector('[name="cartaoDebito"]:checked');
      if (!cartaoD) { alert('Selecione o cartão de débito.'); return; }
      pagamento = { metodo: 'CARTAO_DEBITO', cartaoId: parseInt(cartaoD.value) };

    } else {
      // CARTÃO DE CRÉDITO
      const cartao1 = document.querySelector('[name="cartao"]:checked');
      if (!cartao1) { alert('Selecione um cartão.'); return; }

      const usarDois = document.getElementById('usarSegundoCartao')?.checked;

      if (!usarDois) {
        // 1 cartão — RN0034: mínimo R$10 se não tem cupom cobrindo
        if (!temCupom && totalComDesconto < 10) {
          alert('Valor mínimo para pagamento com cartão é R$ 10,00.');
          return;
        }
        pagamento = { metodo: 'CARTAO_CREDITO', cartaoId: parseInt(cartao1.value) };

      } else {
        // 2 cartões
        const cartao2 = document.querySelector('[name="cartao2"]:checked');
        if (!cartao2) { alert('Selecione o 2º cartão.'); return; }

        // Checar duplicidade: só é duplicado se ambos são cartões salvos com mesmo ID
        const c1IsNovo = cartao1.value === 'novo';
        const c2IsNovo = cartao2.value === 'novo2';
        if (!c1IsNovo && !c2IsNovo && cartao1.value === cartao2.value) {
          alert('Selecione cartões diferentes.');
          return;
        }

        const valor1 = parseFloat(document.getElementById('valorCartao1').value);
        const valor2 = parseFloat((totalComDesconto - valor1).toFixed(2));

        if (isNaN(valor1) || valor1 <= 0) {
          alert('Informe o valor do 1º cartão.');
          return;
        }
        if (valor1 >= totalComDesconto) {
          alert('O valor do 1º cartão deve ser menor que o total da compra.');
          return;
        }

        // RN0034 sem cupom: ambos >= R$10
        // RN0035 com cupom: pode ter < R$10, mas precisa ser positivo
        if (!temCupom) {
          if (valor1 < 10) { alert('Valor mínimo por cartão é R$ 10,00 (RN0034).'); return; }
          if (valor2 < 10) { alert(`O 2º cartão ficaria com R$ ${valor2.toFixed(2)}, abaixo do mínimo de R$ 10,00 (RN0034).`); return; }
        } else {
          if (valor1 <= 0 || valor2 <= 0) { alert('Ambos os cartões precisam ter valor positivo.'); return; }
        }

        pagamento = {
          metodo:    'DOIS_CARTOES',
          cartao1Id: c1IsNovo ? null : parseInt(cartao1.value),
          valor1,
          cartao2Id: c2IsNovo ? null : parseInt(cartao2.value),
          valor2,
        };
      }
    }

    // ---- Enviar pedido ----
    const btnTexto = document.getElementById('btnConfTexto');
    const btnLoad  = document.getElementById('btnConfLoad');
    const btn      = document.getElementById('btnConfirmarPedido');
    btnTexto.style.display = 'none';
    btnLoad.style.display  = 'flex';
    btn.disabled           = true;

    try {
      const payload = {
        usuarioId:   usuario.id,
        enderecoId:  parseInt(endereco.value),
        frete,
        cupomCodigo: cupomAtivo ? document.getElementById('checkoutCupom')?.value.trim().toUpperCase() : null,
        pagamento,
        itens: Carrinho.itens.map(i => ({ produtoId: i.id, quantidade: i.quantidade })),
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