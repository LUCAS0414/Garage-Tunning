document.addEventListener('DOMContentLoaded', () => {
  carregarComponentes();
});

// CARREGAR NAV
async function carregarComponentes() {
  const navContainer = document.querySelector('#navbar-container');
  if (navContainer) {
    try {
      const response = await fetch('/nav.html');
      const html = await response.text();
      navContainer.innerHTML = html;

      initNavbar();
    } catch (err) {
      console.error('Erro ao carregar a nav:', err);
    }
  }
}

function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');

  // Mostrar link de análises apenas para admin
  const user = JSON.parse(localStorage.getItem('garage_user') || '{}');
  const navAnaliseItem = document.getElementById('navAnaliseItem');
  if (navAnaliseItem && user.isAdmin) {
    navAnaliseItem.style.display = '';
  }

  // SCROLL DINAMICO
  window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
  });

  // MENU HAMBURGUER
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('ativo');
      menu.classList.toggle('ativo');
    });
  }
}
// CARRINHO
const Carrinho = {
  // Dados do carrinho lembrar de conectar com back
  _dados: JSON.parse(localStorage.getItem('garage_carrinho') || '[]'),

  adicionar(produto, quantidade = 1) {
    const existente = this._dados.find((item) => item.id === produto.id);
    if (existente) {
      existente.quantidade += quantidade;
    } else {
      this._dados.push({ ...produto, quantidade });
    }
    this._salvar();
    this._atualizarUI();
    this._mostrarFeedback('Item adicionado ao carrinho!');
  },

  remover(id) {
    this._dados = this._dados.filter((item) => String(item.id) !== String(id));
    this._salvar();
    this._atualizarUI();
  },

  atualizarQuantidade(id, quantidade) {
    const item = this._dados.find((item) => String(item.id) === String(id));
    if (item) {
      item.quantidade = Math.max(1, quantidade);
      this._salvar();
    }
  },

  limpar() {
    this._dados = [];
    this._salvar();
    this._atualizarUI();
  },

  get totalItens() {
    return this._dados.reduce((acc, item) => acc + item.quantidade, 0);
  },

  get totalValor() {
    return this._dados.reduce(
      (acc, item) => acc + item.preco * item.quantidade,
      0,
    );
  },

  get itens() {
    return this._dados;
  },

  _salvar() {
    localStorage.setItem('garage_carrinho', JSON.stringify(this._dados));
  },

  _atualizarUI() {
    const badge = document.getElementById('carrinhoCount');
    if (badge) {
      badge.textContent = this.totalItens;
      badge.style.display = this.totalItens > 0 ? 'flex' : 'none';
    }
    // ATUALIZA PAGINAS
    window.dispatchEvent(
      new CustomEvent('carrinhoAtualizado', {
        detail: { itens: this._dados, total: this.totalValor },
      }),
    );
  },

  _mostrarFeedback(mensagem) {
    const toast = document.createElement('div');
    toast.className = 'toast-feedback';
    toast.innerHTML = `<span>✓</span> ${mensagem}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('ativo'), 10);
    setTimeout(() => {
      toast.classList.remove('ativo');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  },

  inicializar() {
    this._atualizarUI();
  },
};

// INICIALIZAR CARRINHO
document.addEventListener('DOMContentLoaded', () => {
  Carrinho.inicializar();
});

// CARROSSEL
class Carrossel {
  constructor(wrapperSelector, opcoes = {}) {
    this.wrapper = document.querySelector(wrapperSelector);
    if (!this.wrapper) return;

    this.track = this.wrapper.querySelector('.carrossel-track');
    this.btnPrev = this.wrapper.querySelector('.carrossel-btn--prev');
    this.btnNext = this.wrapper.querySelector('.carrossel-btn--next');

    this.opcoes = {
      itensPorVista: opcoes.itensPorVista || 4,
      autoPlay: opcoes.autoPlay !== false,
      intervalo: opcoes.intervalo || 4000,
      responsivo: opcoes.responsivo || {
        768: 2,
        480: 1,
      },
    };

    this.indiceAtual = 0;
    this.totalItens = this.track ? this.track.children.length : 0;
    this._autoPlayTimer = null;

    this._init();
  }

  _getItensPorVista() {
    const w = window.innerWidth;
    const breakpoints = Object.entries(this.opcoes.responsivo).sort(
      (a, b) => parseInt(a[0]) - parseInt(b[0]),
    );

    for (const [bp, qtd] of breakpoints) {
      if (w <= parseInt(bp)) return qtd;
    }
    return this.opcoes.itensPorVista;
  }

  _maxIndice() {
    return Math.max(0, this.totalItens - this._getItensPorVista());
  }

  _navegar(direcao) {
    this.indiceAtual += direcao;

    // LOOP
    if (this.indiceAtual > this._maxIndice()) {
      this.indiceAtual = 0;
    } else if (this.indiceAtual < 0) {
      this.indiceAtual = this._maxIndice();
    }

    this._atualizar();
  }

  _atualizar() {
    if (!this.track || !this.track.children.length) return;

    const itemWidth = this.track.children[0].offsetWidth;
    const gap = 24;

    this.track.style.transform = `translateX(-${this.indiceAtual * (itemWidth + gap)}px)`;
  }

  _init() {
    // CONTROLES
    this.btnPrev?.addEventListener('click', () => {
      this._navegar(-1);
      this._resetAutoPlay();
    });

    this.btnNext?.addEventListener('click', () => {
      this._navegar(1);
      this._resetAutoPlay();
    });

    // Touch e swip para celular
    let startX = 0;
    this.track?.addEventListener(
      'touchstart',
      (e) => {
        startX = e.touches[0].clientX;
      },
      { passive: true },
    );

    this.track?.addEventListener(
      'touchend',
      (e) => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
          this._navegar(diff > 0 ? 1 : -1);
          this._resetAutoPlay();
        }
      },
      { passive: true },
    );

    if (this.opcoes.autoPlay) this._iniciarAutoPlay();

    window.addEventListener('resize', () => {
      this.indiceAtual = Math.min(this.indiceAtual, this._maxIndice());
      this._atualizar();
    });
  }

  _iniciarAutoPlay() {
    if (this._autoPlayTimer) clearInterval(this._autoPlayTimer);
    this._autoPlayTimer = setInterval(() => {
      this._navegar(1);
    }, this.opcoes.intervalo);
  }

  _resetAutoPlay() {
    if (this.opcoes.autoPlay) {
      this._iniciarAutoPlay();
    }
  }
}

// TABS
function initTabs(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const botoes = container.querySelectorAll('.tab-btn');
  const paineis = container.querySelectorAll('.tab-painel');

  botoes.forEach((btn) => {
    btn.addEventListener('click', () => {
      const alvo = btn.getAttribute('data-tab');

      botoes.forEach((b) => b.classList.remove('ativo'));
      paineis.forEach((p) => p.classList.remove('ativo'));

      btn.classList.add('ativo');
      const painel = container.querySelector(`[data-tab-painel="${alvo}"]`);
      if (painel) painel.classList.add('ativo');
    });
  });

  // ATIVAR PRIMEIRO
  botoes[0]?.click();
}

// MODAL
function abrirModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('ativo');
    document.body.style.overflow = 'hidden';
  }
}

function fecharModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('ativo');
    document.body.style.overflow = '';
  }
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('ativo');
    document.body.style.overflow = '';
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.ativo').forEach((m) => {
      m.classList.remove('ativo');
      document.body.style.overflow = '';
    });
  }
});

// UTILITARIOS

function formatarPreco(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

function formatarData(data) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(data));
}

function gerarCodigo(prefixo = 'GT') {
  return `${prefixo}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  if (rev !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  return rev === parseInt(cpf[10]);
}

function mascaraCPF(input) {
 input.addEventListener('input', function() {
  let v = this.value.replace(/\D/g, '');
 v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  this.value = v;
});
}

function mascaraCEP(input) {
  input.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    this.value = v;
  });
}

