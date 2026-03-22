import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getAllPots, addPot, updatePot, deletePot, getPotBalance,
  getMonthlyStats,
  getAllBankAccounts, addBankAccount, updateBankAccount, deleteBankAccount, getAccountBalance,
  addManualTransaction, getTransactionsForAccount, getTransactionsForPot,
  deleteTransactionWithGroup,
} from '../lib/database'
import type { Pot, Transaction, BankAccount, AccountType, TransactionType, RecurringType } from '../types'
import { COLORS } from '../types'
import { formatCurrency, formatDate } from '../lib/calculations'
import {
  Plus, Trash2, Edit3, X, TrendingUp, TrendingDown, Wallet,
  PiggyBank, CreditCard, ArrowLeftRight, ArrowDownLeft, ArrowUpRight,
  ChevronLeft, Repeat, Clock, AlertTriangle,
} from 'lucide-react'

const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
const inputCls = 'w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm'
const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'

const TX_TYPES: { type: TransactionType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'income',         label: 'Inkomsten',   icon: <ArrowDownLeft className="w-5 h-5" />,  color: '#10B981' },
  { type: 'expense',        label: 'Uitgave',     icon: <ArrowUpRight className="w-5 h-5" />,   color: '#EF4444' },
  { type: 'transfer',       label: 'Overboeking', icon: <ArrowLeftRight className="w-5 h-5" />, color: '#3B82F6' },
  { type: 'pot_allocation', label: 'Naar potje',  icon: <PiggyBank className="w-5 h-5" />,      color: '#8B5CF6' },
]

const RECURRING_OPTIONS: { value: RecurringType | ''; label: string }[] = [
  { value: '',        label: 'Eenmalig'    },
  { value: 'weekly',  label: 'Wekelijks'   },
  { value: 'monthly', label: 'Maandelijks' },
  { value: 'yearly',  label: 'Jaarlijks'   },
]

const RECURRING_LABEL: Record<string, string> = {
  weekly: 'Wekelijks', monthly: 'Maandelijks', yearly: 'Jaarlijks',
}

