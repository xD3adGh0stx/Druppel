import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import type { Subscription, Transaction, TransactionType, RecurringType, Pot, BankAccount } from '../types';
import { getMonthlyEquivalent } from './calculations';
import { v4 as uuidv4 } from 'uuid';

let db: Database | null = null;

const DB_KEY = 'druppel_db';

export async function initDatabase(): Promise<Database> {
  const SQL = await initSqlJs({
    locateFile: () => '/sql-wasm.wasm',
  });

  const saved = localStorage.getItem(DB_KEY);
  if (saved) {
    const buf = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Overig',
      price REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'EUR',
      billingCycle TEXT NOT NULL DEFAULT 'monthly',
      startDate TEXT NOT NULL,
      nextPaymentDate TEXT NOT NULL,
      notes TEXT DEFAULT '',
      website TEXT DEFAULT '',
      color TEXT DEFAULT '#3B82F6',
      active INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'betaal',
      color TEXT DEFAULT '#3B82F6',
      iban TEXT DEFAULT '',
      openingBalance REAL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pots (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#3B82F6',
      budgetAmount REAL NOT NULL DEFAULT 0,
      description TEXT DEFAULT '',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL DEFAULT 'expense',
      accountId TEXT,
      toAccountId TEXT,
      potId TEXT,
      subscriptionId TEXT,
      recurring TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      raw TEXT DEFAULT '',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (subscriptionId) REFERENCES subscriptions(id)
    );
  `);

  // Migrations
  try { db.run(`ALTER TABLE subscriptions ADD COLUMN website TEXT DEFAULT ''`); } catch { /* exists */ }
  try { db.run(`ALTER TABLE transactions ADD COLUMN potId TEXT`); } catch { /* exists */ }
  try { db.run(`ALTER TABLE transactions ADD COLUMN accountId TEXT`); } catch { /* exists */ }
  try { db.run(`ALTER TABLE transactions ADD COLUMN toAccountId TEXT`); } catch { /* exists */ }
  try { db.run(`ALTER TABLE transactions ADD COLUMN type TEXT NOT NULL DEFAULT 'expense'`); } catch { /* exists */ }
  try { db.run(`ALTER TABLE transactions ADD COLUMN recurring TEXT`); } catch { /* exists */ }

  return db;
}

export function saveDatabase() {
  if (!db) return;
  const data = db.export();
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  localStorage.setItem(DB_KEY, btoa(binary));
}

function getDb(): Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

function mapRows<T>(results: ReturnType<Database['exec']>): T[] {
  if (results.length === 0) return [];
  const cols = results[0].columns;
  return results[0].values.map(row => {
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj as unknown as T;
  });
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export function getAllSubscriptions(): Subscription[] {
  const results = getDb().exec('SELECT * FROM subscriptions ORDER BY name');
  return mapRows<Subscription>(results).map(s => ({ ...s, active: Boolean(s.active) }));
}

export function getSubscription(id: string): Subscription | null {
  const stmt = getDb().prepare('SELECT * FROM subscriptions WHERE id = ?');
  stmt.bind([id]);
  if (!stmt.step()) { stmt.free(); return null; }
  const row = stmt.getAsObject();
  stmt.free();
  return { ...row, active: Boolean(row.active) } as unknown as Subscription;
}

export function addSubscription(sub: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Subscription {
  const id = uuidv4();
  const now = new Date().toISOString();
  getDb().run(
    `INSERT INTO subscriptions (id, name, category, price, currency, billingCycle, startDate, nextPaymentDate, notes, website, color, active, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, sub.name, sub.category, sub.price, sub.currency, sub.billingCycle, sub.startDate, sub.nextPaymentDate, sub.notes, sub.website ?? '', sub.color, sub.active ? 1 : 0, now, now]
  );
  saveDatabase();
  return { ...sub, id, createdAt: now, updatedAt: now };
}

