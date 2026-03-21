import { useState } from 'react'
import type { Subscription, BillingCycle } from '../types'
import { CATEGORIES, BILLING_CYCLE_LABELS, COLORS } from '../types'
import { calculateNextPaymentDate } from '../lib/calculations'
import { X, Globe } from 'lucide-react'

interface Props {
  initial?: Subscription
  onSubmit: (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

const inputCls = 'w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'

export default function SubscriptionForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState(initial?.category ?? 'Overig')
  const [price, setPrice] = useState(initial?.price?.toString() ?? '')
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initial?.billingCycle ?? 'monthly')
  const [startDate, setStartDate] = useState(initial?.startDate ?? new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [website, setWebsite] = useState(initial?.website ?? '')
  const [color, setColor] = useState(initial?.color ?? COLORS[0])
  const [active, setActive] = useState(initial?.active ?? true)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const priceNum = parseFloat(price.replace(',', '.'))
    if (!name || isNaN(priceNum)) return
    onSubmit({
      name, category, price: priceNum, currency: 'EUR',
      billingCycle, startDate,
      nextPaymentDate: calculateNextPaymentDate(startDate, billingCycle),
      notes, website, color, active,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {initial ? 'Abonnement bewerken' : 'Nieuw abonnement'}
          </h2>
          <button onClick={onCancel} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Naam</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="bijv. Netflix, Spotify..." className={inputCls} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Prijs</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                <input type="text" value={price} onChange={e => setPrice(e.target.value)}
                  placeholder="0,00" className={`${inputCls} pl-7`} required />
              </div>
            </div>
            <div>
              <label className={labelCls}>Cyclus</label>
              <select value={billingCycle} onChange={e => setBillingCycle(e.target.value as BillingCycle)}
                className={inputCls}>
                {Object.entries(BILLING_CYCLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Categorie</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Startdatum</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Kleur</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Website</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="url" value={website} onChange={e => setWebsite(e.target.value)}
                placeholder="https://..." className={`${inputCls} pl-9`} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Notities</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Optionele notities..." rows={2}
              className={`${inputCls} resize-none`} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)}
              className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500" />
            <span className="text-sm text-slate-700 dark:text-slate-300">Actief abonnement</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Annuleren
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              {initial ? 'Opslaan' : 'Toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
