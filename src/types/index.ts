export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Subscription {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  startDate: string;
  nextPaymentDate: string;
  notes: string;
  website: string;
  color: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

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

export const CATEGORIES = [
  'Streaming',
  'Muziek',
  'Gaming',
  'Software',
  'Cloud opslag',
  'Nieuws & Media',
  'Fitness',
  'Verzekering',
  'Telefoon & Internet',
  'Overig',
] as const;

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: 'Wekelijks',
  monthly: 'Maandelijks',
  quarterly: 'Per kwartaal',
  yearly: 'Jaarlijks',
};

export const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
];
