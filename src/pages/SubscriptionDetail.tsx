import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getSubscription, updateSubscription, deleteSubscription,
  getTransactionsForSubscription,
} from '../lib/database'
import type { Subscription, Transaction } from '../types'
import { BILLING_CYCLE_LABELS } from '../types'
import { formatCurrency, formatDate, daysUntilNextPayment, formatDaysUntil, estimateTotalPaid } from '../lib/calculations'
import SubscriptionForm from '../components/SubscriptionForm'
import { ArrowLeft, Edit3, Trash2, Calendar, Clock, CreditCard, TrendingUp, Globe } from 'lucide-react'

const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
const stat = 'bg-slate-50 dark:bg-slate-800 rounded-lg p-3'

export default function SubscriptionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [sub, setSub] = useState<Subscription | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!id) return
    const s = getSubscription(id)
    if (!s) { navigate('/subscriptions'); return }
    setSub(s)
    setTransactions(getTransactionsForSubscription(id))
  }, [id, navigate])

  const handleUpdate = useCallback((data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
    updateSubscription(sub!.id, data)
    setSub(getSubscription(sub!.id))
    setEditing(false)
  }, [sub])

  const handleDelete = useCallback(() => {
    deleteSubscription(sub!.id)
    navigate('/subscriptions')
  }, [sub, navigate])

  if (!sub) return null

  const days = daysUntilNextPayment(sub.nextPaymentDate)
  const totalPaid = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
  const actualTotal = totalPaid > 0 ? totalPaid : estimateTotalPaid(sub)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <button
        onClick={() => navigate('/subscriptions')}
        className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Terug naar abonnementen
      </button>

      <div className={`${card} rounded-xl p-6 mb-6`}>
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0"
            style={{ backgroundColor: sub.color }}
          >
            {sub.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{sub.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{sub.category}</span>
                  {!sub.active && (
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">Gepauzeerd</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Bewerken"
                >
                  <Edit3 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Verwijderen"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Website link */}
        {sub.website && (
          <a
            href={sub.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span className="truncate">{sub.website.replace(/^https?:\/\//, '')}</span>
          </a>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className={stat}>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
              <CreditCard className="w-3.5 h-3.5" />
              Prijs
            </div>
            <p className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(sub.price)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{BILLING_CYCLE_LABELS[sub.billingCycle]}</p>
          </div>
          <div className={stat}>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
              <Calendar className="w-3.5 h-3.5" />
              Volgende betaling
            </div>
            <p className="text-lg font-bold text-slate-800 dark:text-white">{formatDate(sub.nextPaymentDate)}</p>
            <p className={`text-xs ${days <= 3 ? 'text-red-500 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
              {formatDaysUntil(days)}
            </p>
          </div>
          <div className={stat}>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
              <Clock className="w-3.5 h-3.5" />
              Sinds
            </div>
            <p className="text-lg font-bold text-slate-800 dark:text-white">{formatDate(sub.startDate)}</p>
          </div>
          <div className={stat}>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Totaal betaald
            </div>
            <p className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(actualTotal)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{totalPaid > 0 ? 'Uit transacties' : 'Geschat'}</p>
          </div>
        </div>

        {sub.notes && (
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-300">{sub.notes}</p>
          </div>
        )}
      </div>

      {/* Transactions */}
      <div className={`${card} rounded-xl p-6`}>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
          Transacties ({transactions.length})
        </h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">
            Nog geen transacties. Importeer een bankafschrift om transacties te koppelen.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{tx.description}</p>
                  <p className="text-xs text-slate-400">{formatDate(tx.date)}</p>
                </div>
                <span className={`text-sm font-medium ${tx.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {formatCurrency(Math.abs(tx.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Abonnement verwijderen?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Weet je zeker dat je <strong className="text-slate-700 dark:text-slate-200">{sub.name}</strong> wilt verwijderen? Dit kan niet ongedaan gemaakt worden.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Annuleren
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <SubscriptionForm
          initial={sub}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  )
}
