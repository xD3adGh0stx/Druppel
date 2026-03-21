import { createContext, useContext, useState } from 'react'

export interface Profile {
  name: string
  email: string
  avatarColor: string
  notifyDays: number[]  // days before payment to send notification
}

const DEFAULTS: Profile = { name: '', email: '', avatarColor: '#3B82F6', notifyDays: [1, 3] }
const KEY = 'druppel_profile'

interface ProfileContextValue {
  profile: Profile
  saveProfile: (p: Partial<Profile>) => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(() => {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } }
    catch { return DEFAULTS }
  })

  function saveProfile(p: Partial<Profile>) {
    const next = { ...profile, ...p }
    setProfile(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  return <ProfileContext.Provider value={{ profile, saveProfile }}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
