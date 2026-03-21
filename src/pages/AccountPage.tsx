import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useProfile } from '../context/ProfileContext'
import { COLORS } from '../types'
import { Sun, Moon, User, Mail, Palette, Bell, Info, Plus, X } from 'lucide-react'

const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
const inputCls = 'w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm'
const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5'
const sectionTitle = 'text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3'

export default function AccountPage() {
  const { theme, setTheme } = useTheme()
  const { profile, saveProfile } = useProfile()

  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [saved, setSaved] = useState(false)

  const initials = name.trim()
    ? name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    saveProfile({ name: name.trim(), email: email.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Account</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Pas je profiel en instellingen aan</p>
      </div>

      {/* Avatar preview */}
      <div className={`${card} rounded-xl p-6 mb-4`}>
        <p className={sectionTitle}>Profiel</p>
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-sm"
            style={{ backgroundColor: profile.avatarColor }}
          >
            {initials}
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-white">{name || 'Jouw naam'}</p>
            <p className="text-sm text-slate-400">{email || 'jouw@email.nl'}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Naam</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jouw naam"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />E-mailadres (optioneel)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jouw@email.nl"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" />Avatarkleur</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => saveProfile({ avatarColor: c })}
                  className={`w-8 h-8 rounded-full transition-all ${
                    profile.avatarColor === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {saved ? '✓ Opgeslagen' : 'Opslaan'}
          </button>
        </form>
      </div>

      {/* Thema */}
      <div className={`${card} rounded-xl p-6 mb-4`}>
        <p className={sectionTitle}>Weergave</p>
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-white">Thema</p>
            <p className="text-xs text-slate-400 mt-0.5">Kies licht of donker uiterlijk</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
              theme === 'light'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <Sun className="w-4 h-4" />
            Licht
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
              theme === 'dark'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <Moon className="w-4 h-4" />
            Donker
          </button>
        </div>
      </div>

      {/* Meldingen */}
      <div className={`${card} rounded-xl p-6 mb-4`}>
        <p className={sectionTitle}>Meldingen</p>
        <div className="flex items-start gap-3 mb-4">
          <Bell className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-white">Betalingsherinneringen</p>
            <p className="text-xs text-slate-400 mt-0.5">Kies hoeveel dagen van tevoren je een melding wilt ontvangen</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {[...profile.notifyDays].sort((a, b) => b - a).map(day => (
            <div key={day} className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-full text-sm font-medium">
              {day} {day === 1 ? 'dag' : 'dagen'} van tevoren
              <button
                onClick={() => saveProfile({ notifyDays: profile.notifyDays.filter(d => d !== day) })}
                className="ml-1 hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {profile.notifyDays.length === 0 && (
            <p className="text-xs text-slate-400 italic">Geen meldingen ingesteld</p>
          )}
        </div>

        <div className="flex gap-2">
          {[1, 2, 3, 5, 7, 14].filter(d => !profile.notifyDays.includes(d)).map(day => (
            <button
              key={day}
              onClick={() => saveProfile({ notifyDays: [...profile.notifyDays, day].sort((a, b) => a - b) })}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-full text-xs text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Plus className="w-3 h-3" />{day}d
            </button>
          ))}
        </div>
      </div>

      {/* App info */}
      <div className={`${card} rounded-xl p-6`}>
        <p className={sectionTitle}>Over de app</p>
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm text-slate-700 dark:text-slate-300">Druppel – Abonnementen & Financiën</p>
            <p className="text-xs text-slate-400">Versie 1.0.0</p>
            <p className="text-xs text-slate-400">Alle data wordt lokaal opgeslagen op dit apparaat</p>
          </div>
        </div>
      </div>
    </div>
  )
}
