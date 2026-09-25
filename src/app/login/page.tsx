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
    <main className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col px-6 pb-8 pt-24 sm:max-w-md sm:px-8">
      <div className="w-full">
        <p className="page-eyebrow mb-9 text-text-primary">Fitness 3D <span className="ml-1 text-accent">●</span></p>
        <h1 className="text-[2rem] font-medium tracking-[-0.055em] text-text-primary">Hoş Geldiniz</h1>
        <p className="mt-4 max-w-[18rem] text-sm leading-6 text-text-secondary">Antrenmanlarınızı takip etmek ve vücudunuzu analiz etmek için giriş yapın.</p>
        
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

        <form action={handleSubmit} className="mt-20 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="page-eyebrow">E-posta</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              placeholder="ornek@fitness3d.app"
              className="h-12 w-full rounded-none border-border-strong bg-white px-4 text-sm text-[#222] placeholder:text-[#9199a7]"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between"><label htmlFor="password" className="page-eyebrow">Şifre</label><Link href="/forgot-password" className="text-[10px] text-text-secondary underline-offset-4 hover:text-text-primary hover:underline">Şifremi unuttum</Link></div>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••"
              className="h-12 w-full rounded-none border-border-strong bg-white px-4 text-sm text-[#222] placeholder:text-[#9199a7]"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-6 flex min-h-14 items-center justify-between border border-text-primary bg-transparent px-6 text-base font-semibold text-text-primary hover:border-accent hover:text-accent disabled:opacity-50"
          >
            <span>{loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</span><span className="text-accent">→</span>
          </button>
        </form>

        <div className="mt-10 flex items-center gap-4 text-[10px] uppercase tracking-wide text-text-muted"><span className="h-px flex-1 bg-border-subtle" />veya<span className="h-px flex-1 bg-border-subtle" /></div>
        <Link href="/register" className="mt-8 flex min-h-12 items-center justify-center border border-border-strong text-[10px] font-semibold uppercase tracking-wide text-text-secondary hover:border-text-secondary hover:text-text-primary">Yeni hesap oluştur</Link>
        <p className="mt-auto pt-16 text-center text-[10px] leading-5 text-text-muted">
          Devam ederek kullanım şartlarını kabul etmiş olursunuz.
        </p>
      </div>
    </main>
  )
}
