// ═══════════════════════════════════════
// js/motos.js — Módulo Motos
// ═══════════════════════════════════════

const MOTOS_MOD = {
  page: 1, perPage: 10,
  sortKey: 'placa', sortDir: 1,
  editId: null,

  init() {
    this.populateFilters();
    this.bindEvents();
    this.render();
  },

  populateFilters() {
    const estados = document.getElementById('filterEstadoMoto');
    estados.innerHTML = '<option value="">Todos os Estados</option>' +
      ESTADOS.map(e => `<option value="${e.uf}">${e.uf}</option>`).join('');

    const statusSel = document.getElementById('filterStatusMoto');
    statusSel.innerHTML = '<option value="">Todos os Status</option>' +
      STATUS_LIST.map(s => `<option value="${s}">${s}</option>`).join('');
  },

  bindEvents() {
    document.getElementById('btnNovoMoto').addEventListener('click', () => this.openForm());
    document.getElementById('searchMoto').addEventListener('input', () => { this.page = 1; this.render(); });
    document.getElementById('filterEstadoMoto').addEventListener('change', () => { this.page = 1; this.render(); });
    document.getElementById('filterStatusMoto').addEventListener('change', () => { this.page = 1; this.render(); });
    document.getElementById('exportMotosCSV').addEventListener('click', () => this.exportCSV());
    document.getElementById('btnSaveMoto').addEventListener('click', () => this.save());

    // Sort headers
    document.querySelectorAll('#tableMotos th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const k = th.dataset.sort;
        if (this.sortKey === k) this.sortDir *= -1; else { this.sortKey = k; this.sortDir = 1; }
        this.render();
      });
    });

    // Vinculação automática condutor
    document.getElementById('motoMatricula').addEventListener('change', () => {
      const mat = document.getElementById('motoMatricula').value;
      const c = getCondutorByMatricula(mat);
      document.getElementById('motoCondutorNome').value = c ? c.nome : '';
      const estadoEl = document.getElementById('motoEstado');
      const cidadeEl = document.getElementById('motoCidade');
      if (c) {
        estadoEl.value = c.estado || '';
        cidadeEl.value = c.cidade || '';
      }
    });
  },

  getFiltered() {
    const q = document.getElementById('searchMoto').value.toLowerCase();
    const est = document.getElementById('filterEstadoMoto').value;
    const sts = document.getElementById('filterStatusMoto').value;
    let all = getMotos();
    if (q) all = all.filter(m =>
      (m.placa || '').toLowerCase().includes(q) ||
      (m.modelo || '').toLowerCase().includes(q) ||
      (m.condutorNome || '').toLowerCase().includes(q) ||
      (m.locadora || '').toLowerCase().includes(q)
    );
    if (est) all = all.filter(m => m.estado === est);
    if (sts) all = all.filter(m => m.status === sts);
    all.sort((a, b) => {
      const av = (a[this.sortKey] || '').toString().toLowerCase();
      const bv = (b[this.sortKey] || '').toString().toLowerCase();
      return av < bv ? -this.sortDir : av > bv ? this.sortDir : 0;
    });
    return all;
  },

  render() {
    const data = this.getFiltered();
    const total = data.length;
    const slice = data.slice((this.page - 1) * this.perPage, this.page * this.perPage);
    const tbody = document.getElementById('bodyMotos');

    if (slice.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-dim)"><i class="fa-solid fa-motorcycle" style="font-size:2rem;display:block;margin-bottom:.5rem"></i>Nenhuma moto encontrada</td></tr>';
    } else {
      tbody.innerHTML = slice.map(m => {
        const horas = (m.status === 'Em manutenção' || m.dataManut) ? slaHoras(m.dataManut) : null;
        const sla = horas !== null ? slaLabel(horas) : '—';
        return `
          <tr>
            <td><strong>${m.placa || '—'}</strong></td>
            <td>${m.modelo || '—'}</td>
            <td>${m.condutorNome || '<span style="color:var(--text-dim)">—</span>'}</td>
            <td>${m.estado || '—'} / ${m.cidade || '—'}</td>
            <td>${statusBadge(m.status)}</td>
            <td>${sla}</td>
            <td>${m.locadora || '—'}</td>
            <td>
              <div style="display:flex;gap:.3rem">
                <button class="btn-icon-sm btn-edit" title="Editar" onclick="MOTOS_MOD.openForm('${m.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon-sm btn-del" title="Excluir" onclick="MOTOS_MOD.remove('${m.id}')"><i class="fa-solid fa-trash"></i></button>
              </div>
            </td>
          </tr>`;
      }).join('');
    }

    renderPagination('pagMotos', total, this.page, this.perPage, p => { this.page = p; this.render(); });
  },

  openForm(id = null) {
    this.editId = id;
    document.getElementById('modalMotoTitle').textContent = id ? 'Editar Moto' : 'Nova Moto';

    // Preenche select matrícula
    const matSel = document.getElementById('motoMatricula');
    matSel.innerHTML = '<option value="">Sem condutor</option>' +
      getCondutores().map(c => `<option value="${c.matricula}">${c.matricula} — ${c.nome}</option>`).join('');

    // Preenche estados
    populateEstadoSelect(document.getElementById('motoEstado'));
    // Preenche status
    document.getElementById('motoStatus').innerHTML = STATUS_LIST.map(s => `<option>${s}</option>`).join('');

    if (id) {
      const m = getMotoById(id);
      if (!m) return;
      matSel.value = m.matricula || '';
      document.getElementById('motoCondutorNome').value = m.condutorNome || '';
      document.getElementById('motoPlaca').value = m.placa || '';
      document.getElementById('motoModelo').value = m.modelo || '';
      document.getElementById('motoLocadora').value = m.locadora || '';
      document.getElementById('motoDataRet').value = m.dataRet || '';
      document.getElementById('motoDataDev').value = m.dataDev || '';
      document.getElementById('motoDataManut').value = m.dataManut || '';
      document.getElementById('motoEstado').value = m.estado || '';
      document.getElementById('motoCidade').value = m.cidade || '';
      document.getElementById('motoStatus').value = m.status || 'Disponível';
      document.getElementById('motoObs').value = m.obs || '';
    } else {
      ['motoCondutorNome','motoPlaca','motoModelo','motoLocadora','motoDataRet','motoDataDev','motoDataManut','motoCidade','motoObs'].forEach(id => document.getElementById(id).value = '');
      matSel.value = '';
      document.getElementById('motoStatus').value = 'Disponível';
    }
    openModal('modalMoto');
  },

  save() {
    const placa = document.getElementById('motoPlaca').value.trim().toUpperCase();
    const modelo = document.getElementById('motoModelo').value.trim();
    if (!placa || !modelo) { showToast('Placa e Modelo são obrigatórios', 'error'); return; }

    const mat = document.getElementById('motoMatricula').value;
    const c = mat ? getCondutorByMatricula(mat) : null;
    const status = document.getElementById('motoStatus').value;
    const dataManut = document.getElementById('motoDataManut').value;

    const moto = {
      id: this.editId || uid(),
      placa, modelo,
      locadora: document.getElementById('motoLocadora').value.trim(),
      dataRet: document.getElementById('motoDataRet').value,
      dataDev: document.getElementById('motoDataDev').value,
      dataManut: (status === 'Em manutenção' || dataManut) ? dataManut : '',
      estado: document.getElementById('motoEstado').value,
      cidade: document.getElementById('motoCidade').value.trim(),
      status,
      obs: document.getElementById('motoObs').value.trim(),
      condutorId: c ? c.id : '',
      condutorNome: c ? c.nome : document.getElementById('motoCondutorNome').value,
      matricula: mat,
    };

    const isEdit = !!this.editId;
    const old = isEdit ? getMotoById(this.editId) : null;
    saveMoto(moto);

    addHistorico({
      tipo: isEdit ? 'edição' : 'cadastro',
      modulo: 'Motos',
      usuario: AUTH.currentUser(),
      descricao: `${isEdit ? 'Editou' : 'Cadastrou'} moto ${placa}`,
      dadosAntigos: old ? JSON.stringify(old) : '',
      dadosNovos: JSON.stringify(moto),
    });

    closeModal('modalMoto');
    this.render();
    showToast(`Moto ${isEdit ? 'atualizada' : 'cadastrada'} com sucesso!`);
    DASH.render();
  },

  async remove(id) {
    const m = getMotoById(id);
    const ok = await showConfirm(`Excluir moto ${m?.placa}? Esta ação não pode ser desfeita.`);
    if (!ok) return;
    addHistorico({
      tipo: 'exclusão', modulo: 'Motos', usuario: AUTH.currentUser(),
      descricao: `Excluiu moto ${m?.placa}`, dadosAntigos: JSON.stringify(m), dadosNovos: '',
    });
    deleteMoto(id);
    this.render();
    showToast('Moto removida', 'warn');
    DASH.render();
  },

  exportCSV() {
    exportCSV(this.getFiltered(), 'motos.csv', [
      { key: 'placa', label: 'Placa' },
      { key: 'modelo', label: 'Modelo' },
      { key: 'condutorNome', label: 'Condutor' },
      { key: 'matricula', label: 'Matrícula' },
      { key: 'locadora', label: 'Locadora' },
      { key: 'estado', label: 'Estado' },
      { key: 'cidade', label: 'Cidade' },
      { key: 'status', label: 'Status' },
      { key: 'dataRet', label: 'Data Retirada' },
      { key: 'dataDev', label: 'Data Devolução' },
      { key: 'dataManut', label: 'Data Entrada Manutenção' },
      { key: 'obs', label: 'Observações' },
    ]);
    showToast('CSV exportado!', 'info');
  }
};