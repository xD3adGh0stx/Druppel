import { useState, useEffect, useMemo } from 'react'
import { getAllSubscriptions } from '../lib/database'
import type { Subscription } from '../types'
import { formatCurrency, daysUntilNextPayment } from '../lib/calculations'
import { BILLING_CYCLE_LABELS } from '../types'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

const NL_MONTHS = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December']
const NL_DAYS_SHORT = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']

function getNextPaymentDates(sub: Subscription, from: Date, to: Date): Date[] {
  const dates: Date[] = []
  const start = new Date(sub.nextPaymentDate)
  let current = new Date(start)

  // Make sure we start from a recent enough date
  while (current < from) {
    advance(current, sub.billingCycle)
  }

  while (current <= to) {
    dates.push(new Date(current))
    advance(current, sub.billingCycle)
  }

  return dates
}

function advance(date: Date, cycle: string) {
  switch (cycle) {
    case 'weekly':    date.setDate(date.getDate() + 7); break
    case 'monthly':   date.setMonth(date.getMonth() + 1); break
    case 'quarterly': date.setMonth(date.getMonth() + 3); break
    case 'yearly':    date.setFullYear(date.getFullYear() + 1); break
  }
}

interface PaymentEvent {
  date: Date
  sub: Subscription
}

const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'

export default function PlanningPage() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  useEffect(() => {
    setSubs(getAllSubscriptions().filter(s => s.active))
  }, [])

  const events = useMemo<PaymentEvent[]>(() => {
    const from = new Date(viewMonth)
    const to = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0)
    const result: PaymentEvent[] = []
    for (const sub of subs) {
      for (const date of getNextPaymentDates(sub, from, to)) {
        result.push({ date, sub })
      }
    }
    return result.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [subs, viewMonth])

  // Group by day
  const byDay = useMemo(() => {
    const map = new Map<string, PaymentEvent[]>()
    for (const ev of events) {
      const key = ev.date.toISOString().split('T')[0]
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(ev)
    }
    return map
  }, [events])

  // Calendar grid
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  const firstDow = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const monthTotal = events.reduce((s, e) => s + e.sub.price, 0)

  function prevMonth() { setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)) }
  function nextMonth() { setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)) }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Planning</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Wanneer worden je abonnementen afgeschreven?</p>
      </div>

      {/* Month nav */}
      <div className={`${card} rounded-xl p-4 mb-4`}>
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-800 dark:text-white">
              {NL_MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </p>
            {events.length > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">
                {events.length} betaling{events.length !== 1 ? 'en' : ''} · {formatCurrency(monthTotal)} totaal
              </p>
            )}
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="mt-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {NL_DAYS_SHORT.map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7 gap-y-1">
            {/* Empty cells before month starts */}
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayEvents = byDay.get(dateStr) ?? []
              const isToday = dateStr === todayStr
              const hasPay = dayEvents.length > 0
              return (
                <div key={day} className="flex flex-col items-center py-1">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors
                    ${isToday ? 'bg-blue-600 text-white font-bold' : hasPay ? 'bg-red-50 dark:bg-red-900/20 text-slate-800 dark:text-white font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                    {day}
                  </div>
                  {hasPay && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {dayEvents.slice(0, 3).map((ev, idx) => (
                        <div key={idx} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ev.sub.color }} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Event list */}
      {events.length === 0 ? (
        <div className={`${card} rounded-xl p-10 text-center`}>
          <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Geen betalingen deze maand</p>
          <p className="text-sm text-slate-400 mt-1">Navigeer naar een andere maand of voeg abonnementen toe</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((ev, idx) => {
            const days = daysUntilNextPayment(ev.date.toISOString().split('T')[0])
            const isPast = days < 0
            const isUrgent = days >= 0 && days <= 3
            return (
              <div key={idx} className={`${card} rounded-xl px-4 py-3 flex items-center gap-3 ${isPast ? 'opacity-50' : ''}`}>
                {/* Logo or color dot */}
                {ev.sub.imageUrl ? (
                  <img src={ev.sub.imageUrl} alt={ev.sub.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: ev.sub.color }}>
                    {ev.sub.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{ev.sub.name}</p>
                  <p className="text-xs text-slate-400">{BILLING_CYCLE_LABELS[ev.sub.billingCycle]}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{formatCurrency(ev.sub.price)}</p>
                  <p className={`text-xs font-medium ${isPast ? 'text-slate-400' : isUrgent ? 'text-red-500' : 'text-slate-400'}`}>
                    {isPast
                      ? `${Math.abs(days)} dag${Math.abs(days) !== 1 ? 'en' : ''} geleden`
                      : days === 0
                      ? 'Vandaag'
                      : isUrgent
                      ? `Over ${days} dag${days !== 1 ? 'en' : ''}`
                      : `${String(ev.date.getDate()).padStart(2, '0')} ${NL_MONTHS[ev.date.getMonth()].toLowerCase()}`
                    }
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
