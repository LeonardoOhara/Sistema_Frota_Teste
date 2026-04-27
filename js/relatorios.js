// ═══════════════════════════════════════
// js/relatorios.js
// ═══════════════════════════════════════
const REL_MOD = {
  init() {
    this.populateFilters();
    document.getElementById('btnGerarRel').addEventListener('click', () => this.gerar());
    document.getElementById('btnPrintRel').addEventListener('click', () => window.print());
  },

  populateFilters() {
    const estados = document.getElementById('relEstado');
    estados.innerHTML = '<option value="">Todos</option>' + ESTADOS.map(e => `<option value="${e.uf}">${e.uf}</option>`).join('');

    const status = document.getElementById('relStatus');
    status.innerHTML = '<option value="">Todos</option>' + STATUS_LIST.map(s => `<option>${s}</option>`).join('');

    // Polos dinâmicos
    this.refreshPolosLocadoras();
  },

  refreshPolosLocadoras() {
    const condutores = getCondutores();
    const motos = getMotos();
    const polos = [...new Set(condutores.map(c => c.polo).filter(Boolean))];
    const locadoras = [...new Set(motos.map(m => m.locadora).filter(Boolean))];

    const polSel = document.getElementById('relPolo');
    polSel.innerHTML = '<option value="">Todos</option>' + polos.map(p => `<option>${p}</option>`).join('');

    const locSel = document.getElementById('relLocadora');
    locSel.innerHTML = '<option value="">Todos</option>' + locadoras.map(l => `<option>${l}</option>`).join('');
  },

  gerar() {
    let motos = getMotos();
    const condutores = getCondutores();
    const dtIni = document.getElementById('relDtIni').value;
    const dtFim = document.getElementById('relDtFim').value;
    const estado = document.getElementById('relEstado').value;
    const polo = document.getElementById('relPolo').value;
    const locadora = document.getElementById('relLocadora').value;
    const status = document.getElementById('relStatus').value;

    if (estado) motos = motos.filter(m => m.estado === estado);
    if (locadora) motos = motos.filter(m => m.locadora === locadora);
    if (status) motos = motos.filter(m => m.status === status);
    if (dtIni) motos = motos.filter(m => (m.dataRet || m.dataManut || '') >= dtIni);
    if (dtFim) motos = motos.filter(m => (m.dataRet || m.dataManut || '') <= dtFim);
    if (polo) {
      const matsNoPolo = condutores.filter(c => c.polo === polo).map(c => c.matricula);
      motos = motos.filter(m => matsNoPolo.includes(m.matricula));
    }

    const paradas = motos.filter(m => ['Em manutenção', 'Aguardando guincho', 'Aguardando agendamento', 'Agendado'].includes(m.status));
    const disponiveis = motos.filter(m => m.status === 'Disponível');
    const condSemMoto = condutores.filter(c => !motos.some(m => m.condutorId === c.id));
    const horas = motos.filter(m => m.dataManut).map(m => slaHoras(m.dataManut) || 0);
    const tmedio = horas.length ? (horas.reduce((a, b) => a + b, 0) / horas.length).toFixed(1) : 0;

    const locCount = {};
    motos.forEach(m => { if (m.locadora) locCount[m.locadora] = (locCount[m.locadora] || 0) + 1; });

    const el = document.getElementById('relResultado');
    el.innerHTML = `
      <div class="card-section">
        <h3><i class="fa-solid fa-circle-exclamation" style="color:var(--red)"></i> Motos Paradas (${paradas.length})</h3>
        ${this.tableMotos(paradas)}
      </div>
      <div class="card-section">
        <h3><i class="fa-solid fa-circle-check" style="color:var(--green)"></i> Motos Disponíveis (${disponiveis.length})</h3>
        ${this.tableMotos(disponiveis)}
      </div>
      <div class="card-section">
        <h3><i class="fa-solid fa-stopwatch" style="color:var(--accent)"></i> Tempo Médio em Manutenção</h3>
        <p style="font-size:2rem;font-weight:800;font-family:'Syne',sans-serif;color:var(--accent)">${tmedio}h</p>
      </div>
      <div class="card-section">
        <h3><i class="fa-solid fa-user-slash" style="color:var(--yellow)"></i> Condutores sem Moto (${condSemMoto.length})</h3>
        ${condSemMoto.length ? `<table class="data-table"><thead><tr><th>Nome</th><th>Matrícula</th><th>Polo</th><th>Estado</th></tr></thead><tbody>
          ${condSemMoto.map(c => `<tr><td>${c.nome}</td><td>${c.matricula}</td><td>${c.polo||'—'}</td><td>${c.estado||'—'}</td></tr>`).join('')}
        </tbody></table>` : '<p style="color:var(--text-dim)">Todos os condutores têm moto vinculada.</p>'}
      </div>
      <div class="card-section">
        <h3><i class="fa-solid fa-building" style="color:var(--purple)"></i> Motos por Locadora</h3>
        <table class="data-table"><thead><tr><th>Locadora</th><th>Quantidade</th></tr></thead><tbody>
          ${Object.entries(locCount).map(([l, n]) => `<tr><td>${l}</td><td><strong>${n}</strong></td></tr>`).join('')}
        </tbody></table>
      </div>`;
  },

  tableMotos(motos) {
    if (!motos.length) return '<p style="color:var(--text-dim)">Nenhum registro encontrado.</p>';
    return `<table class="data-table"><thead><tr><th>Placa</th><th>Modelo</th><th>Condutor</th><th>Estado</th><th>Status</th><th>SLA</th></tr></thead><tbody>
      ${motos.map(m => {
        const h = m.dataManut ? slaHoras(m.dataManut) : null;
        return `<tr><td>${m.placa}</td><td>${m.modelo}</td><td>${m.condutorNome||'—'}</td><td>${m.estado||'—'}</td><td>${statusBadge(m.status)}</td><td>${h!==null?slaLabel(h):'—'}</td></tr>`;
      }).join('')}
    </tbody></table>`;
  }
};

