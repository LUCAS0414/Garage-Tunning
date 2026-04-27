document.addEventListener('DOMContentLoaded', function() {

  const form = document.getElementById('formLogin');
  const emailInput = document.getElementById('loginEmail');
  const senhaInput = document.getElementById('loginSenha');
  const errEmail = document.getElementById('errEmail');
  const errSenha = document.getElementById('errSenha');
  const alertaErro = document.getElementById('alertaErroLogin');
  const btnLogin = document.getElementById('btnLogin');
  const btnLoginTexto = document.getElementById('btnLoginTexto');
  const btnLoginLoading = document.getElementById('btnLoginLoading');

  //Ocultar senha
  document.getElementById('toggleSenhaLogin')?.addEventListener('click', function() {
    const tipo = senhaInput.type === 'password' ? 'text' : 'password';
    senhaInput.type = tipo;
    this.textContent = tipo === 'password' ? <i class="fas fa-eye"></i> : <i class="fas fa-eye-slash"></i>;
  });

  //esqueci minha senha
  document.getElementById('btnEsqueciSenha')?.addEventListener('click', function(e) {
    e.preventDefault();
    abrirModal('modalSenha');
  });

  document.getElementById('btnEnviarRecupera')?.addEventListener('click', function() {
    const email = document.getElementById('emailRecupera').value;
    if (email && email.includes('@')) {
      fecharModal('modalSenha');
      // Mostrar toast
      const toast = document.createElement('div');
      toast.className = 'toast-feedback';
      toast.innerHTML = '✓ Link de recuperação enviado para ' + email;
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add('ativo'), 10);
      setTimeout(() => { toast.classList.remove('ativo'); setTimeout(() => toast.remove(), 300); }, 3000);
    }
  });

  //Validação
  emailInput?.addEventListener('blur', () => validarEmail());
  senhaInput?.addEventListener('input', () => {
    if (errSenha) errSenha.style.display = 'none';
    senhaInput.classList.remove('erro');
  });

  function validarEmail() {
    const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);
    if (!valido && emailInput.value.length > 0) {
      errEmail.style.display = 'flex';
      emailInput.classList.add('erro');
      return false;
    } else {
      errEmail.style.display = 'none';
      emailInput.classList.remove('erro');
      return true;
    }
  }

  //Btn
  form?.addEventListener('submit', function(e) {
    e.preventDefault();

    //resetar
    alertaErro.style.display = 'none';
    const emailOk = validarEmail();
    const senhaOk = senhaInput.value.length >= 6;

    if (!senhaOk) {
      errSenha.style.display = 'flex';
      errSenha.textContent = '⚠ A senha precisa ter no mínimo 6 caracteres';
      senhaInput.classList.add('erro');
    }

    if (!emailOk || !senhaOk) return;

    // Simulação
    btnLoginTexto.style.display = 'none';
    btnLoginLoading.style.display = 'flex';
    btnLogin.disabled = true;

    // Simulalção
    setTimeout(() => {
      btnLoginTexto.style.display = 'inline';
      btnLoginLoading.style.display = 'none';
      btnLogin.disabled = false;

      // MOCK
      const emailMock = 'teste@garage.com';
      const senhaMock = '123456';

      if (emailInput.value === emailMock && senhaInput.value === senhaMock) {
        // Salvar sessão mock
        localStorage.setItem('garage_user', JSON.stringify({
          id: 'u001',
          nome: 'Carlos Tuner',
          email: emailInput.value,
          logado: true
        }));
        // Redirecionar
        window.location.href = 'perfil.html';
      } else {
        // Erro de autenticação
        alertaErro.style.display = 'flex';
        emailInput.classList.add('erro');
        senhaInput.classList.add('erro');

        // Dica de credenciais de teste
        alertaErro.innerHTML = '⚠ Email ou senha incorretos. <span style="color:var(--cor-texto-muted); font-size:0.8rem;">(Demo: teste@garage.com / 123456)</span>';
      }
    }, 1200);
  });

  //implementação futura
  document.getElementById('btnGoogle')?.addEventListener('click', () => {
    alert('OAuth Google - Em breve!');
  });

  document.getElementById('btnFacebook')?.addEventListener('click', () => {
    alert('OAuth Facebook - Em breve!');
  });

});
