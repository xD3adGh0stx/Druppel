import { useState, useEffect, useMemo } from 'react'
import { getAllSubscriptions, computeMonthlyTotal } from '../lib/database'
import type { Subscription } from '../types'
import { formatCurrency, daysUntilNextPayment, estimateTotalPaid, getMonthlyEquivalent } from '../lib/calculations'
import { TrendingUp, CreditCard, Calendar, AlertTriangle } from 'lucide-react'
import SubscriptionCard from '../components/SubscriptionCard'

export default function Dashboard() {
  const [subs, setSubs] = useState<Subscription[]>([])

  useEffect(() => {
    setSubs(getAllSubscriptions())
  }, [])

  const { activeSubs, monthlyTotal, yearlyTotal, totalEverPaid, upcoming, urgentCount } = useMemo(() => {
    const activeSubs = subs.filter(s => s.active)
    const monthlyTotal = computeMonthlyTotal(subs)
    const yearlyTotal = monthlyTotal * 12
    const totalEverPaid = subs.reduce((sum, s) => sum + estimateTotalPaid(s), 0)
    const upcoming = [...activeSubs]
      .sort((a, b) => daysUntilNextPayment(a.nextPaymentDate) - daysUntilNextPayment(b.nextPaymentDate))
      .slice(0, 5)
    const urgentCount = activeSubs.filter(s => daysUntilNextPayment(s.nextPaymentDate) <= 7).length
    return { activeSubs, monthlyTotal, yearlyTotal, totalEverPaid, upcoming, urgentCount }
  }, [subs])

  const stats = [
    { label: 'Maandelijks', value: formatCurrency(monthlyTotal), icon: CreditCard, color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    { label: 'Jaarlijks', value: formatCurrency(yearlyTotal), icon: TrendingUp, color: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
    { label: 'Actieve abonnementen', value: activeSubs.length.toString(), icon: Calendar, color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
    { label: 'Totaal betaald (geschat)', value: formatCurrency(totalEverPaid), icon: TrendingUp, color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Overzicht van je abonnementen</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className={`p-2 rounded-lg w-fit mb-2 ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className="text-base font-bold text-slate-800 dark:text-white mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Urgent alert */}
      {urgentCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">{urgentCount} abonnement{urgentCount > 1 ? 'en' : ''}</span> {urgentCount > 1 ? 'worden' : 'wordt'} binnen 7 dagen afgeschreven.
          </p>
        </div>
      )}

      {/* Upcoming payments */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">Aankomende betalingen</h2>
        {upcoming.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
            <p className="text-slate-400">Nog geen abonnementen toegevoegd</p>
            <p className="text-sm text-slate-400 mt-1">Ga naar Abonnementen om er een toe te voegen</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(sub => (
              <SubscriptionCard key={sub.id} subscription={sub} />
            ))}
          </div>
        )}
      </div>

      {/* Category breakdown */}
      {activeSubs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">Per categorie</h2>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            {Object.entries(
              activeSubs.reduce<Record<string, { count: number; total: number }>>((acc, sub) => {
                if (!acc[sub.category]) acc[sub.category] = { count: 0, total: 0 }
                acc[sub.category].count++
                acc[sub.category].total += getMonthlyEquivalent(sub.price, sub.billingCycle)
                return acc
              }, {})
            )
              .sort((a, b) => b[1].total - a[1].total)
              .map(([cat, data]) => {
                const pct = (data.total / monthlyTotal) * 100
                return (
                  <div key={cat} className="flex items-center gap-3 py-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400 w-32 shrink-0 truncate">{cat}</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-20 text-right shrink-0">
                      {formatCurrency(data.total)}/mnd
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
