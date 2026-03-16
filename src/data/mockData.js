// ═══════════════════════════════════════════════════════════════════════════
// PAYRAIL — MOCK DATA & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const STATUSES = {
  DRAFT: 'draft',
  IN_APPROVAL: 'in_approval',
  AWAITING_FINANCE: 'awaiting_finance',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  REJECTED: 'rejected',
  RECALLED: 'recalled',
};

export const STATUS_CONFIG = {
  [STATUSES.DRAFT]:            { label: 'Draft',            tw: 'bg-white/[0.06] text-textSecondary border-transparent' },
  [STATUSES.IN_APPROVAL]:      { label: 'In Approval',     tw: 'bg-accentPurple/[0.12] text-accentPurple border-transparent' },
  [STATUSES.AWAITING_FINANCE]: { label: 'Awaiting Finance', tw: 'bg-accentAmber/[0.12] text-accentAmber border-transparent' },
  [STATUSES.PARTIALLY_PAID]:   { label: 'Partially Paid',  tw: 'bg-accentAmber/[0.12] text-accentAmber border-transparent' },
  [STATUSES.PAID]:             { label: 'Paid',            tw: 'bg-accentEmerald/[0.12] text-accentEmerald border-transparent' },
  [STATUSES.REJECTED]:         { label: 'Rejected',        tw: 'bg-accentRose/[0.12] text-accentRose border-transparent' },
  [STATUSES.RECALLED]:         { label: 'Recalled',        tw: 'bg-accentRose/[0.12] text-accentRose border-transparent' },
};

export const CATEGORY_COLORS = {
  Operations:  { dot: 'bg-accentEmerald', text: 'text-accentEmerald' },
  Capex:       { dot: 'bg-accentAmber',   text: 'text-accentAmber' },
  Maintenance: { dot: 'bg-accentBlue',    text: 'text-accentBlue' },
  Procurement: { dot: 'bg-accentPurple',  text: 'text-accentPurple' },
};

// ═══ COMPANIES ═══
export const MOCK_COMPANIES = [
  {
    id: 'c1',
    name: 'QuickMove Logistics',
    tag: 'QML',
    active: true,
    procurementEnabled: true,
    enabledCategories: ['Operations', 'Capex'],
  },
  {
    id: 'c2',
    name: 'Aerocool Solutions',
    tag: 'ACS',
    active: true,
    procurementEnabled: true,
    enabledCategories: ['Maintenance', 'Procurement'],
  },
  {
    id: 'c3',
    name: 'PrimeVault Finance',
    tag: 'PVF',
    active: true,
    procurementEnabled: false,
    enabledCategories: ['Operations'],
  },
];

// ═══ USERS ═══
export const MOCK_USERS = [
  { id: 'u1',  name: 'Sunday Ajayi',   email: 'sunday@payrail.local',     avatar: 'SA', role: 'Admin',       companies: ['c1', 'c2', 'c3'], active: true, lastActive: '2026-03-14T11:45:00.000Z', desc: 'Admin — full access' },
  { id: 'u2',  name: 'Emeka Obi',      email: 'emeka@quickmove.com',       avatar: 'EO', role: 'Supervisor',  companies: ['c1'],             active: true, lastActive: '2026-03-14T10:15:00.000Z', desc: 'QML Supervisor' },
  { id: 'u3',  name: 'Bola Adeyemi',   email: 'bola@quickmove.com',        avatar: 'BA', role: 'Head of Ops', companies: ['c1'],             active: true, lastActive: '2026-03-14T09:05:00.000Z', desc: 'QML Head of Ops' },
  { id: 'u4',  name: 'Tunde Bakare',   email: 'tunde@payrail.local',       avatar: 'TB', role: 'CFO',         companies: ['c1', 'c2'],       active: true, lastActive: '2026-03-14T08:55:00.000Z', desc: 'CFO — QML & ACS' },
  { id: 'u5',  name: 'Dayo Ogundimu',  email: 'dayo@quickmove.com',        avatar: 'DO', role: 'CEO',         companies: ['c1'],             active: true, lastActive: '2026-03-13T17:20:00.000Z', desc: 'QML CEO / MD' },
  { id: 'u6',  name: 'Ngozi Eze',      email: 'ngozi@payrail.local',       avatar: 'NE', role: 'Finance',     companies: ['c1', 'c2', 'c3'], active: true, lastActive: '2026-03-14T12:10:00.000Z', desc: 'Finance — all companies' },
  { id: 'u7',  name: 'Kalu Nwachukwu', email: 'kalu@aerocool.com',         avatar: 'KN', role: 'Team Lead',   companies: ['c2'],             active: true, lastActive: '2026-03-14T11:30:00.000Z', desc: 'ACS Team Lead' },
  { id: 'u8',  name: 'Amina Ibrahim',  email: 'amina@aerocool.com',        avatar: 'AI', role: 'Ops Manager', companies: ['c2'],             active: true, lastActive: '2026-03-13T16:40:00.000Z', desc: 'ACS Ops Manager' },
  { id: 'u9',  name: 'Femi Adegoke',   email: 'femi@aerocool.com',         avatar: 'FA', role: 'MD',          companies: ['c2'],             active: true, lastActive: '2026-03-13T15:10:00.000Z', desc: 'ACS Managing Director' },
  { id: 'u10', name: 'Chidera Okoro',  email: 'chidera@primevault.com',    avatar: 'CO', role: 'Supervisor',  companies: ['c3'],             active: true, lastActive: '2026-03-14T07:50:00.000Z', desc: 'PVF Supervisor' },
  { id: 'u11', name: 'Yusuf Bello',    email: 'yusuf@primevault.com',      avatar: 'YB', role: 'Head of Ops', companies: ['c3'],             active: true, lastActive: '2026-03-14T06:15:00.000Z', desc: 'PVF Head of Ops' },
];

