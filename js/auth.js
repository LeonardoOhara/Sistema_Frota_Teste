// ═══════════════════════════════════════
// js/auth.js — Autenticação & Sessão
// ═══════════════════════════════════════

const AUTH = {
  INACTIVITY_MS: 30 * 60 * 1000, // 30 min
  _timer: null,

  init() {
    // Verifica sessão existente
    const sess = getSession();
    if (sess && sess.user) {
      this.showApp();
    } else {
      this.showLogin();
    }

    // Botão login
    document.getElementById('btnLogin').addEventListener('click', () => this.doLogin());
    document.getElementById('loginPass').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.doLogin();
    });
    document.getElementById('loginUser').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('loginPass').focus();
    });

    // Toggle senha
    document.getElementById('togglePass').addEventListener('click', () => {
      const inp = document.getElementById('loginPass');
      const ic = document.getElementById('togglePass');
      if (inp.type === 'password') { inp.type = 'text'; ic.classList.replace('fa-eye', 'fa-eye-slash'); }
      else { inp.type = 'password'; ic.classList.replace('fa-eye-slash', 'fa-eye'); }
    });

    // Logout
    document.getElementById('btnLogout').addEventListener('click', () => this.logout());

    // Reset inactividade ao interagir
    ['mousemove', 'keydown', 'click', 'touchstart'].forEach(ev => {
      document.addEventListener(ev, () => this.resetTimer(), { passive: true });
    });
  },

  doLogin() {
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    const cfg = getConfig();
    const errEl = document.getElementById('loginError');

    if (user === 'admin' && pass === (cfg.senha || 'admin123')) {
      errEl.classList.add('hidden');
      setSession({ user, loginAt: new Date().toISOString() });
      addHistorico({ tipo: 'login', modulo: 'Auth', usuario: user, descricao: 'Login realizado com sucesso', dadosNovos: '' });
      this.showApp();
    } else {
      errEl.classList.remove('hidden');
      document.getElementById('loginPass').value = '';
    }
  },

  showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('appShell').classList.add('hidden');
    this.stopTimer();
  },

  showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appShell').classList.remove('hidden');
    this.resetTimer();
    seedDemoData();
  },

  logout() {
    const sess = getSession();
    if (sess) {
      addHistorico({ tipo: 'logout', modulo: 'Auth', usuario: sess.user, descricao: 'Logout realizado', dadosNovos: '' });
    }
    clearSession();
    this.showLogin();
    showToast('Sessão encerrada', 'info');
  },

  resetTimer() {
    this.stopTimer();
    this._timer = setTimeout(() => {
      showToast('Sessão expirada por inatividade', 'warn');
      this.logout();
    }, this.INACTIVITY_MS);
  },

  stopTimer() {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
  },

  currentUser() {
    return (getSession() || {}).user || 'admin';
  }
};