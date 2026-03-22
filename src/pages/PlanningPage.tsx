import { useState, useEffect, useMemo } from 'react'
import { getAllSubscriptions, getAllBankAccounts, getTransactionsForAccount } from '../lib/database'
import type { Subscription, Transaction } from '../types'
import { formatCurrency, daysUntilNextPayment } from '../lib/calculations'
import { Calendar, CreditCard, ArrowDownLeft, ArrowUpRight, Repeat } from 'lucide-react'

const MONTHS_NL = ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December']
const DAYS_SHORT = ['zo','ma','di','wo','do','vr','za']

interface PlanItem {
  date: string
  label: string
  amount: number
  color: string
  type: 'subscription' | 'income' | 'expense' | 'recurring'
  isExpected: boolean
}

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function PlanningPage() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [futureTx, setFutureTx] = useState<Transaction[]>([])
  const today = new Date()
  const [viewYear, setViewYear]   = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  useEffect(() => {
    setSubs(getAllSubscriptions())
    // Get future transactions from all accounts
    const accs = getAllBankAccounts()
    const all: Transaction[] = []
    accs.forEach(a => {
      getTransactionsForAccount(a.id).forEach(tx => {
        if (tx.date >= toDateStr(today) || tx.isExpected) all.push(tx)
      })
    })
    // Deduplicate by id
    const seen = new Set<string>()
    setFutureTx(all.filter(tx => { if (seen.has(tx.id)) return false; seen.add(tx.id); return true }))
  }, [])

  const items: PlanItem[] = useMemo(() => {
    const result: PlanItem[] = []

    // Subscription payments
    subs.filter(s => s.active).forEach(s => {
      result.push({
        date: s.nextPaymentDate,
        label: s.name,
        amount: s.price,
        color: s.color,
        type: 'subscription',
        isExpected: true,
      })
    })

    // Future / expected transactions
    futureTx.forEach(tx => {
      if (tx.amount === 0) return
      result.push({
        date: tx.date,
        label: tx.description,
        amount: Math.abs(tx.amount),
        color: tx.amount > 0 ? '#10B981' : '#EF4444',
        type: tx.amount > 0 ? 'income' : 'expense',
        isExpected: Boolean(tx.isExpected),
      })
    })

    return result.sort((a, b) => a.date.localeCompare(b.date))
  }, [subs, futureTx])

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1)
  const lastDay  = new Date(viewYear, viewMonth + 1, 0)
  const startDow = firstDay.getDay() // 0=sun
  const daysInMonth = lastDay.getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
  const itemsThisMonth = items.filter(i => i.date.startsWith(monthStr))

  function byDay(day: number) {
    const ds = `${monthStr}-${String(day).padStart(2, '0')}`
    return itemsThisMonth.filter(i => i.date === ds)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  // Upcoming list (next 60 days)
  const todayStr = toDateStr(today)
  const in60 = new Date(today); in60.setDate(in60.getDate() + 60)
  const in60Str = toDateStr(in60)
  const upcoming = items.filter(i => i.date >= todayStr && i.date <= in60Str)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Planning</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Agenda overzicht van aankomende betalingen</p>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">‹</button>
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">
            {MONTHS_NL[viewMonth]} {viewYear}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">›</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />
            const ds = `${monthStr}-${String(day).padStart(2, '0')}`
            const dayItems = byDay(day)
            const isToday = ds === todayStr
            return (
              <div
                key={day}
                className={`min-h-[52px] p-1 rounded-lg ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <p className={`text-xs font-medium mb-0.5 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>{day}</p>
                <div className="space-y-0.5">
                  {dayItems.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      className="w-full h-1.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                      title={`${item.label} — ${formatCurrency(item.amount)}`}
                    />
                  ))}
                  {dayItems.length > 3 && (
                    <p className="text-[9px] text-slate-400">+{dayItems.length - 3}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-3 h-1.5 rounded-full bg-blue-500" />Abonnement
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-3 h-1.5 rounded-full bg-green-500" />Inkomen
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-3 h-1.5 rounded-full bg-red-500" />Uitgave
          </div>
        </div>
      </div>

      {/* Upcoming list */}
      <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-3">Komende 60 dagen</h2>
      {upcoming.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
          <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Geen geplande betalingen</p>
        </div>
      ) : (
        <div className="space-y-2">
          {upcoming.map((item, idx) => {
            const days = daysUntilNextPayment(item.date)
            const isUrgent = days <= 3
            return (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: item.color + '20', color: item.color }}>
                  {item.type === 'subscription' ? <CreditCard className="w-4 h-4" /> :
                   item.type === 'income' ? <ArrowDownLeft className="w-4 h-4" /> :
                   item.amount > 0 ? <ArrowDownLeft className="w-4 h-4" /> :
                   <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${item.type === 'income' ? 'text-green-500' : 'text-slate-800 dark:text-white'}`}>
                    {item.type !== 'income' && item.amount > 0 ? '-' : ''}{formatCurrency(item.amount)}
                  </p>
                  <p className={`text-xs ${isUrgent ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                    {days === 0 ? 'Vandaag' : days === 1 ? 'Morgen' : `Over ${days} dagen`}
                  </p>
                </div>
                {item.isExpected && (
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5">
                    <Repeat className="w-2.5 h-2.5" />verwacht
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
