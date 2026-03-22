import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CreditCard, PiggyBank, CalendarDays, User } from 'lucide-react'
import { useProfile } from '../context/ProfileContext'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/subscriptions', icon: CreditCard, label: 'Abonnementen' },
  { to: '/finance', icon: PiggyBank, label: 'Financiën' },
  { to: '/planning', icon: CalendarDays, label: 'Planning' },
]

function Avatar({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const { profile } = useProfile()
  const initials = profile.name.trim()
    ? profile.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : <User className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
  const cls = size === 'sm'
    ? 'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0'
    : 'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0'
  return (
    <div className={cls} style={{ backgroundColor: profile.avatarColor }}>
      {initials}
    </div>
  )
}

export default function Sidebar() {
  const { profile } = useProfile()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Druppel" className="w-7 h-7" />
            <span className="text-lg font-bold text-slate-800 dark:text-white">Druppel</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Account link onderaan */}
        <NavLink
          to="/account"
          className={({ isActive }) =>
            `m-3 p-3 rounded-xl flex items-center gap-3 transition-colors border ${
              isActive
                ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`
          }
        >
          <Avatar size="md" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
              {profile.name || 'Account'}
            </p>
            <p className="text-xs text-slate-400 truncate">{profile.email || 'Profiel aanpassen'}</p>
          </div>
        </NavLink>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center safe-area-bottom">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        {/* Account knop in mobiele nav */}
        <NavLink
          to="/account"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
              isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${isActive ? 'ring-2 ring-blue-500' : ''}`}
                style={{ background: profile.avatarColor }}>
                {profile.name ? profile.name[0].toUpperCase() : <User className="w-3 h-3" />}
              </div>
              <span>Account</span>
            </>
          )}
        </NavLink>
      </nav>
    </>
  )
}