// ═══════════════════════════════════════
// js/historico.js
// ═══════════════════════════════════════
const HIST_MOD = {
  page: 1, perPage: 20,

  init() {
    document.getElementById('searchHistorico').addEventListener('input', () => { this.page = 1; this.render(); });
    document.getElementById('filterHistTipo').addEventListener('change', () => { this.page = 1; this.render(); });
    document.getElementById('exportHistCSV').addEventListener('click', () => this.exportCSV());
    this.render();
  },

  getFiltered() {
    const q = document.getElementById('searchHistorico').value.toLowerCase();
    const tipo = document.getElementById('filterHistTipo').value;
    let all = getHistorico();
    if (q) all = all.filter(h => JSON.stringify(h).toLowerCase().includes(q));
    if (tipo) all = all.filter(h => (h.tipo || '').toLowerCase().includes(tipo));
    return all;
  },

  render() {
    const data = this.getFiltered();
    const total = data.length;
    const slice = data.slice((this.page - 1) * this.perPage, this.page * this.perPage);
    const tbody = document.getElementById('bodyHistorico');

    const tipoBadge = (t) => {
      const m = { login:'badge-green', logout:'badge-gray', cadastro:'badge-blue', 'edição':'badge-yellow', 'exclusão':'badge-red', status:'badge-purple' };
      return `<span class="badge ${m[t]||'badge-gray'}">${t||'—'}</span>`;
    };

    if (slice.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-dim)">Nenhum registro no histórico</td></tr>';
    } else {
      tbody.innerHTML = slice.map(h => `
        <tr>
          <td style="white-space:nowrap">${fmtDateTime(h.ts)}</td>
          <td>${h.usuario || '—'}</td>
          <td>${tipoBadge(h.tipo)}</td>
          <td>${h.modulo || '—'}</td>
          <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis">${h.descricao || '—'}</td>
        </tr>`).join('');
    }
    renderPagination('pagHistorico', total, this.page, this.perPage, p => { this.page = p; this.render(); });
  },

  exportCSV() {
    exportCSV(this.getFiltered(), 'historico.csv', [
      { key: 'ts', label: 'Data/Hora' },
      { key: 'usuario', label: 'Usuario' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'modulo', label: 'Modulo' },
      { key: 'descricao', label: 'Descricao' },
    ]);
    showToast('Histórico exportado!', 'info');
  }
};

// ═══════════════════════════════════════
// js/config.js
// ═══════════════════════════════════════
const CONFIG_MOD = {
  init() {
    const cfg = getConfig();
    const slaSel = document.getElementById('slaConfig');
    const slaVal = String(cfg.sla);
    slaSel.value = ['24','48','72'].includes(slaVal) ? slaVal : 'custom';
    if (slaSel.value === 'custom') {
      document.getElementById('slaCustomGroup').style.display = 'flex';
      document.getElementById('slaCustomVal').value = cfg.slaCustom || 96;
    }
    slaSel.addEventListener('change', () => {
      document.getElementById('slaCustomGroup').style.display = slaSel.value === 'custom' ? 'flex' : 'none';
    });
    document.getElementById('btnSaveSLA').addEventListener('click', () => {
      const c = getConfig();
      c.sla = slaSel.value === 'custom' ? 'custom' : Number(slaSel.value);
      c.slaCustom = slaSel.value === 'custom' ? Number(document.getElementById('slaCustomVal').value) : null;
      saveConfig(c);
      showToast('SLA salvo!');
      addHistorico({ tipo: 'edição', modulo: 'Config', usuario: AUTH.currentUser(), descricao: `SLA alterado para ${c.sla}h`, dadosNovos: '' });
    });

    document.getElementById('btnSaveSenha').addEventListener('click', () => {
      const cfg = getConfig();
      const atual = document.getElementById('senhaAtual').value;
      const nova = document.getElementById('senhaNova').value;
      const conf = document.getElementById('senhaConf').value;
      if (atual !== (cfg.senha || 'admin123')) { showToast('Senha atual incorreta', 'error'); return; }
      if (!nova || nova !== conf) { showToast('Senhas novas não coincidem', 'error'); return; }
      cfg.senha = nova;
      saveConfig(cfg);
      ['senhaAtual','senhaNova','senhaConf'].forEach(id => document.getElementById(id).value = '');
      showToast('Senha alterada com sucesso!');
      addHistorico({ tipo: 'edição', modulo: 'Config', usuario: AUTH.currentUser(), descricao: 'Senha alterada', dadosNovos: '' });
    });

    document.getElementById('btnExportTudo').addEventListener('click', () => {
      const all = {
        motos: getMotos(), condutores: getCondutores(),
        historico: getHistorico(), config: getConfig(),
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `motofleet_backup_${Date.now()}.json`;
      a.click();
      showToast('Backup exportado!', 'info');
    });

    document.getElementById('btnLimparDados').addEventListener('click', async () => {
      const ok = await showConfirm('ATENÇÃO: Isso irá apagar TODOS os dados do sistema. Continuar?');
      if (!ok) return;
      [DB.MOTOS, DB.CONDUTORES, DB.HISTORICO].forEach(k => localStorage.removeItem(k));
      showToast('Dados limpos!', 'warn');
      DASH.render();
      MOTOS_MOD.render();
      COND_MOD.render();
    });
  }
};