// ═══ CATEGORIES ═══
export const MOCK_CATEGORIES = ['Operations', 'Capex', 'Maintenance', 'Procurement'];

// ═══ BANKS ═══
export const BANKS = [
  'Access Bank', 'GTBank', 'First Bank', 'UBA', 'Zenith Bank',
  'Stanbic IBTC', 'Wema Bank', 'Sterling Bank', 'Fidelity Bank', 'FCMB',
];

// ═══ POLICIES ═══
export const POLICIES = [
  // QuickMove Logistics
  { id: 'p1', companyId: 'c1', name: 'Ops ≤ ₦500K', category: 'Operations', min: 0, max: 500000,
    steps: ['Supervisor', 'Head of Ops'], requiresFinance: true,
    requiredQuotes: 0, quoteRuleLabel: null, requireJustificationIfNotLowest: false, allowSingleSourceException: false,
    active: true, version: 1 },
  { id: 'p2', companyId: 'c1', name: 'Ops ₦500K–₦2M', category: 'Operations', min: 500001, max: 2000000,
    steps: ['Supervisor', 'Head of Ops', 'CFO'], requiresFinance: true,
    requiredQuotes: 2, quoteRuleLabel: 'This request requires 2 competitive quotes for operations above ₦500K',
    requireJustificationIfNotLowest: true, allowSingleSourceException: false,
    active: true, version: 1 },
  { id: 'p3', companyId: 'c1', name: 'Capex ≤ ₦5M', category: 'Capex', min: 0, max: 5000000,
    steps: ['Supervisor', 'Head of Ops', 'CFO'], requiresFinance: true,
    requiredQuotes: 2, quoteRuleLabel: 'This request requires 2 competitive quotes for capital expenditure',
    requireJustificationIfNotLowest: true, allowSingleSourceException: false,
    active: true, version: 1 },
  { id: 'p4', companyId: 'c1', name: 'Capex > ₦5M', category: 'Capex', min: 5000001, max: 999999999,
    steps: ['Supervisor', 'Head of Ops', 'CFO', 'CEO'], requiresFinance: true,
    requiredQuotes: 3, quoteRuleLabel: 'This request requires 3 competitive quotes for capital expenditure above ₦5M',
    requireJustificationIfNotLowest: true, allowSingleSourceException: true,
    active: true, version: 1 },
  // Aerocool Solutions
  { id: 'p5', companyId: 'c2', name: 'Maintenance ≤ ₦200K', category: 'Maintenance', min: 0, max: 200000,
    steps: ['Team Lead'], requiresFinance: true,
    requiredQuotes: 0, quoteRuleLabel: null, requireJustificationIfNotLowest: false, allowSingleSourceException: false,
    active: true, version: 1 },
  { id: 'p6', companyId: 'c2', name: 'Maintenance > ₦200K', category: 'Maintenance', min: 200001, max: 999999999,
    steps: ['Team Lead', 'Ops Manager', 'MD'], requiresFinance: true,
    requiredQuotes: 2, quoteRuleLabel: 'This request requires 2 competitive quotes for maintenance above ₦200K',
    requireJustificationIfNotLowest: true, allowSingleSourceException: false,
    active: true, version: 1 },
  { id: 'p7', companyId: 'c2', name: 'Procurement ₦200K–₦1M', category: 'Procurement', min: 200001, max: 1000000,
    steps: ['Team Lead', 'Ops Manager', 'MD'], requiresFinance: true,
    requiredQuotes: 3, quoteRuleLabel: 'This request requires 3 competitive quotes for procurement compliance',
    requireJustificationIfNotLowest: true, allowSingleSourceException: false,
    active: true, version: 1 },
  { id: 'p8', companyId: 'c2', name: 'Procurement > ₦1M', category: 'Procurement', min: 1000001, max: 999999999,
    steps: ['Team Lead', 'Ops Manager', 'MD'], requiresFinance: true,
    requiredQuotes: 4, quoteRuleLabel: 'This request requires 4 quotations for high-value procurement compliance',
    requireJustificationIfNotLowest: true, allowSingleSourceException: true,
    active: true, version: 1 },
  // PrimeVault Finance
  { id: 'p9', companyId: 'c3', name: 'Ops ≤ ₦300K', category: 'Operations', min: 0, max: 300000,
    steps: ['Supervisor', 'Head of Ops'], requiresFinance: true,
    requiredQuotes: 0, quoteRuleLabel: null, requireJustificationIfNotLowest: false, allowSingleSourceException: false,
    active: true, version: 1 },
  { id: 'p10', companyId: 'c3', name: 'Ops > ₦300K', category: 'Operations', min: 300001, max: 999999999,
    steps: ['Supervisor', 'Head of Ops'], requiresFinance: true,
    requiredQuotes: 2, quoteRuleLabel: 'This request requires 2 competitive quotes for operations above ₦300K',
    requireJustificationIfNotLowest: true, allowSingleSourceException: false,
    active: true, version: 1 },
];

