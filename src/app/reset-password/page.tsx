import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import ResetPasswordForm from './reset-password-form'

type ResetPasswordPageProps = {
  searchParams: Promise<{ error?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams
  const cookieStore = await cookies()
  let hasRecoverySession = cookieStore.get('fitness-3d-password-recovery')?.value === '1'

  if (hasRecoverySession) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    hasRecoverySession = !error && Boolean(user)
  }

  return (
    <main className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col px-6 pb-8 pt-24 sm:max-w-md sm:px-8">
      <div className="w-full">
        <p className="page-eyebrow mb-9 text-text-primary">Fitness 3D <span className="ml-1 text-accent">●</span></p>
        {hasRecoverySession && params.error !== 'invalid-link' ? (
          <ResetPasswordForm />
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
