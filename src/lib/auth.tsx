import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './supabase'

export type AuthMode = 'login' | 'signup'

interface AuthContextValue {
  session: Session | null
  user: User | null
  authLoading: boolean
  authModalOpen: boolean
  authMode: AuthMode
  openAuthModal: (mode?: AuthMode) => void
  closeAuthModal: () => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<{ requiresConfirmation: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const translateAuthError = (message: string) => {
  const normalized = message.toLowerCase()

  if (normalized.includes('invalid login credentials')) {
    return 'Email atau kata sandi salah.'
  }
  if (normalized.includes('user already registered')) {
    return 'Email ini sudah terdaftar. Silakan masuk.'
  }
  if (normalized.includes('email not confirmed')) {
    return 'Email belum dikonfirmasi. Periksa kotak masuk Anda.'
  }
  if (normalized.includes('password should be at least')) {
    return 'Kata sandi minimal 6 karakter.'
  }
  if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
    return 'Terlalu banyak percobaan. Silakan coba beberapa saat lagi.'
  }

  return message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('login')

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false)
      return
    }

    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setAuthLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setAuthLoading(false)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const openAuthModal = useCallback((mode: AuthMode = 'login') => {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => setAuthModalOpen(false), [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.')
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(translateAuthError(error.message))
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.')
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw new Error(translateAuthError(error.message))

    return { requiresConfirmation: !data.session }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(translateAuthError(error.message))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      authLoading,
      authModalOpen,
      authMode,
      openAuthModal,
      closeAuthModal,
      signIn,
      signUp,
      signOut,
    }),
    [
      session,
      authLoading,
      authModalOpen,
      authMode,
      openAuthModal,
      closeAuthModal,
      signIn,
      signUp,
      signOut,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
