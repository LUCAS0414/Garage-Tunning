document.addEventListener('DOMContentLoaded', () => {
  carregarComponentes();
});

//carregar nav
async function carregarComponentes() {
  const navContainer = document.querySelector('#navbar-container');
  if (navContainer) {
    try {
      const response = await fetch('/html/nav.html');
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

  //Scroll dinamico
  window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
  });

  //Menu hamburguer
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('ativo');
      menu.classList.toggle('ativo');
    });
  }
}
//Carrinho
const Carrinho = {
  //dados do carrinho lembrar de conectar com back
  _dados: JSON.parse(localStorage.getItem('garage_carrinho') || '[]'),

  /**
   * Adiciona item ao carrinho
   * @param {Object} produto - { id, nome, preco, imagem, categoria }
   * @param {number} quantidade
   */
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
    this._dados = this._dados.filter((item) => item.id !== id);
    this._salvar();
    this._atualizarUI();
  },

  atualizarQuantidade(id, quantidade) {
    const item = this._dados.find((item) => item.id === id);
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
    //Atualiza paginas
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

//Inicializar carrinho
document.addEventListener('DOMContentLoaded', () => {
  Carrinho.inicializar();
});

//Carrossel
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

    //loop
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
    // Controles
    this.btnPrev?.addEventListener('click', () => {
      this._navegar(-1);
      this._resetAutoPlay();
    });

    this.btnNext?.addEventListener('click', () => {
      this._navegar(1);
      this._resetAutoPlay();
    });

    //touch e swip para celular
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

//Tabs
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

  // Ativar primeiro
  botoes[0]?.click();
}

//Modal
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

//Utilitarios

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

//head dinamico
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

