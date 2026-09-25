import Link from 'next/link'
import { confirmRecovery } from './actions'

type RecoveryPageProps = {
  searchParams: Promise<{ token_hash?: string; error?: string }>
}

export default async function RecoveryPage({ searchParams }: RecoveryPageProps) {
  const params = await searchParams
  const tokenHash = params.token_hash
  const canContinue =
    params.error !== 'invalid' &&
    typeof tokenHash === 'string' &&
    tokenHash.length > 0 &&
    tokenHash.length <= 256

  return (
    <main className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col px-6 pb-8 pt-24 sm:max-w-md sm:px-8">
      <div className="w-full">
        <p className="page-eyebrow mb-9 text-text-primary">Fitness 3D <span className="ml-1 text-accent">●</span></p>
        {canContinue ? (
          <section>
            <h1 className="text-[2rem] font-medium tracking-[-0.055em] text-text-primary">Şifreni sıfırla</h1>
            <p className="mt-4 text-sm leading-6 text-text-secondary">
              Şifre değiştirme işlemine devam etmek için aşağıdaki butona bas.
            </p>
            <form action={confirmRecovery} className="mt-10">
              <input type="hidden" name="token_hash" value={tokenHash} />
              <button type="submit" className="flex min-h-14 w-full items-center justify-between border border-accent bg-accent px-6 text-base font-semibold text-white hover:bg-accent-hover">
                <span>Şifreyi Sıfırla</span><span aria-hidden="true">→</span>
              </button>
            </form>
          </section>
        ) : (
          <section>
            <h1 className="text-[2rem] font-medium tracking-[-0.055em] text-text-primary">Bağlantı geçersiz</h1>
            <p className="mt-4 text-sm leading-6 text-text-secondary">Bağlantının süresi dolmuş veya geçersiz.</p>
            <Link href="/forgot-password" className="button-primary mt-10 w-full">Yeni sıfırlama bağlantısı iste</Link>
          </section>
        )}
      </div>
    </main>
  )
}
