import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from './actions'
import { InstallGuideModal } from '@/features/home/components/InstallGuideModal'

export default async function HomePage() {
  const supabase = await createClient()
  
  // We use getClaims instead of getUser to avoid a redundant remote network lookup.
  // The JWT has already been verified by the Proxy middleware, and it securely contains the email.
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  return (
    <main className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col px-6 pb-8 pt-12 sm:max-w-2xl sm:px-8">
      <header className="border-b border-border-strong/70 pb-10">
        <div className="mb-16 flex items-center justify-between">
          <p className="page-eyebrow text-text-primary">Fitness 3D</p>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
        </div>
        <p className="page-eyebrow mb-3">01 / Aktif</p>
        <h1 className="max-w-[12rem] text-[2rem] font-medium leading-[1.08] tracking-[-0.055em] text-text-primary">Antrenman kontrolü</h1>
        <p className="mt-4 max-w-[18rem] text-sm leading-6 text-text-secondary">
          Sonraki antrenmanını planla, yaptıklarını kaydet ve vücudunda incele.
        </p>
      </header>

      <div className="pt-8">
        <section>
          <Link href="/workout/routines" className="group flex min-h-[3.25rem] items-center justify-between border border-accent/70 bg-surface px-6 text-base font-semibold text-text-primary transition-colors hover:bg-surface-high">
            <span>Programları Aç</span>
            <span className="text-accent transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-y-2">
            <Link href="/workout/history" className="group inline-flex min-h-10 items-center gap-3 text-xs font-medium text-text-secondary hover:text-text-primary">
              <svg className="h-[18px] w-[18px] shrink-0 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
                <path d="M3 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Antrenman Geçmişi
            </Link>
            <InstallGuideModal />
          </div>
        </section>

        <section className="mt-14">
          <p className="page-eyebrow mb-6">02 / Keşfet</p>
          <div className="space-y-3">
          <Link href="/body" className="group flex min-h-20 items-center justify-between border border-border-strong/70 bg-surface px-5">
            <span>
              <span className="block text-sm font-semibold text-text-primary">Vücut</span>
              <span className="mt-1 block text-xs text-text-muted">Antrenman yükü ve kas haritası</span>
            </span>
            <span className="text-text-muted transition-transform group-hover:translate-x-0.5">›</span>
          </Link>
          <Link href="/exercises" className="group flex min-h-20 items-center justify-between border border-border-strong/70 bg-surface px-5">
            <span>
              <span className="block text-sm font-semibold text-text-primary">Hareketler</span>
              <span className="block text-xs text-text-muted">Hareket kütüphanesi</span>
            </span>
            <span className="text-text-muted transition-transform group-hover:translate-x-0.5">›</span>
          </Link>
          <Link href="/profile" className="group flex min-h-20 items-center justify-between border border-border-strong/70 bg-surface px-5">
            <span>
              <span className="block text-sm font-semibold text-text-primary">Profil</span>
              <span className="block text-xs text-text-muted">Tercihler ve gelişim</span>
            </span>
            <span className="text-text-muted transition-transform group-hover:translate-x-0.5">›</span>
          </Link>
          </div>
        </section>
      </div>

      <footer className="mt-auto border-t border-border-subtle pt-8 text-xs text-text-muted">
        <div className="flex items-end justify-between gap-4">
        <span><span className="mb-1 block text-[10px] uppercase tracking-wide text-text-muted">Aktif oturum</span>{claims?.email || 'Bilinmeyen hesap'}</span>
        <form action={logout}>
          <button type="submit" className="button-tertiary min-h-8 text-[10px] uppercase tracking-wide">Çıkış Yap</button>
        </form>
        </div>
      </footer>
    </main>
  )
}
