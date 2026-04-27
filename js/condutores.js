// ═══════════════════════════════════════
// js/condutores.js — Módulo Condutores
// ═══════════════════════════════════════

const COND_MOD = {
  page: 1, perPage: 10,
  sortKey: 'nome', sortDir: 1,
  editId: null,

  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    document.getElementById('btnNovoCondutor').addEventListener('click', () => this.openForm());
    document.getElementById('searchCondutor').addEventListener('input', () => { this.page = 1; this.render(); });
    document.getElementById('exportCondutoresCSV').addEventListener('click', () => this.exportCSV());
    document.getElementById('btnSaveCondutor').addEventListener('click', () => this.save());
    document.getElementById('importCondutoresBtn').addEventListener('click', () => document.getElementById('importCondutoresFile').click());
    document.getElementById('importCondutoresFile').addEventListener('change', e => this.importCSV(e));

    document.querySelectorAll('#tableCondutores th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const k = th.dataset.sort;
        if (this.sortKey === k) this.sortDir *= -1; else { this.sortKey = k; this.sortDir = 1; }
        this.render();
      });
    });
  },

  getFiltered() {
    const q = document.getElementById('searchCondutor').value.toLowerCase();
    let all = getCondutores();
    if (q) all = all.filter(c =>
      (c.nome || '').toLowerCase().includes(q) ||
      (c.matricula || '').toLowerCase().includes(q) ||
      (c.polo || '').toLowerCase().includes(q) ||
      (c.cidade || '').toLowerCase().includes(q)
    );
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
    const tbody = document.getElementById('bodyCondutores');

    if (slice.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-dim)"><i class="fa-solid fa-users" style="font-size:2rem;display:block;margin-bottom:.5rem"></i>Nenhum condutor encontrado</td></tr>';
    } else {
      tbody.innerHTML = slice.map(c => `
        <tr>
          <td>${c.matricula || '—'}</td>
          <td><strong>${c.nome || '—'}</strong></td>
          <td>${c.telefone || '—'}</td>
          <td>${c.cnh || '—'}</td>
          <td>${c.polo || '—'}</td>
          <td>${c.cidade || '—'} / ${c.estado || '—'}</td>
          <td>
            <div style="display:flex;gap:.3rem">
              <button class="btn-icon-sm btn-edit" title="Editar" onclick="COND_MOD.openForm('${c.id}')"><i class="fa-solid fa-pen"></i></button>
              <button class="btn-icon-sm btn-del" title="Excluir" onclick="COND_MOD.remove('${c.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>`).join('');
    }
    renderPagination('pagCondutores', total, this.page, this.perPage, p => { this.page = p; this.render(); });
  },

  openForm(id = null) {
    this.editId = id;
    document.getElementById('modalCondutorTitle').textContent = id ? 'Editar Condutor' : 'Novo Condutor';
    populateEstadoSelect(document.getElementById('condEstado'));

    if (id) {
      const c = getCondutorById(id);
      if (!c) return;
      document.getElementById('condNome').value = c.nome || '';
      document.getElementById('condMatricula').value = c.matricula || '';
      document.getElementById('condTel').value = c.telefone || '';
      document.getElementById('condCNH').value = c.cnh || '';
      document.getElementById('condPolo').value = c.polo || '';
      document.getElementById('condEstado').value = c.estado || '';
      document.getElementById('condCidade').value = c.cidade || '';
    } else {
      ['condNome','condMatricula','condTel','condCNH','condPolo','condCidade'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('condEstado').value = '';
    }
    openModal('modalCondutor');
  },

  save() {
    const nome = document.getElementById('condNome').value.trim();
    const matricula = document.getElementById('condMatricula').value.trim();
    if (!nome || !matricula) { showToast('Nome e Matrícula são obrigatórios', 'error'); return; }

    // Verificar matrícula duplicada
    const existing = getCondutorByMatricula(matricula);
    if (existing && existing.id !== this.editId) {
      showToast('Matrícula já cadastrada!', 'error'); return;
    }

    const cond = {
      id: this.editId || uid(),
      nome,
      matricula,
      telefone: document.getElementById('condTel').value.trim(),
      cnh: document.getElementById('condCNH').value.trim(),
      polo: document.getElementById('condPolo').value.trim(),
      estado: document.getElementById('condEstado').value,
      cidade: document.getElementById('condCidade').value.trim(),
    };

    const isEdit = !!this.editId;
    const old = isEdit ? getCondutorById(this.editId) : null;
    saveCondutor(cond);

    addHistorico({
      tipo: isEdit ? 'edição' : 'cadastro',
      modulo: 'Condutores', usuario: AUTH.currentUser(),
      descricao: `${isEdit ? 'Editou' : 'Cadastrou'} condutor ${nome} (${matricula})`,
      dadosAntigos: old ? JSON.stringify(old) : '',
      dadosNovos: JSON.stringify(cond),
    });

    closeModal('modalCondutor');
    this.render();
    showToast(`Condutor ${isEdit ? 'atualizado' : 'cadastrado'} com sucesso!`);
    DASH.render();
  },

  async remove(id) {
    const c = getCondutorById(id);
    const ok = await showConfirm(`Excluir condutor ${c?.nome}?`);
    if (!ok) return;
    addHistorico({
      tipo: 'exclusão', modulo: 'Condutores', usuario: AUTH.currentUser(),
      descricao: `Excluiu condutor ${c?.nome}`, dadosAntigos: JSON.stringify(c), dadosNovos: '',
    });
    deleteCondutor(id);
    this.render();
    showToast('Condutor removido', 'warn');
    DASH.render();
  },

  exportCSV() {
    exportCSV(this.getFiltered(), 'condutores.csv', [
      { key: 'matricula', label: 'Matricula' },
      { key: 'nome', label: 'Nome' },
      { key: 'telefone', label: 'Telefone' },
      { key: 'cnh', label: 'CNH' },
      { key: 'polo', label: 'Polo' },
      { key: 'estado', label: 'Estado' },
      { key: 'cidade', label: 'Cidade' },
    ]);
    showToast('CSV exportado!', 'info');
  },

  importCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const rows = parseCSV(ev.target.result);
      let added = 0, skipped = 0;
      rows.forEach(row => {
        const mat = (row['Matricula'] || row['matricula'] || '').trim();
        const nome = (row['Nome'] || row['nome'] || '').trim();
        if (!mat || !nome) { skipped++; return; }
        if (getCondutorByMatricula(mat)) { skipped++; return; }
        saveCondutor({
          id: uid(), nome, matricula: mat,
          telefone: row['Telefone'] || row['telefone'] || '',
          cnh: row['CNH'] || row['cnh'] || '',
          polo: row['Polo'] || row['polo'] || '',
          estado: row['Estado'] || row['estado'] || '',
          cidade: row['Cidade'] || row['cidade'] || '',
        });
        added++;
      });
      addHistorico({ tipo: 'cadastro', modulo: 'Condutores', usuario: AUTH.currentUser(), descricao: `Importou ${added} condutores via CSV`, dadosNovos: '' });
      this.render();
      showToast(`Importados ${added} condutores. ${skipped} ignorados.`, added > 0 ? 'success' : 'warn');
      e.target.value = '';
      DASH.render();
    };
    reader.readAsText(file, 'UTF-8');
  }
};