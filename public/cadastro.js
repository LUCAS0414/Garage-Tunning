document.addEventListener('DOMContentLoaded', function () {
  let stepAtual = 1;

  // ---- helpers e máscaras ---- //
  function calcularIdade(dataString) {
    const hoje = new Date();
    const dataNasc = new Date(dataString);
    let idade = hoje.getFullYear() - dataNasc.getFullYear();
    const m = hoje.getMonth() - dataNasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < dataNasc.getDate())) {
      idade--;
    }
    return idade;
  }

  function marcarErro(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('erro');
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

  if (document.getElementById('cpf'))
    mascaraCPF(document.getElementById('cpf'));
  if (document.getElementById('cep'))
    mascaraCEP(document.getElementById('cep'));
  if (document.getElementById('numTel'))
    mascaraTelefone(document.getElementById('numTel'));

  // ---- navegação de steps ---- //
  function irParaStep(num) {
    document
      .querySelectorAll('.form-step')
      .forEach((s) => (s.style.display = 'none'));
    document.getElementById(`step${num}`).style.display = 'block';

    document.querySelectorAll('.cadastro-step').forEach((s, i) => {
      s.classList.remove('ativo', 'concluido');
      if (i + 1 < num) s.classList.add('concluido');
      else if (i + 1 === num) s.classList.add('ativo');
    });

    stepAtual = num;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---- validações de etapa ---- //
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
    } else if (calcularIdade(dataNasc) < 18) {
      // Rn0029: validação de maioridade
      marcarErro(
        'dataNasc',
        'É necessário ter 18 anos ou mais para se cadastrar.',
      );
      ok = false;
    } else {
      limparErro('dataNasc');
    }

    const tipoTel = document.getElementById('tipoTelefone').value;
    const numTelStr = document
      .getElementById('numTel')
      .value.replace(/\D/g, '');
    if (numTelStr.length < 10) {
      marcarErro('numTel', 'Telefone inválido');
      ok = false;
    } else {
      const numeroTel = numTelStr.substring(2);
      if (tipoTel === 'Celular' && numeroTel.length !== 9) {
        marcarErro('numTel', 'Celular deve ter 9 dígitos após o DDD');
        ok = false;
      } else if (tipoTel !== 'Celular' && numeroTel.length !== 8) {
        marcarErro('numTel', 'Fixo deve ter 8 dígitos após o DDD');
        ok = false;
      } else {
        limparErro('numTel');
      }
    }

    return ok;
  }

  function validarStep2() {
    let ok = true;

    const cep = document.getElementById('cep').value.replace(/\D/g, '');
    if (cep.length !== 8) {
      marcarErro('cep', 'CEP inválido');
      ok = false;
    } else limparErro('cep');

    ['logradouro', 'numEndereco', 'bairro', 'cidade'].forEach((id) => {
      const el = document.getElementById(id);
      if (el && !el.value.trim()) {
        marcarErro(id, 'Campo obrigatório');
        ok = false;
      } else limparErro(id);
    });
    return ok;
  }

  // EVENTOS DE NAVEGAÇÃO
  document.getElementById('btnProximo1')?.addEventListener('click', () => {
    if (validarStep1()) irParaStep(2);
  });
  document.getElementById('btnProximo2')?.addEventListener('click', () => {
    if (validarStep2()) irParaStep(3);
  });
  document
    .getElementById('btnVoltar2')
    ?.addEventListener('click', () => irParaStep(1));
  document
    .getElementById('btnVoltar3')
    ?.addEventListener('click', () => irParaStep(2));

  // ---- endereço e cep ---- //
  document.getElementById('cobIgual')?.addEventListener('change', function () {
    document.getElementById('endCobrancaArea').style.display = this.checked
      ? 'none'
      : 'block';
  });

  document
    .getElementById('btnBuscarCEP')
    ?.addEventListener('click', async function () {
      const cep = document.getElementById('cep').value.replace(/\D/g, '');
      if (cep.length === 8) {
        try {
          const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          const dados = await res.json();
          if (!dados.erro) {
            document.getElementById('logradouro').value = dados.logradouro;
            document.getElementById('bairro').value = dados.bairro;
            document.getElementById('cidade').value = dados.localidade;
            document.getElementById('estado').value = dados.uf;
            limparErro('cep');
          }
        } catch (err) {
          marcarErro('cep', 'Erro ao buscar CEP');
        }
      }
    });

  // ---- força da senha (rnf0031) ---- //
  const senhaInput = document.getElementById('cadastroSenha');
  const confSenha = document.getElementById('confirmarSenha');
  const senhaForca = document.getElementById('senhaForca');
  const senhaFill = document.getElementById('senhaForcaFill');
  const senhaNivel = document.getElementById('senhaForcaNivel');

  senhaInput?.addEventListener('input', function () {
    const senha = this.value;
    if (!senha.length) {
      senhaForca.style.display = 'none';
      return;
    }

    senhaForca.style.display = 'block';
    const forca = verificarForcaSenha(senha);

    senhaFill.style.width = forca.porcentagem + '%';
    senhaFill.style.background = forca.cor;
    senhaNivel.textContent = forca.nivel;
    senhaNivel.style.color = forca.cor;

    const map = {
      tamanho: 'req-tamanho',
      maiuscula: 'req-maiuscula',
      minuscula: 'req-minuscula',
      numero: 'req-numero',
      especial: 'req-especial',
    };
    Object.entries(forca.requisitos).forEach(([key, ok]) => {
      const el = document.getElementById(map[key]);
      if (el) el.classList.toggle('ok', ok);
    });
  });

  ['toggleSenha1', 'toggleSenha2'].forEach((id, idx) => {
    document.getElementById(id)?.addEventListener('click', function () {
      const input = idx === 0 ? senhaInput : confSenha;
      const tipo = input.type === 'password' ? 'text' : 'password';
      input.type = tipo;
      this.innerHTML = tipo === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
  });

  confSenha?.addEventListener('input', function () {
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

  // ---- submit e integração  ---- //
  document
    .getElementById('formCadastro')
    ?.addEventListener('submit', async function (e) {
      e.preventDefault();
      let ok = true;

      // VALIDAÇÕES FINAIS
      const email = document.getElementById('cadastroEmail').value;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('errCadEmail').style.display = 'flex';
        ok = false;
      } else {
        document.getElementById('errCadEmail').style.display = 'none';
      }

      const forca = verificarForcaSenha(senhaInput.value);
      if (forca.atendidos < 4) {
        marcarErro(
          'cadastroSenha',
          'A senha deve atender a todos os requisitos.',
        );
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

      // LOADING STATE
      const btnTexto = document.getElementById('btnCadTexto');
      const btnLoad = document.getElementById('btnCadLoading');
      const btn = document.getElementById('btnCadastrar');
      btnTexto.style.display = 'none';
      btnLoad.style.display = 'flex';
      btn.disabled = true;

      // Montar payload seguindo a rn0023 e rn0026
      const telLimpo = document
        .getElementById('numTel')
        .value.replace(/\D/g, '');
      const isCobIgual = document.getElementById('cobIgual')?.checked;

      // Dentro do evento de submit do cadastro.js
      async function enviarParaBanco() {
        const dados = {
          nome: document.getElementById('nomeCompleto').value,
          email: document.getElementById('cadastroEmail').value,
          cpf: document.getElementById('cpf').value,
          dataNascimento: document.getElementById('dataNasc').value,
          genero: document.getElementById('genero').value,
          senha: document.getElementById('cadastroSenha').value,
          logradouro: document.getElementById('logradouro').value,
          numero: document.getElementById('numEndereco').value,
          cep: document.getElementById('cep').value,
          bairro: document.getElementById('bairro').value,
          cidade: document.getElementById('cidade').value,
          estado: document.getElementById('estado').value,
          telefone_tipo: document.getElementById('tipoTelefone').value,
          telefone_ddd: telLimpo.substring(0, 2),
          telefone_numero: telLimpo.substring(2),
        };

        try {
          const response = await fetch('http://localhost:3000/api/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
          });

          if (response.ok) {
            const data = await response.json();

            if(data.id){
              localStorage.setItem('garage_user_id', data.id);
            }
            alert('Cadastrado com sucesso! Bem vindo a sua Garagem');
            window.location.href = 'perfil.html';
          } else {
            alert('Erro ao cadastrar. Verifique o console.');
            // Restaurar botão em caso de erro
            btnTexto.style.display = 'inline';
            btnLoad.style.display = 'none';
            btn.disabled = false;
          }
        } catch (err) {
          console.error('Erro de conexão:', err);
          alert('O servidor backend não está rodando!');
          // Restaurar botão em caso de erro
          btnTexto.style.display = 'inline';
          btnLoad.style.display = 'none';
          btn.disabled = false;
        }
      }

      await enviarParaBanco();
    });

  // INICIAR
  irParaStep(1);
});
