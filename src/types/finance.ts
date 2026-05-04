export type TransactionType = 'income' | 'expense' | 'transfer' | 'pot_allocation'
export type RecurringType = 'weekly' | 'monthly' | 'yearly'

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  accountId: string | null;
  toAccountId: string | null;
  potId: string | null;
  subscriptionId: string | null;
  recurring: RecurringType | null;
  groupId: string | null;
  isExpected: number;
  source: 'manual' | 'csv' | 'mt940' | 'pdf';
  raw: string;
  createdAt: string;
}

export type AccountType = 'betaal' | 'spaar'

export interface BankAccount {
  id: string
  name: string
  type: AccountType
  color: string
  iban: string
  openingBalance: number
  createdAt: string
  updatedAt: string
}

export interface Pot {
  id: string;
  name: string;
  color: string;
  budgetAmount: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportResult {
  transactions: Omit<Transaction, 'id' | 'createdAt'>[];
  matched: number;
  unmatched: number;
}
