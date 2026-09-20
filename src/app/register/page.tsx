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
      <main className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col px-6 pb-8 pt-24 sm:max-w-md sm:px-8">
        <div className="w-full">
          <p className="page-eyebrow mb-9 text-text-primary">Fitness 3D <span className="ml-1 text-accent">●</span></p>
          <h1 className="text-[2rem] font-medium tracking-[-0.055em] text-text-primary">Hesap Oluştur</h1>
          <p className="mt-4 text-sm leading-6 text-text-secondary">Antrenman yolculuğunuza bugün başlayın.</p>
          <div className="mt-10 border border-border-strong/70 bg-surface p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-primary">✉ <span className="ml-2">E-postanı doğrula</span></h2>

          <p className="mt-4 text-sm text-text-secondary leading-relaxed">
            Hesabın oluşturuldu. Giriş yapmadan önce e-posta adresine gönderdiğimiz doğrulama bağlantısına tıklaman gerekiyor.
          </p>

          {registeredEmail && (
            <div className="mb-4 mt-4 border-y border-border-subtle py-3 text-sm font-medium text-text-primary break-all">
              {registeredEmail}
            </div>
          )}

          <p className="text-xs text-text-muted mb-6">
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
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || cooldown > 0}
              className="button-secondary w-full text-[10px] uppercase tracking-wide disabled:opacity-50"
            >
              {resendLoading
                ? 'Gönderiliyor...'
                : cooldown > 0
                ? `Tekrar Gönder (${cooldown}s)`
                : 'Doğrulama E-postasını Yeniden Gönder'}
            </button>
            <Link href="/login" className="text-center text-xs text-text-secondary hover:text-text-primary">Giriş sayfasına dön</Link>
          </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col px-6 pb-8 pt-24 sm:max-w-md sm:px-8">
      <div className="w-full">
        <p className="page-eyebrow mb-9 text-text-primary">Fitness 3D <span className="ml-1 text-accent">●</span></p>
        <h1 className="text-[2rem] font-medium tracking-[-0.055em] text-text-primary">Hesap Oluştur</h1>
        <p className="mt-4 text-sm leading-6 text-text-secondary">Antrenman yolculuğunuza bugün başlayın.</p>
        
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

        <form action={handleSubmit} className="mt-12 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="page-eyebrow">E-posta</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              className="h-12 w-full rounded-none border-border-strong bg-white px-4 text-sm text-[#222]"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="page-eyebrow">Şifre</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className="h-12 w-full rounded-none border-border-strong bg-white px-4 text-sm text-[#222]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="passwordConfirm" className="page-eyebrow">Şifreyi Onayla</label>
            <input 
              id="passwordConfirm" 
              name="passwordConfirm" 
              type="password" 
              required 
              className="h-12 w-full rounded-none border-border-strong bg-white px-4 text-sm text-[#222]"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-5 flex min-h-14 items-center justify-between border border-text-primary bg-transparent px-6 text-base font-semibold text-text-primary hover:border-accent hover:text-accent disabled:opacity-50"
          >
            <span>{loading ? 'Hesap oluşturuluyor...' : 'Kayıt Ol'}</span><span className="text-accent">→</span>
          </button>
        </form>

        <Link href="/login" className="mt-7 block text-center text-xs text-text-secondary hover:text-text-primary">Zaten hesabın var mı? Giriş Yap</Link>
      </div>
    </main>
  )
}
