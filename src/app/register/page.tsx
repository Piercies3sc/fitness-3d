'use client'

import { useState, useEffect } from 'react'
import { signup, resendVerification } from './actions'
import Link from 'next/link'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const [existingUser, setExistingUser] = useState(false)

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
    if (!registeredEmail || cooldown > 0 || resendLoading) return
    setResendLoading(true)
    setResendError(null)
    setResendMessage(null)

    const result = await resendVerification(registeredEmail)
    setResendLoading(false)

    if (result?.error) {
      setResendError(result.error)
      if (result.rateLimited) {
        setCooldown(60)
      }
    } else {
      setResendMessage('Doğrulama e-postası tekrar gönderildi.')
      setCooldown(60)
    }
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setExistingUser(false)

    const result = await signup(formData)

    if (result?.error) {
      setError(result.error)
      if (result.existingUser && result.email) {
        setExistingUser(true)
        setRegisteredEmail(result.email)
      }
      setLoading(false)
    } else if (result?.needsVerification && result?.email) {
      setRegisteredEmail(result.email)
      setNeedsVerification(true)
      setLoading(false)
    }
  }

  if (needsVerification) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="surface-panel w-full max-w-sm p-6 sm:p-8">
          <p className="page-eyebrow mb-2 text-center">Fitness 3D</p>
          <h1 className="page-title mb-4 text-center text-2xl">E-postanı doğrula</h1>

          <p className="text-sm text-text-secondary text-center mb-4 leading-relaxed">
            Hesabın oluşturuldu. Giriş yapmadan önce e-posta adresine gönderdiğimiz doğrulama bağlantısına tıklaman gerekiyor.
          </p>

          {registeredEmail && (
            <div className="mb-4 p-3 rounded-md bg-surface-high border border-border-subtle text-center text-sm font-medium text-text-primary break-all">
              {registeredEmail}
            </div>
          )}

          <p className="text-xs text-text-muted text-center mb-6">
            E-posta gelmediyse spam / gereksiz klasörünü de kontrol et.
          </p>

          {resendMessage && (
            <div className="mb-4 p-3 rounded-md bg-status-success/10 border border-status-success/20 text-status-success text-sm text-center">
              {resendMessage}
            </div>
          )}

          {resendError && (
            <div className="mb-4 p-3 rounded-md bg-status-danger/10 border border-status-danger/20 text-status-danger text-sm text-center">
              {resendError}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="button-primary w-full text-center"
            >
              Giriş Yap
            </Link>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || cooldown > 0}
              className="button-secondary w-full disabled:opacity-50"
            >
              {resendLoading
                ? 'Gönderiliyor...'
                : cooldown > 0
                ? `Tekrar Gönder (${cooldown}s)`
                : 'Doğrulama E-postasını Yeniden Gönder'}
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="surface-panel w-full max-w-sm p-6 sm:p-8">
        <p className="page-eyebrow mb-2 text-center">Fitness 3D</p>
        <h1 className="page-title mb-6 text-center text-2xl">Kayıt Ol</h1>
        
        {(!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url_here') && (
          <div className="mb-4 p-3 rounded-md bg-status-warning/10 border border-status-warning/20 text-status-warning text-sm">
            Geliştirme uyarısı: Supabase bilgileri yapılandırılmadı. Kimlik doğrulama çalışmaz.
          </div>
        )}

        {existingUser ? (
          <div className="mb-4 p-4 rounded-md bg-surface-high border border-border-subtle">
            <p className="text-sm text-text-secondary mb-3">
              Bu e-posta adresiyle zaten bir hesap var. Giriş yapabilir veya e-postanı doğrulamadıysan doğrulama bağlantısını tekrar gönderebilirsin.
            </p>
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
            <div className="flex flex-col gap-2">
              <Link href="/login" className="button-primary text-center">
                Giriş Yap
              </Link>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || cooldown > 0}
                className="button-secondary text-center disabled:opacity-50"
              >
                {resendLoading
                  ? 'Gönderiliyor...'
                  : cooldown > 0
                  ? `Tekrar Gönder (${cooldown}s)`
                  : 'Doğrulama E-postasını Yeniden Gönder'}
              </button>
            </div>
          </div>
        ) : error ? (
          <div className="mb-4 p-3 rounded-md bg-status-danger/10 border border-status-danger/20 text-status-danger text-sm">
            {error}
          </div>
        ) : null}

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

          <div className="flex flex-col gap-1.5">
            <label htmlFor="passwordConfirm" className="text-sm font-medium text-text-secondary">Şifreyi Onayla</label>
            <input 
              id="passwordConfirm" 
              name="passwordConfirm" 
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
            {loading ? 'Hesap oluşturuluyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          Zaten hesabın var mı? <Link href="/login" className="text-accent hover:underline">Giriş Yap</Link>
        </p>
      </div>
    </main>
  )
}

