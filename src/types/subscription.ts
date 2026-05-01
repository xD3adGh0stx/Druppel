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
  imageUrl: string;
  color: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const CATEGORIES = [
  // Entertainment
  'Streaming video',
  'Streaming muziek',
  'Gaming',
  'Podcasts & Audio',
  'Boeken & E-readers',
  'Sport & Fitness',
  // Software & Tech
  'Software & Apps',
  'Cloud opslag',
  'VPN & Beveiliging',
  'AI & Productiviteit',
  'Webhosting',
  'Developer tools',
  // Communicatie
  'Telefoon',
  'Internet',
  'Nieuwsbrief',
  'Nieuws & Media',
  // Financieel
  'Verzekering',
  'Bank & Betalen',
  'Investeren',
  // Levensstijl
  'Eten & Drinken',
  'Mode & Kleding',
  'Beauty & Verzorging',
  'Reizen',
  'Auto & Vervoer',
  'Wonen & Energie',
  'Huisdieren',
  // Onderwijs
  'Onderwijs & Cursussen',
  'Taal leren',
  // Zakelijk
  'Zakelijk',
  'Marketing',
  // Overig
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