function AccountForm({ initial, onSubmit, onCancel }: {
  initial?: BankAccount
  onSubmit: (d: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}) {
  const [name, setName]       = useState(initial?.name ?? '')
  const [type, setType]       = useState<AccountType>(initial?.type ?? 'betaal')
  const [color, setColor]     = useState(initial?.color ?? COLORS[0])
  const [iban, setIban]       = useState(initial?.iban ?? '')
  const [opening, setOpening] = useState(initial?.openingBalance?.toString() ?? '0')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name) return
    onSubmit({ name, type, color, iban, openingBalance: parseFloat(opening.replace(',', '.')) || 0 })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className={`${card} rounded-2xl shadow-2xl w-full max-w-md`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {initial ? 'Rekening bewerken' : 'Rekening toevoegen'}
          </h2>
          <button onClick={onCancel} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Naam</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="bijv. ING Betaalrekening" className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <div className="grid grid-cols-2 gap-3">
              {(['betaal', 'spaar'] as AccountType[]).map(t => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    type === t ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                  {t === 'betaal' ? <CreditCard className="w-4 h-4" /> : <PiggyBank className="w-4 h-4" />}
                  {t === 'betaal' ? 'Betaalrekening' : 'Spaarrekening'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>IBAN (optioneel)</label>
            <input value={iban} onChange={e => setIban(e.target.value.toUpperCase())} placeholder="NL00 BANK 0000 0000 00" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Beginsaldo</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
              <input value={opening} onChange={e => setOpening(e.target.value)} placeholder="0,00" className={`${inputCls} pl-7`} />
            </div>
            <p className="text-xs text-slate-400 mt-1">Huidig saldo om mee te beginnen</p>
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
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300">Annuleren</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">{initial ? 'Opslaan' : 'Toevoegen'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PotForm({ initial, onSubmit, onCancel }: {
  initial?: Pot
  onSubmit: (d: Omit<Pot, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}) {
  const [name, setName]           = useState(initial?.name ?? '')
  const [color, setColor]         = useState(initial?.color ?? COLORS[2])
  const [budgetAmount, setBudget] = useState(initial?.budgetAmount?.toString() ?? '')
  const [description, setDesc]    = useState(initial?.description ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(budgetAmount.replace(',', '.'))
    if (!name || isNaN(amt)) return
    onSubmit({ name, color, budgetAmount: amt, description })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className={`${card} rounded-2xl shadow-2xl w-full max-w-md`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{initial ? 'Potje bewerken' : 'Nieuw potje'}</h2>
          <button onClick={onCancel} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Naam</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="bijv. Vakantie, Noodfonds..." className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Doelbedrag</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
              <input value={budgetAmount} onChange={e => setBudget(e.target.value)} placeholder="0,00" className={`${inputCls} pl-7`} required />
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
            <label className={labelCls}>Beschrijving (optioneel)</label>
            <input value={description} onChange={e => setDesc(e.target.value)} placeholder="Waarvoor is dit potje?" className={inputCls} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300">Annuleren</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">{initial ? 'Opslaan' : 'Aanmaken'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ActionForm({ accounts, pots, defaultAccountId, defaultType, defaultPotId, onSubmit, onCancel }: {
  accounts: BankAccount[]
  pots: Pot[]
  defaultAccountId?: string
  defaultType?: TransactionType
  defaultPotId?: string
  onSubmit: () => void
  onCancel: () => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const [accountId, setAccountId] = useState(defaultAccountId ?? accounts[0]?.id ?? '')
  const [type, setType]           = useState<TransactionType>(defaultType ?? 'expense')
  const [amount, setAmount]       = useState('')
  const [description, setDesc]    = useState('')
  const [date, setDate]           = useState(today)
  const [toAccountId, setToAccId] = useState(accounts.find(a => a.id !== (defaultAccountId ?? accounts[0]?.id))?.id ?? '')
  const [potId, setPotId]         = useState(defaultPotId ?? pots[0]?.id ?? '')
  const [recurring, setRecurring] = useState<RecurringType | ''>('')
  const [isExpected, setExpected] = useState(false)

  const accountBalance = useMemo(() => {
    if (!accountId) return null
    return getAccountBalance(accountId)
  }, [accountId])

  const amtNum = parseFloat(amount.replace(',', '.')) || 0
  const needsDebit = type === 'expense' || type === 'transfer' || type === 'pot_allocation'
  const remaining = accountBalance !== null && needsDebit ? accountBalance - amtNum : null
  const goingNegative = remaining !== null && remaining < 0

  function handleMax() {
    if (accountBalance !== null && accountBalance > 0) {
      setAmount(accountBalance.toFixed(2).replace('.', ','))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount.replace(',', '.'))
    if (!amt || amt <= 0) return
    addManualTransaction({
      type, date,
      description: description || TX_TYPES.find(t => t.type === type)!.label,
      amount: amt,
      accountId: accountId || null,
      toAccountId: type === 'transfer' ? (toAccountId || null) : null,
      potId: type === 'pot_allocation' ? (potId || null) : null,
      recurring: recurring || null,
      isExpected: isExpected ? 1 : 0,
    })
    onSubmit()
  }

  const txMeta = TX_TYPES.find(t => t.type === type)!

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className={`${card} rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Actie toevoegen</h2>
          <button onClick={onCancel} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* 1. Rekening EERST */}
          {accounts.length > 0 && (
            <div>
              <label className={labelCls}>{type === 'income' ? 'Naar rekening' : 'Van rekening'}</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)} className={inputCls}>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {formatCurrency(getAccountBalance(a.id))}
                  </option>
                ))}
              </select>
              {accountBalance !== null && (
                <p className="text-xs text-slate-400 mt-1">
                  Huidig saldo: <span className={`font-medium ${accountBalance < 0 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>{formatCurrency(accountBalance)}</span>
                </p>
              )}
            </div>
          )}

          {/* 2. Type actie */}
          <div>
            <label className={labelCls}>Type actie</label>
            <div className="grid grid-cols-2 gap-2">
              {TX_TYPES.map(t => (
                <button key={t.type} type="button" onClick={() => setType(t.type)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${type === t.type ? 'text-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                  style={type === t.type ? { backgroundColor: t.color, borderColor: t.color } : {}}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Bedrag met Max-knop */}
          <div>
            <label className={labelCls}>Bedrag</label>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00"
                  className={`${inputCls} pl-7`} required inputMode="decimal" />
              </div>
              {needsDebit && accountBalance !== null && accountBalance > 0 && (
                <button type="button" onClick={handleMax}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-700">
                  Max
                </button>
              )}
            </div>
            {/* Resterend saldo preview */}
            {remaining !== null && amtNum > 0 && (
              <p className={`text-xs mt-1.5 font-medium ${goingNegative ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                Resterend saldo: {formatCurrency(remaining)}
              </p>
            )}
            {/* Negatief-waarschuwing */}
            {goingNegative && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">Let op: je staat in de min na deze actie</p>
              </div>
            )}
          </div>

          {/* Omschrijving */}
          <div>
            <label className={labelCls}>Omschrijving</label>
            <input value={description} onChange={e => setDesc(e.target.value)}
              placeholder={type === 'income' ? 'Salaris' : type === 'expense' ? 'Boodschappen' : type === 'transfer' ? 'Sparen' : 'Vakantie pot'}
              className={inputCls} />
          </div>

          {/* Datum */}
          <div>
            <label className={labelCls}>Datum</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} required />
          </div>

          {/* Naar rekening (bij transfer) */}
          {type === 'transfer' && accounts.length > 1 && (
            <div>
              <label className={labelCls}>Naar rekening</label>
              <select value={toAccountId} onChange={e => setToAccId(e.target.value)} className={inputCls}>
                {accounts.filter(a => a.id !== accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}

          {/* Potje (bij pot_allocation) */}
          {type === 'pot_allocation' && (
            pots.length > 0
              ? <div>
                  <label className={labelCls}>Naar potje</label>
                  <select value={potId} onChange={e => setPotId(e.target.value)} className={inputCls}>
                    {pots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              : <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                  Maak eerst een potje aan.
                </p>
          )}

          {/* Herhaling */}
          <div>
            <label className={labelCls}>Herhaling</label>
            <div className="grid grid-cols-2 gap-2">
              {RECURRING_OPTIONS.map(r => (
                <button key={r.value} type="button" onClick={() => setRecurring(r.value as RecurringType | '')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all ${
                    recurring === r.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>
                  {r.value && <Repeat className="w-3 h-3" />}{r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Verwacht (toekomstige transactie) */}
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${isExpected ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              onClick={() => setExpected(!isExpected)}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isExpected ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Verwachte transactie</p>
              <p className="text-xs text-slate-400">Toekomstige inkomsten of uitgave</p>
            </div>
          </label>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300">Annuleren</button>
            <button type="submit" className="flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-medium" style={{ backgroundColor: txMeta.color }}>Toevoegen</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TxIcon({ type }: { type: TransactionType }) {
  const t = TX_TYPES.find(t => t.type === type) ?? TX_TYPES[1]
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: t.color + '20', color: t.color }}>
      {t.icon}
    </div>
  )
}

function AccountDetail({ account, accounts, pots, onBack, onReload }: {
  account: BankAccount; accounts: BankAccount[]; pots: Pot[]
  onBack: () => void; onReload: () => void
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showAction, setShowAction] = useState(false)
  const balance = getAccountBalance(account.id)

  function load() { setTransactions(getTransactionsForAccount(account.id)) }
  useEffect(() => { load() }, [account.id])

  function handleDelete(id: string) {
    if (!confirm('Transactie verwijderen? Bij overboekingen en potjes worden beide kanten teruggedraaid.')) return
    deleteTransactionWithGroup(id); load(); onReload()
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white truncate">{account.name}</h2>
          <p className="text-xs text-slate-400">
            {account.type === 'betaal' ? 'Betaalrekening' : 'Spaarrekening'}{account.iban ? ` · ${account.iban}` : ''}
          </p>
        </div>
        <button onClick={() => setShowAction(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shrink-0">
          <Plus className="w-4 h-4" />Actie
        </button>
      </div>

      <div className={`${card} rounded-xl p-5 mb-5`} style={{ borderColor: account.color + '60' }}>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Huidig saldo</p>
        <p className={`text-3xl font-bold ${balance < 0 ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>{formatCurrency(balance)}</p>
      </div>

      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Transacties</p>
      {transactions.length === 0 ? (
        <div className={`${card} rounded-xl p-8 text-center`}>
          <p className="text-slate-400 text-sm">Nog geen transacties — druk op Actie om te beginnen.</p>
        </div>
      ) : (
        <div className={`${card} rounded-xl divide-y divide-slate-100 dark:divide-slate-800`}>
          {transactions.map(tx => (
            <div key={tx.id} className={`flex items-center gap-3 px-4 py-3 ${tx.isExpected ? 'opacity-60' : ''}`}>
              <TxIcon type={tx.type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm text-slate-700 dark:text-slate-300 truncate ${tx.isExpected ? 'italic' : ''}`}>{tx.description}</p>
                  {Boolean(tx.isExpected) && <Clock className="w-3 h-3 text-slate-400 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-400">{formatDate(tx.date)}</p>
                  {tx.recurring && (
                    <span className="text-xs text-blue-500 flex items-center gap-0.5">
                      <Repeat className="w-2.5 h-2.5" />{RECURRING_LABEL[tx.recurring]}
                    </span>
                  )}
                  {Boolean(tx.isExpected) && <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">verwacht</span>}
                </div>
              </div>
              <span className={`text-sm font-semibold shrink-0 ${tx.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
              </span>
              <button onClick={() => handleDelete(tx.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg shrink-0">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAction && (
        <ActionForm accounts={accounts} pots={pots} defaultAccountId={account.id}
          onSubmit={() => { setShowAction(false); load(); onReload() }}
          onCancel={() => setShowAction(false)} />
      )}
    </div>
  )
}

function PotDetail({ pot, accounts, pots, onBack, onReload }: {
  pot: Pot; accounts: BankAccount[]; pots: Pot[]
  onBack: () => void; onReload: () => void
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showAction, setShowAction] = useState(false)
  const balance = getPotBalance(pot.id)

  function load() { setTransactions(getTransactionsForPot(pot.id)) }
  useEffect(() => { load() }, [pot.id])

  function handleDelete(id: string) {
    if (!confirm('Transactie verwijderen? De overboeking wordt teruggedraaid.')) return
    deleteTransactionWithGroup(id); load(); onReload()
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: pot.color }} />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white truncate">{pot.name}</h2>
        </div>
        <button onClick={() => setShowAction(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shrink-0">
          <Plus className="w-4 h-4" />Actie
        </button>
      </div>

      <div className={`${card} rounded-xl p-5 mb-5`} style={{ borderColor: pot.color + '60' }}>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Huidig saldo</p>
        <p className={`text-3xl font-bold ${balance < 0 ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>{formatCurrency(balance)}</p>
        {pot.budgetAmount > 0 && (
          <>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
              <div className="h-full rounded-full" style={{ width: `${Math.min((balance / pot.budgetAmount) * 100, 100)}%`, backgroundColor: pot.color }} />
            </div>
            <p className="text-xs text-slate-400 mt-1">Doel: {formatCurrency(pot.budgetAmount)}</p>
          </>
        )}
      </div>

      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Transacties</p>
      {transactions.length === 0 ? (
        <div className={`${card} rounded-xl p-8 text-center`}>
          <p className="text-slate-400 text-sm">Nog geen transacties in dit potje.</p>
        </div>
      ) : (
        <div className={`${card} rounded-xl divide-y divide-slate-100 dark:divide-slate-800`}>
          {transactions.map(tx => (
            <div key={tx.id} className={`flex items-center gap-3 px-4 py-3 ${tx.isExpected ? 'opacity-60' : ''}`}>
              <TxIcon type={tx.type} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm text-slate-700 dark:text-slate-300 truncate ${tx.isExpected ? 'italic' : ''}`}>{tx.description}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(tx.date)}</p>
              </div>
              <span className={`text-sm font-semibold shrink-0 ${tx.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
              </span>
              <button onClick={() => handleDelete(tx.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg shrink-0">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAction && (
        <ActionForm accounts={accounts} pots={pots}
          defaultType="pot_allocation" defaultPotId={pot.id}
          onSubmit={() => { setShowAction(false); load(); onReload() }}
          onCancel={() => setShowAction(false)} />
      )}
    </div>
  )
}

export default function FinancePage() {
  const now = new Date()
  const [accounts, setAccounts]        = useState<BankAccount[]>([])
  const [accountBalances, setBalances] = useState<Record<string, number>>({})
  const [pots, setPots]                = useState<Pot[]>([])
  const [potBalances, setPotBalances]  = useState<Record<string, number>>({})
  const [monthlyStats, setMonthly]     = useState({ income: 0, expenses: 0 })
  const [showAccountForm, setShowAcc]  = useState(false)
  const [editingAccount, setEditAcc]   = useState<BankAccount | null>(null)
  const [showPotForm, setShowPot]      = useState(false)
  const [editingPot, setEditPot]       = useState<Pot | null>(null)
  const [showAction, setShowAction]    = useState(false)
  const [selectedAccount, setSelected] = useState<BankAccount | null>(null)
  const [selectedPot, setSelectedPot]  = useState<Pot | null>(null)

  function reload() {
    const accs = getAllBankAccounts()
    setAccounts(accs)
    const bal: Record<string, number> = {}
    accs.forEach(a => { bal[a.id] = getAccountBalance(a.id) })
    setBalances(bal)
    const p = getAllPots()
    setPots(p)
    const pb: Record<string, number> = {}
    p.forEach(pot => { pb[pot.id] = getPotBalance(pot.id) })
    setPotBalances(pb)
    setMonthly(getMonthlyStats(now.getFullYear(), now.getMonth() + 1))
  }

  useEffect(() => { reload() }, [])

  const handleAddAccount  = useCallback((d: Omit<BankAccount,'id'|'createdAt'|'updatedAt'>) => { addBankAccount(d); setShowAcc(false); reload() }, [])
  const handleEditAccount = useCallback((d: Omit<BankAccount,'id'|'createdAt'|'updatedAt'>) => { if (!editingAccount) return; updateBankAccount(editingAccount.id, d); setEditAcc(null); reload() }, [editingAccount])
  const handleDelAccount  = useCallback((acc: BankAccount) => { if (confirm(`"${acc.name}" verwijderen?`)) { deleteBankAccount(acc.id); reload() } }, [])
  const handleAddPot      = useCallback((d: Omit<Pot,'id'|'createdAt'|'updatedAt'>) => { addPot(d); setShowPot(false); reload() }, [])
  const handleEditPot     = useCallback((d: Omit<Pot,'id'|'createdAt'|'updatedAt'>) => { if (!editingPot) return; updatePot(editingPot.id, d); setEditPot(null); reload() }, [editingPot])
  const handleDelPot      = useCallback((pot: Pot) => { if (confirm(`"${pot.name}" verwijderen?`)) { deletePot(pot.id); reload() } }, [])

  const totalBalance = Object.values(accountBalances).reduce((s, v) => s + v, 0)
  const net = monthlyStats.income - monthlyStats.expenses

  if (selectedAccount) {
    return (
      <div className="max-w-4xl mx-auto">
        <AccountDetail account={selectedAccount} accounts={accounts} pots={pots}
          onBack={() => { setSelected(null); reload() }} onReload={reload} />
      </div>
    )
  }

  if (selectedPot) {
    return (
      <div className="max-w-4xl mx-auto">
        <PotDetail pot={selectedPot} accounts={accounts} pots={pots}
          onBack={() => { setSelectedPot(null); reload() }} onReload={reload} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Financieel overzicht</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Rekeningen en potjes</p>
        </div>
        {accounts.length > 0 && (
          <button onClick={() => setShowAction(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shrink-0">
            <Plus className="w-4 h-4" />Actie
          </button>
        )}
      </div>

      {accounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className={`${card} rounded-xl p-5`}>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-2">
              <Wallet className="w-4 h-4" />Totaal alle rekeningen
            </div>
            <p className={`text-3xl font-bold ${totalBalance >= 0 ? 'text-slate-800 dark:text-white' : 'text-red-500'}`}>{formatCurrency(totalBalance)}</p>
          </div>
          <div className={`${card} rounded-xl p-5`}>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs mb-2">
              <TrendingUp className="w-4 h-4" />Inkomsten deze maand
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(monthlyStats.income)}</p>
          </div>
          <div className={`${card} rounded-xl p-5`}>
            <div className="flex items-center gap-2 text-red-500 text-xs mb-2">
              <TrendingDown className="w-4 h-4" />Uitgaven deze maand
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(monthlyStats.expenses)}</p>
            <p className={`text-xs mt-1 font-medium ${net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {net >= 0 ? '+' : ''}{formatCurrency(net)} netto
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Rekeningen</h2>
            <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{accounts.length}</span>
          </div>
          <button onClick={() => setShowAcc(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" />Rekening
          </button>
        </div>
        {accounts.length === 0 ? (
          <div className={`${card} rounded-xl p-8 text-center`}>
            <CreditCard className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Nog geen rekeningen</p>
            <p className="text-sm text-slate-400 mt-1">Voeg je betaal- of spaarrekening toe om te beginnen</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.map(acc => {
              const bal = accountBalances[acc.id] ?? 0
              return (
                <button key={acc.id} onClick={() => setSelected(acc)} className={`${card} rounded-xl p-4 text-left hover:shadow-md transition-shadow w-full`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: acc.color + '20' }}>
                        {acc.type === 'betaal' ? <CreditCard className="w-5 h-5" style={{ color: acc.color }} /> : <PiggyBank className="w-5 h-5" style={{ color: acc.color }} />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-800 dark:text-white">{acc.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${acc.type === 'betaal' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                          {acc.type === 'betaal' ? 'Betaalrekening' : 'Spaarrekening'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setEditAcc(acc)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Edit3 className="w-3.5 h-3.5 text-slate-400" /></button>
                      <button onClick={() => handleDelAccount(acc)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                    </div>
                  </div>
                  {acc.iban && <p className="text-xs text-slate-400 mt-2 font-mono">{acc.iban}</p>}
                  <p className={`text-2xl font-bold mt-3 ${bal < 0 ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>{formatCurrency(bal)}</p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Potjes</h2>
            <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{pots.length}</span>
          </div>
          <button onClick={() => setShowPot(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" />Nieuw potje
          </button>
        </div>
        {pots.length === 0 ? (
          <div className={`${card} rounded-xl p-8 text-center`}>
            <PiggyBank className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Nog geen potjes</p>
            <p className="text-sm text-slate-400 mt-1">Maak een spaarpotje aan voor vakantie, noodfonds, etc.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pots.map(pot => {
              const bal = potBalances[pot.id] ?? 0
              const pct = pot.budgetAmount > 0 ? Math.min((bal / pot.budgetAmount) * 100, 100) : 0
              const reached = bal >= pot.budgetAmount && pot.budgetAmount > 0
              return (
                <button key={pot.id} onClick={() => setSelectedPot(pot)}
                  className={`${card} rounded-xl p-4 text-left w-full hover:shadow-md transition-shadow`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center" style={{ backgroundColor: pot.color + '20' }}>
                        <PiggyBank className="w-4 h-4" style={{ color: pot.color }} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-800 dark:text-white">{pot.name}</p>
                        {pot.description && <p className="text-xs text-slate-400">{pot.description}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setEditPot(pot)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Edit3 className="w-3.5 h-3.5 text-slate-400" /></button>
                      <button onClick={() => handleDelPot(pot)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                    </div>
                  </div>
                  <div className="flex items-end justify-between mb-2">
                    <span className={`text-lg font-bold ${reached ? 'text-green-500' : 'text-slate-800 dark:text-white'}`}>{formatCurrency(bal)}</span>
                    <span className="text-xs text-slate-400">doel: {formatCurrency(pot.budgetAmount)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: reached ? '#10B981' : pot.color }} />
                  </div>
                  <p className={`text-xs mt-1.5 ${reached ? 'text-green-500 font-medium' : 'text-slate-400'}`}>
                    {reached ? 'Doel bereikt!' : `${formatCurrency(pot.budgetAmount - bal)} te gaan`}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {showAccountForm && <AccountForm onSubmit={handleAddAccount} onCancel={() => setShowAcc(false)} />}
      {editingAccount   && <AccountForm initial={editingAccount} onSubmit={handleEditAccount} onCancel={() => setEditAcc(null)} />}
      {showPotForm      && <PotForm onSubmit={handleAddPot} onCancel={() => setShowPot(false)} />}
      {editingPot       && <PotForm initial={editingPot} onSubmit={handleEditPot} onCancel={() => setEditPot(null)} />}
      {showAction       && <ActionForm accounts={accounts} pots={pots} onSubmit={() => { setShowAction(false); reload() }} onCancel={() => setShowAction(false)} />}
    </div>
  )
}
