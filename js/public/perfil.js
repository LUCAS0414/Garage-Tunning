
document.addEventListener('DOMContentLoaded', function() {

  // Carregar dados do usuário mockado
  const user = JSON.parse(localStorage.getItem('garage_user') || '{"nome":"Carlos Tuner","email":"carlos@tuner.com","logado":true}');
  if (user.nome) {
    document.getElementById('perfilNome').textContent = user.nome;
    document.getElementById('perfilEmail').textContent = user.email;
    if(document.getElementById('dNome')) document.getElementById('dNome').textContent = user.nome;
    if(document.getElementById('dEmail')) document.getElementById('dEmail').textContent = user.email;
  }

  // ---- SIDEBAR TABS ---- //
  const sidebarBtns = document.querySelectorAll('.perfil-sidebar__item');
  const tabs = document.querySelectorAll('.perfil-tab');

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

  // Verificar hash na URL para abrir tab diretamente (ex: perfil.html#pedidos)
  const hash = window.location.hash.replace('#','');
  if (hash) {
    const btn = document.querySelector(`.perfil-sidebar__item[data-tab="${hash}"]`);
    if (btn) btn.click();
  }

  // ---- DADOS PESSOAIS ---- //
  document.getElementById('btnEditarDados')?.addEventListener('click', () => {
    document.getElementById('dadosView').style.display = 'none';
    document.getElementById('dadosForm').style.display = 'block';
  });

  document.getElementById('btnCancelarDados')?.addEventListener('click', () => {
    document.getElementById('dadosView').style.display = 'grid';
    document.getElementById('dadosForm').style.display = 'none';
  });

  document.getElementById('btnSalvarDados')?.addEventListener('click', () => {
    const nome = document.getElementById('editNome').value;
    if (nome) {
      document.getElementById('dNome').textContent = nome;
      document.getElementById('perfilNome').textContent = nome;
      const userData = JSON.parse(localStorage.getItem('garage_user') || '{}');
      userData.nome = nome;
      localStorage.setItem('garage_user', JSON.stringify(userData));
    }
    document.getElementById('dadosView').style.display = 'grid';
    document.getElementById('dadosForm').style.display = 'none';
    // Toast
    const toast = document.createElement('div');
    toast.className = 'toast-feedback';
    toast.innerHTML = '✓ Dados salvos com sucesso!';
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('ativo'), 10);
    setTimeout(() => { toast.classList.remove('ativo'); setTimeout(() => toast.remove(), 300); }, 2500);
  });

  // ---- ENDEREÇOS ---- //
  document.getElementById('btnNovoEndereco')?.addEventListener('click', () => {
    const form = document.getElementById('enderecoForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('btnCancelarEndereco')?.addEventListener('click', () => {
    document.getElementById('enderecoForm').style.display = 'none';
  });

  document.getElementById('btnSalvarEndereco')?.addEventListener('click', () => {
    document.getElementById('enderecoForm').style.display = 'none';
    Carrinho._mostrarFeedback('Endereço adicionado!');
  });

  // ---- CARTÕES ---- //
  document.getElementById('btnNovoCartao')?.addEventListener('click', () => {
    const form = document.getElementById('cartaoForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('btnCancelarCartao')?.addEventListener('click', () => {
    document.getElementById('cartaoForm').style.display = 'none';
  });

  if(document.getElementById('novoCartaoNum')) mascaraCartao(document.getElementById('novoCartaoNum'));

  document.getElementById('btnSalvarCartao')?.addEventListener('click', () => {
    document.getElementById('cartaoForm').style.display = 'none';
    Carrinho._mostrarFeedback('Cartão adicionado com sucesso!');
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
  ['toggleAtual','toggleNova','toggleConf'].forEach((id, i) => {
    const inputIds = ['senhaAtual','novaSenha','confirmarNovaSenha'];
    document.getElementById(id)?.addEventListener('click', function() {
      const input = document.getElementById(inputIds[i]);
      const tipo = input.type === 'password' ? 'text' : 'password';
      input.type = tipo;
      this.textContent = tipo === 'password' ? '👁️' : '🙈';
    });
  });

  document.getElementById('novaSenha')?.addEventListener('input', function() {
    const forca = verificarForcaSenha(this.value);
    const forcaEl = document.getElementById('novaSenhaForca');
    const fillEl = document.getElementById('novaSenhaFill');
    const nivelEl = document.getElementById('novaSenhaNivel');
    if (this.value) {
      forcaEl.style.display = 'block';
      fillEl.style.width = forca.porcentagem + '%';
      fillEl.style.background = forca.cor;
      nivelEl.textContent = forca.nivel;
      nivelEl.style.color = forca.cor;
    } else {
      forcaEl.style.display = 'none';
    }
  });

  document.getElementById('confirmarNovaSenha')?.addEventListener('input', function() {
    const nova = document.getElementById('novaSenha').value;
    const errEl = document.getElementById('errNovaSenhaConf');
    if (this.value && this.value !== nova) {
      errEl.style.display = 'flex';
    } else {
      errEl.style.display = 'none';
    }
  });

  document.getElementById('formAlterarSenha')?.addEventListener('submit', function(e) {
    e.preventDefault();
    Carrinho._mostrarFeedback('Senha alterada com sucesso!');
    this.reset();
  });

  // ---- LOGOUT ---- //
  document.getElementById('btnLogout')?.addEventListener('click', () => {
    localStorage.removeItem('garage_user');
    window.location.href = 'login.html';
  });

});
