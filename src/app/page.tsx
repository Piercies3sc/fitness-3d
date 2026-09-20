import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <p className="page-eyebrow mb-3">Antrenmanını görünür kıl</p>
      <h1 className="page-title text-center">Fitness 3D</h1>
      <p className="mt-3 max-w-sm text-text-secondary">Antrenmanını planla, çalışma setlerini kaydet ve sonucunu vücudunda gör.</p>

      <div className="surface-panel mt-10 p-5 max-w-xs w-full flex flex-col gap-3">
        <Link
          href="/login"
          className="button-primary w-full"
        >
          Giriş Yap
        </Link>
        <Link
          href="/register"
          className="button-secondary w-full"
        >
          Kayıt Ol
        </Link>
      </div>

      <div className="mt-8">
        <Link
          href="/exercises"
          className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors underline underline-offset-4"
        >
          Hareketleri Keşfet
        </Link>
      </div>
    </main>
  );
}
