// ═══════════════════════════════════════
// js/app.js — Inicialização & Roteamento
// ═══════════════════════════════════════

const PAGES = {
  dashboard:  { title: 'Dashboard',     render: () => DASH.render() },
  motos:      { title: 'Motos',         render: () => MOTOS_MOD.render() },
  condutores: { title: 'Condutores',    render: () => COND_MOD.render() },
  mapa:       { title: 'Mapa da Frota', render: () => MAPA_MOD.render() },
  relatorios: { title: 'Relatórios',    render: () => REL_MOD.refreshPolosLocadoras() },
  historico:  { title: 'Histórico',     render: () => HIST_MOD.render() },
  config:     { title: 'Configurações', render: () => {} },
};

let currentPage = 'dashboard';

function navigateTo(page) {
  if (!PAGES[page]) return;
  currentPage = page;

  // Páginas
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.add('active');

  // Nav items sidebar
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === page);
  });

  // Bottom nav
  document.querySelectorAll('.bn-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === page);
  });

  // Título
  document.getElementById('pageTitle').textContent = PAGES[page].title;

  // Render — para o mapa, aguarda o container estar visível
  if (page === 'mapa') {
    // Pequeno delay para garantir que a seção está visível antes de inicializar o Leaflet
    setTimeout(() => {
      if (typeof PAGES[page].render === 'function') PAGES[page].render();
    }, 100);
  } else {
    if (typeof PAGES[page].render === 'function') PAGES[page].render();
  }

  // Fechar sidebar no mobile
  const sidebar = document.getElementById('sidebar');
  if (sidebar && sidebar.classList.contains('mobile-open')) {
    sidebar.classList.remove('mobile-open');
    document.querySelector('.sidebar-overlay')?.classList.remove('show');
  }
}

function initNavigation() {
  // Sidebar nav
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); navigateTo(el.dataset.page); });
  });

  // Bottom nav
  document.querySelectorAll('.bn-item[data-page]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); navigateTo(el.dataset.page); });
  });

  // Sidebar toggle (desktop)
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed');
    });
  }

  // Mobile menu
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);

  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('mobile-open');
      overlay.classList.toggle('show');
    });
  }

  overlay.addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('mobile-open');
    overlay.classList.remove('show');
  });
}

function initModules() {
  MOTOS_MOD.init();
  COND_MOD.init();
  MAPA_MOD.init();
  REL_MOD.init();
  HIST_MOD.init();
  CONFIG_MOD.init();
}

// ── BOOT ──
document.addEventListener('DOMContentLoaded', () => {
  // Init auth (handles login/session)
  AUTH.init();

  // Utils
  initModalClose();
  initDarkMode();
  startClock();
  initNavigation();

  // Seed demo data if first run
  if (typeof seedDemoData === 'function') seedDemoData();

  // Modules (safe to init even before login since they read from localStorage)
  initModules();

  // Initial dashboard render if already logged in
  const sess = getSession();
  if (sess && sess.user) {
    DASH.render();
    navigateTo('dashboard');
  }

  // Hide loading screen
  setTimeout(() => {
    const ls = document.getElementById('loadingScreen');
    if (ls) {
      ls.classList.add('hide');
      setTimeout(() => ls.remove(), 600);
    }
  }, 1800);

  // Re-render dashboard when returning to it
  document.querySelectorAll('[data-page="dashboard"]').forEach(el => {
    el.addEventListener('click', () => {
      setTimeout(() => DASH.render(), 50);
    });
  });
});

// Auto-refresh dashboard every 60s
setInterval(() => {
  if (currentPage === 'dashboard' && getSession()) DASH.render();
}, 60000);
