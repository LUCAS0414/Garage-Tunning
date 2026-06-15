(function() {
  const user = JSON.parse(localStorage.getItem('garage_user') || '{}');
  if (!user.logado || !user.isAdmin) {
    window.location.replace('login.html');
  }
})();

document.addEventListener('DOMContentLoaded', async function() {

  // CORES
  const COR_CAT = {
    'JDM':        '#00ff88',
    'Americanos': '#ff6600',
    'Italianos':  '#00ccff',
    'Alemães':    '#ffbb00',
    'Peças':      '#cc88ff',
  };

  let categoriasAtivas = new Set(Object.keys(COR_CAT));
  let dadosGraficoComparativo = { labels: [], linhasPorCategoria: [] };

  function initFiltrosCategoria() {
    const container = document.getElementById('filtrosCategoria');
    if (!container) return;
    container.innerHTML = Object.keys(COR_CAT).map(cat => `
      <label style="cursor: pointer; display: flex; align-items: center; gap: 5px; font-size: 0.9em; color: #ccc;">
        <input type="checkbox" class="filtro-cat-cb" value="${cat}" checked>
        <span style="color: ${COR_CAT[cat]}; text-shadow: 0 0 5px ${COR_CAT[cat]}88;">●</span> ${cat}
      </label>
    `).join('');

    container.querySelectorAll('.filtro-cat-cb').forEach(cb => {
      cb.addEventListener('change', (e) => {
        if (e.target.checked) categoriasAtivas.add(e.target.value);
        else categoriasAtivas.delete(e.target.value);
        desenharGraficoComparativo();
      });
    });
  }

  function desenharGraficoComparativo() {
    const canvasComp = document.getElementById('graficoComparativo');
    if (!canvasComp) return;

    const labels = dadosGraficoComparativo.labels;
    const linhasPorCat = dadosGraficoComparativo.linhasPorCategoria;
    
    if (!labels.length || !linhasPorCat.length) {
      setTimeout(() => drawLineChart(canvasComp, [], []), 50);
      return;
    }

    const seriesComp = [];
    Object.keys(COR_CAT).forEach(cat => {
      if (categoriasAtivas.has(cat)) {
        const dados = labels.map(label => {
          const point = linhasPorCat.find(l => l.categoria === cat && (l.periodo ? String(l.periodo).substring(5) : '') === label);
          return point ? parseInt(point.unidades || 0) : 0;
        });
        
        seriesComp.push({
          nome: cat,
          cor: COR_CAT[cat],
          dados: dados
        });
      }
    });

    setTimeout(() => drawLineChart(canvasComp, labels, seriesComp), 50);
  }

  const COR_STATUS = {
    'ENTREGUE':         '#00cc64',
    'EM TRANSPORTE':    '#00ccff',
    'APROVADO':         '#00ff88',
    'EM PROCESSAMENTO': '#ffbb00',
    'REPROVADO':        '#ff3344',
    'EM TROCA':         '#ff6600',
    'TROCA AUTORIZADA': '#cc88ff',
    'TROCADO':          '#888888',
  };

  // TOAST
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast-feedback';
    t.innerHTML = `<span>ℹ</span> ${msg}`;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('ativo'), 10);
    setTimeout(() => { t.classList.remove('ativo'); setTimeout(() => t.remove(), 300); }, 3000);
  }

  // CANVAS
  function drawLineChart(canvas, labels, series) {
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 800;
    const H = canvas.offsetHeight || 300;
    canvas.width  = W;
    canvas.height = H;

    const pad = { top: 30, right: 20, bottom: 50, left: 70 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    ctx.clearRect(0, 0, W, H);

    if (!labels.length || !series.length) {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados no período', W / 2, H / 2);
      return;
    }

    const allValues = series.flatMap(s => s.dados);
    const maxVal = Math.max(...allValues, 1) * 1.15;

    // GRID
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
      const val = maxVal * (1 - i / 5);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val >= 1000 ? 'R$' + (val / 1000).toFixed(0) + 'k' : val.toFixed(0), pad.left - 6, y + 4);
    }

    // LABELS X
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    const step = labels.length > 1 ? chartW / (labels.length - 1) : chartW;
    labels.forEach((label, i) => {
      const x = pad.left + step * i;
      ctx.fillText(label, x, H - 15);
    });

    // SÉRIES
    series.forEach(s => {
      const pontos = s.dados.map((v, i) => ({
        x: pad.left + (labels.length > 1 ? (chartW / (labels.length - 1)) * i : chartW / 2),
        y: pad.top + chartH - (v / maxVal) * chartH,
      }));

      // ÁREA
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

      // LINHA
      ctx.beginPath();
      ctx.strokeStyle = s.cor;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      pontos.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();

      // PONTOS
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

  function drawBarChart(canvas, labels, valores, cores, H = 280) {
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 400;
    canvas.width  = W;
    canvas.height = H;

    const pad = { top: 20, right: 20, bottom: 60, left: 50 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const maxVal = Math.max(...valores, 1) * 1.15;
    const barW = (chartW / labels.length) * 0.6;
    const gap  = (chartW / labels.length) * 0.4;

    ctx.clearRect(0, 0, W, H);

    if (!labels.length) {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados', W / 2, H / 2);
      return;
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
    }

    labels.forEach((label, i) => {
      const x    = pad.left + (chartW / labels.length) * i + gap / 2;
      const barH = (valores[i] / maxVal) * chartH;
      const y    = pad.top + chartH - barH;

      const gr = ctx.createLinearGradient(0, y, 0, y + barH);
      gr.addColorStop(0, cores[i]);
      gr.addColorStop(1, cores[i] + '88');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [3, 3, 0, 0]);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      const labelCurto = label.length > 8 ? label.substring(0, 7) + '.' : label;
      ctx.fillText(labelCurto, x + barW / 2, H - 10);

      if (valores[i] > 0) {
        ctx.fillStyle = cores[i];
        ctx.font = '9px monospace';
        ctx.fillText(valores[i] >= 1000 ? (valores[i] / 1000).toFixed(1) + 'k' : valores[i], x + barW / 2, y - 5);
      }
    });
  }

  // BUSCA API
  async function buscarDados(periodo) {
    const hoje = new Date();
    let dataInicio, dataFim, agrupamento;

    dataFim = hoje.toISOString().split('T')[0];

    if (periodo === 'custom') {
      const inputInicio = document.getElementById('periodoInicio').value;
      const inputFim = document.getElementById('periodoFim').value;
      
      dataInicio = inputInicio || dataFim;
      dataFim = inputFim || dataFim;
      
      const diffMs = new Date(dataFim) - new Date(dataInicio);
      const diffDias = Math.max(1, diffMs / 86400000);
      
      if (diffDias > 90) agrupamento = 'mes';
      else if (diffDias > 30) agrupamento = 'semana';
      else agrupamento = 'dia';
    } else {
      switch (periodo) {
        case '7d':
          dataInicio   = new Date(hoje - 7  * 86400000).toISOString().split('T')[0];
          agrupamento  = 'dia';
          break;
        case '30d':
          dataInicio   = new Date(hoje - 30 * 86400000).toISOString().split('T')[0];
          agrupamento  = 'semana';
          break;
        case '90d':
          dataInicio   = new Date(hoje - 90 * 86400000).toISOString().split('T')[0];
          agrupamento  = 'semana';
          break;
        default:
          dataInicio   = new Date(hoje);
          dataInicio.setMonth(dataInicio.getMonth() - 12);
          dataInicio   = dataInicio.toISOString().split('T')[0];
          agrupamento  = 'mes';
      }
    }

    const [dashboard, historico, distribuicao] = await Promise.all([
      fetch('/api/admin/dashboard').then(r => r.json()).catch(() => ({})),
      fetch(`/api/admin/historico-vendas?dataInicio=${dataInicio}&dataFim=${dataFim}&agrupamento=${agrupamento}`)
        .then(r => r.json()).catch(() => ({ linhas: [], porCategoria: [], topProdutos: [] })),
      fetch('/api/admin/distribuicao-status').then(r => r.json()).catch(() => []),
    ]);

    return { dashboard, historico, distribuicao };
  }

  // RENDERIZAR
  async function renderizar(periodo) {
    const { dashboard, historico, distribuicao } = await buscarDados(periodo);

    // KPIS DO DASHBOARD
    const stats = dashboard;
    const receitaTotal  = parseFloat(stats.receita_total  || 0);
    const totalPedidos  = parseInt(stats.total_pedidos    || 0);
    const emTroca       = parseInt(stats.em_troca         || 0);
    const ticketMedio   = totalPedidos > 0 ? receitaTotal / totalPedidos : 0;

    const el = id => document.getElementById(id);
    if (el('kpiReceita')) el('kpiReceita').textContent = 'R$ ' + receitaTotal.toLocaleString('pt-BR', {minimumFractionDigits:0});
    if (el('kpiPedidos')) el('kpiPedidos').textContent = totalPedidos;
    if (el('kpiTicket'))  el('kpiTicket').textContent  = 'R$ ' + ticketMedio.toLocaleString('pt-BR', {minimumFractionDigits:0});
    if (el('kpiTrocas'))  el('kpiTrocas').textContent  = emTroca;

    // Gráfico de vendas
    const linhas    = historico.linhas || [];
    const labels    = linhas.map(l => l.periodo ? String(l.periodo).substring(5) : '');
    const receitas  = linhas.map(l => parseFloat(l.receita || 0));
    const pedidosSerie = linhas.map(l => parseInt(l.total_pedidos || 0) * 100); 

    const canvasVendas = el('graficoVendas');
    if (canvasVendas) {
      setTimeout(() => {
        drawLineChart(canvasVendas, labels, [
          { nome: 'Receita',  cor: '#00ff88', dados: receitas },
          { nome: 'Pedidos',  cor: '#00ccff', dados: pedidosSerie },
        ]);
      }, 50);
    }

    // GRÁFICO CATEGORIAS
    const porCat     = historico.porCategoria || [];
    const catLabels  = porCat.map(c => c.categoria);
    const catValores = porCat.map(c => parseFloat(c.receita || 0) / 1000);
    const catCores   = catLabels.map(c => COR_CAT[c] || '#888888');

    const canvasCat = el('graficoCategorias');
    if (canvasCat) {
      setTimeout(() => {
        drawBarChart(canvasCat, catLabels, catValores, catCores);
      }, 50);
    }

    // LEGENDA CATEGORIAS
    const catLegenda = el('graficoCatLegenda');
    if (catLegenda && porCat.length > 0) {
      const totalCat = porCat.reduce((s, c) => s + parseFloat(c.receita || 0), 0);
      catLegenda.innerHTML = porCat.map(c => {
        const pct = totalCat > 0 ? Math.round((parseFloat(c.receita || 0) / totalCat) * 100) : 0;
        const cor = COR_CAT[c.categoria] || '#888888';
        return `
          <div class="cat-legenda-item">
            <div class="cat-legenda-cor" style="background:${cor}"></div>
            <span class="cat-legenda-nome">${c.categoria}</span>
            <div class="cat-legenda-barra"><div class="cat-legenda-barra-fill" style="width:${pct}%;background:${cor}"></div></div>
            <span class="cat-legenda-val">R$ ${(parseFloat(c.receita || 0) / 1000).toFixed(0)}k</span>
            <span class="cat-legenda-pct">${pct}%</span>
          </div>`;
      }).join('');
    } else if (catLegenda) {
      catLegenda.innerHTML = '<p class="texto-muted texto-pequeno">Sem vendas no período.</p>';
    }

    // GRÁFICO DE STATUS
    const distList   = Array.isArray(distribuicao) ? distribuicao : [];
    const stLabels   = distList.map(d => d.status);
    const stValores  = distList.map(d => parseInt(d.total || 0));
    const stCores    = stLabels.map(s => COR_STATUS[s] || '#888888');

    const canvasStatus = el('graficoStatus');
    if (canvasStatus) {
      setTimeout(() => {
        drawBarChart(canvasStatus, stLabels, stValores, stCores);
      }, 50);
    }

    // RANKING DE PRODUTOS
    const topProd  = historico.topProdutos || [];
    const ranking  = el('rankingProdutos');
    if (ranking) {
      if (topProd.length > 0) {
        ranking.innerHTML = topProd.slice(0, 5).map((p, i) => `
          <div class="ranking-item">
            <span class="ranking-pos ranking-pos-${i + 1}">${i + 1}</span>
            <div class="ranking-info">
              <div class="ranking-nome">${p.nome}</div>
              <div class="ranking-cat">${p.categoria}</div>
            </div>
            <span class="ranking-val">R$ ${(parseFloat(p.receita || 0) / 1000).toFixed(0)}k</span>
          </div>`).join('');
      } else {
        ranking.innerHTML = '<p class="texto-muted texto-pequeno">Sem dados no período.</p>';
      }
    }

    // Gráfico comparativo por categoria ao longo do tempo
    const linhasPorCat = historico.linhasPorCategoria || [];
    dadosGraficoComparativo = { labels, linhasPorCategoria: linhasPorCat };
    desenharGraficoComparativo();
  }

  // EVENTOS PERÍODO
  let periodoAtivo = '7d';
  
  const tipoFiltro = document.getElementById('tipoFiltro');
  const filtroPre = document.getElementById('filtroPre');
  const filtroCustom = document.getElementById('filtroCustom');
  const btnAplicarCustom = document.getElementById('btnAplicarCustom');

  if (tipoFiltro) {
    tipoFiltro.addEventListener('change', (e) => {
      if (e.target.value === 'custom') {
        filtroPre.style.display = 'none';
        filtroCustom.style.display = 'flex';
        periodoAtivo = 'custom';
        renderizar('custom');
      } else {
        filtroPre.style.display = 'flex';
        filtroCustom.style.display = 'none';
        const btnAtivo = document.querySelector('.periodo-btn.ativo');
        periodoAtivo = btnAtivo ? btnAtivo.dataset.periodo : '7d';
        renderizar(periodoAtivo);
      }
    });
  }

  if (btnAplicarCustom) {
    btnAplicarCustom.addEventListener('click', () => {
      periodoAtivo = 'custom';
      renderizar('custom');
    });
  }

  document.querySelectorAll('.periodo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.periodo-btn').forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      periodoAtivo = btn.dataset.periodo;
      renderizar(periodoAtivo);
    });
  });

  window.addEventListener('resize', () => renderizar(periodoAtivo));

  initFiltrosCategoria();
  renderizar(periodoAtivo);

  // Tempo real: atualiza a cada 30 segundos
  let intervaloTempReal = setInterval(() => renderizar(periodoAtivo), 30000);

  // Para o polling quando o usuário sair da página
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(intervaloTempReal);
    } else {
      renderizar(periodoAtivo);
      intervaloTempReal = setInterval(() => renderizar(periodoAtivo), 30000);
    }
});
});
