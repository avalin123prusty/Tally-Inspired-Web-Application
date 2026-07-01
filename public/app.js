const state = {
  token: localStorage.getItem('tally-token') || '',
  user: null,
  views: {},
  summary: null,
  companies: [],
  ledgers: [],
  groups: [],
  stock: [],
  vouchers: [],
  reports: [],
  shortcuts: []
};

const api = (path, options = {}) => {
  const headers = { ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  return fetch(path, { ...options, headers });
};

function setActiveView(viewName) {
  document.querySelectorAll('.nav-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === viewName);
  });
  document.querySelectorAll('.view').forEach((section) => {
    section.classList.toggle('active', section.id === viewName);
  });
}

async function loadSession() {
  if (!state.token) {
    document.getElementById('auth-status').textContent = 'Please login or create an account';
    return;
  }
  const response = await api('/api/auth/me');
  if (response.ok) {
    const data = await response.json();
    state.user = data.user;
    document.getElementById('auth-status').textContent = `Signed in as ${state.user.name}`;
  } else {
    localStorage.removeItem('tally-token');
    state.token = '';
    document.getElementById('auth-status').textContent = 'Session expired';
  }
}

async function refreshData() {
  const [companiesRes, ledgersRes, groupsRes, stockRes, vouchersRes, summaryRes, shortcutsRes] = await Promise.all([
    api('/api/companies'),
    api('/api/ledgers'),
    api('/api/groups'),
    api('/api/stock'),
    api('/api/vouchers'),
    api('/api/reports/summary'),
    api('/api/shortcuts')
  ]);

  state.companies = companiesRes.ok ? await companiesRes.json() : [];
  state.ledgers = ledgersRes.ok ? await ledgersRes.json() : [];
  state.groups = groupsRes.ok ? await groupsRes.json() : [];
  state.stock = stockRes.ok ? await stockRes.json() : [];
  state.vouchers = vouchersRes.ok ? await vouchersRes.json() : [];
  state.summary = summaryRes.ok ? await summaryRes.json() : null;
  state.shortcuts = shortcutsRes.ok ? await shortcutsRes.json() : [];

  renderDashboard();
  renderCompanyList();
  renderLedgerList();
  renderGroupList();
  renderStockList();
  renderVoucherList();
  renderReports();
  renderShortcuts();
}

function renderDashboard() {
  const summaryGrid = document.getElementById('summary-grid');
  const milestones = [
    'Day 1: requirement analysis and database design',
    'Day 2: backend setup and PostgreSQL configuration',
    'Day 3: authentication module',
    'Day 4: company management',
    'Day 5: dashboard UI',
    'Day 6: ledger management',
    'Day 7: group management',
    'Day 8: stock management',
    'Day 9: purchase voucher',
    'Day 10: sales voucher',
    'Day 11: billing system',
    'Day 12: reports module',
    'Day 13: keyboard shortcuts',
    'Day 14: testing and deployment'
  ];
  document.getElementById('milestone-list').innerHTML = milestones.map((item) => `<li>${item}</li>`).join('');

  const cards = state.summary ? [
    { label: 'Companies', value: state.summary.companies },
    { label: 'Ledgers', value: state.summary.ledgers },
    { label: 'Groups', value: state.summary.groups },
    { label: 'Stock items', value: state.summary.stockItems },
    { label: 'Purchase', value: `₹${state.summary.purchase}` },
    { label: 'Sales', value: `₹${state.summary.sales}` },
    { label: 'Balance', value: `₹${state.summary.balance}` }
  ] : [];

  summaryGrid.innerHTML = cards.map((card) => `<div class="card"><h3>${card.label}</h3><p>${card.value}</p></div>`).join('');
}

function renderCompanyList() {
  document.getElementById('company-list').innerHTML = state.companies.map((company) => `<div class="item"><strong>${company.name}</strong><p>${company.address || 'No address'}<br />GSTIN: ${company.gstin || 'N/A'}</p></div>`).join('');
}

function renderLedgerList() {
  document.getElementById('ledger-list').innerHTML = state.ledgers.map((ledger) => `<div class="item"><strong>${ledger.name}</strong><p>${ledger.type} • Opening: ₹${ledger.openingBalance || 0}</p></div>`).join('');
}

function renderGroupList() {
  document.getElementById('group-list').innerHTML = state.groups.map((group) => `<div class="item"><strong>${group.name}</strong><p>${group.description || 'No description'}</p></div>`).join('');
}

function renderStockList() {
  document.getElementById('stock-list').innerHTML = state.stock.map((item) => `<div class="item"><strong>${item.name}</strong><p>${item.quantity} ${item.unit || 'pcs'} • ₹${item.rate}</p></div>`).join('');
}