export const INITIAL_REQUEST_RULES = {
  allowRecall: true,
  allowResubmission: true,
  requestIdMode: 'company_tag',
  auditRetentionDays: 365,
};

export const INITIAL_SAVED_ACCOUNTS = [
  {
    id: 'sa-1',
    userId: 'u1',
    payeeName: 'NNPC Retail Depot',
    bankName: 'Zenith Bank',
    accountNumber: '2034567890',
    createdAt: '2026-03-10T09:10:00.000Z',
    lastUsedAt: '2026-03-13T08:30:00.000Z',
  },
  {
    id: 'sa-2',
    userId: 'u7',
    payeeName: 'CoolGas Nigeria',
    bankName: 'Sterling Bank',
    accountNumber: '0123498765',
    createdAt: '2026-03-08T10:00:00.000Z',
    lastUsedAt: '2026-03-14T11:20:00.000Z',
  },
  {
    id: 'sa-3',
    userId: 'u10',
    payeeName: 'OfficeHub Nigeria',
    bankName: 'Access Bank',
    accountNumber: '0145678901',
    createdAt: '2026-03-05T12:15:00.000Z',
    lastUsedAt: '2026-03-13T09:15:00.000Z',
  },
];

export const INITIAL_SETTINGS_AUDIT_LOG = [
  {
    id: 'audit-1',
    module: 'policies',
    entityType: 'policy',
    entityId: 'p8',
    action: 'created',
    changedByUserId: 'u1',
    summary: 'Created Aerocool high-value procurement policy',
    createdAt: '2026-03-14T08:00:00.000Z',
  },
  {
    id: 'audit-2',
    module: 'users',
    entityType: 'user',
    entityId: 'u11',
    action: 'updated',
    changedByUserId: 'u1',
    summary: 'Assigned Yusuf Bello to PrimeVault Finance',
    createdAt: '2026-03-14T09:30:00.000Z',
  },
];

// ═══ HELPERS ═══
export const generateId = () => Math.random().toString(36).substr(2, 9);
export const generateRef = () => 'PAY-' + Math.random().toString(36).slice(2, 8).toUpperCase();

export const formatNaira = (n) =>
  '₦' + Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 });

