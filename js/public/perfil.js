document.addEventListener('DOMContentLoaded', async function() {

  const API = 'http://localhost:3000';
  const userId = localStorage.getItem('garage_user_id');

  // Se não tem sessão, manda para login
  if (!userId) {
    window.location.href = 'login.html';
    return;
  }

  // ---- CARREGAR DADOS INICIAIS ---- //
  async function carregarPerfil() {
    try {
      const response = await fetch(`${API}/api/clientes/${userId}`);
      if (!response.ok) {
        window.location.href = 'login.html';
        return;
      }
      const user = await response.json();

      // Header
      document.getElementById('perfilNome').textContent  = user.nome;
      document.getElementById('perfilEmail').textContent = `${user.email} | Nível: ${user.ranking || 'Iniciante'}`;

      // Aba dados
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

      // Listar endereços
      if (user.enderecos && user.enderecos.length > 0) {
        const lista = document.getElementById('enderecosList');
        if (lista) {
          lista.innerHTML = user.enderecos.map(end => `
            <div class="endereco-card card" style="padding:1rem; margin-bottom:0.75rem; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong>${end.identificacao}</strong> <span style="font-size:0.75rem; color:var(--cor-texto-muted);">${end.tipo_endereco}</span><br>
                <span style="font-size:0.85rem;">${end.logradouro}, ${end.numero} — ${end.bairro}, ${end.cidade}/${end.estado}</span>
              </div>
              <button class="btn btn-danger btn-sm" onclick="removerEndereco(${end.id})">🗑</button>
            </div>
          `).join('');
        }
      }

      // Listar cartões
      if (user.cartoes && user.cartoes.length > 0) {
        const lista = document.getElementById('cartoesList');
        if (lista) {
          lista.innerHTML = user.cartoes.map(c => `
            <div class="cartao-item card" style="padding:1rem; margin-bottom:0.75rem; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong>${c.bandeira}</strong> •••• ${String(c.numero_cartao).slice(-4)}
                ${c.is_preferencial ? '<span style="color:var(--cor-primaria); font-size:0.75rem;"> ★ Principal</span>' : ''}
                <br><span style="font-size:0.85rem; color:var(--cor-texto-muted);">${c.nome_impresso}</span>
              </div>
              <button class="btn btn-danger btn-sm" onclick="removerCartao(${c.id})">🗑</button>
            </div>
          `).join('');
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

  // ---- SIDEBAR E TABS ---- //
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
    });
  });

  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const btn = document.querySelector(`.perfil-sidebar__item[data-tab="${hash}"]`);
    if (btn) btn.click();
  }

  // ---- ATUALIZAR DADOS PESSOAIS ---- //
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

  // ---- INATIVAR CONTA ---- //
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

  // ---- ENDEREÇOS ---- //
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

  // ---- CARTÕES ---- //
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
      is_preferencial: document.getElementById('novoCartaoPrincipal')?.checked  || false
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

  // ---- FILTRO DE PEDIDOS ---- //
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

  // ---- ALTERAR SENHA ---- //
  ['toggleAtual', 'toggleNova', 'toggleConf'].forEach((id, i) => {
    const inputIds = ['senhaAtual', 'novaSenha', 'confirmarNovaSenha'];
    document.getElementById(id)?.addEventListener('click', function() {
      const input = document.getElementById(inputIds[i]);
      const tipo  = input.type === 'password' ? 'text' : 'password';
      input.type  = tipo;
      this.innerHTML = tipo === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
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

  // ---- LOGOUT ---- //
  document.getElementById('btnLogout')?.addEventListener('click', () => {
    localStorage.removeItem('garage_user_id');
    localStorage.removeItem('garage_user');
    window.location.href = 'login.html';
  });

  // Inicializa
  carregarPerfil();
});