function renderVoucherList() {
  document.getElementById('voucher-list').innerHTML = state.vouchers.map((voucher) => `<div class="item"><strong>${voucher.type.toUpperCase()}</strong><p>${voucher.narration || 'No narration'}<br />Amount: ₹${voucher.amount || 0}</p></div>`).join('');
}

function renderReports() {
  const reportSummary = document.getElementById('report-summary');
  const reportList = document.getElementById('report-list');
  if (!state.summary) {
    reportSummary.innerHTML = '<div class="card">No data yet</div>';
    reportList.innerHTML = '';
    return;
  }

  reportSummary.innerHTML = `
    <div class="card"><h3>Purchase</h3><p>₹${state.summary.purchase}</p></div>
    <div class="card"><h3>Sales</h3><p>₹${state.summary.sales}</p></div>
    <div class="card"><h3>Balance</h3><p>₹${state.summary.balance}</p></div>
  `;
  reportList.innerHTML = state.vouchers.map((voucher) => `<div class="item"><strong>${voucher.type}</strong><p>${voucher.narration || 'No narration'} • ₹${voucher.amount || 0}</p></div>`).join('');
}

function renderShortcuts() {
  document.getElementById('shortcut-list').innerHTML = state.shortcuts.map((shortcut) => `<div class="item"><strong>${shortcut.key}</strong><p>${shortcut.action}</p></div>`).join('');
}

function attachFormHandlers() {
  document.querySelectorAll('.nav-btn').forEach((button) => button.addEventListener('click', () => setActiveView(button.dataset.view)));

  document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const response = await api('/api/auth/login', { method: 'POST', body: { email: document.getElementById('login-email').value, password: document.getElementById('login-password').value } });
    const data = await response.json();
    if (response.ok) {
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('tally-token', data.token);
      document.getElementById('auth-status').textContent = `Signed in as ${data.user.name}`;
      await refreshData();
    } else {
      document.getElementById('auth-status').textContent = data.error || 'Login failed';
    }
  });

  document.getElementById('signup-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const response = await api('/api/auth/register', { method: 'POST', body: { name: document.getElementById('signup-name').value, email: document.getElementById('signup-email').value, password: document.getElementById('signup-password').value } });
    const data = await response.json();
    if (response.ok) {
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('tally-token', data.token);
      document.getElementById('auth-status').textContent = `Signed in as ${data.user.name}`;
      await refreshData();
    } else {
      document.getElementById('auth-status').textContent = data.error || 'Sign-up failed';
    }
  });

  document.getElementById('company-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    await api('/api/companies', { method: 'POST', body: { name: document.getElementById('company-name').value, address: document.getElementById('company-address').value, gstin: document.getElementById('company-gstin').value } });
    event.target.reset();
    await refreshData();
  });

  document.getElementById('ledger-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    await api('/api/ledgers', { method: 'POST', body: { name: document.getElementById('ledger-name').value, type: document.getElementById('ledger-type').value, openingBalance: Number(document.getElementById('ledger-opening').value || 0) } });
    event.target.reset();
    await refreshData();
  });

  document.getElementById('group-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    await api('/api/groups', { method: 'POST', body: { name: document.getElementById('group-name').value, description: document.getElementById('group-description').value } });
    event.target.reset();
    await refreshData();
  });

  document.getElementById('stock-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    await api('/api/stock', { method: 'POST', body: { name: document.getElementById('stock-name').value, quantity: Number(document.getElementById('stock-quantity').value || 0), rate: Number(document.getElementById('stock-rate').value || 0), unit: document.getElementById('stock-unit').value } });
    event.target.reset();
    await refreshData();
  });

  document.getElementById('purchase-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    await api('/api/vouchers/purchase', { method: 'POST', body: { date: document.getElementById('purchase-date').value, ledgerId: document.getElementById('purchase-ledger').value, amount: Number(document.getElementById('purchase-amount').value || 0), narration: document.getElementById('purchase-narration').value } });
    event.target.reset();
    await refreshData();
  });

  document.getElementById('sales-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    await api('/api/vouchers/sales', { method: 'POST', body: { date: document.getElementById('sales-date').value, ledgerId: document.getElementById('sales-ledger').value, amount: Number(document.getElementById('sales-amount').value || 0), narration: document.getElementById('sales-narration').value } });
    event.target.reset();
    await refreshData();
  });

  document.getElementById('billing-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    await api('/api/billing', { method: 'POST', body: { customer: document.getElementById('billing-customer').value, total: Number(document.getElementById('billing-total').value || 0) } });
    event.target.reset();
    await refreshData();
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  attachFormHandlers();
  setActiveView('dashboard');
  await loadSession();
  await refreshData();
});
