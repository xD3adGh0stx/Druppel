import type { Subscription } from '../types'
import { BILLING_CYCLE_LABELS } from '../types'
import { formatCurrency, daysUntilNextPayment, formatDaysUntil } from '../lib/calculations'
import { Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
  subscription: Subscription
}

export default function SubscriptionCard({ subscription: sub }: Props) {
  const days = daysUntilNextPayment(sub.nextPaymentDate)
  const isUrgent = days <= 3
  const isSoon = days <= 7

  return (
    <Link
      to={`/subscriptions/${sub.id}`}
      className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 hover:shadow-md transition-all group active:scale-[0.99]"
    >
      {/* Logo */}
      {sub.imageUrl ? (
        <img src={sub.imageUrl} alt={sub.name} className="w-11 h-11 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
          style={{ backgroundColor: sub.color }}>
          {sub.name.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="font-semibold text-slate-800 dark:text-white truncate text-sm">{sub.name}</h3>
          {!sub.active && (
            <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded-full shrink-0">Gepauzeerd</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-slate-400">{sub.category}</span>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span className={`text-xs font-medium flex items-center gap-0.5 ${isUrgent ? 'text-red-500' : isSoon ? 'text-amber-500' : 'text-slate-400'}`}>
            <Clock className="w-3 h-3" />
            {formatDaysUntil(days)}
          </span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-slate-800 dark:text-white">{formatCurrency(sub.price)}</p>
        <p className="text-xs text-slate-400">{BILLING_CYCLE_LABELS[sub.billingCycle]}</p>
      </div>
    </Link>
  )
}
