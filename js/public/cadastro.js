
document.addEventListener('DOMContentLoaded', function() {

  let stepAtual = 1;

  // ---- NAVEGAÇÃO DE STEPS ---- //
  function irParaStep(num) {
    document.querySelectorAll('.form-step').forEach(s => s.style.display = 'none');
    document.getElementById(`step${num}`).style.display = 'block';

    document.querySelectorAll('.cadastro-step').forEach((s, i) => {
      s.classList.remove('ativo', 'concluido');
      if (i + 1 < num) s.classList.add('concluido');
      else if (i + 1 === num) s.classList.add('ativo');
    });

    stepAtual = num;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Botões de próximo/voltar
  document.getElementById('btnProximo1')?.addEventListener('click', () => {
    if (validarStep1()) irParaStep(2);
  });

  document.getElementById('btnProximo2')?.addEventListener('click', () => {
    if (validarStep2()) irParaStep(3);
  });

  document.getElementById('btnVoltar2')?.addEventListener('click', () => irParaStep(1));
  document.getElementById('btnVoltar3')?.addEventListener('click', () => irParaStep(2));

  // ---- VALIDAÇÕES ---- //
  function validarStep1() {
    let ok = true;

    const nome = document.getElementById('nomeCompleto').value.trim();
    if (nome.length < 3) {
      marcarErro('nomeCompleto', 'Nome muito curto');
      ok = false;
    } else limparErro('nomeCompleto');

    const cpf = document.getElementById('cpf').value;
    if (!validarCPF(cpf)) {
      document.getElementById('errCPF').style.display = 'flex';
      document.getElementById('cpf').classList.add('erro');
      ok = false;
    } else {
      document.getElementById('errCPF').style.display = 'none';
      document.getElementById('cpf').classList.remove('erro');
    }

    const dataNasc = document.getElementById('dataNasc').value;
    if (!dataNasc) {
      marcarErro('dataNasc', 'Data obrigatória');
      ok = false;
    } else limparErro('dataNasc');

    return ok;
  }

  function validarStep2() {
    let ok = true;

    const cep = document.getElementById('cep').value.replace(/\D/g,'');
    if (cep.length !== 8) {
      marcarErro('cep', 'CEP inválido');
      ok = false;
    } else limparErro('cep');

    ['logradouro','numEndereco','bairro','cidade'].forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        marcarErro(id, 'Campo obrigatório');
        ok = false;
      } else limparErro(id);
    });

    return ok;
  }

  function marcarErro(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('erro');
    // Adicionar ou atualizar mensagem de erro após o campo
    let errEl = el.parentElement.querySelector('.input-erro-msg');
    if (!errEl) {
      errEl = document.createElement('span');
      errEl.className = 'input-erro-msg';
      el.parentElement.appendChild(errEl);
    }
    errEl.textContent = `⚠ ${msg}`;
    errEl.style.display = 'flex';
  }

  function limparErro(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('erro');
    const errEl = el.parentElement.querySelector('.input-erro-msg');
    if (errEl) errEl.style.display = 'none';
  }

  // ---- MÁSCARAS ---- //
  mascaraCPF(document.getElementById('cpf'));
  mascaraCEP(document.getElementById('cep'));
  mascaraTelefone(document.getElementById('numTel'));

  // ---- ENDEREÇO DE COBRANÇA ---- //
  document.getElementById('cobIgual')?.addEventListener('change', function() {
    document.getElementById('endCobrancaArea').style.display = this.checked ? 'none' : 'block';
  });

  // ---- BUSCA CEP (mock) ---- //
  document.getElementById('btnBuscarCEP')?.addEventListener('click', function() {
    const cep = document.getElementById('cep').value.replace(/\D/g,'');
    if (cep.length === 8) {
      // Mock: preencher campos simulando API ViaCEP
      // Futuro: fetch(`https://viacep.com.br/ws/${cep}/json/`)
      document.getElementById('logradouro').value = 'Rua das Garagens';
      document.getElementById('bairro').value = 'Bairro Motor';
      document.getElementById('cidade').value = 'São Paulo';
      document.getElementById('estado').value = 'SP';

      const toast = document.createElement('div');
      toast.className = 'toast-feedback';
      toast.innerHTML = '✓ CEP encontrado!';
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add('ativo'), 10);
      setTimeout(() => { toast.classList.remove('ativo'); setTimeout(() => toast.remove(), 300); }, 2000);
    }
  });

  // ---- FORÇA DA SENHA ---- //
  const senhaInput = document.getElementById('cadastroSenha');
  const senhaForca = document.getElementById('senhaForca');
  const senhaFill = document.getElementById('senhaForcaFill');
  const senhaNivel = document.getElementById('senhaForcaNivel');

  senhaInput?.addEventListener('input', function() {
    const senha = this.value;
    if (!senha.length) {
      senhaForca.style.display = 'none';
      return;
    }

    senhaForca.style.display = 'block';
    const forca = verificarForcaSenha(senha);

    // Atualizar barra
    senhaFill.style.width = forca.porcentagem + '%';
    senhaFill.style.background = forca.cor;
    senhaNivel.textContent = forca.nivel;
    senhaNivel.style.color = forca.cor;

    // Atualizar requisitos
    const map = {
      tamanho: 'req-tamanho',
      maiuscula: 'req-maiuscula',
      minuscula: 'req-minuscula',
      numero: 'req-numero',
      especial: 'req-especial'
    };

    Object.entries(forca.requisitos).forEach(([key, ok]) => {
      const el = document.getElementById(map[key]);
      if (el) el.classList.toggle('ok', ok);
    });
  });

  // ---- TOGGLE SENHA ---- //
  document.getElementById('toggleSenha1')?.addEventListener('click', function() {
    const tipo = senhaInput.type === 'password' ? 'text' : 'password';
    senhaInput.type = tipo;
    this.textContent = tipo === 'password' ? '👁️' : '🙈';
  });

  const confSenha = document.getElementById('confirmarSenha');
  document.getElementById('toggleSenha2')?.addEventListener('click', function() {
    const tipo = confSenha.type === 'password' ? 'text' : 'password';
    confSenha.type = tipo;
    this.textContent = tipo === 'password' ? '👁️' : '🙈';
  });

  // Validar confirmação de senha
  confSenha?.addEventListener('input', function() {
    const errEl = document.getElementById('errConfSenha');
    if (this.value && this.value !== senhaInput.value) {
      errEl.style.display = 'flex';
      this.classList.add('erro');
    } else {
      errEl.style.display = 'none';
      this.classList.remove('erro');
      if (this.value) this.classList.add('sucesso');
    }
  });

  // ---- SUBMIT ---- //
  document.getElementById('formCadastro')?.addEventListener('submit', function(e) {
    e.preventDefault();

    // Validar step 3
    let ok = true;

    const email = document.getElementById('cadastroEmail').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('errCadEmail').style.display = 'flex';
      ok = false;
    } else document.getElementById('errCadEmail').style.display = 'none';

    const forca = verificarForcaSenha(senhaInput.value);
    if (forca.atendidos < 3) {
      marcarErro('cadastroSenha', 'Senha fraca - atenda ao menos 3 requisitos');
      ok = false;
    }

    if (confSenha.value !== senhaInput.value) {
      document.getElementById('errConfSenha').style.display = 'flex';
      ok = false;
    }

    if (!document.getElementById('aceitaTermos').checked) {
      document.getElementById('errTermos').style.display = 'flex';
      ok = false;
    } else {
      document.getElementById('errTermos').style.display = 'none';
    }

    if (!ok) return;

    // Simular envio
    const btnTexto = document.getElementById('btnCadTexto');
    const btnLoad = document.getElementById('btnCadLoading');
    const btn = document.getElementById('btnCadastrar');
    btnTexto.style.display = 'none';
    btnLoad.style.display = 'flex';
    btn.disabled = true;

    // Futuro: fetch POST /api/auth/cadastro com os dados do formulário
    setTimeout(() => {
      // Salvar usuário mock
      localStorage.setItem('garage_user', JSON.stringify({
        id: 'u_' + Date.now(),
        nome: document.getElementById('nomeCompleto').value,
        email: email,
        logado: true,
        novo: true
      }));
      window.location.href = 'perfil.html';
    }, 1500);
  });

  // Iniciar no step 1
  irParaStep(1);

});
