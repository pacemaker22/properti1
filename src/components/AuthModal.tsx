import { useEffect, useState, type FormEvent } from 'react'
import { AlertCircle, CheckCircle2, LogIn, UserPlus, X } from 'lucide-react'
import { useAuth } from '../lib/auth'

export function AuthModal() {
  const {
    authModalOpen,
    authMode,
    closeAuthModal,
    openAuthModal,
    signIn,
    signUp,
  } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authModalOpen) return
    setError('')
    setNotice('')
  }, [authModalOpen, authMode])

  if (!authModalOpen) return null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.')
      return
    }
    if (authMode === 'signup' && password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak sama.')
      return
    }

    setSubmitting(true)
    try {
      if (authMode === 'login') {
        await signIn(email.trim(), password)
        setPassword('')
        setConfirmPassword('')
        closeAuthModal()
      } else {
        const result = await signUp(email.trim(), password)
        setPassword('')
        setConfirmPassword('')
        if (result.requiresConfirmation) {
          setNotice('Akun berhasil dibuat. Silakan konfirmasi email Anda sebelum masuk.')
        } else {
          closeAuthModal()
        }
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-primary-600">
            {authMode === 'login' ? <LogIn size={20} aria-hidden="true" /> : <UserPlus size={20} aria-hidden="true" />}
          </span>
          <button type="button" onClick={closeAuthModal} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-text-grey transition hover:bg-slate-200" aria-label="Tutup">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <h2 id="auth-modal-title" className="mt-4 text-xl font-bold text-navy">
          {authMode === 'login' ? 'Masuk sebagai penjual' : 'Daftar akun penjual'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-text-grey">
          {authMode === 'login' ? 'Masuk untuk memasang dan mengelola iklan properti Anda.' : 'Buat akun untuk memasang dan mengelola iklan properti Anda.'}
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor="auth-email" className="field-label">Email</label>
            <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" className="field-control" />
          </div>
          <div>
            <label htmlFor="auth-password" className="field-label">Kata sandi</label>
            <input id="auth-password" type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimal 6 karakter" className="field-control" />
          </div>
          {authMode === 'signup' && (
            <div>
              <label htmlFor="auth-confirm-password" className="field-label">Konfirmasi kata sandi</label>
              <input id="auth-confirm-password" type="password" autoComplete="new-password" required minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Ulangi kata sandi" className="field-control" />
            </div>
          )}

          {error && <p className="flex items-start gap-2 text-xs font-medium text-error-red" role="alert"><AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />{error}</p>}
          {notice && <p className="flex items-start gap-2 text-xs font-medium text-primary-600" role="status"><CheckCircle2 size={14} className="mt-0.5 shrink-0" aria-hidden="true" />{notice}</p>}

          <button type="submit" disabled={submitting} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-bold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60">
            {authMode === 'login' ? <LogIn size={17} aria-hidden="true" /> : <UserPlus size={17} aria-hidden="true" />}
            {submitting ? 'Memproses...' : authMode === 'login' ? 'Masuk' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-text-grey">
          {authMode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
          <button type="button" onClick={() => openAuthModal(authMode === 'login' ? 'signup' : 'login')} className="font-bold text-primary-600 hover:text-primary-500">
            {authMode === 'login' ? 'Daftar' : 'Masuk'}
          </button>
        </p>
      </div>
    </div>
  )
}