export const formatNairaCompact = (n) => {
  const num = Number(n);
  if (num >= 1_000_000) return '₦' + (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return '₦' + (num / 1_000).toFixed(0) + 'K';
  return '₦' + num.toLocaleString('en-NG');
};

export const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatTime = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDateTime = (d) => {
  if (!d) return '';
  return `${formatDate(d)} ${formatTime(d)}`;
};

export const getMatchedPolicy = (companyId, category, amount, policies = POLICIES) => {
  return policies.find(
    p => (p.active ?? true) && p.companyId === companyId && p.category === category && amount >= p.min && amount <= p.max
  ) || null;
};

export const getCategoriesForCompany = (companyId, policies = POLICIES, companies = MOCK_COMPANIES) => {
  const company = companies.find(c => c.id === companyId);
  if (company?.enabledCategories?.length) return company.enabledCategories;
  const cats = new Set();
  policies.filter(p => (p.active ?? true) && p.companyId === companyId).forEach(p => cats.add(p.category));
  return [...cats];
};

export const getLowestQuoteIndex = (quotes) => {
  if (!quotes || quotes.length === 0) return -1;
  let idx = 0, lowest = Number(quotes[0].amount) || Infinity;
  for (let i = 1; i < quotes.length; i++) {
    const amt = Number(quotes[i].amount) || Infinity;
    if (amt < lowest) { lowest = amt; idx = i; }
  }
  return idx;
};

export const getUserById = (id, users = MOCK_USERS) => users.find(u => u.id === id);
export const getCompanyById = (id, companies = MOCK_COMPANIES) => companies.find(c => c.id === id);

// ═══ PERMISSION HELPERS ═══
export const canActOnStep = (user, request) => {
  if (request.status !== STATUSES.IN_APPROVAL) return false;
  if (user.role === 'Admin') return true;
  const currentStep = request.route?.[request.currentStepIndex];
  if (!currentStep || currentStep.status !== 'pending') return false;
  if (!user.companies.includes(request.companyId)) return false;
  return user.role === currentStep.role;
};

export const canPayLineItem = (user, request) => {
  if (!['awaiting_finance', 'partially_paid'].includes(request.status)) return false;
  if (user.role === 'Admin') return true;
  return user.role === 'Finance' && user.companies.includes(request.companyId);
};

export const canRecall = (user, request) => {
  if (request.status !== STATUSES.IN_APPROVAL) return false;
  return user.role === 'Admin' || request.requesterId === user.id;
};

export const canResubmit = (user, request) => {
  if (![STATUSES.REJECTED, STATUSES.RECALLED].includes(request.status)) return false;
  return user.role === 'Admin' || request.requesterId === user.id;
};

export const getMyActions = (requests, user) => {
  return requests.filter(r => {
    if (canActOnStep(user, r)) return true;
    if (canPayLineItem(user, r) && r.payees.some(p => !p.isPaid)) return true;
    return false;
  });
};

export const getDashboardStats = (requests, user) => {
  const isFinance = user.role === 'Finance' || user.role === 'Admin';
  const visible = user.role === 'Admin'
    ? requests
    : requests.filter(r => user.companies.includes(r.companyId));

  const totalValue = visible.reduce((s, r) => s + r.amount, 0);
  const disbursed = visible.reduce(
    (s, r) => s + r.payees.filter(p => p.isPaid).reduce((a, p) => a + p.amount, 0), 0
  );
  const totalPayees = visible.reduce((s, r) => s + r.payees.length, 0);
  const paidPayees = visible.reduce((s, r) => s + r.payees.filter(p => p.isPaid).length, 0);

  const byStatus = {};
  for (const key of Object.keys(STATUS_CONFIG)) {
    const matching = visible.filter(r => r.status === key);
    byStatus[key] = { count: matching.length, volume: matching.reduce((s, r) => s + r.amount, 0) };
  }

  return {
    totalValue, disbursed, pending: totalValue - disbursed,
    disbursedPct: totalValue > 0 ? Math.round((disbursed / totalValue) * 100) : 0,
    totalPayees, paidPayees, requestCount: visible.length,
    byStatus, actionable: getMyActions(visible, user).length, isFinance,
  };
};

// ═══ SEED DATA ═══
const now = Date.now();
const hour = 3600000;
const day = 86400000;

export const INITIAL_REQUESTS = [
  {
    id: 'QML-078', companyId: 'c1', companyName: 'QuickMove Logistics', companyTag: 'QML',
    category: 'Operations', description: 'Diesel supply — March fleet refuel across 3 depots',
    amount: 1250000, status: STATUSES.IN_APPROVAL, policyId: 'p2', policyName: 'Ops ₦500K–₦2M',
    requesterId: 'u2', date: new Date(now - 1 * day).toISOString(),
    route: [
      { step: 1, role: 'Supervisor',  status: 'approved', actorId: 'u2', date: new Date(now - 1 * day + 1 * hour).toISOString() },
      { step: 2, role: 'Head of Ops', status: 'approved', actorId: 'u3', date: new Date(now - 1 * day + 3 * hour).toISOString() },
      { step: 3, role: 'CFO',         status: 'pending' },
    ],
    currentStepIndex: 2,
    payees: [{ id: 'p1-l0', name: 'NNPC Retail Depot', bank: 'Zenith Bank', accountNumber: '2034567890', amount: 1250000, isPaid: false }],
    quotes: [
      { id: 'q1', vendor: 'TotalEnergies Depot', amount: 1250000, quoteRef: 'TE-2026-0412', validityDate: '2026-03-20', notes: 'Bulk rate for 5000L', selected: true },
      { id: 'q2', vendor: 'MRS Oil Nigeria',     amount: 1380000, quoteRef: 'MRS-Q-887',     validityDate: '2026-03-25', notes: 'Includes delivery',  selected: false },
    ],
    quoteJustification: '',
    timeline: [
      { id: 't1', action: 'Submitted',            actorId: 'u2',     date: new Date(now - 1 * day).toISOString(), note: 'Policy: Ops ₦500K–₦2M' },
      { id: 't2', action: 'Route generated',       actorId: 'system', date: new Date(now - 1 * day).toISOString(), note: 'Supervisor → Head of Ops → CFO → Finance' },
      { id: 't3', action: '2 vendor quotes attached', actorId: 'system', date: new Date(now - 1 * day).toISOString() },
      { id: 't4', action: 'Supervisor approved',   actorId: 'u2', role: 'Supervisor',  date: new Date(now - 1 * day + 1 * hour).toISOString() },
      { id: 't5', action: 'Head of Ops approved',  actorId: 'u3', role: 'Head of Ops', date: new Date(now - 1 * day + 3 * hour).toISOString() },
    ],
  },
  {
    id: 'QML-077', companyId: 'c1', companyName: 'QuickMove Logistics', companyTag: 'QML',
    category: 'Capex', description: 'New Hino 500 truck acquisition — Apapa depot expansion',
    amount: 8500000, status: STATUSES.AWAITING_FINANCE, policyId: 'p4', policyName: 'Capex > ₦5M',
    requesterId: 'u1', date: new Date(now - 2 * day).toISOString(),
    route: [
      { step: 1, role: 'Supervisor',  status: 'approved', actorId: 'u2', date: new Date(now - 2 * day + 1 * hour).toISOString() },
      { step: 2, role: 'Head of Ops', status: 'approved', actorId: 'u3', date: new Date(now - 2 * day + 3 * hour).toISOString() },
      { step: 3, role: 'CFO',         status: 'approved', actorId: 'u4', date: new Date(now - 2 * day + 6 * hour).toISOString() },
      { step: 4, role: 'CEO',         status: 'approved', actorId: 'u5', date: new Date(now - 2 * day + 8 * hour).toISOString() },
    ],
    currentStepIndex: 4,
    payees: [{ id: 'p2-l0', name: 'CFAO Motors Nigeria', bank: 'Stanbic IBTC', accountNumber: '0023456789', amount: 8500000, isPaid: false }],
    quotes: [
      { id: 'q3', vendor: 'CFAO Motors Nigeria', amount: 8500000, quoteRef: 'CFAO-HN500-026', validityDate: '2026-04-15', notes: '2026 model, 12-month warranty', selected: true },
      { id: 'q4', vendor: 'Mantrac Nigeria',     amount: 8200000, quoteRef: 'MNT-Q-4421',     validityDate: '2026-03-30', notes: '2025 model, 6-month warranty', selected: false },
      { id: 'q5', vendor: 'Coscharis Motors',     amount: 9100000, quoteRef: 'COS-2026-178',   validityDate: '2026-04-10', notes: '2026 model, includes first service', selected: false },
    ],
    quoteJustification: 'CFAO is the authorized Hino dealer in Nigeria with local warranty support and parts availability',
    timeline: [
      { id: 't6',  action: 'Submitted',            actorId: 'u1',     date: new Date(now - 2 * day).toISOString(), note: 'Policy: Capex > ₦5M' },
      { id: 't7',  action: 'Route generated',       actorId: 'system', date: new Date(now - 2 * day).toISOString(), note: 'Supervisor → Head of Ops → CFO → CEO → Finance' },
      { id: 't8',  action: '3 vendor quotes attached', actorId: 'system', date: new Date(now - 2 * day).toISOString() },
      { id: 't9',  action: 'Supervisor approved',   actorId: 'u2', role: 'Supervisor',  date: new Date(now - 2 * day + 1 * hour).toISOString() },
      { id: 't10', action: 'Head of Ops approved',  actorId: 'u3', role: 'Head of Ops', date: new Date(now - 2 * day + 3 * hour).toISOString() },
      { id: 't11', action: 'CFO approved',          actorId: 'u4', role: 'CFO',         date: new Date(now - 2 * day + 6 * hour).toISOString() },
      { id: 't12', action: 'CEO approved',          actorId: 'u5', role: 'CEO',         date: new Date(now - 2 * day + 8 * hour).toISOString() },
      { id: 't13', action: 'All business approvals complete', actorId: 'system', date: new Date(now - 2 * day + 8 * hour).toISOString() },
    ],
  },
  {
    id: 'QML-076', companyId: 'c1', companyName: 'QuickMove Logistics', companyTag: 'QML',
    category: 'Operations', description: 'Purchase of servicing parts for truck KRD-775-XZ and workmanship',
    amount: 385000, status: STATUSES.PAID, policyId: 'p1', policyName: 'Ops ≤ ₦500K',
    requesterId: 'u1', date: new Date(now - 3 * day).toISOString(),
    route: [
      { step: 1, role: 'Supervisor',  status: 'approved', actorId: 'u2', date: new Date(now - 3 * day + 1 * hour).toISOString() },
      { step: 2, role: 'Head of Ops', status: 'approved', actorId: 'u3', date: new Date(now - 3 * day + 2 * hour).toISOString() },
    ],
    currentStepIndex: 2,
    payees: [
      { id: 'p3-l0', name: 'Bridgestone Tyres Ltd', bank: 'GTBank',     accountNumber: '0112345678', amount: 240000, isPaid: true, paidDate: new Date(now - 3 * day + 4 * hour).toISOString(), ref: 'PAY-7GK2MN' },
      { id: 'p3-l1', name: 'AutoFix Workshop',      bank: 'Access Bank', accountNumber: '0098765432', amount: 145000, isPaid: true, paidDate: new Date(now - 3 * day + 4.1 * hour).toISOString(), ref: 'PAY-8BQ4RT' },
    ],
    quotes: [], quoteJustification: '',
    timeline: [
      { id: 't14', action: 'Submitted',            actorId: 'u1',     date: new Date(now - 3 * day).toISOString(), note: 'Policy: Ops ≤ ₦500K' },
      { id: 't15', action: 'Route generated',       actorId: 'system', date: new Date(now - 3 * day).toISOString(), note: 'Supervisor → Head of Ops → Finance' },
      { id: 't16', action: 'Supervisor approved',   actorId: 'u2', role: 'Supervisor',  date: new Date(now - 3 * day + 1 * hour).toISOString() },
      { id: 't17', action: 'Head of Ops approved',  actorId: 'u3', role: 'Head of Ops', date: new Date(now - 3 * day + 2 * hour).toISOString() },
      { id: 't18', action: 'All business approvals complete', actorId: 'system', date: new Date(now - 3 * day + 2 * hour).toISOString() },
      { id: 't19', action: 'Paid: Bridgestone Tyres Ltd', actorId: 'u6', role: 'Finance', date: new Date(now - 3 * day + 4 * hour).toISOString(), note: 'GTBank · ₦240,000' },
      { id: 't20', action: 'Paid: AutoFix Workshop',      actorId: 'u6', role: 'Finance', date: new Date(now - 3 * day + 4.1 * hour).toISOString(), note: 'Access Bank · ₦145,000' },
      { id: 't21', action: 'All payments complete', actorId: 'system', date: new Date(now - 3 * day + 4.1 * hour).toISOString() },
    ],
  },
  {
    id: 'ACS-042', companyId: 'c2', companyName: 'Aerocool Solutions', companyTag: 'ACS',
    category: 'Maintenance', description: 'AC unit servicing — Lekki Phase 1 office block A & B',
    amount: 185000, status: STATUSES.PARTIALLY_PAID, policyId: 'p5', policyName: 'Maintenance ≤ ₦200K',
    requesterId: 'u7', date: new Date(now - 1 * day).toISOString(),
    route: [{ step: 1, role: 'Team Lead', status: 'approved', actorId: 'u7', date: new Date(now - 1 * day + 1 * hour).toISOString() }],
    currentStepIndex: 1,
    payees: [
      { id: 'p4-l0', name: 'Daikin Parts Ng',    bank: 'First Bank', accountNumber: '3012345678', amount: 75000,  isPaid: true,  paidDate: new Date(now - 0.5 * day).toISOString(), ref: 'PAY-3WK8NP' },
      { id: 'p4-l1', name: 'CoolAir Contractors', bank: 'UBA',        accountNumber: '2098765432', amount: 65000,  isPaid: true,  paidDate: new Date(now - 0.48 * day).toISOString(), ref: 'PAY-5JM2QR' },
      { id: 'p4-l2', name: 'ElectriFix Services', bank: 'Wema Bank',  accountNumber: '0187654321', amount: 45000,  isPaid: false },
    ],
    quotes: [], quoteJustification: '',
    timeline: [
      { id: 't22', action: 'Submitted',            actorId: 'u7',     date: new Date(now - 1 * day).toISOString(), note: 'Policy: Maintenance ≤ ₦200K' },
      { id: 't23', action: 'Route generated',       actorId: 'system', date: new Date(now - 1 * day).toISOString(), note: 'Team Lead → Finance' },
      { id: 't24', action: 'Team Lead approved',    actorId: 'u7', role: 'Team Lead', date: new Date(now - 1 * day + 1 * hour).toISOString() },
      { id: 't25', action: 'All business approvals complete', actorId: 'system', date: new Date(now - 1 * day + 1 * hour).toISOString() },
      { id: 't26', action: 'Paid: Daikin Parts Ng',    actorId: 'u6', role: 'Finance', date: new Date(now - 0.5 * day).toISOString(), note: 'First Bank · ₦75,000' },
      { id: 't27', action: 'Paid: CoolAir Contractors', actorId: 'u6', role: 'Finance', date: new Date(now - 0.48 * day).toISOString(), note: 'UBA · ₦65,000' },
    ],
  },
  {
    id: 'ACS-041', companyId: 'c2', companyName: 'Aerocool Solutions', companyTag: 'ACS',
    category: 'Procurement', description: 'Compressor bulk order — Q2 stock replenishment',
    amount: 720000, status: STATUSES.REJECTED, policyId: 'p7', policyName: 'Procurement ₦200K–₦1M',
    requesterId: 'u7', date: new Date(now - 2 * day).toISOString(),
    route: [
      { step: 1, role: 'Team Lead',   status: 'approved', actorId: 'u7', date: new Date(now - 2 * day + 1 * hour).toISOString() },
      { step: 2, role: 'Ops Manager', status: 'approved', actorId: 'u8', date: new Date(now - 2 * day + 3 * hour).toISOString() },
      { step: 3, role: 'MD',          status: 'rejected', actorId: 'u9', date: new Date(now - 2 * day + 6 * hour).toISOString() },
    ],
    currentStepIndex: 2,
    rejectionReason: 'Get 3 competing quotes first. Only 1 quote was attached — procurement policy requires minimum 3 vendor quotations.',
    payees: [{ id: 'p5-l0', name: 'Carrier HVAC Nigeria', bank: 'FCMB', accountNumber: '4056781234', amount: 720000, isPaid: false }],
    quotes: [{ id: 'q6', vendor: 'Carrier HVAC Nigeria', amount: 720000, quoteRef: 'CHN-2026-88', validityDate: '2026-03-25', notes: 'Standard bulk rate', selected: true }],
    quoteJustification: '',
    timeline: [
      { id: 't28', action: 'Submitted',             actorId: 'u7',     date: new Date(now - 2 * day).toISOString(), note: 'Policy: Procurement ₦200K–₦1M' },
      { id: 't29', action: 'Route generated',        actorId: 'system', date: new Date(now - 2 * day).toISOString(), note: 'Team Lead → Ops Manager → MD → Finance' },
      { id: 't30', action: '1 vendor quote attached', actorId: 'system', date: new Date(now - 2 * day).toISOString() },
      { id: 't31', action: 'Team Lead approved',     actorId: 'u7', role: 'Team Lead',   date: new Date(now - 2 * day + 1 * hour).toISOString() },
      { id: 't32', action: 'Ops Manager approved',   actorId: 'u8', role: 'Ops Manager', date: new Date(now - 2 * day + 3 * hour).toISOString() },
      { id: 't33', action: 'MD rejected',            actorId: 'u9', role: 'MD',          date: new Date(now - 2 * day + 6 * hour).toISOString(), note: 'Get 3 competing quotes first.' },
    ],
  },
  {
    id: 'ACS-043', companyId: 'c2', companyName: 'Aerocool Solutions', companyTag: 'ACS',
    category: 'Procurement', description: 'Refrigerant gas supply — R410A cylinders for Q2',
    amount: 450000, status: STATUSES.IN_APPROVAL, policyId: 'p7', policyName: 'Procurement ₦200K–₦1M',
    requesterId: 'u7', date: new Date(now - 0.25 * day).toISOString(),
    route: [
      { step: 1, role: 'Team Lead',   status: 'pending' },
      { step: 2, role: 'Ops Manager', status: 'waiting' },
      { step: 3, role: 'MD',          status: 'waiting' },
    ],
    currentStepIndex: 0,
    payees: [
      { id: 'p6-l0', name: 'CoolGas Nigeria',  bank: 'Sterling Bank', accountNumber: '0123498765', amount: 280000, isPaid: false },
      { id: 'p6-l1', name: 'AirTech Supplies',  bank: 'Fidelity Bank', accountNumber: '5067891234', amount: 170000, isPaid: false },
    ],
    quotes: [
      { id: 'q7', vendor: 'CoolGas Nigeria', amount: 430000, quoteRef: 'CGN-R410-221', validityDate: '2026-03-28', notes: '10 cylinders, includes delivery', selected: false },
      { id: 'q8', vendor: 'AirTech Supplies', amount: 450000, quoteRef: 'ATS-Q-0093',  validityDate: '2026-04-05', notes: '12 cylinders, bulk pricing',     selected: true },
      { id: 'q9', vendor: 'RefriGas Ltd',     amount: 480000, quoteRef: 'RGL-2026-55',  validityDate: '2026-03-30', notes: '8 cylinders premium grade',      selected: false },
    ],
    quoteJustification: 'AirTech provides 2 additional cylinders at marginal extra cost, better value per unit',
    timeline: [
      { id: 't34', action: 'Submitted',                actorId: 'u7',     date: new Date(now - 0.25 * day).toISOString(), note: 'Policy: Procurement ₦200K–₦1M' },
      { id: 't35', action: 'Route generated',           actorId: 'system', date: new Date(now - 0.25 * day).toISOString(), note: 'Team Lead → Ops Manager → MD → Finance' },
      { id: 't36', action: '3 vendor quotes attached',  actorId: 'system', date: new Date(now - 0.25 * day).toISOString() },
    ],
  },
  {
    id: 'PVF-015', companyId: 'c3', companyName: 'PrimeVault Finance', companyTag: 'PVF',
    category: 'Operations', description: 'Office supplies and stationery — Q1 restocking',
    amount: 220000, status: STATUSES.IN_APPROVAL, policyId: 'p9', policyName: 'Ops ≤ ₦300K',
    requesterId: 'u10', date: new Date(now - 0.5 * day).toISOString(),
    route: [
      { step: 1, role: 'Supervisor',  status: 'approved', actorId: 'u10', date: new Date(now - 0.5 * day + 1 * hour).toISOString() },
      { step: 2, role: 'Head of Ops', status: 'pending' },
    ],
    currentStepIndex: 1,
    payees: [{ id: 'p7-l0', name: 'OfficeHub Nigeria', bank: 'Access Bank', accountNumber: '0145678901', amount: 220000, isPaid: false }],
    quotes: [], quoteJustification: '',
    timeline: [
      { id: 't37', action: 'Submitted',           actorId: 'u10',    date: new Date(now - 0.5 * day).toISOString(), note: 'Policy: Ops ≤ ₦300K' },
      { id: 't38', action: 'Route generated',      actorId: 'system', date: new Date(now - 0.5 * day).toISOString(), note: 'Supervisor → Head of Ops → Finance' },
      { id: 't39', action: 'Supervisor approved',  actorId: 'u10', role: 'Supervisor', date: new Date(now - 0.5 * day + 1 * hour).toISOString() },
    ],
  },
];
