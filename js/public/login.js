document.addEventListener('DOMContentLoaded', function() {

  const form            = document.getElementById('formLogin');
  const emailInput      = document.getElementById('loginEmail');
  const senhaInput      = document.getElementById('loginSenha');
  const errEmail        = document.getElementById('errEmail');
  const errSenha        = document.getElementById('errSenha');
  const alertaErro      = document.getElementById('alertaErroLogin');
  const btnLogin        = document.getElementById('btnLogin');
  const btnLoginTexto   = document.getElementById('btnLoginTexto');
  const btnLoginLoading = document.getElementById('btnLoginLoading');

  // Mostrar/ocultar senha
  document.getElementById('toggleSenhaLogin')?.addEventListener('click', function() {
    const tipo = senhaInput.type === 'password' ? 'text' : 'password';
    senhaInput.type = tipo;
    this.textContent = tipo === 'password' ? '👁️' : '🙈';
  });

  // Recuperar senha
  document.getElementById('btnEsqueciSenha')?.addEventListener('click', function(e) {
    e.preventDefault();
    abrirModal('modalSenha');
  });

  document.getElementById('btnEnviarRecupera')?.addEventListener('click', function() {
    const email = document.getElementById('emailRecupera').value;
    if (email && email.includes('@')) {
      fecharModal('modalSenha');
      const toast = document.createElement('div');
      toast.className = 'toast-feedback';
      toast.innerHTML = '✓ Link de recuperação enviado para ' + email;
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add('ativo'), 10);
      setTimeout(() => { toast.classList.remove('ativo'); setTimeout(() => toast.remove(), 300); }, 3000);
    }
  });

  // Validação de email
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

  function setLoading(estado) {
    btnLoginTexto.style.display  = estado ? 'none'   : 'inline';
    btnLoginLoading.style.display = estado ? 'flex'   : 'none';
    btnLogin.disabled             = estado;
  }

  // Submit — chama a API real
  form?.addEventListener('submit', async function(e) {
    e.preventDefault();

    alertaErro.style.display = 'none';
    const emailOk = validarEmail();
    const senhaOk = senhaInput.value.length >= 6;

    if (!senhaOk) {
      errSenha.style.display = 'flex';
      errSenha.textContent   = '⚠ A senha precisa ter no mínimo 6 caracteres';
      senhaInput.classList.add('erro');
    }
    if (!emailOk || !senhaOk) return;

    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: emailInput.value, senha: senhaInput.value })
      });

      if (res.ok) {
        const usuario = await res.json();
        localStorage.setItem('garage_user_id', usuario.id);
        localStorage.setItem('garage_user', JSON.stringify({ ...usuario, logado: true }));
        window.location.href = 'perfil.html';
      } else {
        setLoading(false);
        alertaErro.style.display = 'flex';
        alertaErro.textContent   = '⚠ Email ou senha incorretos.';
        emailInput.classList.add('erro');
        senhaInput.classList.add('erro');
      }
    } catch (err) {
      setLoading(false);
      alertaErro.style.display = 'flex';
      alertaErro.textContent   = '⚠ Servidor fora do ar. Tente novamente mais tarde.';
      console.error('Erro de login:', err);
    }
  });

  document.getElementById('btnGoogle')?.addEventListener('click', () => alert('OAuth Google — Em breve!'));
  document.getElementById('btnFacebook')?.addEventListener('click', () => alert('OAuth Facebook — Em breve!'));
});