export function updateSubscription(id: string, sub: Partial<Subscription>): void {
  const now = new Date().toISOString();
  const entries = Object.entries(sub).filter(([key]) => key !== 'id' && key !== 'createdAt');
  const fields = entries.map(([key]) => `${key} = ?`);
  const values = entries.map(([, val]) => val === true ? 1 : val === false ? 0 : val);
  fields.push('updatedAt = ?');
  values.push(now, id);
  getDb().run(`UPDATE subscriptions SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

export function deleteSubscription(id: string): void {
  getDb().run('DELETE FROM subscriptions WHERE id = ?', [id]);
  getDb().run('UPDATE transactions SET subscriptionId = NULL WHERE subscriptionId = ?', [id]);
  saveDatabase();
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export function getAllTransactions(): Transaction[] {
  return mapRows<Transaction>(getDb().exec('SELECT * FROM transactions ORDER BY date DESC, createdAt DESC'));
}

export function getTransactionsForAccount(accountId: string): Transaction[] {
  return mapRows<Transaction>(getDb().exec(
    `SELECT * FROM transactions WHERE accountId = ? OR toAccountId = ? ORDER BY date DESC, createdAt DESC`,
    [accountId, accountId]
  ));
}

export function getTransactionsForSubscription(subscriptionId: string): Transaction[] {
  return mapRows<Transaction>(getDb().exec(
    'SELECT * FROM transactions WHERE subscriptionId = ? ORDER BY date DESC',
    [subscriptionId]
  ));
}

export function addManualTransaction(tx: {
  type: TransactionType
  date: string
  description: string
  amount: number
  accountId: string | null
  toAccountId: string | null
  potId: string | null
  recurring: RecurringType | null
}): void {
  const now = new Date().toISOString();

  if (tx.type === 'transfer' && tx.accountId && tx.toAccountId) {
    // Two entries: debit from source, credit to target
    getDb().run(
      `INSERT INTO transactions (id, date, description, amount, type, accountId, toAccountId, potId, subscriptionId, recurring, source, raw, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, 'manual', '', ?)`,
      [uuidv4(), tx.date, tx.description, -Math.abs(tx.amount), 'transfer', tx.accountId, tx.toAccountId, tx.recurring, now]
    );
    getDb().run(
      `INSERT INTO transactions (id, date, description, amount, type, accountId, toAccountId, potId, subscriptionId, recurring, source, raw, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, 'manual', '', ?)`,
      [uuidv4(), tx.date, tx.description, Math.abs(tx.amount), 'transfer', tx.toAccountId, tx.accountId, tx.recurring, now]
    );
  } else if (tx.type === 'pot_allocation' && tx.accountId && tx.potId) {
    // Debit from account
    getDb().run(
      `INSERT INTO transactions (id, date, description, amount, type, accountId, toAccountId, potId, subscriptionId, recurring, source, raw, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, 'manual', '', ?)`,
      [uuidv4(), tx.date, tx.description, -Math.abs(tx.amount), 'pot_allocation', tx.accountId, tx.recurring, now]
    );
    // Credit to pot
    getDb().run(
      `INSERT INTO transactions (id, date, description, amount, type, accountId, toAccountId, potId, subscriptionId, recurring, source, raw, createdAt)
       VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, NULL, ?, 'manual', '', ?)`,
      [uuidv4(), tx.date, tx.description, Math.abs(tx.amount), 'pot_allocation', tx.potId, tx.recurring, now]
    );
  } else {
    const amount = tx.type === 'income' ? Math.abs(tx.amount) : -Math.abs(tx.amount);
    getDb().run(
      `INSERT INTO transactions (id, date, description, amount, type, accountId, toAccountId, potId, subscriptionId, recurring, source, raw, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?, NULL, ?, 'manual', '', ?)`,
      [uuidv4(), tx.date, tx.description, amount, tx.type, tx.accountId, tx.potId, tx.recurring, now]
    );
  }

  saveDatabase();
}

export function addTransactions(txs: Omit<Transaction, 'id' | 'createdAt'>[], accountId?: string): void {
  const now = new Date().toISOString();
  for (const tx of txs) {
    const id = uuidv4();
    getDb().run(
      `INSERT INTO transactions (id, date, description, amount, type, accountId, toAccountId, potId, subscriptionId, recurring, source, raw, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL, ?, ?, ?)`,
      [id, tx.date, tx.description, tx.amount, tx.type ?? 'expense', accountId ?? tx.accountId ?? null, tx.potId ?? null, tx.subscriptionId ?? null, tx.source, tx.raw, now]
    );
  }
  saveDatabase();
}

export function deleteTransaction(id: string): void {
  getDb().run('DELETE FROM transactions WHERE id = ?', [id]);
  saveDatabase();
}

export function updateTransaction(id: string, updates: Partial<Transaction>): void {
  const entries = Object.entries(updates).filter(([key]) => key !== 'id' && key !== 'createdAt');
  const fields = entries.map(([key]) => `${key} = ?`);
  const values = entries.map(([, val]) => val);
  values.push(id);
  getDb().run(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

// ─── Bank accounts ────────────────────────────────────────────────────────────

export function getAllBankAccounts(): BankAccount[] {
  return mapRows<BankAccount>(getDb().exec('SELECT * FROM bank_accounts ORDER BY name'));
}

export function addBankAccount(acc: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>): BankAccount {
  const id = uuidv4();
  const now = new Date().toISOString();
  getDb().run(
    `INSERT INTO bank_accounts (id, name, type, color, iban, openingBalance, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, acc.name, acc.type, acc.color, acc.iban, acc.openingBalance, now, now]
  );
  saveDatabase();
  return { ...acc, id, createdAt: now, updatedAt: now };
}

