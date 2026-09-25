'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { requestPasswordReset } from './actions'

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)
    const formData = new FormData(event.currentTarget)
    const result = await requestPasswordReset(String(formData.get('email') ?? ''))
    setIsSubmitting(false)

    if ('error' in result) {
      setError(result.error)
      return
    }

    setSent(true)
  }

  return (
    <main className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col px-6 pb-8 pt-24 sm:max-w-md sm:px-8">
      <div className="w-full">
        <p className="page-eyebrow mb-9 text-text-primary">Fitness 3D <span className="ml-1 text-accent">●</span></p>
        {sent ? (
          <section aria-live="polite">
            <h1 className="text-[2rem] font-medium tracking-[-0.055em] text-text-primary">E-postanı kontrol et</h1>
            <p className="mt-4 text-sm leading-6 text-text-secondary">
              Şifre sıfırlama bağlantısı gönderildiyse gelen kutunda göreceksin. Spam / gereksiz klasörünü de kontrol et.
            </p>
            <Link href="/login" className="button-secondary mt-10 w-full">← Girişe Dön</Link>
          </section>
        ) : (
          <>
            <h1 className="text-[2rem] font-medium tracking-[-0.055em] text-text-primary">Şifreni sıfırla</h1>
            <p className="mt-4 text-sm leading-6 text-text-secondary">
              Hesabına bağlı e-posta adresini gir. Şifre sıfırlama bağlantısını e-posta ile göndereceğiz.
            </p>

            {error && <p role="alert" className="mt-6 border-l-2 border-status-danger pl-3 text-sm text-status-danger">{error}</p>}

            <form onSubmit={handleSubmit} className="mt-12 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="page-eyebrow">E-posta</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  placeholder="ornek@fitness3d.app"
                  className="h-12 w-full rounded-none border-border-strong bg-white px-4 text-sm text-[#222] placeholder:text-[#9199a7] focus-visible:outline-2 focus-visible:outline-accent"
                />
              </div>
              <button type="submit" disabled={isSubmitting} className="mt-4 flex min-h-14 items-center justify-between border border-accent bg-accent px-6 text-base font-semibold text-white hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60">
                <span>{isSubmitting ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}</span><span aria-hidden="true">→</span>
              </button>
            </form>

            <Link href="/login" className="button-tertiary mt-8 min-h-12 w-full">← Girişe Dön</Link>
          </>
        )}
      </div>
    </main>
  )
}
