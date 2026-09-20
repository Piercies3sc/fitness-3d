import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BackLink } from '@/components/ui/BackLink';
import { createClient } from '@/lib/supabase/server';
import { getTrainingExposureData, getMuscleMeshes } from '@/lib/supabase/body';
import { getRangeTimestamps, TimeRange } from '@/lib/calculations/exposure';
import { BodyClientContainer } from '@/features/body/components/BodyClientContainer';

const VALID_RANGES: TimeRange[] = ['7d', '30d', '3m', '6m', '1y'];

export default async function BodyPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (!userId) {
    redirect('/login');
  }
  
  const params = await searchParams;
  let rangeParam = params.range as string;
  if (!rangeParam || !VALID_RANGES.includes(rangeParam as TimeRange)) {
    rangeParam = '30d';
  }
  
  const activeRange = rangeParam as TimeRange;
  const { start, end } = getRangeTimestamps(activeRange);
  
  const [exposureData, muscleMeshes] = await Promise.all([
    getTrainingExposureData(userId, start, end),
    getMuscleMeshes()
  ]);
  
  const rangeLabels: Record<TimeRange, string> = {
    '7d': '7G',
    '30d': '30G',
    '3m': '3A',
    '6m': '6A',
    '1y': '1Y'
  };

  const allZero = exposureData.every(m => m.exposure === 0);

  return (
    <main className="mx-auto w-full max-w-[24rem] flex-1 px-6 pb-12 pt-12 sm:max-w-2xl sm:px-8 lg:max-w-6xl">
      <div className="border-b border-border-subtle pb-7">
        <div className="mb-9 flex items-center justify-between">
          <p className="page-eyebrow text-text-primary">Fitness 3D</p>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
        </div>
        <BackLink href="/home" text="Ana Sayfaya Dön" />
        <p className="page-eyebrow mb-3">Anatomi</p>
        <h1 className="text-[2rem] font-medium tracking-[-0.055em] text-text-primary">Vücut</h1>
      </div>
      
      <div className="pt-6">
        <p className="mb-5 max-w-3xl text-xs leading-5 text-text-muted">
          Antrenman yükü, her kasın dahil olduğu çalışma setlerini hareket-kas faktörüne göre tahmin eder. Renkler, kasları seçili zaman aralığındaki en yüksek antrenman yüküne göre karşılaştırır.
        </p>

        <div className="mb-5 grid grid-cols-5 gap-1 bg-surface p-1">
          {VALID_RANGES.map(r => (
            <Link
              key={r}
              href={`/body?range=${r}`}
              className={`min-w-0 w-full px-0 py-2 text-center text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                activeRange === r 
                  ? 'bg-bg-base text-accent'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {rangeLabels[r]}
            </Link>
          ))}
        </div>

        {allZero && (
          <p className="surface-inset mb-4 px-3 py-2 text-xs text-text-muted">
            Bu zaman aralığında tamamlanmış çalışma seti yok.
          </p>
        )}
        
        <BodyClientContainer 
          exposureData={exposureData} 
          muscleMeshes={muscleMeshes} 
          rangeLabel={rangeLabels[activeRange]}
        />
        
        {allZero && (
          <div className="mt-6 text-center lg:text-left">
            <Link href="/workout/routines" className="button-tertiary text-accent hover:text-accent">
              Programlara Git &rarr;
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
