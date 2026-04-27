// ═══════════════════════════════════════
// js/data.js — Data layer & localStorage
// ═══════════════════════════════════════

const DB = {
  MOTOS: 'motofleet_motos',
  CONDUTORES: 'motofleet_condutores',
  HISTORICO: 'motofleet_historico',
  CONFIG: 'motofleet_config',
  SESSION: 'motofleet_session',
};

// ── GENERIC CRUD ──
function dbGet(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}
function dbSet(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function dbGetObj(key, def = {}) {
  try { return JSON.parse(localStorage.getItem(key)) || def; }
  catch { return def; }
}
function dbSetObj(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── MOTOS ──
function getMotos() { return dbGet(DB.MOTOS); }
function setMotos(arr) { dbSet(DB.MOTOS, arr); }
function getMotoById(id) { return getMotos().find(m => m.id === id); }
function saveMoto(moto) {
  const all = getMotos();
  const idx = all.findIndex(m => m.id === moto.id);
  if (idx >= 0) all[idx] = moto; else all.push(moto);
  setMotos(all);
}
function deleteMoto(id) { setMotos(getMotos().filter(m => m.id !== id)); }

// ── CONDUTORES ──
function getCondutores() { return dbGet(DB.CONDUTORES); }
function setCondutores(arr) { dbSet(DB.CONDUTORES, arr); }
function getCondutorById(id) { return getCondutores().find(c => c.id === id); }
function getCondutorByMatricula(mat) { return getCondutores().find(c => c.matricula === mat); }
function saveCondutor(c) {
  const all = getCondutores();
  const idx = all.findIndex(x => x.id === c.id);
  if (idx >= 0) all[idx] = c; else all.push(c);
  setCondutores(all);
}
function deleteCondutor(id) { setCondutores(getCondutores().filter(c => c.id !== id)); }

// ── HISTÓRICO ──
function getHistorico() { return dbGet(DB.HISTORICO); }
function addHistorico(entry) {
  const all = getHistorico();
  all.unshift({ ...entry, id: uid(), ts: new Date().toISOString() });
  // manter apenas 2000 registros
  if (all.length > 2000) all.length = 2000;
  dbSet(DB.HISTORICO, all);
}

// ── CONFIG ──
function getConfig() {
  return dbGetObj(DB.CONFIG, { sla: 48, slaCustom: null, senha: 'admin123', darkMode: true });
}
function saveConfig(cfg) { dbSetObj(DB.CONFIG, cfg); }

// ── SESSÃO ──
function getSession() { return dbGetObj(DB.SESSION, null); }
function setSession(s) { dbSetObj(DB.SESSION, s); }
function clearSession() { localStorage.removeItem(DB.SESSION); }

// ── UTILS ──
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// ── ESTADOS DO BRASIL ──
const ESTADOS = [
  { uf: 'AC', nome: 'Acre' },
  { uf: 'AL', nome: 'Alagoas' },
  { uf: 'AP', nome: 'Amapá' },
  { uf: 'AM', nome: 'Amazonas' },
  { uf: 'BA', nome: 'Bahia' },
  { uf: 'CE', nome: 'Ceará' },
  { uf: 'DF', nome: 'Distrito Federal' },
  { uf: 'ES', nome: 'Espírito Santo' },
  { uf: 'GO', nome: 'Goiás' },
  { uf: 'MA', nome: 'Maranhão' },
  { uf: 'MT', nome: 'Mato Grosso' },
  { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'MG', nome: 'Minas Gerais' },
  { uf: 'PA', nome: 'Pará' },
  { uf: 'PB', nome: 'Paraíba' },
  { uf: 'PR', nome: 'Paraná' },
  { uf: 'PE', nome: 'Pernambuco' },
  { uf: 'PI', nome: 'Piauí' },
  { uf: 'RJ', nome: 'Rio de Janeiro' },
  { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'RS', nome: 'Rio Grande do Sul' },
  { uf: 'RO', nome: 'Rondônia' },
  { uf: 'RR', nome: 'Roraima' },
  { uf: 'SC', nome: 'Santa Catarina' },
  { uf: 'SP', nome: 'São Paulo' },
  { uf: 'SE', nome: 'Sergipe' },
  { uf: 'TO', nome: 'Tocantins' },
];

const STATUS_LIST = [
  'Disponível',
  'Em uso',
  'Pronta',
  'Aguardando agendamento',
  'Agendado',
  'Aguardando guincho',
  'Em manutenção',
  'Inativa',
];

function statusBadge(status) {
  const map = {
    'Disponível': 'badge-green',
    'Em uso': 'badge-blue',
    'Pronta': 'badge-teal',
    'Aguardando agendamento': 'badge-yellow',
    'Agendado': 'badge-purple',
    'Aguardando guincho': 'badge-orange',
    'Em manutenção': 'badge-red',
    'Inativa': 'badge-gray',
  };
  return `<span class="badge ${map[status] || 'badge-gray'}">${status}</span>`;
}

function slaHoras(dataEntrada) {
  if (!dataEntrada) return null;
  const entrada = new Date(dataEntrada + 'T00:00:00');
  const agora = new Date();
  const diff = agora - entrada;
  return Math.floor(diff / (1000 * 60 * 60));
}

function slaLabel(horas) {
  if (horas === null) return '—';
  const cfg = getConfig();
  const limite = cfg.sla === 'custom' ? (cfg.slaCustom || 48) : Number(cfg.sla);
  const dias = (horas / 24).toFixed(1);
  const label = horas < 24 ? `${horas}h` : `${dias}d`;
  if (horas > limite) return `<span class="sla-over"><i class="fa-solid fa-triangle-exclamation"></i> ${label}</span>`;
  if (horas > limite * 0.7) return `<span class="sla-warn"><i class="fa-solid fa-clock"></i> ${label}</span>`;
  return `<span class="sla-ok"><i class="fa-solid fa-circle-check"></i> ${label}</span>`;
}

// Seed de dados demo
function seedDemoData() {
  if (getCondutores().length > 0) return;
  const condutores = [
    { id: uid(), nome: 'Carlos Andrade', matricula: '00101', telefone: '(11) 98765-4321', cnh: '12345678900', polo: 'Polo SP Centro', estado: 'SP', cidade: 'São Paulo' },
    { id: uid(), nome: 'Fernanda Lima', matricula: '00102', telefone: '(21) 99876-5432', cnh: '98765432100', polo: 'Polo RJ Sul', estado: 'RJ', cidade: 'Rio de Janeiro' },
    { id: uid(), nome: 'Rafael Costa', matricula: '00103', telefone: '(71) 97654-3210', cnh: '55544433300', polo: 'Polo BA Norte', estado: 'BA', cidade: 'Salvador' },
    { id: uid(), nome: 'Juliana Souza', matricula: '00104', telefone: '(31) 96543-2109', cnh: '11122233300', polo: 'Polo MG Leste', estado: 'MG', cidade: 'Belo Horizonte' },
    { id: uid(), nome: 'Thiago Mendes', matricula: '00105', telefone: '(85) 95432-1098', cnh: '44455566600', polo: 'Polo CE Oeste', estado: 'CE', cidade: 'Fortaleza' },
  ];
  setCondutores(condutores);

  const c = condutores;
  const motos = [
    { id: uid(), placa: 'ABC-1234', modelo: 'Honda CG 160', locadora: 'MotoRent', dataRet: '2025-01-10', dataDev: '2026-06-10', dataManut: '2026-04-01', estado: 'SP', cidade: 'São Paulo', status: 'Em manutenção', obs: 'Troca de correia', condutorId: c[0].id, condutorNome: c[0].nome, matricula: c[0].matricula },
    { id: uid(), placa: 'DEF-5678', modelo: 'Yamaha Factor 150', locadora: 'LocaMoto', dataRet: '2025-03-15', dataDev: '2026-09-15', dataManut: '', estado: 'RJ', cidade: 'Rio de Janeiro', status: 'Disponível', obs: '', condutorId: c[1].id, condutorNome: c[1].nome, matricula: c[1].matricula },
    { id: uid(), placa: 'GHI-9012', modelo: 'Suzuki Burgman 125', locadora: 'MotoRent', dataRet: '2025-02-20', dataDev: '2026-08-20', dataManut: '2026-04-10', estado: 'BA', cidade: 'Salvador', status: 'Aguardando guincho', obs: 'Acidente leve', condutorId: c[2].id, condutorNome: c[2].nome, matricula: c[2].matricula },
    { id: uid(), placa: 'JKL-3456', modelo: 'Honda CB 300R', locadora: 'FastMoto', dataRet: '2025-04-01', dataDev: '2026-10-01', dataManut: '', estado: 'MG', cidade: 'Belo Horizonte', status: 'Pronta', obs: '', condutorId: c[3].id, condutorNome: c[3].nome, matricula: c[3].matricula },
    { id: uid(), placa: 'MNO-7890', modelo: 'Kawasaki Z300', locadora: 'LocaMoto', dataRet: '2025-05-05', dataDev: '2026-11-05', dataManut: '2026-04-20', estado: 'CE', cidade: 'Fortaleza', status: 'Agendado', obs: 'Revisão programada', condutorId: c[4].id, condutorNome: c[4].nome, matricula: c[4].matricula },
    { id: uid(), placa: 'PQR-1122', modelo: 'Honda CG 160', locadora: 'MotoRent', dataRet: '2025-01-20', dataDev: '2026-07-20', dataManut: '', estado: 'SP', cidade: 'Campinas', status: 'Em uso', obs: '', condutorId: '', condutorNome: '', matricula: '' },
    { id: uid(), placa: 'STU-3344', modelo: 'Yamaha Fazer 250', locadora: 'FastMoto', dataRet: '2025-06-01', dataDev: '2027-01-01', dataManut: '2026-03-15', estado: 'RS', cidade: 'Porto Alegre', status: 'Em manutenção', obs: 'Motor', condutorId: '', condutorNome: '', matricula: '' },
    { id: uid(), placa: 'VWX-5566', modelo: 'Honda Pop 110i', locadora: 'LocaMoto', dataRet: '2025-02-10', dataDev: '2026-08-10', dataManut: '', estado: 'PR', cidade: 'Curitiba', status: 'Aguardando agendamento', obs: '', condutorId: '', condutorNome: '', matricula: '' },
  ];
  setMotos(motos);

  addHistorico({ tipo: 'cadastro', modulo: 'Sistema', usuario: 'admin', descricao: 'Dados de demonstração carregados', dadosNovos: '' });
}