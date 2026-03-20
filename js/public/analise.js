
document.addEventListener('DOMContentLoaded', function() {

  // ---- DADOS MOCKADOS ---- //
  const DADOS = {
    '7d': {
      labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'],
      receita: [1890, 3450, 2100, 5890, 4200, 7800, 3200],
      pedidos: [2, 4, 3, 6, 5, 8, 4],
      totalReceita: 28530, totalPedidos: 32, ticket: 892,
    },
    '30d': {
      labels: ['S1', 'S2', 'S3', 'S4'],
      receita: [24500, 31200, 28700, 35100],
      pedidos: [28, 36, 32, 40],
      totalReceita: 119500, totalPedidos: 136, ticket: 879,
    },
    '90d': {
      labels: ['Out', 'Nov', 'Dez'],
      receita: [89000, 112000, 98500],
      pedidos: [98, 128, 110],
      totalReceita: 299500, totalPedidos: 336, ticket: 892,
    },
    '12m': {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      receita: [45000, 52000, 48000, 61000, 58000, 72000, 68000, 75000, 69000, 89000, 112000, 98500],
      pedidos: [52, 60, 55, 70, 65, 82, 78, 88, 80, 98, 128, 110],
      totalReceita: 837500, totalPedidos: 966, ticket: 867,
    },
  };

  const CATEGORIAS = [
    { nome: 'JDM', cor: '#00ff88', valor: 142000, pct: 45 },
    { nome: 'Americanos', cor: '#ff6600', valor: 98000, pct: 31 },
    { nome: 'Italianos', cor: '#00ccff', valor: 54000, pct: 17 },
    { nome: 'Alemães', cor: '#ffbb00', valor: 22000, pct: 7 },
  ];

  const STATUS_DADOS = {
    'Entregue': { valor: 286, cor: '#00cc64' },
    'Em Transporte': { valor: 48, cor: '#00ccff' },
    'Aprovada': { valor: 32, cor: '#00ff88' },
    'Processando': { valor: 18, cor: '#ffbb00' },
    'Reprovada': { valor: 12, cor: '#ff3344' },
    'Troca': { valor: 8, cor: '#ff6600' },
  };

  const TOP_PRODUTOS = [
    { nome: 'Rodas Rays 57DR', cat: 'JDM', val: 89000 },
    { nome: 'Kit Freio Brembo', cat: 'Italianos', val: 77400 },
    { nome: 'Kit Turbo T3/T4', cat: 'Americanos', val: 65880 },
    { nome: 'Suspensão Coilover', cat: 'JDM', val: 54460 },
    { nome: 'NOS System', cat: 'Americanos', val: 40800 },
  ];

  const COMPARATIVO = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    series: [
      { nome: 'JDM', cor: '#00ff88', dados: [18000, 22000, 19000, 26000, 24000, 31000, 29000, 33000, 28000, 38000, 49000, 41000] },
      { nome: 'Americanos', cor: '#ff6600', dados: [14000, 16000, 15000, 19000, 18000, 22000, 21000, 24000, 22000, 28000, 35000, 30000] },
      { nome: 'Italianos', cor: '#00ccff', dados: [8000, 9000, 9500, 11000, 10500, 13000, 12000, 13500, 12500, 15000, 19000, 17000] },
      { nome: 'Alemães', cor: '#ffbb00', dados: [5000, 5000, 4500, 5000, 5500, 6000, 6000, 4500, 6500, 8000, 9000, 10500] },
    ],
  };

  // ---- HELPERS DE CANVAS ---- //
  function darkenColor(hex, amount) {
    return hex; // simplificado
  }

  function drawLineChart(canvas, labels, series, opcoes = {}) {
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 800;
    const H = canvas.offsetHeight || 300;
    canvas.width = W;
    canvas.height = H;

    const pad = { top: 30, right: 20, bottom: 50, left: 70 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    ctx.clearRect(0, 0, W, H);

    // Calcular max
    const allValues = series.flatMap(s => s.dados);
    const maxVal = Math.max(...allValues) * 1.1;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
      // Labels Y
      const val = maxVal * (1 - i / 5);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val >= 1000 ? 'R$' + (val/1000).toFixed(0) + 'k' : val.toFixed(0), pad.left - 6, y + 4);
    }

    // Labels X
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    labels.forEach((label, i) => {
      const x = pad.left + (chartW / (labels.length - 1)) * i;
      ctx.fillText(label, x, H - 15);
    });

    // Linhas das séries
    series.forEach(s => {
      const pontos = s.dados.map((v, i) => ({
        x: pad.left + (chartW / (labels.length - 1)) * i,
        y: pad.top + chartH - (v / maxVal) * chartH,
      }));

      // Área preenchida
      ctx.beginPath();
      ctx.moveTo(pontos[0].x, pad.top + chartH);
      pontos.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pontos[pontos.length - 1].x, pad.top + chartH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
      grad.addColorStop(0, s.cor + '33');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fill();

      // Linha
      ctx.beginPath();
      ctx.strokeStyle = s.cor;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      pontos.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();

      // Pontos
      pontos.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = s.cor;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    });
  }

  function drawBarChart(canvas, labels, valores, cores) {
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 400;
    const H = 280;
    canvas.width = W;
    canvas.height = H;

    const pad = { top: 20, right: 20, bottom: 60, left: 50 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const maxVal = Math.max(...valores) * 1.1;
    const barW = (chartW / labels.length) * 0.6;
    const gap = (chartW / labels.length) * 0.4;

    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
    }

    labels.forEach((label, i) => {
      const x = pad.left + (chartW / labels.length) * i + gap / 2;
      const barH = (valores[i] / maxVal) * chartH;
      const y = pad.top + chartH - barH;

      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, cores[i]);
      grad.addColorStop(1, cores[i] + '88');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [3, 3, 0, 0]);
      ctx.fill();

      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + barW / 2, H - 10);

      // Valor
      ctx.fillStyle = cores[i];
      ctx.font = '10px monospace';
      ctx.fillText(valores[i], x + barW / 2, y - 6);
    });
  }

  // ---- RENDERIZAR TUDO ---- //
  function renderizar(periodo) {
    const dados = DADOS[periodo] || DADOS['7d'];

    // KPIs
    document.getElementById('kpiReceita').textContent = 'R$ ' + dados.totalReceita.toLocaleString('pt-BR');
    document.getElementById('kpiPedidos').textContent = dados.totalPedidos;
    document.getElementById('kpiTicket').textContent = 'R$ ' + dados.ticket.toLocaleString('pt-BR');
    document.getElementById('kpiTrocas').textContent = '8';

    // Gráfico de vendas
    const canvasVendas = document.getElementById('graficoVendas');
    if (canvasVendas) {
      setTimeout(() => {
        drawLineChart(canvasVendas, dados.labels, [
          { nome: 'Receita', cor: '#00ff88', dados: dados.receita },
          { nome: 'Pedidos', cor: '#00ccff', dados: dados.pedidos.map(v => v * 100) },
        ]);
      }, 50);
    }

    // Gráfico categorias (barras)
    const canvasCat = document.getElementById('graficoCategorias');
    if (canvasCat) {
      setTimeout(() => {
        drawBarChart(canvasCat,
          CATEGORIAS.map(c => c.nome),
          CATEGORIAS.map(c => c.valor / 1000),
          CATEGORIAS.map(c => c.cor)
        );
      }, 50);
    }

    // Legenda categorias
    const catLegenda = document.getElementById('graficoCatLegenda');
    if (catLegenda) {
      catLegenda.innerHTML = CATEGORIAS.map(c => `
        <div class="cat-legenda-item">
          <div class="cat-legenda-cor" style="background:${c.cor}"></div>
          <span class="cat-legenda-nome">${c.nome}</span>
          <div class="cat-legenda-barra"><div class="cat-legenda-barra-fill" style="width:${c.pct}%;background:${c.cor}"></div></div>
          <span class="cat-legenda-val">R$ ${(c.valor/1000).toFixed(0)}k</span>
          <span class="cat-legenda-pct">${c.pct}%</span>
        </div>
      `).join('');
    }

    // Gráfico status
    const canvasStatus = document.getElementById('graficoStatus');
    if (canvasStatus) {
      const entries = Object.entries(STATUS_DADOS);
      setTimeout(() => {
        drawBarChart(canvasStatus,
          entries.map(([k]) => k.length > 6 ? k.substring(0,6)+'.' : k),
          entries.map(([, v]) => v.valor),
          entries.map(([, v]) => v.cor)
        );
      }, 50);
    }

    // Ranking produtos
    const ranking = document.getElementById('rankingProdutos');
    if (ranking) {
      ranking.innerHTML = TOP_PRODUTOS.map((p, i) => `
        <div class="ranking-item">
          <span class="ranking-pos ranking-pos-${i+1}">${i+1}</span>
          <div class="ranking-info">
            <div class="ranking-nome">${p.nome}</div>
            <div class="ranking-cat">${p.cat}</div>
          </div>
          <span class="ranking-val">R$ ${(p.val/1000).toFixed(0)}k</span>
        </div>
      `).join('');
    }

    // Gráfico comparativo
    const canvasComp = document.getElementById('graficoComparativo');
    if (canvasComp) {
      setTimeout(() => {
        drawLineChart(canvasComp, COMPARATIVO.labels, COMPARATIVO.series);
      }, 50);
    }
  }

  // ---- EVENTOS PERÍODO ---- //
  let periodoAtivo = '7d';
  document.querySelectorAll('.periodo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.periodo-btn').forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      periodoAtivo = btn.dataset.periodo;
      renderizar(periodoAtivo);
    });
  });

  // Rerender no resize
  window.addEventListener('resize', () => renderizar(periodoAtivo));

  // Iniciar
  renderizar(periodoAtivo);

});
