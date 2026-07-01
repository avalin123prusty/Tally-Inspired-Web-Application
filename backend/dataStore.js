const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, '..', 'data');
const stateFile = path.join(dataDir, 'state.json');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function saveJson(filePath, value) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

const defaultState = {
  users: [
    {
      id: 'user-001',
      name: 'Admin User',
      email: 'admin@example.com',
      password: crypto.createHash('sha256').update('admin123').digest('hex'),
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  ],
  companies: [
    {
      id: 'company-001',
      name: 'Northwind Traders',
      address: 'Gurgaon, Haryana',
      gstin: '29ABCDE1234F1Z5',
      createdAt: new Date().toISOString()
    }
  ],
  ledgers: [
    {
      id: 'ledger-001',
      name: 'Cash',
      type: 'Asset',
      openingBalance: 50000,
      companyId: 'company-001',
      createdAt: new Date().toISOString()
    },
    {
      id: 'ledger-002',
      name: 'Sales',
      type: 'Income',
      openingBalance: 0,
      companyId: 'company-001',
      createdAt: new Date().toISOString()
    }
  ],
  groups: [
    {
      id: 'group-001',
      name: 'Primary',
      description: 'Core accounting groups',
      createdAt: new Date().toISOString()
    }
  ],
  stockItems: [
    {
      id: 'stock-001',
      name: 'Laptop',
      quantity: 12,
      rate: 45000,
      unit: 'pcs',
      createdAt: new Date().toISOString()
    }
  ],
  vouchers: [
    {
      id: 'voucher-001',
      type: 'purchase',
      date: '2026-07-01',
      ledgerId: 'ledger-001',
      amount: 12000,
      narration: 'Office supplies purchase',
      createdAt: new Date().toISOString()
    }
  ],
  shortcuts: [
    { key: 'Ctrl+Alt+D', action: 'Open dashboard' },
    { key: 'Ctrl+Alt+L', action: 'Open ledgers' },
    { key: 'Ctrl+Alt+S', action: 'Open stock' }
  ]
};

let state = loadJson(stateFile, defaultState);

function ensureState() {
  state = {
    users: state.users || [],
    companies: state.companies || [],
    ledgers: state.ledgers || [],
    groups: state.groups || [],
    stockItems: state.stockItems || [],
    vouchers: state.vouchers || [],
    shortcuts: state.shortcuts || []
  };
}

function getState() {
  ensureState();
  return state;
}

function saveState() {
  ensureState();
  saveJson(stateFile, state);
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password, hashedPassword) {
  return hashPassword(password) === hashedPassword;
}

function resetStore() {
  state = JSON.parse(JSON.stringify(defaultState));
  saveState();
}

ensureState();
saveState();

module.exports = {
  getState,
  saveState,
  hashPassword,
  verifyPassword,
  resetStore
};
