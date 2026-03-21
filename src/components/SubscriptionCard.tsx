import type { Subscription } from '../types'
import { BILLING_CYCLE_LABELS } from '../types'
import { formatCurrency, formatDate, daysUntilNextPayment, formatDaysUntil, getMonthlyEquivalent } from '../lib/calculations'
import { Calendar, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
  subscription: Subscription
}

export default function SubscriptionCard({ subscription: sub }: Props) {
  const days = daysUntilNextPayment(sub.nextPaymentDate)
  const monthly = getMonthlyEquivalent(sub.price, sub.billingCycle)

  return (
    <Link
      to={`/subscriptions/${sub.id}`}
      className="block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ backgroundColor: sub.color }}
        >
          {sub.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {sub.name}
            </h3>
            <span className="text-base font-bold text-slate-800 dark:text-white shrink-0 ml-2">
              {formatCurrency(sub.price)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{sub.category}</span>
            <span>{BILLING_CYCLE_LABELS[sub.billingCycle]}</span>
            {sub.billingCycle !== 'monthly' && (
              <span className="text-slate-400 dark:text-slate-500">({formatCurrency(monthly)}/mnd)</span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(sub.nextPaymentDate)}
            </span>
            <span className={`inline-flex items-center gap-1 ${
              days <= 3 ? 'text-red-500 font-medium' : days <= 7 ? 'text-amber-500' : ''
            }`}>
              <Clock className="w-3.5 h-3.5" />
              {formatDaysUntil(days)}
            </span>
          </div>
          {!sub.active && (
            <span className="inline-block mt-2 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
              Gepauzeerd
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
