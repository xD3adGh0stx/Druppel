import { useState, useCallback, useEffect } from 'react'
import { getAllSubscriptions, addTransactions, getAllBankAccounts } from '../lib/database'
import { parseCSV, parseMT940, parsePDF, autoMatchTransactions } from '../lib/importers'
import type { Subscription, Transaction, BankAccount } from '../types'
import { formatCurrency, formatDate } from '../lib/calculations'
import { Upload, FileText, Check, AlertCircle, Link2, ChevronDown, CreditCard, PiggyBank } from 'lucide-react'

type Step = 'upload' | 'review' | 'match' | 'done'

const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload')
  const [transactions, setTransactions] = useState<Omit<Transaction, 'id' | 'createdAt'>[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [importCount, setImportCount] = useState(0)
  const [pdfText, setPdfText] = useState<string | null>(null)

  useEffect(() => {
    setSubscriptions(getAllSubscriptions())
    const accs = getAllBankAccounts()
    setAccounts(accs)
    if (accs.length > 0) setSelectedAccountId(accs[0].id)
  }, [])

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    setPdfText(null)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase()
      let parsed: Omit<Transaction, 'id' | 'createdAt'>[] = []

      if (ext === 'pdf') {
        setPdfText(await parsePDF(file))
        return
      }

      const text = await file.text()

      if (ext === 'csv' || ext === 'txt') {
        parsed = parseCSV(text)
      } else if (ext === 'sta' || ext === 'mt940' || ext === 'swi' || ext === 'mta') {
        parsed = parseMT940(text)
      } else {
        // Auto-detect: if content looks like MT940, parse as MT940, else try CSV
        if (text.includes(':60F:') || text.includes(':61:') || text.includes(':20:')) {
          parsed = parseMT940(text)
        } else {
          parsed = parseCSV(text)
        }
      }

      if (parsed.length === 0) throw new Error('Geen transacties gevonden in het bestand')
      setTransactions(autoMatchTransactions(parsed, subscriptions))
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout bij importeren')
    }
  }, [subscriptions])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function updateTransactionMatch(index: number, subscriptionId: string | null) {
    setTransactions(prev => prev.map((tx, i) => i === index ? { ...tx, subscriptionId } : tx))
  }

  function handleImport() {
    const toImport = transactions.filter(tx => tx.amount < 0 || tx.subscriptionId)
    addTransactions(toImport, selectedAccountId || undefined)
    setImportCount(toImport.length)
    setStep('done')
  }

  function reset() {
    setStep('upload')
    setTransactions([])
    setError(null)
    setPdfText(null)
    setImportCount(0)
  }

  const matchedCount = transactions.filter(tx => tx.subscriptionId).length

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Bankafschrift importeren</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Upload een CSV, MT940 of PDF bestand van je bank</p>
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div>
          {accounts.length > 0 && (
            <div className={`${card} rounded-xl p-4 mb-4`}>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Importeren naar rekening</p>
              <div className="flex flex-wrap gap-2">
                {accounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                      selectedAccountId === acc.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {acc.type === 'spaar'
                      ? <PiggyBank className="w-4 h-4" />
                      : <CreditCard className="w-4 h-4" />}
                    <span>{acc.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${acc.type === 'spaar' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'}`}>
                      {acc.type === 'spaar' ? 'Spaar' : 'Betaal'}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => setSelectedAccountId('')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                    selectedAccountId === ''
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  Geen rekening
                </button>
              </div>
            </div>
          )}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => document.getElementById('file-input')?.click()}
            className={`${card} rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors p-12 text-center cursor-pointer`}
          >
            <Upload className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-300 font-medium">Sleep een bestand hierheen</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">of klik om een bestand te kiezen</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">CSV</span>
              <span className="text-xs bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">MT940</span>
              <span className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full">PDF</span>
            </div>
            <input id="file-input" type="file" accept="*/*"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} className="hidden" />
          </div>

          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 dark:text-red-300 font-medium">Fout bij importeren</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {pdfText && (
            <div className={`mt-4 ${card} rounded-xl p-6`}>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />Tekst uit PDF
              </h3>
              <pre className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap">{pdfText}</pre>
              <p className="text-xs text-slate-400 mt-3">PDF-import is beperkt. Exporteer als CSV voor betere resultaten.</p>
            </div>
          )}

          <div className={`mt-6 ${card} rounded-xl p-6`}>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Ondersteunde banken</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { name: 'ING', desc: 'Mijn ING → Downloaden → CSV' },
                { name: 'Rabobank', desc: 'Rabo Online → Transacties → Downloaden' },
                { name: 'ABN AMRO', desc: 'Internet Bankieren → Exporteren' },
              ].map(b => (
                <div key={b.name} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <p className="font-medium text-sm text-slate-700 dark:text-slate-200">{b.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <div>
          <div className={`${card} rounded-xl p-4 mb-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">{transactions.length} transacties gevonden</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {matchedCount} automatisch gekoppeld
                  {selectedAccountId && accounts.find(a => a.id === selectedAccountId) && (
                    <> · <span className="text-blue-500">{accounts.find(a => a.id === selectedAccountId)!.name}</span></>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={reset} className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Opnieuw</button>
                <button onClick={() => setStep('match')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Koppelen →</button>
              </div>
            </div>
          </div>
          <div className={`${card} rounded-xl divide-y divide-slate-100 dark:divide-slate-800`}>
            {transactions.slice(0, 50).map((tx, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{tx.description}</p>
                  <p className="text-xs text-slate-400">{formatDate(tx.date)}</p>
                </div>
                <span className={`text-sm font-medium ml-4 ${tx.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {formatCurrency(Math.abs(tx.amount))}
                </span>
                {tx.subscriptionId && (
                  <span className="ml-3 text-xs bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Link2 className="w-3 h-3" />Gekoppeld
                  </span>
                )}
              </div>
            ))}
            {transactions.length > 50 && (
              <div className="px-4 py-3 text-center text-sm text-slate-400">En nog {transactions.length - 50} transacties...</div>
            )}
          </div>
        </div>
      )}

      {/* Step: Match */}
      {step === 'match' && (
        <div>
          <div className={`${card} rounded-xl p-4 mb-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">Koppel transacties aan abonnementen</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{matchedCount} van {transactions.length} gekoppeld</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep('review')} className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Terug</button>
                <button onClick={handleImport} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  Importeren ({transactions.filter(tx => tx.amount < 0 || tx.subscriptionId).length})
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {transactions.map((tx, i) => ({ tx, i })).filter(({ tx }) => tx.amount < 0).slice(0, 100).map(({ tx, i }) => {
              const matched = subscriptions.find(s => s.id === tx.subscriptionId)
              return (
                <div key={i} className={`${card} rounded-lg px-4 py-3 flex items-center gap-4`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{formatDate(tx.date)}</span>
                      <span className="text-xs font-medium text-red-500">{formatCurrency(Math.abs(tx.amount))}</span>
                    </div>
                  </div>
                  <div className="relative shrink-0">
                    <select
                      value={tx.subscriptionId || ''}
                      onChange={e => updateTransactionMatch(i, e.target.value || null)}
                      className="appearance-none pl-3 pr-8 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none"
                    >
                      <option value="">-- Geen koppeling --</option>
                      {subscriptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  {matched && <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: matched.color }} />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className={`${card} rounded-xl p-12 text-center`}>
          <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Importeren gelukt!</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {importCount} transactie{importCount !== 1 ? 's' : ''} zijn geïmporteerd.
          </p>
          <button onClick={reset} className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Nog een bestand importeren
          </button>
        </div>
      )}
    </div>
  )
}
