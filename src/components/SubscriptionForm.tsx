import { useState, useRef, useMemo } from 'react'
import type { Subscription, BillingCycle } from '../types'
import { CATEGORIES, BILLING_CYCLE_LABELS, COLORS } from '../types'
import { calculateNextPaymentDate } from '../lib/calculations'
import { X, Globe, Search, Camera, ChevronDown, Check } from 'lucide-react'

interface Props {
  initial?: Subscription
  onSubmit: (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

const inputCls = 'w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm'
const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'

function CategoryPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return CATEGORIES as readonly string[]
    const q = search.toLowerCase()
    return (CATEGORIES as readonly string[]).filter(c => c.toLowerCase().includes(q))
  }, [search])

  // Group categories by type
  const groups: Record<string, string[]> = {}
  filtered.forEach(cat => {
    const groupMap: Record<string, string> = {
      'Streaming video': 'Entertainment',
      'Streaming muziek': 'Entertainment',
      'Gaming': 'Entertainment',
      'Podcasts & Audio': 'Entertainment',
      'Boeken & E-readers': 'Entertainment',
      'Sport & Fitness': 'Entertainment',
      'Software & Apps': 'Software & Tech',
      'Cloud opslag': 'Software & Tech',
      'VPN & Beveiliging': 'Software & Tech',
      'AI & Productiviteit': 'Software & Tech',
      'Webhosting': 'Software & Tech',
      'Developer tools': 'Software & Tech',
      'Telefoon': 'Communicatie',
      'Internet': 'Communicatie',
      'Nieuwsbrief': 'Communicatie',
      'Nieuws & Media': 'Communicatie',
      'Verzekering': 'Financieel',
      'Bank & Betalen': 'Financieel',
      'Investeren': 'Financieel',
      'Eten & Drinken': 'Levensstijl',
      'Mode & Kleding': 'Levensstijl',
      'Beauty & Verzorging': 'Levensstijl',
      'Reizen': 'Levensstijl',
      'Auto & Vervoer': 'Levensstijl',
      'Wonen & Energie': 'Levensstijl',
      'Huisdieren': 'Levensstijl',
      'Onderwijs & Cursussen': 'Onderwijs',
      'Taal leren': 'Onderwijs',
      'Zakelijk': 'Zakelijk',
      'Marketing': 'Zakelijk',
      'Overig': 'Overig',
    }
    const group = groupMap[cat] ?? 'Overig'
    if (!groups[group]) groups[group] = []
    groups[group].push(cat)
  })

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${inputCls} flex items-center justify-between`}
      >
        <span>{value}</span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold text-slate-800 dark:text-white">Kies categorie</h3>
              <button onClick={() => { setOpen(false); setSearch('') }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Zoeken..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-2">
              {Object.entries(groups).map(([group, cats]) => (
                <div key={group} className="mb-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-2 mb-1">{group}</p>
                  {cats.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => { onChange(cat); setOpen(false); setSearch('') }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        cat === value
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{cat}</span>
                      {cat === value && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              ))}
              {Object.keys(groups).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">Geen resultaten</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SubscriptionForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState(initial?.category ?? 'Overig')
  const [price, setPrice] = useState(initial?.price?.toString() ?? '')
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initial?.billingCycle ?? 'monthly')
  const [startDate, setStartDate] = useState(initial?.startDate ?? new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [website, setWebsite] = useState(initial?.website ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '')
  const [color, setColor] = useState(initial?.color ?? COLORS[0])
  const [active, setActive] = useState(initial?.active ?? true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setImageUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const priceNum = parseFloat(price.replace(',', '.'))
    if (!name || isNaN(priceNum)) return
    onSubmit({
      name, category, price: priceNum, currency: 'EUR',
      billingCycle, startDate,
      nextPaymentDate: calculateNextPaymentDate(startDate, billingCycle),
      notes, website, imageUrl, color, active,
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
          {/* Logo upload */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 transition-colors shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800"
            >
              {imageUrl ? (
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: color }}
                >
                  {name ? name.charAt(0).toUpperCase() : <Camera className="w-5 h-5 text-slate-400" />}
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            <div className="flex-1">
              <label className={labelCls}>Naam</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="bijv. Netflix, Spotify..." className={inputCls} required />
            </div>
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
              <CategoryPicker value={category} onChange={setCategory} />
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
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'}`}
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
