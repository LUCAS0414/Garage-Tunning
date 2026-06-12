document.addEventListener('DOMContentLoaded', async function() {

  // Url relativa — funciona em qualquer porta/ambiente (igual ao checkout.js)
  const API = '';
  const userId = localStorage.getItem('garage_user_id') ||
                 JSON.parse(localStorage.getItem('garage_user') || '{}').id;

  // Se não tem sessão, manda para login
  if (!userId) {
    window.location.href = 'login.html';
    return;
  }

  // ---- carregar dados iniciais ---- //
  async function carregarPerfil() {
    try {
      const response = await fetch(`${API}/api/clientes/${userId}`);
      if (!response.ok) {
        window.location.href = 'login.html';
        return;
      }
      const user = await response.json();

      // HEADER
      document.getElementById('perfilNome').textContent  = user.nome;
      document.getElementById('perfilEmail').textContent = `${user.email} | Nível: ${user.ranking || 'Iniciante'}`;

      // ABA DADOS
      if (document.getElementById('dNome'))       document.getElementById('dNome').textContent       = user.nome;
      if (document.getElementById('dEmail'))      document.getElementById('dEmail').textContent      = user.email;
      if (document.getElementById('dCpf'))        document.getElementById('dCpf').textContent        = user.cpf || 'Não informado';
      
      const phoneFormat = user.telefone_ddd ? `(${user.telefone_ddd}) ${user.telefone_numero}` : 'Não informado';
      if (document.getElementById('dTelefone'))   document.getElementById('dTelefone').textContent   = phoneFormat;
      
      if (document.getElementById('dDataNasc')) {
        if (user.data_nascimento) {
          const date = new Date(user.data_nascimento);
          document.getElementById('dDataNasc').textContent = date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        } else {
          document.getElementById('dDataNasc').textContent = 'Não informada';
        }
      }
      
      if (document.getElementById('dGenero'))     document.getElementById('dGenero').textContent     = user.genero || 'Não informado';

      if (document.getElementById('editEmail'))   document.getElementById('editEmail').value         = user.email || '';
      if (document.getElementById('editNome'))    document.getElementById('editNome').value          = user.nome || '';
      if (document.getElementById('editTelefone')) document.getElementById('editTelefone').value     = user.telefone_ddd ? `(${user.telefone_ddd}) ${user.telefone_numero}` : '';
      
      if (document.getElementById('editDataNasc')) {
        if (user.data_nascimento) {
          const date = new Date(user.data_nascimento);
          document.getElementById('editDataNasc').value = date.toISOString().split('T')[0];
        } else {
           document.getElementById('editDataNasc').value = '';
        }
      }
      if (document.getElementById('editGenero'))  document.getElementById('editGenero').value        = user.genero || '';

      // LISTAR ENDEREÇOS
      const listaEnd = document.getElementById('enderecosList');
      if (listaEnd) {
        if (user.enderecos && user.enderecos.length > 0) {
          listaEnd.innerHTML = user.enderecos.map(end => `
            <div class="endereco-card card" style="padding:1rem; margin-bottom:0.75rem; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong>${end.identificacao}</strong> <span style="font-size:0.75rem; color:var(--cor-texto-muted);">${end.tipo_endereco}</span><br>
                <span style="font-size:0.85rem;">${end.logradouro}, ${end.numero} — ${end.bairro}, ${end.cidade}/${end.estado}</span>
              </div>
              <button class="btn btn-danger btn-sm" onclick="removerEndereco(${end.id})">🗑</button>
            </div>
          `).join('');
        } else {
          listaEnd.innerHTML = '<p class="texto-muted">Nenhum endereço cadastrado.</p>';
        }
      }

      // LISTAR CARTÕES
      const listaCartoes = document.getElementById('cartoesList');
      if (listaCartoes) {
        if (user.cartoes && user.cartoes.length > 0) {
          listaCartoes.innerHTML = user.cartoes.map(c => `
            <div class="cartao-item card" style="padding:1rem; margin-bottom:0.75rem; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong>${c.bandeira}</strong> •••• ${String(c.numero_cartao).slice(-4)}
                ${c.is_preferencial ? '<span style="color:var(--cor-primaria); font-size:0.75rem;"> ★ Principal</span>' : ''}
                <br><span style="font-size:0.85rem; color:var(--cor-texto-muted);">${c.nome_impresso}</span>
              </div>
              <button class="btn btn-danger btn-sm" onclick="removerCartao(${c.id})">🗑</button>
            </div>
          `).join('');
        } else {
          listaCartoes.innerHTML = '<p class="texto-muted">Nenhum cartão cadastrado.</p>';
        }
      }

      // Listar pedidos do cliente
      const listaPedidos = document.getElementById('pedidosList');
      if (listaPedidos) {
        listaPedidos.innerHTML = '<p class="texto-muted">Carregando pedidos...</p>';
        try {
          const resPedidos = await fetch(`/api/pedidos/cliente/${userId}`);
          if (!resPedidos.ok) throw new Error(`Erro HTTP ${resPedidos.status}`);
          const pedidos = await resPedidos.json();
          if (pedidos && pedidos.length > 0) {
              const STATUS_MAP = {
                'EM PROCESSAMENTO': { label: 'Em Processamento', cor: '#ffbb00' },
                'APROVADO':         { label: 'Aprovado',          cor: '#00ff88' },
                'REPROVADO':        { label: 'Reprovado',         cor: '#ff3344' },
                'EM TRANSPORTE':    { label: 'Em Transporte',     cor: '#00ccff' },
                'ENTREGUE':         { label: 'Entregue',          cor: '#00cc64' },
                'EM TROCA':         { label: 'Em Troca',          cor: '#ff6600' },
                'TROCA AUTORIZADA': { label: 'Troca Autorizada',  cor: '#cc88ff' },
                'TROCADO':          { label: 'Trocado',           cor: '#888888' },
              };
              // Mapa em memória: pedidoid → dados do pedido (evita json.parse inline no onclick)
              window._pedidosMap = {};
              pedidos.forEach(p => { window._pedidosMap[p.id] = p; });

              listaPedidos.innerHTML = pedidos.map(p => {
                const st   = STATUS_MAP[p.status] || { label: p.status, cor: '#888' };
                const data = new Date(p.data_pedido).toLocaleDateString('pt-BR');
                const itensHTML = (p.itens || []).map(i =>
                  `<span class="texto-pequeno texto-muted">${i.nome_produto} x${i.quantidade}</span>`
                ).join('<br>');
                const btnTroca = p.status === 'ENTREGUE'
                  ? `<button id="btn-solicitar-troca" class="btn btn-outline btn-sm" style="margin-top:0.75rem;"
                       onclick="abrirModalTrocaPorId(${p.id})">
                       <i class="fas fa-arrows-rotate"></i> Solicitar Troca
                     </button>`
                  : '';
                return `
                  <div class="pedido-card card" data-status="${p.status}" style="padding:1rem; margin-bottom:0.75rem; border-left:3px solid ${st.cor};">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem;">
                      <div>
                        <strong style="font-family:var(--fonte-mono); color:var(--cor-primaria);">#${p.codigo_pedido}</strong>
                        <span class="texto-muted texto-pequeno" style="margin-left:0.5rem;">${data}</span>
                      </div>
                      <div style="display:flex; gap:0.75rem; align-items:center;">
                        <span style="font-family:var(--fonte-destaque); color:var(--cor-primaria); font-size:0.95rem;">R$ ${parseFloat(p.valor_total).toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
                        <span style="background:${st.cor}22; color:${st.cor}; border:1px solid ${st.cor}; border-radius:4px; padding:2px 8px; font-size:0.75rem; font-weight:600;">${st.label}</span>
                      </div>
                    </div>
                    <div style="margin-top:0.5rem;">${itensHTML || '<span class="texto-muted texto-pequeno">Sem itens</span>'}</div>
                    ${btnTroca}
                  </div>`;
              }).join('');
            } else {
              listaPedidos.innerHTML = '<p class="texto-muted">Você ainda não fez nenhum pedido.</p>';
            }
        } catch(errPed) {
          console.error('Erro ao buscar pedidos:', errPed);
          listaPedidos.innerHTML = `<p class="texto-muted" style="color:#ff3344;">⚠ Erro ao carregar pedidos: ${errPed.message}</p>`;
        }
      }

    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    }
  }

  // Funções globais para remover (chamadas por onclick)
  window.removerEndereco = async function(endId) {
    if (!confirm('Remover este endereço?')) return;
    try {
      await fetch(`${API}/api/clientes/${userId}/enderecos/${endId}`, { method: 'DELETE' });
      carregarPerfil();
    } catch (e) { alert('Erro ao remover endereço.'); }
  };

  window.removerCartao = async function(cartaoId) {
    if (!confirm('Remover este cartão?')) return;
    try {
      await fetch(`${API}/api/clientes/${userId}/cartoes/${cartaoId}`, { method: 'DELETE' });
      carregarPerfil();
    } catch (e) { alert('Erro ao remover cartão.'); }
  };

  // ---- sidebar e tabs ---- //
  const sidebarBtns = document.querySelectorAll('.perfil-sidebar__item');
  const tabs        = document.querySelectorAll('.perfil-tab');

  sidebarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const alvo = btn.dataset.tab;
      sidebarBtns.forEach(b => b.classList.remove('ativo'));
      tabs.forEach(t => t.classList.remove('ativo'));
      btn.classList.add('ativo');
      const tab = document.getElementById(`tab-${alvo}`);
      if (tab) tab.classList.add('ativo');
      if (alvo === 'cupons') carregarCupons();
    });
  });

  // ---- cupons ---- //
  async function carregarCupons() {
    const lista = document.getElementById('cuponsLista');
    if (!lista) return;
    lista.innerHTML = '<p class="texto-muted">Carregando cupons...</p>';

    try {
      const resp = await fetch(`/api/cupons/meus?clienteId=${userId}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const cupons = await resp.json();

      if (!cupons.length) {
        lista.innerHTML = '<p class="texto-muted">Você não possui cupons no momento.</p>';
        return;
      }

      lista.innerHTML = cupons.map(c => {
        const ativo     = c.status === 1;
        const tipo      = (c.tipo_cupom || '').toLowerCase();
        const valorFmt  = tipo === 'percentual'
          ? `${c.valor}% de desconto`
          : `R$ ${parseFloat(c.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de desconto`;
        const validade  = c.data_validade
          ? new Date(c.data_validade).toLocaleDateString('pt-BR')
          : 'Sem validade';
        const corBorda  = ativo ? 'var(--cor-primaria)' : '#555';
        const badgeAtivo = ativo
          ? '<span style="background:#00ff8822;color:#00ff88;border:1px solid #00ff88;border-radius:4px;padding:2px 8px;font-size:0.72rem;font-weight:600;">DISPONÍVEL</span>'
          : '<span style="background:#88888822;color:#888;border:1px solid #555;border-radius:4px;padding:2px 8px;font-size:0.72rem;font-weight:600;">UTILIZADO</span>';

        return `
          <div style="
            border:1px solid ${corBorda};
            border-left:4px solid ${corBorda};
            border-radius:8px;
            padding:1rem 1.25rem;
            margin-bottom:0.75rem;
            display:flex;
            justify-content:space-between;
            align-items:center;
            flex-wrap:wrap;
            gap:0.75rem;
            opacity:${ativo ? '1' : '0.55'};
          ">
            <div>
              <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.35rem;">
                <span style="font-family:var(--fonte-mono);font-size:1.1rem;font-weight:700;color:var(--cor-primaria);letter-spacing:2px;">${c.codigo}</span>
                ${badgeAtivo}
              </div>
              <div style="font-size:0.85rem;color:var(--cor-texto-muted);">
                <span>${valorFmt}</span>
                <span style="margin:0 0.5rem;">·</span>
                <span>Válido até: ${validade}</span>
              </div>
            </div>
            ${ativo ? `
            <button onclick="copiarCupom('${c.codigo}')" class="btn btn-outline btn-sm" style="white-space:nowrap;">
              <i class="fas fa-copy"></i> Copiar código
            </button>` : ''}
          </div>`;
      }).join('');

    } catch (err) {
      console.error('Erro ao buscar cupons:', err);
      lista.innerHTML = '<p class="texto-muted" style="color:#ff3344;">⚠ Erro ao carregar cupons.</p>';
    }
  }

  window.copiarCupom = function(codigo) {
    navigator.clipboard.writeText(codigo).then(() => {
      Carrinho._mostrarFeedback(`Cupom ${codigo} copiado!`);
    }).catch(() => {
      prompt('Copie o código:', codigo);
    });
  };

  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const btn = document.querySelector(`.perfil-sidebar__item[data-tab="${hash}"]`);
    if (btn) btn.click();
  }

  // ---- atualizar dados pessoais ---- //
  document.getElementById('btnEditarDados')?.addEventListener('click', () => {
    document.getElementById('dadosView').style.display = 'none';
    document.getElementById('dadosForm').style.display = 'block';
  });

  document.getElementById('btnCancelarDados')?.addEventListener('click', () => {
    document.getElementById('dadosView').style.display = 'grid';
    document.getElementById('dadosForm').style.display = 'none';
  });

  document.getElementById('btnSalvarDados')?.addEventListener('click', async () => {
    const novoNome     = document.getElementById('editNome').value;
    const novoEmail    = document.getElementById('editEmail')?.value;
    const novoTelefone = document.getElementById('editTelefone').value.replace(/\D/g, '');

    if (novoTelefone.length > 0 && (novoTelefone.length < 10 || novoTelefone.length > 11)) {
      alert('Por favor, informe um número de telefone com DDD válido (10 ou 11 dígitos).');
      return;
    }

    const novaDataNasc = document.getElementById('editDataNasc')?.value;
    const novoGenero   = document.getElementById('editGenero')?.value;

    const payload = {
      nome:             novoNome,
      email:            novoEmail || null,
      telefone_ddd:     novoTelefone ? novoTelefone.substring(0, 2) : '',
      telefone_numero:  novoTelefone ? novoTelefone.substring(2) : '',
      data_nascimento:  novaDataNasc || null,
      genero:           novoGenero || null
    };

    try {
      const res = await fetch(`${API}/api/clientes/${userId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });

      if (res.ok) {
        await carregarPerfil();
        document.getElementById('dadosView').style.display = 'grid';
        document.getElementById('dadosForm').style.display = 'none';

        const toast = document.createElement('div');
        toast.className = 'toast-feedback';
        toast.innerHTML = '✓ Dados salvos com sucesso!';
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('ativo'), 10);
        setTimeout(() => { toast.classList.remove('ativo'); setTimeout(() => toast.remove(), 300); }, 2500);
      }
    } catch (err) {
      alert('Erro ao atualizar dados.');
    }
  });

  // ---- inativar conta ---- //
  document.getElementById('btnInativarConta')?.addEventListener('click', async () => {
    if (!confirm('Tem certeza que deseja inativar sua conta? Esta ação não pode ser desfeita.')) return;
    try {
      const res = await fetch(`${API}/api/clientes/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Sua conta foi inativada com sucesso.');
        document.getElementById('btnLogout').click();
      } else {
        const err = await res.json();
        alert('Erro: ' + (err.error || 'Falha ao inativar conta.'));
      }
    } catch (err) {
      alert('Erro de comunicação.');
    }
  });

  // ---- endereços ---- //
  document.getElementById('btnNovoEndereco')?.addEventListener('click', () => {
    const form = document.getElementById('enderecoForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('btnCancelarEndereco')?.addEventListener('click', () => {
    document.getElementById('enderecoForm').style.display = 'none';
  });

  document.getElementById('btnSalvarEndereco')?.addEventListener('click', async () => {
    const payload = {
      identificacao:   document.getElementById('endIdentificacao')?.value   || 'Novo Endereço',
      tipo_endereco:   document.getElementById('endTipoUso')?.value         || 'AMBOS',
      tipo_residencia: document.getElementById('endTipoResidencia')?.value  || 'Casa',
      tipo_logradouro: document.getElementById('endTipoLogradouro')?.value  || 'Rua',
      logradouro:      document.getElementById('endLogradouro')?.value,
      numero:          document.getElementById('endNumero')?.value,
      bairro:          document.getElementById('endBairro')?.value,
      cep:             document.getElementById('endCep')?.value.replace(/\D/g, ''),
      cidade:          document.getElementById('endCidade')?.value,
      estado:          document.getElementById('endEstado')?.value,
      pais:            'Brasil',
      observacoes:     document.getElementById('endObs')?.value || ''
    };

    try {
      const res = await fetch(`${API}/api/clientes/${userId}/enderecos`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });

      if (res.ok) {
        document.getElementById('enderecoForm').style.display = 'none';
        alert('Endereço adicionado com sucesso!');
        carregarPerfil();
      } else {
        const err = await res.json();
        alert('Erro: ' + (err.error || 'Falha ao salvar endereço.'));
      }
    } catch (err) {
      alert('Erro ao salvar endereço.');
    }
  });

  // ---- cartões ---- //
  document.getElementById('btnNovoCartao')?.addEventListener('click', () => {
    const form = document.getElementById('cartaoForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('btnCancelarCartao')?.addEventListener('click', () => {
    document.getElementById('cartaoForm').style.display = 'none';
  });

  if (document.getElementById('novoCartaoNum')) mascaraCartao(document.getElementById('novoCartaoNum'));

  document.getElementById('btnSalvarCartao')?.addEventListener('click', async () => {
    const payload = {
      numero_cartao:  document.getElementById('novoCartaoNum').value.replace(/\D/g, ''),
      nome_impresso:  document.getElementById('novoCartaoNome').value,
      bandeira:       document.getElementById('novoCartaoBandeira')?.value || 'VISA',
      is_preferencial: document.getElementById('novoCartaoPref')?.checked  || false
    };

    try {
      const res = await fetch(`${API}/api/clientes/${userId}/cartoes`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });

      if (res.ok) {
        document.getElementById('cartaoForm').style.display = 'none';
        alert('Cartão adicionado com sucesso!');
        carregarPerfil();
      } else {
        const err = await res.json();
        alert('Erro: ' + (err.error || 'Falha ao salvar cartão.'));
      }
    } catch (err) {
      alert('Erro ao salvar cartão.');
    }
  });

  // ---- filtro de pedidos ---- //
  const pedidoFiltros = document.querySelectorAll('.pedido-filtro-btn');
  pedidoFiltros.forEach(btn => {
    btn.addEventListener('click', () => {
      pedidoFiltros.forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      const status = btn.dataset.status;
      document.querySelectorAll('.pedido-card').forEach(card => {
        if (status === 'todos' || card.dataset.status === status) {
          card.classList.remove('oculto');
        } else {
          card.classList.add('oculto');
        }
      });
    });
  });

  // ---- alterar senha ---- //
  ['toggleAtual', 'toggleNova', 'toggleConf'].forEach((id, i) => {
    const inputIds = ['senhaAtual', 'novaSenha', 'confirmarNovaSenha'];
    document.getElementById(id)?.addEventListener('click', function() {
      const input = document.getElementById(inputIds[i]);
      const tipo  = input.type === 'password' ? 'text' : 'password';
      input.type  = tipo;
      this.textContent = tipo === 'password' ? '👁️' : '🙈';
    });
  });

  document.getElementById('novaSenha')?.addEventListener('input', function() {
    const forca   = verificarForcaSenha(this.value);
    const forcaEl = document.getElementById('novaSenhaForca');
    const fillEl  = document.getElementById('novaSenhaFill');
    const nivelEl = document.getElementById('novaSenhaNivel');

    if (this.value) {
      forcaEl.style.display = 'block';
      fillEl.style.width    = forca.porcentagem + '%';
      fillEl.style.background = forca.cor;
      nivelEl.textContent   = forca.nivel;
      nivelEl.style.color   = forca.cor;
    } else {
      forcaEl.style.display = 'none';
    }
  });

  document.getElementById('confirmarNovaSenha')?.addEventListener('input', function() {
    const errEl = document.getElementById('errNovaSenhaConf');
    if (this.value && this.value !== document.getElementById('novaSenha').value) {
      errEl.style.display = 'flex';
    } else {
      errEl.style.display = 'none';
    }
  });

  document.getElementById('formAlterarSenha')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const novaSenhaVal = document.getElementById('novaSenha').value;

    const forca = verificarForcaSenha(novaSenhaVal);
    if (forca.atendidos < 4) return alert('A nova senha é muito fraca.');

    try {
      const res = await fetch(`${API}/api/clientes/${userId}/senha`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ novaSenha: novaSenhaVal })
      });

      if (res.ok) {
        alert('Senha alterada com sucesso!');
        this.reset();
        document.getElementById('novaSenhaForca').style.display = 'none';
      } else {
        const err = await res.json();
        alert('Erro: ' + (err.error || 'Falha ao alterar senha.'));
      }
    } catch (err) {
      alert('Erro de comunicação.');
    }
  });

  // ---- logout ---- //
  document.getElementById('btnLogout')?.addEventListener('click', () => {
    localStorage.removeItem('garage_user_id');
    localStorage.removeItem('garage_user');
    window.location.href = 'login.html';
  });

  // --- troca de produto ---
let trocaPedidoIdAtual = null;

window.abrirModalTrocaPorId = function(pedidoId) {
  const pedido = window._pedidosMap && window._pedidosMap[pedidoId];
  if (!pedido) {
    alert('Dados do pedido não encontrados. Recarregue a página.');
    return;
  }
  window.abrirModalTroca(pedido.id, pedido.codigo_pedido, pedido.itens || []);
};

window.abrirModalTroca = function(pedidoId, codigoPedido, itens) {
  trocaPedidoIdAtual = pedidoId;
  document.getElementById('trocaPedidoCodigo').textContent = '#' + codigoPedido;

  const lista = document.getElementById('trocaItensLista');
  if (!itens || itens.length === 0) {
    lista.innerHTML = '<p class="texto-muted texto-pequeno">Nenhum item encontrado.</p>';
  } else {
    const linhas = [];
    itens.forEach(item => {
      const qty = item.quantidade || 1;
      for (let u = 1; u <= qty; u++) {
        linhas.push(`
          <label class="checkbox-label" style="margin-bottom:0.35rem; display:flex; align-items:center; gap:0.5rem;">
            <input type="checkbox" class="troca-item-check"
              data-produto-id="${item.produto_id || item.id}"
              data-nome="${item.nome_produto}">
            <span class="checkbox-custom"></span>
            <span style="font-size:0.85rem;">${item.nome_produto} — Unidade ${u}</span>
          </label>`);
      }
    });
    lista.innerHTML = linhas.join('');
  }

  document.getElementById('trocaSelecionarTudo').checked = false;
  document.getElementById('trocaMotivo').value = '';
  document.getElementById('trocaFeedback').innerHTML = '';

  const modal = document.getElementById('modalSolicitarTroca');
  if (modal) {
    modal.classList.add('ativo');
    document.body.style.overflow = 'hidden';
  }
};

window.fecharModalTroca = function() {
  const modal = document.getElementById('modalSolicitarTroca');
  if (modal) {
    modal.classList.remove('ativo');
    document.body.style.overflow = '';
  }
};

document.getElementById('trocaSelecionarTudo')?.addEventListener('change', function() {
  document.querySelectorAll('.troca-item-check').forEach(cb => cb.checked = this.checked);
});

document.getElementById('btnEnviarTroca')?.addEventListener('click', async () => {
  const checks   = [...document.querySelectorAll('.troca-item-check:checked')];
  const motivo   = document.getElementById('trocaMotivo').value.trim();
  const feedback = document.getElementById('trocaFeedback');

  if (checks.length === 0) {
    feedback.innerHTML = '<div class="alerta alerta-erro">⚠ Selecione ao menos um item.</div>';
    return;
  }
  if (!motivo) {
    feedback.innerHTML = '<div class="alerta alerta-erro">⚠ Informe o motivo da troca.</div>';
    return;
  }

  // Agrupar checkboxes por produto_id → quantidade
  const agrupado = {};
  checks.forEach(cb => {
    const pid = cb.dataset.produtoId;
    agrupado[pid] = (agrupado[pid] || 0) + 1;
  });
  const itens = Object.entries(agrupado).map(([produtoId, quantidade]) => ({
    produtoId: parseInt(produtoId),
    quantidade,
  }));

  try {
    const resp = await fetch(`${API}/api/trocas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteId: userId,
        pedidoId:  trocaPedidoIdAtual,
        itens,
        motivo,
      }),
    });
    const resultado = await resp.json();

    if (resp.ok) {
      feedback.innerHTML = '<div class="alerta alerta-sucesso">✓ Solicitação enviada! Aguarde a análise.</div>';
      setTimeout(() => window.fecharModalTroca(), 2000);
    } else {
      feedback.innerHTML = `<div class="alerta alerta-erro">⚠ ${resultado.error}</div>`;
    }
  } catch (err) {
    feedback.innerHTML = '<div class="alerta alerta-erro">⚠ Erro de conexão.</div>';
  }
});

  // INICIALIZA
  carregarPerfil();
});