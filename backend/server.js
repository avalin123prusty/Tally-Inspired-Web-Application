const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const { getState, saveState, hashPassword, verifyPassword } = require('./dataStore');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tally-secret';

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Tally-inspired app backend is running' });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  const state = getState();

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }

  const existingUser = state.users.find((user) => user.email === email);
  if (existingUser) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const user = {
    id: `user-${Date.now()}`,
    name,
    email,
    password: hashPassword(password),
    role: 'user',
    createdAt: new Date().toISOString()
  };

  state.users.push(user);
  saveState();

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const state = getState();
  const user = state.users.find((entry) => entry.email === email);

  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const state = getState();
  const user = state.users.find((entry) => entry.id === req.user.id);
  res.json({ user });
});

app.get('/api/companies', authenticate, (req, res) => {
  res.json(getState().companies);
});

app.post('/api/companies', authenticate, (req, res) => {
  const state = getState();
  const company = { id: `company-${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
  state.companies.push(company);
  saveState();
  res.status(201).json(company);
});

app.get('/api/ledgers', authenticate, (req, res) => {
  res.json(getState().ledgers);
});

app.post('/api/ledgers', authenticate, (req, res) => {
  const state = getState();
  const ledger = { id: `ledger-${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
  state.ledgers.push(ledger);
  saveState();
  res.status(201).json(ledger);
});

app.get('/api/groups', authenticate, (req, res) => {
  res.json(getState().groups);
});

app.post('/api/groups', authenticate, (req, res) => {
  const state = getState();
  const group = { id: `group-${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
  state.groups.push(group);
  saveState();
  res.status(201).json(group);
});

app.get('/api/stock', authenticate, (req, res) => {
  res.json(getState().stockItems);
});

app.post('/api/stock', authenticate, (req, res) => {
  const state = getState();
  const item = { id: `stock-${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
  state.stockItems.push(item);
  saveState();
  res.status(201).json(item);
});

app.get('/api/vouchers', authenticate, (req, res) => {
  res.json(getState().vouchers);
});

app.post('/api/vouchers/purchase', authenticate, (req, res) => {
  const state = getState();
  const voucher = { id: `voucher-${Date.now()}`, type: 'purchase', ...req.body, createdAt: new Date().toISOString() };
  state.vouchers.push(voucher);
  saveState();
  res.status(201).json(voucher);
});

app.post('/api/vouchers/sales', authenticate, (req, res) => {
  const state = getState();
  const voucher = { id: `voucher-${Date.now()}`, type: 'sales', ...req.body, createdAt: new Date().toISOString() };
  state.vouchers.push(voucher);
  saveState();
  res.status(201).json(voucher);
});

app.post('/api/billing', authenticate, (req, res) => {
  const state = getState();
  const bill = { id: `bill-${Date.now()}`, type: 'billing', ...req.body, createdAt: new Date().toISOString() };
  state.vouchers.push(bill);
  saveState();
  res.status(201).json(bill);
});

app.get('/api/reports/summary', authenticate, (req, res) => {
  const state = getState();
  const purchase = state.vouchers.filter((entry) => entry.type === 'purchase').reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const sales = state.vouchers.filter((entry) => entry.type === 'sales').reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  res.json({
    companies: state.companies.length,
    ledgers: state.ledgers.length,
    groups: state.groups.length,
    stockItems: state.stockItems.length,
    purchase,
    sales,
    balance: sales - purchase
  });
});

app.get('/api/shortcuts', authenticate, (req, res) => {
  res.json(getState().shortcuts);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
