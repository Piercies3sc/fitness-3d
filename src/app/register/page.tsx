'use client'

import { useState } from 'react'
import { signup } from './actions'
import Link from 'next/link'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
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

        {error && (
          <div className="mb-4 p-3 rounded-md bg-status-danger/10 border border-status-danger/20 text-status-danger text-sm">
            {error}
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
