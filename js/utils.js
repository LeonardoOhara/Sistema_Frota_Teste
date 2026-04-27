// ═══════════════════════════════════════
// js/utils.js — Utilitários globais
// ═══════════════════════════════════════

// ── TOAST ──
function showToast(msg, type = 'success', duration = 3500) {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warn: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => {
    el.classList.add('hide');
    setTimeout(() => el.remove(), 350);
  }, duration);
}

// ── CONFIRM MODAL ──
function showConfirm(msg) {
  return new Promise(resolve => {
    document.getElementById('confirmMsg').textContent = msg;
    openModal('modalConfirm');
    const yes = document.getElementById('confirmYes');
    const no = document.getElementById('confirmNo');
    const cleanup = (val) => {
      closeModal('modalConfirm');
      yes.replaceWith(yes.cloneNode(true));
      no.replaceWith(no.cloneNode(true));
      resolve(val);
    };
    document.getElementById('confirmYes').addEventListener('click', () => cleanup(true));
    document.getElementById('confirmNo').addEventListener('click', () => cleanup(false));
  });
}

// ── MODALS ──
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// ── PAGINAÇÃO ──
function renderPagination(containerId, total, page, perPage, onPage) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) { container.innerHTML = ''; return; }

  let html = '';
  html += `<button class="pg-btn" data-p="${Math.max(1, page - 1)}"><i class="fa-solid fa-chevron-left"></i></button>`;
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, page + 2);
  if (start > 1) html += `<button class="pg-btn" data-p="1">1</button>${start > 2 ? '<span class="pg-info">…</span>' : ''}`;
  for (let i = start; i <= end; i++) {
    html += `<button class="pg-btn${i === page ? ' active' : ''}" data-p="${i}">${i}</button>`;
  }
  if (end < pages) html += `${end < pages - 1 ? '<span class="pg-info">…</span>' : ''}<button class="pg-btn" data-p="${pages}">${pages}</button>`;
  html += `<button class="pg-btn" data-p="${Math.min(pages, page + 1)}"><i class="fa-solid fa-chevron-right"></i></button>`;
  html += `<span class="pg-info">${total} registros</span>`;

  container.innerHTML = html;
  container.querySelectorAll('.pg-btn').forEach(btn => {
    btn.addEventListener('click', () => onPage(Number(btn.dataset.p)));
  });
}

// ── CSV EXPORT ──
function exportCSV(data, filename, cols) {
  const header = cols.map(c => c.label).join(';');
  const rows = data.map(row => cols.map(c => `"${(row[c.key] || '').toString().replace(/"/g, '""')}"`).join(';'));
  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── PARSE CSV ──
function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(';').map(h => h.replace(/"/g, '').trim());
  return lines.slice(1).map(line => {
    const vals = line.split(';').map(v => v.replace(/"/g, '').trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
}

// ── FORMAT DATE ──
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR');
}
function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR');
}

// ── POPULATE SELECT WITH ESTADOS ──
function populateEstadoSelect(selectEl) {
  selectEl.innerHTML = '<option value="">Selecione…</option>' +
    ESTADOS.map(e => `<option value="${e.uf}">${e.uf} — ${e.nome}</option>`).join('');
}

// ── CLOCK ──
function startClock() {
  const el = document.getElementById('clockDisplay');
  function tick() {
    el.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  tick();
  setInterval(tick, 1000);
}

// ── MODAL CLOSE BUTTONS ──
function initModalClose() {
  document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.modal;
      if (id) closeModal(id);
    });
  });
  // Fechar clicando fora
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', e => {
      if (e.target === ov) ov.classList.add('hidden');
    });
  });
}

// ── DARK MODE ──
function initDarkMode() {
  const cfg = getConfig();
  if (!cfg.darkMode) document.body.classList.add('light');
  document.getElementById('darkModeToggle').addEventListener('click', () => {
    document.body.classList.toggle('light');
    const isDark = !document.body.classList.contains('light');
    const c = getConfig(); c.darkMode = isDark; saveConfig(c);
    const ic = document.querySelector('#darkModeToggle i');
    ic.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  });
}