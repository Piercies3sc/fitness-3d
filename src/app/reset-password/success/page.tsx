import Link from 'next/link'

export default function ResetPasswordSuccessPage() {
  return (
    <main className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col px-6 pb-8 pt-24 sm:max-w-md sm:px-8">
      <div className="w-full">
        <p className="page-eyebrow mb-9 text-text-primary">Fitness 3D <span className="ml-1 text-accent">●</span></p>
        <section>
          <h1 className="text-[2rem] font-medium tracking-[-0.055em] text-text-primary">Şifren güncellendi</h1>
          <p className="mt-4 text-sm leading-6 text-text-secondary">
            Yeni şifren başarıyla kaydedildi. Artık yeni şifrenle giriş yapabilirsin.
          </p>
          <Link href="/login" className="button-primary mt-10 w-full">Giriş Yap</Link>
        </section>
      </div>
    </main>
  )
}
