import { useState, useEffect, useMemo } from 'react'
import { getAllSubscriptions, computeMonthlyTotal, getMonthlyStats } from '../lib/database'
import type { Subscription } from '../types'
import { formatCurrency, daysUntilNextPayment, estimateTotalPaid, getMonthlyEquivalent } from '../lib/calculations'
import { TrendingUp, TrendingDown, CreditCard, Calendar, AlertTriangle } from 'lucide-react'
import SubscriptionCard from '../components/SubscriptionCard'

const MONTHS_NL = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december']
const DAYS_NL = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag']

export default function Dashboard() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const now = new Date()

  useEffect(() => {
    setSubs(getAllSubscriptions())
  }, [])

  const { activeSubs, monthlySubTotal, yearlyTotal, totalEverPaid, upcoming, urgentCount } = useMemo(() => {
    const activeSubs = subs.filter(s => s.active)
    const monthlySubTotal = computeMonthlyTotal(subs)
    const yearlyTotal = monthlySubTotal * 12
    const totalEverPaid = subs.reduce((sum, s) => sum + estimateTotalPaid(s), 0)
    const upcoming = [...activeSubs]
      .sort((a, b) => daysUntilNextPayment(a.nextPaymentDate) - daysUntilNextPayment(b.nextPaymentDate))
      .slice(0, 5)
    const urgentCount = activeSubs.filter(s => daysUntilNextPayment(s.nextPaymentDate) <= 7).length
    return { activeSubs, monthlySubTotal, yearlyTotal, totalEverPaid, upcoming, urgentCount }
  }, [subs])

  const monthlyStats = getMonthlyStats(now.getFullYear(), now.getMonth() + 1)
  const net = monthlyStats.income - monthlyStats.expenses

  const dateLabel = `${DAYS_NL[now.getDay()]} ${now.getDate()} ${MONTHS_NL[now.getMonth()]} ${now.getFullYear()}`
  const monthLabel = `${MONTHS_NL[now.getMonth()].charAt(0).toUpperCase() + MONTHS_NL[now.getMonth()].slice(1)} ${now.getFullYear()}`

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header met datum */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 capitalize">{dateLabel}</p>
        </div>
        <span className="text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-800">
          {monthLabel}
        </span>
      </div>

      {/* Maand stats: inkomen & uitgaven */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs mb-2">
            <TrendingDown className="w-4 h-4" />
            <span>Inkomen deze maand</span>
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(monthlyStats.income)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 text-red-500 text-xs mb-2">
            <TrendingUp className="w-4 h-4" />
            <span>Uitgaven deze maand</span>
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(monthlyStats.expenses)}</p>
          {(monthlyStats.income > 0 || monthlyStats.expenses > 0) && (
            <p className={`text-xs mt-0.5 font-medium ${net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {net >= 0 ? '+' : ''}{formatCurrency(net)} netto
            </p>
          )}
        </div>
      </div>

      {/* Abonnement stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs mb-2">
            <CreditCard className="w-4 h-4" />
            <span>Abonnementen/mnd</span>
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(monthlySubTotal)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(yearlyTotal)}/jaar</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs mb-2">
            <Calendar className="w-4 h-4" />
            <span>Actieve abonnementen</span>
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">{activeSubs.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(totalEverPaid)} totaal betaald</p>
        </div>
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
        <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-3">Aankomende betalingen</h2>
        {upcoming.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
            <p className="text-slate-400 text-sm">Nog geen abonnementen toegevoegd</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map(sub => (
              <SubscriptionCard key={sub.id} subscription={sub} />
            ))}
          </div>
        )}
      </div>

      {/* Category breakdown */}
      {activeSubs.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-3">Per categorie</h2>
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
                const pct = monthlySubTotal > 0 ? (data.total / monthlySubTotal) * 100 : 0
                return (
                  <div key={cat} className="flex items-center gap-3 py-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400 w-36 shrink-0 truncate">{cat}</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
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
