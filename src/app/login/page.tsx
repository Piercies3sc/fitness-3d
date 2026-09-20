'use client'

import { useState, useEffect } from 'react'
import { login } from './actions'
import { resendVerification } from '../register/actions'
import Link from 'next/link'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [unverified, setUnverified] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)

  // Resend state
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [resendError, setResendError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  async function handleResend() {
    if (!unverifiedEmail || cooldown > 0 || resendLoading) return
    setResendLoading(true)
    setResendError(null)
    setResendMessage(null)

    const result = await resendVerification(unverifiedEmail)
    setResendLoading(false)

    if (result?.error) {
      setResendError(result.error)
      if (result.rateLimited) {
        setCooldown(60)
      }
    } else {
      setResendMessage('Doğrulama e-postası tekrar gönderildi. Lütfen gelen kutunu kontrol et.')
      setCooldown(60)
    }
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setUnverified(false)

    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      if (result.unverified && result.email) {
        setUnverified(true)
        setUnverifiedEmail(result.email)
      }
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="surface-panel w-full max-w-sm p-6 sm:p-8">
        <p className="page-eyebrow mb-2 text-center">Fitness 3D</p>
        <h1 className="page-title mb-6 text-center text-2xl">Giriş Yap</h1>
        
        {(!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url_here') && (
          <div className="mb-4 p-3 rounded-md bg-status-warning/10 border border-status-warning/20 text-status-warning text-sm">
            Geliştirme uyarısı: Supabase bilgileri yapılandırılmadı. Kimlik doğrulama çalışmaz.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-md bg-status-danger/10 border border-status-danger/20 text-status-danger text-sm">
            <p className="leading-relaxed">{error}</p>
            {unverified && unverifiedEmail && (
              <div className="mt-3 pt-3 border-t border-status-danger/20">
                {resendMessage && (
                  <p className="mb-2 text-status-success text-xs font-medium">
                    {resendMessage}
                  </p>
                )}
                {resendError && (
                  <p className="mb-2 text-status-danger text-xs font-medium">
                    {resendError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading || cooldown > 0}
                  className="button-secondary w-full text-xs min-h-[2.25rem] py-1.5 disabled:opacity-50"
                >
                  {resendLoading
                    ? 'Gönderiliyor...'
                    : cooldown > 0
                    ? `Tekrar Gönder (${cooldown}s)`
                    : 'Doğrulama E-postasını Yeniden Gönder'}
                </button>
              </div>
            )}
          </div>
        )}

        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-text-secondary">E-posta</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              className="field-control px-3"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-text-secondary">Şifre</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className="field-control px-3"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="button-primary mt-2 disabled:opacity-50"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          Hesabın yok mu? <Link href="/register" className="text-accent hover:underline">Kayıt Ol</Link>
        </p>
      </div>
    </main>
  )
}

