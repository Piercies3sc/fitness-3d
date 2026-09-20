import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from './actions'

export default async function HomePage() {
  const supabase = await createClient()
  
  // We use getClaims instead of getUser to avoid a redundant remote network lookup.
  // The JWT has already been verified by the Proxy middleware, and it securely contains the email.
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  return (
    <main className="page-shell flex-1">
      <header className="page-header">
        <p className="page-eyebrow mb-3">Fitness 3D</p>
        <h1 className="page-title">Antrenman kontrolü</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">
          Sonraki antrenmanını planla, yaptıklarını kaydet ve vücudunda incele.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(15rem,0.65fr)] lg:gap-8">
        <section className="surface-panel border-l-2 border-l-accent p-5 sm:p-6">
          <p className="section-eyebrow mb-3">Buradan başla</p>
          <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
            Sonraki antrenmanını hazırla.
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-text-secondary">
            Antrenmana başlamadan önce bir program oluştur, aktif antrenmana dön veya kayıtlı şablon seç.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/workout/routines" className="button-primary w-full sm:w-auto">
              Programları aç
            </Link>
            <Link href="/workout/history" className="button-tertiary min-h-11 w-full sm:w-auto">
              Antrenman geçmişini incele
            </Link>
          </div>
        </section>

        <aside className="border-y border-border-subtle py-1 lg:border-y-0 lg:border-l lg:py-0 lg:pl-6">
          <Link href="/body" className="group flex min-h-16 items-center justify-between border-b border-border-subtle py-3">
            <span>
              <span className="block text-sm font-semibold text-text-primary">Vücut</span>
              <span className="block text-xs text-text-muted">Antrenman yükü</span>
            </span>
            <span className="text-text-muted transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <Link href="/exercises" className="group flex min-h-16 items-center justify-between border-b border-border-subtle py-3">
            <span>
              <span className="block text-sm font-semibold text-text-primary">Hareketler</span>
              <span className="block text-xs text-text-muted">Hareket kütüphanesi</span>
            </span>
            <span className="text-text-muted transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <Link href="/profile" className="group flex min-h-16 items-center justify-between py-3">
            <span>
              <span className="block text-sm font-semibold text-text-primary">Profil</span>
              <span className="block text-xs text-text-muted">Tercihler ve gelişim</span>
            </span>
            <span className="text-text-muted transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </aside>
      </div>

      <footer className="mt-10 flex flex-col gap-1 border-t border-border-subtle pt-4 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>{claims?.email || 'Bilinmeyen hesap'}</span>
        <form action={logout}>
          <button type="submit" className="button-tertiary min-h-9 text-xs">Çıkış Yap</button>
        </form>
      </footer>
    </main>
  )
}
