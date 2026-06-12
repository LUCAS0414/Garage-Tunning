document.addEventListener('DOMContentLoaded', async function() {

  const usuario = JSON.parse(localStorage.getItem('garage_user') || '{}');
  if (!usuario.id) { window.location.href = 'login.html'; return; }

  let cupomAtivo  = null;
  let cartoesData = [];   // Cartões salvos do cliente
  let metodoPagamento = 'cartao';

  // ---- abas de método de pagamento ----
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

  // ---- helpers de total ----
  function calcularTotal() {
    const subtotal = Carrinho.totalValor;
    const frete    = subtotal >= 500 ? 0 : 49.90;
    let desconto   = 0;
    if (cupomAtivo) {
      desconto = cupomAtivo.tipo === 'percentual'
        ? subtotal * cupomAtivo.desconto
        : cupomAtivo.desconto;
    }
    return Math.max(0, subtotal + frete - desconto);
  }

  // ---- gerenciamento de slots de cartão ----
  function criarSlotHTML(index) {
    const opcoesHTML = cartoesData.map(c => `
      <label class="checkout-opcao">
        <input type="radio" name="cartaoSlot${index}" value="${c.id}">
        <div class="checkout-opcao__info">
          <strong>${c.bandeira}</strong> •••• ${String(c.numero_cartao).slice(-4)}
          ${c.is_preferencial ? '<span style="color:var(--cor-primaria)"> ★ Principal</span>' : ''}
          <span class="texto-muted texto-pequeno">${c.nome_impresso}</span>
        </div>
      </label>`).join('');

    return `
      <div class="cartao-slot" data-index="${index}"
        style="margin-top:1rem; padding:1rem; border:1px solid var(--cor-borda); border-radius:8px;">

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <span class="texto-muted texto-pequeno slot-label" style="font-weight:600;">Cartão ${index + 1}</span>
          ${index > 0
            ? `<button type="button" class="btn btn-danger btn-sm btn-remover-slot">Remover</button>`
            : ''}
        </div>

        <div class="checkout-opcoes-list slot-opcoes">
          ${opcoesHTML}
          <label class="checkout-opcao">
            <input type="radio" name="cartaoSlot${index}" value="novo${index}">
            <div class="checkout-opcao__info"><strong>+ Novo cartão</strong></div>
          </label>
        </div>

        <div class="novo-cartao-form-slot"
          style="display:none; margin-top:0.75rem; padding-top:0.75rem; border-top:1px solid var(--cor-borda);">
          <div class="form-grid-2">
            <div class="input-grupo">
              <label>Número <span class="required">*</span></label>
              <input type="text" class="input-field slot-num" placeholder="0000 0000 0000 0000" maxlength="19">
            </div>
            <div class="input-grupo">
              <label>Bandeira</label>
              <select class="input-field slot-bandeira">
                <option value="VISA">Visa</option>
                <option value="MASTERCARD">Mastercard</option>
                <option value="ELO">Elo</option>
                <option value="AMEX">AmEx</option>
              </select>
            </div>
          </div>
          <div class="input-grupo">
            <label>Nome Impresso <span class="required">*</span></label>
            <input type="text" class="input-field slot-nome" placeholder="NOME COMO NO CARTÃO" style="text-transform:uppercase;">
          </div>
        </div>

        <div class="slot-valor-wrap" style="margin-top:0.75rem; display:none;">
          <label class="texto-pequeno texto-muted">Valor neste cartão (R$) <span class="required">*</span></label>
          <input type="number" class="input-field slot-valor" min="10" step="0.01" placeholder="mínimo R$ 10,00">
          <span class="slot-valor-auto texto-muted texto-pequeno" style="display:none; color:var(--cor-primaria);">
            Calculado automaticamente (restante)
          </span>
        </div>
      </div>`;
  }

  function adicionarSlot() {
    const container = document.getElementById('cartoesSlots');
    const existentes = container.querySelectorAll('.cartao-slot').length;

    if (existentes === 0) {
      // Primeira vez: esconder seção estática e criar 2 slots
      const secaoEstatica = document.getElementById('cartaoOpcoes');
      const formNovoEstatico = document.getElementById('novoCartaoForm');
      if (secaoEstatica) secaoEstatica.style.display = 'none';
      if (formNovoEstatico) formNovoEstatico.style.display = 'none';

      // Pegar o cartão já selecionado na seção estática
      const cartaoSelecionado = document.querySelector('[name="cartao"]:checked');
      const cartaoIdPreSelecionado = cartaoSelecionado ? cartaoSelecionado.value : null;

      // Criar cartão 1 e cartão 2
      container.insertAdjacentHTML('beforeend', criarSlotHTML(0));
      container.insertAdjacentHTML('beforeend', criarSlotHTML(1));

      const slot0 = container.querySelectorAll('.cartao-slot')[0];
      const slot1 = container.querySelectorAll('.cartao-slot')[1];
      bindSlot(slot0);
      bindSlot(slot1);

      // Pré-selecionar no cartão 1 o cartão que estava selecionado na seção estática
      if (cartaoIdPreSelecionado && cartaoIdPreSelecionado !== 'novo') {
        const radio = slot0.querySelector(`input[type="radio"][value="${cartaoIdPreSelecionado}"]`);
        if (radio) radio.checked = true;
      }
    } else {
      // Já tem slots: adicionar mais um
      const index = existentes;
      container.insertAdjacentHTML('beforeend', criarSlotHTML(index));
      bindSlot(container.querySelectorAll('.cartao-slot')[index]);
    }

    sincronizarSlots();
  }

  function bindSlot(slot) {
    // Mostrar form novo cartão ao selecionar "novo"
    slot.querySelectorAll('input[type="radio"]').forEach(r => {
      r.addEventListener('change', () => {
        const idx  = slot.dataset.index;
        const form = slot.querySelector('.novo-cartao-form-slot');
        form.style.display = r.value === `novo${idx}` ? 'block' : 'none';
        sincronizarSlots();
      });
    });

    // REMOVER SLOT
    slot.querySelector('.btn-remover-slot')?.addEventListener('click', () => {
      slot.remove();
      const container = document.getElementById('cartoesSlots');
      const restantes = container.querySelectorAll('.cartao-slot').length;

      if (restantes <= 1) {
        // Se sobrou 0 ou 1 slot, voltar para a seção estática
        container.innerHTML = '';
        const secaoEstatica = document.getElementById('cartaoOpcoes');
        if (secaoEstatica) secaoEstatica.style.display = '';
      } else {
        renumerarSlots();
      }
      sincronizarSlots();
    });

    // Ao digitar valor, recalcular último
    slot.querySelector('.slot-valor')?.addEventListener('input', sincronizarSlots);
  }

  function renumerarSlots() {
    document.querySelectorAll('.cartao-slot').forEach((slot, i) => {
      slot.dataset.index = i;
      slot.querySelector('.slot-label').textContent = `Cartão ${i + 1}`;
      slot.querySelectorAll('input[type="radio"]').forEach(r => {
        r.name  = `cartaoSlot${i}`;
        if (r.value.startsWith('novo')) r.value = `novo${i}`;
      });
      // O 1º slot não tem botão remover; os outros sim
      const btnRem = slot.querySelector('.btn-remover-slot');
      if (i === 0 && btnRem) btnRem.remove();
    });
  }

  function sincronizarSlots() {
    const slots = [...document.querySelectorAll('.cartao-slot')];
    const total = calcularTotal();

    if (slots.length <= 1) {
      if (slots[0]) slots[0].querySelector('.slot-valor-wrap').style.display = 'none';
      return;
    }

    let somaAnteriores = 0;
    slots.forEach((slot, i) => {
      const wrap      = slot.querySelector('.slot-valor-wrap');
      const input     = slot.querySelector('.slot-valor');
      const autoLabel = slot.querySelector('.slot-valor-auto');
      wrap.style.display = 'block';

      if (i < slots.length - 1) {
        input.readOnly = false;
        input.style.color = '';
        autoLabel.style.display = 'none';
        if (!input.value || parseFloat(input.value) === 0) {
          input.value = (10).toFixed(2);
        }
        somaAnteriores += parseFloat(input.value) || 0;
      } else {
        const restante = Math.max(0, total - somaAnteriores);
        input.value    = restante.toFixed(2);
        input.readOnly = true;
        input.style.color = 'var(--cor-primaria)';
        autoLabel.style.display = 'block';
      }
    });
  }

  // BOTÃO ADICIONAR CARTÃO
  document.getElementById('btnAdicionarCartao')?.addEventListener('click', adicionarSlot);

  // ---- carregar dados do checkout ----
  async function carregarDadosCheckout() {
    try {
      const resp = await fetch(`/api/clientes/${usuario.id}`);
      if (!resp.ok) throw new Error('Falha ao carregar dados.');
      const dados = await resp.json();

      cartoesData = dados.cartoes || [];

      // ENDEREÇOS
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

      // Cartões (1º slot — cartão único)
      const cartaoArea = document.getElementById('cartaoOpcoes');
      if (cartaoArea) {
        const opcoesHTML = cartoesData.map((c, i) => `
          <label class="checkout-opcao">
            <input type="radio" name="cartao" value="${c.id}" ${i === 0 ? 'checked' : ''}>
            <div class="checkout-opcao__info">
              <strong>${c.bandeira}</strong> •••• ${String(c.numero_cartao).slice(-4)}
              ${c.is_preferencial ? '<span style="color:var(--cor-primaria)"> ★ Principal</span>' : ''}
              <span class="texto-muted texto-pequeno">${c.nome_impresso}</span>
            </div>
          </label>`).join('');

        cartaoArea.innerHTML = opcoesHTML + `
          <label class="checkout-opcao">
            <input type="radio" name="cartao" value="novo" ${!opcoesHTML ? 'checked' : ''}>
            <div class="checkout-opcao__info"><strong>+ ${opcoesHTML ? 'Novo cartão' : 'Adicionar cartão'}</strong></div>
          </label>`;

        if (!opcoesHTML) {
          const form = document.getElementById('novoCartaoForm');
          if (form) form.style.display = 'block';
        }
      }

      // Mostrar botão "adicionar cartão" agora que os dados estão prontos
      document.getElementById('btnAdicionarCartao').style.display = 'inline-block';

      // DÉBITO
      const debitoArea = document.getElementById('cartaoDebitoOpcoes');
      if (debitoArea) {
        const opcoesDebitoHTML = cartoesData.map((c, i) => `
          <label class="checkout-opcao">
            <input type="radio" name="cartaoDebito" value="${c.id}" ${i === 0 ? 'checked' : ''}>
            <div class="checkout-opcao__info">
              <strong>${c.bandeira}</strong> •••• ${String(c.numero_cartao).slice(-4)}
              <span class="texto-muted texto-pequeno">${c.nome_impresso}</span>
            </div>
          </label>`).join('');

        debitoArea.innerHTML = opcoesDebitoHTML + `
          <label class="checkout-opcao">
            <input type="radio" name="cartaoDebito" value="novoDebito" ${!opcoesDebitoHTML ? 'checked' : ''}>
            <div class="checkout-opcao__info"><strong>+ Cartão de débito</strong></div>
          </label>`;
      }

    } catch (err) {
      console.error('Erro ao carregar dados do checkout:', err);
    }
  }

  await carregarDadosCheckout();

  // Mostrar form novo cartão (cartão único)
  document.addEventListener('change', (e) => {
    if (e.target.name === 'cartao') {
      const form = document.getElementById('novoCartaoForm');
      if (form) form.style.display = e.target.value === 'novo' ? 'block' : 'none';
    }
  });

  // ---- renderizar resumo ----
  function renderizarResumo() {
    const itens         = Carrinho.itens;
    const checkoutItens = document.getElementById('checkoutItens');
    if (!checkoutItens) return;

    if (itens.length === 0) { window.location.href = 'carrinho.html'; return; }

    checkoutItens.innerHTML = itens.map(item => {
      const emoji = item.categoria === 'JDM' ? '🇯🇵'
                  : item.categoria === 'Americanos' ? '🇺🇸'
                  : item.categoria === 'Italianos' ? '🇮🇹'
                  : item.categoria === 'Alemães' ? '🇩🇪' : '🔧';
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

    sincronizarSlots();
  }

  if (document.getElementById('checkoutCartaoNum')) {
    mascaraCartao(document.getElementById('checkoutCartaoNum'));
  }

  // ---- aplicar cupom ----
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
        const c        = resultado.cupom;
        const valorNum = parseFloat(c.valor);
        cupomAtivo = {
          desconto: c.tipo === 'percentual' ? valorNum / 100 : valorNum,
          tipo:     c.tipo,
          codigo:   c.codigo,
        };
        const valorExibido = c.tipo === 'percentual'
          ? valorNum + '%'
          : 'R$ ' + valorNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        feedbackEl.innerHTML = `<div class="alerta alerta-sucesso">✓ ${valorExibido} de desconto aplicado!</div>`;
        atualizarCalculo();
      } else {
        feedbackEl.innerHTML = `<div class="alerta alerta-erro">⚠ ${resultado.motivo || 'Cupom inválido'}</div>`;
      }
    } catch (err) {
      feedbackEl.innerHTML = `<div class="alerta alerta-erro">⚠ Erro ao validar cupom</div>`;
    }
  });

  // ---- confirmar pedido ----
  document.getElementById('btnConfirmarPedido')?.addEventListener('click', async () => {
    const endereco = document.querySelector('[name="endereco"]:checked');
    if (!endereco) { alert('Selecione um endereço de entrega.'); return; }

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
      const slots = [...document.querySelectorAll('.cartao-slot')];

      if (slots.length === 0) {
        // Fluxo legado (sem slots adicionados): usa o seletor #cartaoopcoes
        const cartao1 = document.querySelector('[name="cartao"]:checked');
        if (!cartao1) { alert('Selecione um cartão.'); return; }

        if (!temCupom && totalComDesconto < 10) {
          alert('Valor mínimo para pagamento com cartão é R$ 10,00.');
          return;
        }
        pagamento = { metodo: 'CARTAO_CREDITO', cartaoId: parseInt(cartao1.value) };

      } else if (slots.length === 1) {
        // 1 slot: cartão único
        const radio = slots[0].querySelector('input[type="radio"]:checked');
        if (!radio) { alert('Selecione um cartão.'); return; }
        if (!temCupom && totalComDesconto < 10) {
          alert('Valor mínimo para pagamento com cartão é R$ 10,00.');
          return;
        }
        pagamento = { metodo: 'CARTAO_CREDITO', cartaoId: parseInt(radio.value) };

      } else {
        // N slots: múltiplos cartões
        const cartoesPayload = [];
        for (let i = 0; i < slots.length; i++) {
          const slot  = slots[i];
          const radio = slot.querySelector('input[type="radio"]:checked');
          if (!radio) { alert(`Selecione um cartão no slot ${i + 1}.`); return; }

          const valor = parseFloat(slot.querySelector('.slot-valor').value);
          if (isNaN(valor) || valor <= 0) { alert(`Informe um valor válido no cartão ${i + 1}.`); return; }
          if (!temCupom && valor < 10) {
            alert(`Valor mínimo por cartão é R$ 10,00 (Cartão ${i + 1} com R$ ${valor.toFixed(2)}).`);
            return;
          }

          const cartaoId = radio.value.startsWith('novo') ? null : parseInt(radio.value);

          // Verificar duplicidade de cartões salvos
          if (cartaoId !== null && cartoesPayload.some(c => c.cartaoId === cartaoId)) {
            alert(`O cartão selecionado no slot ${i + 1} já está sendo usado em outro slot.`);
            return;
          }

          cartoesPayload.push({ cartaoId, valor: parseFloat(valor.toFixed(2)) });
        }

        const somaCartoes = cartoesPayload.reduce((s, c) => s + c.valor, 0);
        if (Math.abs(somaCartoes - totalComDesconto) > 0.02) {
          alert(`A soma dos cartões (R$ ${somaCartoes.toFixed(2)}) não bate com o total (R$ ${totalComDesconto.toFixed(2)}).`);
          return;
        }

        pagamento = {
          metodo:  'MULTIPLOS_CARTOES',
          cartoes: cartoesPayload,
        };
      }
    }

    // ENVIAR PEDIDO
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

      const resp      = await fetch('/api/pedidos', {
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