function mascaraTelefone(input) {
  input.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/^(\d{2})(\d)/, '($1) $2');
    v = v.replace(/(\d{4,5})(\d{4})$/, '$1-$2');
    this.value = v;
  });
}

function mascaraCartao(input) {
  input.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '');
    v = v.replace(/(\d{4})(?=\d)/g, '$1 ');
    this.value = v.substring(0, 19);
  });
}

function verificarForcaSenha(senha) {
  const requisitos = {
    tamanho: senha.length >= 8,
    maiuscula: /[A-Z]/.test(senha),
    minuscula: /[a-z]/.test(senha),
    numero: /\d/.test(senha),
    especial: /[!@#$%^&*(),.?":{}|<>]/.test(senha),
  };

  const atendidos = Object.values(requisitos).filter(Boolean).length;
  let nivel, cor;

  if (atendidos <= 2) {
    nivel = 'Fraca';
    cor = '#ff3344';
  } else if (atendidos <= 3) {
    nivel = 'Regular';
    cor = '#ffbb00';
  } else if (atendidos === 4) {
    nivel = 'Boa';
    cor = '#00ccff';
  } else {
    nivel = 'Forte';
    cor = '#00ff88';
  }

  return {
    requisitos,
    atendidos,
    nivel,
    cor,
    porcentagem: (atendidos / 5) * 100,
  };
}

// HEAD DINAMICO
const toastStyle = document.createElement('style');
toastStyle.textContent = `
  .toast-feedback {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--cor-fundo-card);
    border: 1px solid var(--cor-primaria);
    border-radius: 4px;
    padding: 0.75rem 1.25rem;
    color: var(--cor-primaria);
    font-family: var(--fonte-destaque);
    font-size: 0.9rem;
    font-weight: 600;
    box-shadow: var(--sombra-neon-verde);
    transform: translateY(100px);
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 9999;
  }
  .toast-feedback.ativo {
    transform: translateY(0);
    opacity: 1;
  }
`;
document.head.appendChild(toastStyle);