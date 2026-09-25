'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { updatePassword } from './actions'

export default function ResetPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [invalidRecovery, setInvalidRecovery] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)
    const formData = new FormData(event.currentTarget)
    const result = await updatePassword(
      String(formData.get('password') ?? ''),
      String(formData.get('passwordConfirm') ?? '')
    )
    setIsSubmitting(false)

    if ('error' in result) {
      setError(result.error)
      setInvalidRecovery(Boolean(result.invalidRecovery))
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <section aria-live="polite">
        <h1 className="text-[2rem] font-medium tracking-[-0.055em] text-text-primary">Şifren güncellendi</h1>
        <p className="mt-4 text-sm leading-6 text-text-secondary">Yeni şifrenle giriş yapabilirsin.</p>
        <Link href="/login" className="button-primary mt-10 w-full">Girişe Dön</Link>
      </section>
    )
  }

  if (invalidRecovery) {
    return (
      <section aria-live="polite">
        <h1 className="text-[2rem] font-medium tracking-[-0.055em] text-text-primary">Bağlantı geçersiz</h1>
        <p className="mt-4 text-sm leading-6 text-text-secondary">{error}</p>
        <Link href="/forgot-password" className="button-primary mt-10 w-full">Yeni sıfırlama bağlantısı iste</Link>
      </section>
    )
  }

  return (
    <>
      <h1 className="text-[2rem] font-medium tracking-[-0.055em] text-text-primary">Yeni şifre belirle</h1>
      <p className="mt-4 text-sm leading-6 text-text-secondary">Şifren, hesabında belirlenen minimum uzunluk ve güvenlik gerekliliklerini karşılamalı.</p>

      {error && <p role="alert" className="mt-6 border-l-2 border-status-danger pl-3 text-sm text-status-danger">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="page-eyebrow">Yeni şifre</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required className="h-12 w-full rounded-none border-border-strong bg-white px-4 text-sm text-[#222] focus-visible:outline-2 focus-visible:outline-accent" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="passwordConfirm" className="page-eyebrow">Yeni şifre tekrar</label>
          <input id="passwordConfirm" name="passwordConfirm" type="password" autoComplete="new-password" required className="h-12 w-full rounded-none border-border-strong bg-white px-4 text-sm text-[#222] focus-visible:outline-2 focus-visible:outline-accent" />
        </div>
        <button type="submit" disabled={isSubmitting} className="mt-4 flex min-h-14 items-center justify-between border border-accent bg-accent px-6 text-base font-semibold text-white hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60">
          <span>{isSubmitting ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}</span><span aria-hidden="true">→</span>
        </button>
      </form>
      <Link href="/login" className="button-tertiary mt-6 min-h-12 w-full">← Girişe Dön</Link>
    </>
  )
}
