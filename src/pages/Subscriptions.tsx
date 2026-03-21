import { useState, useEffect, useCallback } from 'react'
import { getAllSubscriptions, addSubscription } from '../lib/database'
import type { Subscription } from '../types'
import SubscriptionCard from '../components/SubscriptionCard'
import SubscriptionForm from '../components/SubscriptionForm'
import { calculateNextPaymentDate, daysUntilNextPayment, getMonthlyEquivalent } from '../lib/calculations'
import { Plus, Search, ArrowUpDown } from 'lucide-react'

type SortOption = 'name' | 'price-asc' | 'price-desc' | 'next-payment' | 'newest'

const SORT_LABELS: Record<SortOption, string> = {
  'name': 'Naam A-Z',
  'price-asc': 'Prijs laag-hoog',
  'price-desc': 'Prijs hoog-laag',
  'next-payment': 'Vroegste betaling',
  'newest': 'Nieuwste eerst',
}

export default function Subscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all')
  const [sort, setSort] = useState<SortOption>('newest')
  const [showSortMenu, setShowSortMenu] = useState(false)

  useEffect(() => {
    setSubs(getAllSubscriptions())
  }, [])

  const filtered = subs
    .filter(s => {
      if (filter === 'active' && !s.active) return false
      if (filter === 'paused' && s.active) return false
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
          !s.category.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      switch (sort) {
        case 'name': return a.name.localeCompare(b.name)
        case 'price-asc': return getMonthlyEquivalent(a.price, a.billingCycle) - getMonthlyEquivalent(b.price, b.billingCycle)
        case 'price-desc': return getMonthlyEquivalent(b.price, b.billingCycle) - getMonthlyEquivalent(a.price, a.billingCycle)
        case 'next-payment': {
          const dA = daysUntilNextPayment(calculateNextPaymentDate(a.startDate, a.billingCycle))
          const dB = daysUntilNextPayment(calculateNextPaymentDate(b.startDate, b.billingCycle))
          return dA - dB
        }
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

  const handleAdd = useCallback((data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
    addSubscription(data)
    setSubs(getAllSubscriptions())
    setShowForm(false)
  }, [])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Abonnementen</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{subs.length} abonnement{subs.length !== 1 ? 'en' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Toevoegen
        </button>
      </div>

      {/* Zoekbalk */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoeken..."
          className="w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Filters + Sortering */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          {(['all', 'active', 'paused'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              {f === 'all' ? 'Alle' : f === 'active' ? 'Actief' : 'Gepauzeerd'}
            </button>
          ))}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {SORT_LABELS[sort]}
          </button>
          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 min-w-44">
                {(Object.keys(SORT_LABELS) as SortOption[]).map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setSort(opt); setShowSortMenu(false) }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                      sort === opt
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {SORT_LABELS[opt]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <p className="text-slate-400 text-lg">Geen abonnementen gevonden</p>
          <p className="text-sm text-slate-400 mt-1">
            {subs.length === 0
              ? 'Klik op "Toevoegen" om je eerste abonnement toe te voegen'
              : 'Pas je zoekopdracht of filter aan'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(sub => (
            <SubscriptionCard key={sub.id} subscription={sub} />
          ))}
        </div>
      )}

      {showForm && (
        <SubscriptionForm
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
