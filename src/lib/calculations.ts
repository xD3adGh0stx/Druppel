import { addDays, addMonths, addYears, differenceInDays, isPast, format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { BillingCycle, Subscription } from '../types';

export const WEEKS_PER_MONTH = 52 / 12;

// Cached formatter for the common EUR case
const eurFormatter = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const currencyFormatters = new Map<string, Intl.NumberFormat>();

function advanceByOneCycle(date: Date, cycle: BillingCycle): Date {
  switch (cycle) {
    case 'weekly': return addDays(date, 7);
    case 'monthly': return addMonths(date, 1);
    case 'quarterly': return addMonths(date, 3);
    case 'yearly': return addYears(date, 1);
  }
}

export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function calculateNextPaymentDate(startDate: string, billingCycle: BillingCycle): string {
  let next = new Date(startDate);
  const now = new Date();
  while (isPast(next) || next <= now) {
    next = advanceByOneCycle(next, billingCycle);
  }
  return toDateString(next);
}

export function daysUntilNextPayment(nextPaymentDate: string): number {
  return differenceInDays(new Date(nextPaymentDate), new Date());
}

export function formatDaysUntil(days: number): string {
  if (days === 0) return 'Vandaag!';
  if (days === 1) return 'Morgen';
  return `Over ${days} dagen`;
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'd MMM yyyy', { locale: nl });
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
  if (currency === 'EUR') return eurFormatter.format(amount);
  let fmt = currencyFormatters.get(currency);
  if (!fmt) {
    fmt = new Intl.NumberFormat('nl-NL', { style: 'currency', currency });
    currencyFormatters.set(currency, fmt);
  }
  return fmt.format(amount);
}

export function estimateTotalPaid(sub: Subscription): number {
  const now = new Date();
  let count = 0;
  let current = new Date(sub.startDate);
  while (current <= now) {
    count++;
    current = advanceByOneCycle(current, sub.billingCycle);
  }
  return count * sub.price;
}

export function getMonthlyEquivalent(price: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'weekly': return price * WEEKS_PER_MONTH;
    case 'monthly': return price;
    case 'quarterly': return price / 3;
    case 'yearly': return price / 12;
  }
}
