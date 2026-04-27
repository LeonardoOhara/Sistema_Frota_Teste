// ═══════════════════════════════════════
// js/dashboard.js — Dashboard principal
// ═══════════════════════════════════════

const DASH = {
  charts: {},

  render() {
    this.updateCards();
    this.renderCharts();
    this.renderMovTable();
  },

  updateCards() {
    const motos = getMotos();
    const condutores = getCondutores();
    const cfg = getConfig();
    const limite = cfg.sla === 'custom' ? (cfg.slaCustom || 48) : Number(cfg.sla);

    const total = motos.length;
    const disp = motos.filter(m => m.status === 'Disponível').length;
    const manut = motos.filter(m => m.status === 'Em manutenção').length;
    const guincho = motos.filter(m => m.status === 'Aguardando guincho').length;
    const pronta = motos.filter(m => m.status === 'Pronta').length;

    // Tempo médio parado (em manutenção com dataManut)
    const emManut = motos.filter(m => m.status === 'Em manutenção' && m.dataManut);
    let tmedio = '—';
    if (emManut.length > 0) {
      const horas = emManut.map(m => slaHoras(m.dataManut)).filter(h => h !== null);
      if (horas.length > 0) {
        const avg = horas.reduce((a, b) => a + b, 0) / horas.length;
        tmedio = avg < 24 ? `${Math.round(avg)}h` : `${(avg / 24).toFixed(1)}d`;
      }
    }

    // SLA médio
    let slaAvg = '—';
    const comSla = motos.filter(m => m.dataManut).map(m => slaHoras(m.dataManut)).filter(h => h !== null);
    if (comSla.length > 0) {
      const avg = comSla.reduce((a, b) => a + b, 0) / comSla.length;
      const pct = Math.min(100, Math.round((avg / limite) * 100));
      slaAvg = `${pct}%`;
    }

    document.getElementById('card-total').textContent = total;
    document.getElementById('card-disp').textContent = disp;
    document.getElementById('card-manut').textContent = manut;
    document.getElementById('card-guincho').textContent = guincho;
    document.getElementById('card-pronta').textContent = pronta;
    document.getElementById('card-tmedio').textContent = tmedio;
    document.getElementById('card-sla').textContent = slaAvg;
    document.getElementById('card-condutores').textContent = condutores.length;
  },

  renderCharts() {
    const motos = getMotos();
    Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#8b949e';
    Chart.defaults.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#30363d';

    this.renderStatusPie(motos);
    this.renderEstadoBar(motos);
    this.renderLinhaChart(motos);
    this.renderPolosChart(motos);
  },

  destroyChart(id) {
    if (this.charts[id]) { this.charts[id].destroy(); delete this.charts[id]; }
  },

  renderStatusPie(motos) {
    this.destroyChart('status');
    const counts = {};
    STATUS_LIST.forEach(s => counts[s] = 0);
    motos.forEach(m => { if (counts[m.status] !== undefined) counts[m.status]++; });
    const filtered = STATUS_LIST.filter(s => counts[s] > 0);
    const colors = ['#22c55e','#3b82f6','#14b8a6','#eab308','#a855f7','#f97316','#ef4444','#6b7280'];
    const ctx = document.getElementById('chartStatus').getContext('2d');
    this.charts.status = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: filtered,
        datasets: [{ data: filtered.map(s => counts[s]), backgroundColor: colors.slice(0, filtered.length), borderWidth: 2, borderColor: 'var(--bg2)' }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } } }, cutout: '65%' }
    });
  },

  renderEstadoBar(motos) {
    this.destroyChart('estado');
    const counts = {};
    motos.forEach(m => { if (m.estado) counts[m.estado] = (counts[m.estado] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const ctx = document.getElementById('chartEstado').getContext('2d');
    this.charts.estado = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(e => e[0]),
        datasets: [{ label: 'Motos', data: sorted.map(e => e[1]), backgroundColor: '#2563eb', borderRadius: 6 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
  },

  renderLinhaChart(motos) {
    this.destroyChart('linha');
    // Simula histórico dos últimos 7 dias com base nos dados atuais
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
      // Conta motos em manutenção que estavam paradas nesse dia
      const count = motos.filter(m => {
        if (!m.dataManut) return false;
        const ent = new Date(m.dataManut + 'T00:00:00');
        return ent <= d;
      }).length;
      data.push(count);
    }
    const ctx = document.getElementById('chartLinha').getContext('2d');
    this.charts.linha = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Motos paradas',
          data,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37,99,235,.15)',
          fill: true,
          tension: .4,
          pointBackgroundColor: '#2563eb',
          pointRadius: 4,
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
  },

  renderPolosChart(motos) {
    this.destroyChart('polos');
    const condutores = getCondutores();
    const counts = {};
    motos.filter(m => m.status === 'Em manutenção' && m.condutorId).forEach(m => {
      const c = condutores.find(c => c.id === m.condutorId);
      if (c && c.polo) counts[c.polo] = (counts[c.polo] || 0) + 1;
    });
    // Incluir motos sem condutor em polo "Sem polo"
    const semPolo = motos.filter(m => m.status === 'Em manutenção' && !m.condutorId).length;
    if (semPolo > 0) counts['Sem polo'] = semPolo;

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (sorted.length === 0) {
      document.getElementById('chartPolos').parentElement.innerHTML = '<p style="color:var(--text-dim);padding:1rem">Nenhuma moto em manutenção no momento.</p>';
      return;
    }
    const ctx = document.getElementById('chartPolos').getContext('2d');
    this.charts.polos = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(e => e[0]),
        datasets: [{ label: 'Manutenções', data: sorted.map(e => e[1]), backgroundColor: '#ef4444', borderRadius: 6 }]
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  },

  renderMovTable() {
    const hist = getHistorico().slice(0, 15);
    const tbody = document.getElementById('dashMovTable');
    if (!tbody) return;
    if (hist.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text-dim)">Sem movimentações</td></tr>';
      return;
    }
    tbody.innerHTML = hist.map(h => `
      <tr>
        <td>${fmtDateTime(h.ts)}</td>
        <td>${h.descricao || h.modulo || '—'}</td>
        <td><span class="badge badge-blue">${h.tipo || '—'}</span></td>
      </tr>
    `).join('');
  }
};