// DADOS MOCKADOS
const DadosMock = {
  produtos: [
    //JDM
    {
      id: 'p015',
      nome: 'Nissan Skyline GT-R R34 V-Spec II',
      codigo: 'JD-SK015',
      preco: 950000,
      precoOriginal: 1100000,
      categoria: 'JDM',
      estoque: 1,
      novo: false,
    },
    {
      id: 'p016',
      nome: 'Toyota Supra A80 Targa Top',
      codigo: 'JD-SU016',
      preco: 580000,
      precoOriginal: null,
      categoria: 'JDM',
      estoque: 2,
      novo: false,
    },
    {
      id: 'p017',
      nome: 'Mazda RX-7 FD3S Spirit R',
      codigo: 'JD-RX017',
      preco: 420000,
      precoOriginal: 450000,
      categoria: 'JDM',
      estoque: 3,
      novo: false,
    },
    {
      id: 'p018',
      nome: 'Honda NSX-R NA2',
      codigo: 'JD-NS018',
      preco: 1200000,
      precoOriginal: null,
      categoria: 'JDM',
      estoque: 1,
      novo: false,
    },
    {
      id: 'p019',
      nome: 'Mitsubishi Lancer Evo VI Tommi Mäkinen',
      codigo: 'JD-EV019',
      preco: 350000,
      precoOriginal: 380000,
      categoria: 'JDM',
      estoque: 2,
      novo: false,
    },
    {
      id: 'p020',
      nome: 'Subaru Impreza 22B STi',
      codigo: 'JD-IM020',
      preco: 890000,
      precoOriginal: null,
      categoria: 'JDM',
      estoque: 1,
      novo: false,
    },
    {
      id: 'p021',
      nome: 'Nissan Silvia S15 Spec-R',
      codigo: 'JD-SI021',
      preco: 220000,
      precoOriginal: 245000,
      categoria: 'JDM',
      estoque: 4,
      novo: false,
    },
    {
      id: 'p022',
      nome: 'Toyota AE86 Trueno GT-Apex',
      codigo: 'JD-AE022',
      preco: 180000,
      precoOriginal: null,
      categoria: 'JDM',
      estoque: 2,
      novo: false,
    },
    {
      id: 'p023',
      nome: 'Mazda MX-5 Miata NA Turbo',
      codigo: 'JD-MX023',
      preco: 95000,
      precoOriginal: 110000,
      categoria: 'JDM',
      estoque: 6,
      novo: false,
    },
    {
      id: 'p024',
      nome: 'Honda Civic Type R EK9',
      codigo: 'JD-CV024',
      preco: 155000,
      precoOriginal: null,
      categoria: 'JDM',
      estoque: 3,
      novo: true,
    },
    // AMERICANOS
    {
      id: 'p025',
      nome: 'Ford Mustang Shelby GT500 1967',
      codigo: 'US-MU025',
      preco: 1800000,
      precoOriginal: 2100000,
      categoria: 'Americanos',
      estoque: 1,
      novo: false,
    },
    {
      id: 'p026',
      nome: 'Dodge Challenger SRT Demon',
      codigo: 'US-CH026',
      preco: 850000,
      precoOriginal: null,
      categoria: 'Americanos',
      estoque: 2,
      novo: true,
    },
    {
      id: 'p027',
      nome: 'Chevrolet Corvette C8 Z06',
      codigo: 'US-CO027',
      preco: 1100000,
      precoOriginal: 1250000,
      categoria: 'Americanos',
      estoque: 3,
      novo: true,
    },
    {
      id: 'p028',
      nome: 'Dodge Viper ACR 1:28 Edition',
      codigo: 'US-VI028',
      preco: 1400000,
      precoOriginal: null,
      categoria: 'Americanos',
      estoque: 1,
      novo: false,
    },
    {
      id: 'p029',
      nome: 'Plymouth Hemi Cuda 1971',
      codigo: 'US-PL029',
      preco: 2500000,
      precoOriginal: 2800000,
      categoria: 'Americanos',
      estoque: 1,
      novo: false,
    },
    {
      id: 'p030',
      nome: 'Ford GT Heritage Edition',
      codigo: 'US-GT030',
      preco: 5500000,
      precoOriginal: null,
      categoria: 'Americanos',
      estoque: 1,
      novo: true,
    },
    {
      id: 'p031',
      nome: 'Chevrolet Camaro Yenko S/C',
      codigo: 'US-CA031',
      preco: 450000,
      precoOriginal: 490000,
      categoria: 'Americanos',
      estoque: 2,
      novo: false,
    },
    {
      id: 'p032',
      nome: 'Shelby Cobra 427 S/C',
      codigo: 'US-SB032',
      preco: 3200000,
      precoOriginal: null,
      categoria: 'Americanos',
      estoque: 1,
      novo: false,
    },
    {
      id: 'p033',
      nome: 'Buick GNX 1987',
      codigo: 'US-BU033',
      preco: 720000,
      precoOriginal: 800000,
      categoria: 'Americanos',
      estoque: 2,
      novo: false,
    },
    {
      id: 'p034',
      nome: 'Pontiac Firebird Trans Am SD-455',
      codigo: 'US-PO034',
      preco: 380000,
      precoOriginal: null,
      categoria: 'Americanos',
      estoque: 1,
      novo: false,
    },
    //ITALIANOS
    {
      id: 'p035',
      nome: 'Ferrari F40 Rosso Corsa',
      codigo: 'IT-FE035',
      preco: 15000000,
      precoOriginal: 17500000,
      categoria: 'Italianos',
      estoque: 1,
      novo: false,
    },
    {
      id: 'p036',
      nome: 'Lamborghini Aventador SVJ',
      codigo: 'IT-LA036',
      preco: 6200000,
      precoOriginal: null,
      categoria: 'Italianos',
      estoque: 2,
      novo: true,
    },
    {
      id: 'p037',
      nome: 'Pagani Zonda Cinque',
      codigo: 'IT-PA037',
      preco: 45000000,
      precoOriginal: null,
      categoria: 'Italianos',
      estoque: 1,
      novo: false,
    },
    {
      id: 'p038',
      nome: 'Alfa Romeo Giulia GTA',
      codigo: 'IT-AL038',
      preco: 1200000,
      precoOriginal: 1400000,
      categoria: 'Italianos',
      estoque: 3,
      novo: true,
    },
    {
      id: 'p039',
      nome: 'Lancia Delta HF Integrale Evo II',
      codigo: 'IT-LN039',
      preco: 750000,
      precoOriginal: null,
      categoria: 'Italianos',
      estoque: 2,
      novo: false,
    },
    {
      id: 'p040',
      nome: 'Maserati MC20 Cielo',
      codigo: 'IT-MA040',
      preco: 2800000,
      precoOriginal: 3100000,
      categoria: 'Italianos',
      estoque: 4,
      novo: true,
    },
    {
      id: 'p041',
      nome: 'Ferrari Enzo',
      codigo: 'IT-FE041',
      preco: 22000000,
      precoOriginal: null,
      categoria: 'Italianos',
      estoque: 1,
      novo: false,
    },
    {
      id: 'p042',
      nome: 'Lamborghini Miura P400SV',
      codigo: 'IT-LA042',
      preco: 18000000,
      precoOriginal: 20000000,
      categoria: 'Italianos',
      estoque: 1,
      novo: false,
    },
    {
      id: 'p043',
      nome: 'De Tomaso Pantera GTS',
      codigo: 'IT-DT043',
      preco: 950000,
      precoOriginal: null,
      categoria: 'Italianos',
      estoque: 2,
      novo: false,
    },
    {
      id: 'p044',
      nome: 'Ferrari Testarossa 512 TR',
      codigo: 'IT-FE044',
      preco: 1600000,
      precoOriginal: 1850000,
      categoria: 'Italianos',
      estoque: 1,
      novo: false,
    },
    //ALEMÃES
    {
      id: 'p045',
      nome: 'BMW M3 E30 Sport Evolution',
      codigo: 'AL-BM045',
      preco: 850000,
      precoOriginal: 950000,
      categoria: 'Alemães',
      estoque: 1,
      novo: false,
    },
    {
      id: 'p046',
      nome: 'Porsche 911 GT3 RS (992)',
      codigo: 'AL-PO046',
      preco: 2400000,
      precoOriginal: null,
      categoria: 'Alemães',
      estoque: 3,
      novo: true,
    },
    {
      id: 'p047',
      nome: 'Mercedes-Benz 190E 2.5-16 Evo II',
      codigo: 'AL-ME047',
      preco: 1950000,
      precoOriginal: 2200000,
      categoria: 'Alemães',
      estoque: 1,
      novo: false,
    },
    {
      id: 'p048',
      nome: 'Audi RS6 Avant Performance',
      codigo: 'AL-AU048',
      preco: 1150000,
      precoOriginal: null,
      categoria: 'Alemães',
      estoque: 5,
      novo: true,
    },
    {
      id: 'p049',
      nome: 'Volkswagen Golf R 20 Years',
      codigo: 'AL-VW049',
      preco: 380000,
      precoOriginal: 410000,
      categoria: 'Alemães',
      estoque: 8,
      novo: true,
    },
    {
      id: 'p050',
      nome: 'BMW M5 CS',
      codigo: 'AL-BM050',
      preco: 1350000,
      precoOriginal: null,
      categoria: 'Alemães',
      estoque: 2,
      novo: true,
    },
    {
      id: 'p051',
      nome: 'Porsche 959 Komfort',
      codigo: 'AL-PO051',
      preco: 12000000,
      precoOriginal: 14000000,
      categoria: 'Alemães',
      estoque: 1,
      novo: false,
    },
    {
      id: 'p052',
      nome: 'Audi Quattro S1 Group B',
      codigo: 'AL-AU052',
      preco: 4500000,
      precoOriginal: null,
      categoria: 'Alemães',
      estoque: 1,
      novo: false,
    },
    {
      id: 'p053',
      nome: 'Mercedes-AMG GT Black Series',
      codigo: 'AL-ME053',
      preco: 4800000,
      precoOriginal: 5200000,
      categoria: 'Alemães',
      estoque: 2,
      novo: true,
    },
    {
      id: 'p054',
      nome: 'BMW M1 Procar',
      codigo: 'AL-BM054',
      preco: 3900000,
      precoOriginal: null,
      categoria: 'Alemães',
      estoque: 1,
      novo: false,
    },
    //PEÇAS
    {
      id: 'p055',
      nome: 'Banco Recaro Sportster CS Leather',
      codigo: 'PC-RE055',
      preco: 12500,
      precoOriginal: 14000,
      categoria: 'Peças',
      estoque: 10,
      novo: true,
    },
    {
      id: 'p056',
      nome: 'Escapamento Akrapovič Titanium RS6',
      codigo: 'PC-AK056',
      preco: 45000,
      precoOriginal: null,
      categoria: 'Peças',
      estoque: 4,
      novo: true,
    },
    {
      id: 'p057',
      nome: 'Gaiola Roll Cage FIA Approved',
      codigo: 'PC-RC057',
      preco: 8500,
      precoOriginal: 9800,
      categoria: 'Peças',
      estoque: 5,
      novo: true,
    },
    {
      id: 'p058',
      nome: 'Intercooler Mishimoto Front Mount',
      codigo: 'PC-MI058',
      preco: 4200,
      precoOriginal: null,
      categoria: 'Peças',
      estoque: 15,
      novo: true,
    },
    {
      id: 'p059',
      nome: 'Short Shifter Billet Motorsport',
      codigo: 'PC-SS059',
      preco: 1850,
      precoOriginal: 2100,
      categoria: 'Peças',
      estoque: 20,
      novo: true,
    },
    {
      id: 'p060',
      nome: 'Faróis LED AlphaRex Nova-Series',
      codigo: 'PC-AL060',
      preco: 6400,
      precoOriginal: null,
      categoria: 'Peças',
      estoque: 12,
      novo: true,
    },
    {
      id: 'p061',
      nome: 'Capô em Fibra de Carbono Seibon',
      codigo: 'PC-SE061',
      preco: 11200,
      precoOriginal: 13500,
      categoria: 'Peças',
      estoque: 6,
      novo: true,
    },
    {
      id: 'p062',
      nome: 'Discos de Freio Cerâmica-Carbono',
      codigo: 'PC-CB062',
      preco: 65000,
      precoOriginal: null,
      categoria: 'Peças',
      estoque: 2,
      novo: true,
    },
    {
      id: 'p063',
      nome: 'Painel Digital Haltech IC-7',
      codigo: 'PC-HA063',
      preco: 8900,
      precoOriginal: 9600,
      categoria: 'Peças',
      estoque: 8,
      novo: true,
    },
    {
      id: 'p064',
      nome: 'Câmbio Sequencial Holinger 6-Speed',
      codigo: 'PC-HO064',
      preco: 145000,
      precoOriginal: null,
      categoria: 'Peças',
      estoque: 1,
      novo: true,
    },
  ],

  categorias: [
    {
      id: 'jdm',
      nome: 'JDM',
      descricao:
        'Japanese Domestic Market - Peças e acessórios originais do Japão',
      emoji: 'JP',
      cor: '#d400ff',
    },
    {
      id: 'americanos',
      nome: 'Americanos',
      descricao: 'Muscle cars e performance made in USA',
      emoji: 'US',
      cor: '#ff6600',
    },
    {
      id: 'italianos',
      nome: 'Italianos',
      descricao: 'Elegância e performance da peninsula itálica',
      emoji: 'IT',
      cor: '#FF3300',
    },
    {
      id: 'alemaes',
      nome: 'Alemães',
      descricao: 'Engenharia de precisão germânica',
      emoji: 'AL',
      cor: '#00ccff',
    },
    {
      id: 'pecas',
      nome: 'Peças',
      descricao: 'Estilo e Velocidade',
      emoji: 'PC',
      cor: '#ffcc00',
    },
  ],
};
