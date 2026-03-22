import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { initDatabase, getAllSubscriptions } from './lib/database'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { ProfileProvider, useProfile } from './context/ProfileContext'
import { requestNotificationPermission, schedulePaymentNotifications } from './lib/notifications'
import Sidebar from './components/Sidebar'
import WelcomeModal from './components/WelcomeModal'
import Dashboard from './pages/Dashboard'
import Subscriptions from './pages/Subscriptions'
import SubscriptionDetail from './pages/SubscriptionDetail'
import ImportPage from './pages/ImportPage'
import FinancePage from './pages/FinancePage'
import AccountPage from './pages/AccountPage'
import PlanningPage from './pages/PlanningPage'
import { Loader2 } from 'lucide-react'
import { StatusBar, Style } from '@capacitor/status-bar'

const SWIPE_ROUTES = ['/', '/subscriptions', '/finance', '/planning']

async function applyStatusBar() {
  try {
    await StatusBar.setOverlaysWebView({ overlay: true })
    await StatusBar.setStyle({ style: Style.Light })
  } catch {
    // Not on native platform, no-op
  }
}

function SwipeWrapper({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    // Only horizontal swipes (dx > 60px and more horizontal than vertical)
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return

    const currentPath = location.pathname
    const idx = SWIPE_ROUTES.indexOf(currentPath)
    if (idx === -1) return

    if (dx < 0 && idx < SWIPE_ROUTES.length - 1) {
      navigate(SWIPE_ROUTES[idx + 1])
    } else if (dx > 0 && idx > 0) {
      navigate(SWIPE_ROUTES[idx - 1])
    }

    touchStartX.current = null
    touchStartY.current = null
  }

  return (
    <main
      className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </main>
  )
}

function AppInner() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isFirstLaunch } = useTheme()
  const { profile } = useProfile()

  useEffect(() => {
    applyStatusBar()
    initDatabase()
      .then(async () => {
        setLoading(false)
        const granted = await requestNotificationPermission()
        if (granted) {
          const subs = getAllSubscriptions()
          await schedulePaymentNotifications(subs, profile.notifyDays)
        }
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Druppel laden...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <p className="text-red-800 font-medium">Fout bij laden</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950"
      style={{ paddingTop: 'env(safe-area-inset-top, 24px)' }}>
      {isFirstLaunch && <WelcomeModal />}
      <Sidebar />
      <SwipeWrapper>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/planning" element={<PlanningPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Routes>
      </SwipeWrapper>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <AppInner />
      </ProfileProvider>
    </ThemeProvider>
  )
}

export default App
