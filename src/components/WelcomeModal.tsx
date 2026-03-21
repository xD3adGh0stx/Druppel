import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { Sun, Moon } from 'lucide-react'

export default function WelcomeModal() {
  const { setTheme, dismissWelcome } = useTheme()

  // Pre-select based on system dark mode preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const [selected, setSelected] = useState<'light' | 'dark'>(prefersDark ? 'dark' : 'light')

  // Apply theme preview live as user hovers/selects
  function handleSelect(theme: 'light' | 'dark') {
    setSelected(theme)
    setTheme(theme) // live preview
  }

  function handleConfirm() {
    setTheme(selected)
    dismissWelcome()
  }

  const isDark = selected === 'dark'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
      <div className="rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden bg-white border border-slate-200">

        {/* Header */}
        <div className="bg-linear-to-br from-blue-500 to-blue-700 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <img src="/logo.png" alt="Druppel" className="w-11 h-11" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welkom bij Druppel</h1>
          <p className="text-blue-100 text-sm mt-2">Jouw abonnementen tracker</p>
        </div>

        {/* Theme picker */}
        <div className="p-6">
          <p className="text-sm font-medium text-center mb-4 text-slate-700">
            Kies je voorkeursstijl
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Light */}
            <button
              onClick={() => handleSelect('light')}
              className={`relative rounded-2xl p-4 border-2 transition-all ${
                selected === 'light'
                  ? 'border-blue-500 shadow-lg'
                  : isDark ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="bg-slate-50 rounded-xl p-3 mb-3">
                <div className="h-2 bg-slate-200 rounded-full mb-2" />
                <div className="h-2 bg-slate-200 rounded-full w-3/4" />
                <div className="flex gap-1.5 mt-3">
                  <div className="h-8 flex-1 bg-white rounded-lg border border-slate-200" />
                  <div className="h-8 flex-1 bg-white rounded-lg border border-slate-200" />
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className={`text-sm font-medium text-slate-700`}>Licht</span>
              </div>
              {selected === 'light' && <Checkmark />}
            </button>

            {/* Dark */}
            <button
              onClick={() => handleSelect('dark')}
              className={`relative rounded-2xl p-4 border-2 transition-all ${
                selected === 'dark'
                  ? 'border-blue-500 shadow-lg shadow-blue-900/30'
                  : isDark ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="bg-slate-900 rounded-xl p-3 mb-3">
                <div className="h-2 bg-slate-700 rounded-full mb-2" />
                <div className="h-2 bg-slate-700 rounded-full w-3/4" />
                <div className="flex gap-1.5 mt-3">
                  <div className="h-8 flex-1 bg-slate-800 rounded-lg border border-slate-700" />
                  <div className="h-8 flex-1 bg-slate-800 rounded-lg border border-slate-700" />
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Moon className="w-4 h-4 text-blue-400" />
                <span className={`text-sm font-medium text-slate-700`}>Donker</span>
              </div>
              {selected === 'dark' && <Checkmark />}
            </button>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg"
          >
            Aan de slag →
          </button>

          <p className="text-xs text-slate-400 text-center mt-3">
            Je kunt dit later aanpassen via de Thema knop
          </p>
        </div>
      </div>
    </div>
  )
}

function Checkmark() {
  return (
    <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