export function updateBankAccount(id: string, acc: Partial<BankAccount>): void {
  const now = new Date().toISOString();
  const entries = Object.entries(acc).filter(([k]) => k !== 'id' && k !== 'createdAt');
  const fields = entries.map(([k]) => `${k} = ?`);
  const values = entries.map(([, v]) => v);
  fields.push('updatedAt = ?');
  values.push(now, id);
  getDb().run(`UPDATE bank_accounts SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

export function deleteBankAccount(id: string): void {
  getDb().run('DELETE FROM bank_accounts WHERE id = ?', [id]);
  getDb().run('UPDATE transactions SET accountId = NULL WHERE accountId = ?', [id]);
  saveDatabase();
}

export function getAccountBalance(accountId: string): number {
  const acc = mapRows<BankAccount>(getDb().exec('SELECT * FROM bank_accounts WHERE id = ?', [accountId]))[0];
  if (!acc) return 0;
  // Sum all tx where this account is the accountId (debits/credits on this account)
  // For transfers: the debit side has accountId=source (negative), credit side has accountId=target (positive)
  const r = getDb().exec(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE accountId = ?`,
    [accountId]
  );
  const txTotal = r.length ? (r[0].values[0][0] as number) : 0;
  return acc.openingBalance + txTotal;
}

// ─── Pots ─────────────────────────────────────────────────────────────────────

export function getAllPots(): Pot[] {
  return mapRows<Pot>(getDb().exec('SELECT * FROM pots ORDER BY name'));
}

export function addPot(pot: Omit<Pot, 'id' | 'createdAt' | 'updatedAt'>): Pot {
  const id = uuidv4();
  const now = new Date().toISOString();
  getDb().run(
    `INSERT INTO pots (id, name, color, budgetAmount, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, pot.name, pot.color, pot.budgetAmount, pot.description, now, now]
  );
  saveDatabase();
  return { ...pot, id, createdAt: now, updatedAt: now };
}

export function updatePot(id: string, pot: Partial<Pot>): void {
  const now = new Date().toISOString();
  const entries = Object.entries(pot).filter(([k]) => k !== 'id' && k !== 'createdAt');
  const fields = entries.map(([k]) => `${k} = ?`);
  const values = entries.map(([, v]) => v);
  fields.push('updatedAt = ?');
  values.push(now, id);
  getDb().run(`UPDATE pots SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

export function deletePot(id: string): void {
  getDb().run('DELETE FROM pots WHERE id = ?', [id]);
  getDb().run('UPDATE transactions SET potId = NULL WHERE potId = ?', [id]);
  saveDatabase();
}

export function getPotBalance(potId: string): number {
  const r = getDb().exec(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE potId = ?`,
    [potId]
  );
  return r.length ? (r[0].values[0][0] as number) : 0;
}

export function assignTransactionToPot(txId: string, potId: string | null): void {
  getDb().run('UPDATE transactions SET potId = ? WHERE id = ?', [potId, txId]);
  saveDatabase();
}

export function getTransactionsForPot(potId: string): Transaction[] {
  return mapRows<Transaction>(getDb().exec(
    'SELECT * FROM transactions WHERE potId = ? ORDER BY date DESC', [potId]
  ));
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function getBalance(): number {
  const r = getDb().exec('SELECT COALESCE(SUM(amount), 0) as bal FROM transactions');
  return r.length ? (r[0].values[0][0] as number) : 0;
}

export function getMonthlyStats(year: number, month: number): { income: number; expenses: number } {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const to = `${year}-${String(month).padStart(2, '0')}-31`;
  const r = getDb().exec(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END), 0) as expenses
     FROM transactions WHERE date >= ? AND date <= ?`,
    [from, to]
  );
  if (!r.length) return { income: 0, expenses: 0 };
  return { income: r[0].values[0][0] as number, expenses: r[0].values[0][1] as number };
}

export function getPotSpending(potId: string, year: number, month: number): number {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const to = `${year}-${String(month).padStart(2, '0')}-31`;
  const r = getDb().exec(
    `SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM transactions WHERE potId = ? AND amount < 0 AND date >= ? AND date <= ?`,
    [potId, from, to]
  );
  return r.length ? (r[0].values[0][0] as number) : 0;
}

export function getUnassignedTransactions(): Transaction[] {
  return mapRows<Transaction>(getDb().exec(
    `SELECT * FROM transactions WHERE potId IS NULL AND subscriptionId IS NULL AND type IN ('income','expense')
     ORDER BY date DESC LIMIT 50`
  ));
}

export function getTotalPaidForSubscription(subscriptionId: string): number {
  const results = getDb().exec(
    'SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM transactions WHERE subscriptionId = ?',
    [subscriptionId]
  );
  if (results.length === 0 || results[0].values.length === 0) return 0;
  return results[0].values[0][0] as number;
}

export function computeMonthlyTotal(subs: Subscription[]): number {
  return subs
    .filter(s => s.active)
    .reduce((sum, s) => sum + getMonthlyEquivalent(s.price, s.billingCycle), 0);
}
