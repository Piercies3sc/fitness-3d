import { notFound } from 'next/navigation';
import { getExerciseBySlug } from '@/lib/supabase/exercises';
import { BackLink } from '@/components/ui/BackLink';
import { displayExerciseName, displayMuscleName } from '@/lib/ui/turkish';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const resolvedParams = await params;
  const exercise = await getExerciseBySlug(resolvedParams.slug);
  
  if (!exercise) {
    return { title: 'Hareket Bulunamadı' };
  }

  return {
    title: `${displayExerciseName(exercise.name)} | Fitness 3D`,
    description: exercise.description || `${displayExerciseName(exercise.name)} hareketini öğrenin.`,
  };
}

export default async function ExerciseDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const exercise = await getExerciseBySlug(resolvedParams.slug);

  if (!exercise) {
    notFound();
  }

  const primaryMuscles = exercise.exercise_muscles
    ?.filter(em => em.role === 'primary' && em.muscles)
    .sort((a, b) => b.exposure_factor - a.exposure_factor) || [];

  const secondaryMuscles = exercise.exercise_muscles
    ?.filter(em => em.role === 'secondary' && em.muscles)
    .sort((a, b) => b.exposure_factor - a.exposure_factor) || [];

  const regionLabel = exercise.body_region 
    ? exercise.body_region.charAt(0).toUpperCase() + exercise.body_region.slice(1)
    : null;

  return (
    <main className="page-shell flex-1 max-w-4xl">
      <div className="page-header">
        <BackLink href="/exercises" text="Hareketlere Dön" />
        <p className="page-eyebrow mb-2">{regionLabel || 'Hareket'}</p>
        <h1 className="page-title">{displayExerciseName(exercise.name)}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-text-muted">
          {regionLabel && (
            <>
              <span className="text-accent">{regionLabel}</span>
              <span className="text-border-strong">&bull;</span>
            </>
          )}
          <span>{exercise.equipment || 'Ekipman belirtilmedi'}</span>
          {exercise.movement_type && (
            <>
              <span className="text-border-strong">&bull;</span>
              <span>{exercise.movement_type}</span>
            </>
          )}
          {exercise.home_friendly && (
            <>
              <span className="text-border-strong">&bull;</span>
              <span className="text-status-success font-medium normal-case">
                Ev için uygun
              </span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {/* Movement Overview */}
        <section className="border-y border-border-subtle py-5">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Hareket Özeti
          </h2>
          {exercise.description ? (
            <p className="text-text-secondary text-sm leading-relaxed max-w-prose">
              {exercise.description}
            </p>
          ) : (
            <p className="text-text-muted text-sm italic">Hareket açıklaması bulunmuyor.</p>
          )}
        </section>

        {/* 3D Demonstration Status */}
        <section className="surface-panel flex min-h-28 flex-col justify-between p-5 text-xs text-text-muted sm:min-h-32 sm:flex-row sm:items-end">
          <div>
            <p className="section-eyebrow mb-2">Yakında 3B gösterim</p>
            <p className="text-sm font-medium text-text-secondary">Hareket oynatımı burada görünecek.</p>
          </div>
          <span className="mt-4 text-xs text-text-muted sm:mt-0">Henüz kullanıma açık değil</span>
        </section>

        {/* Anatomy & Exposure Factors */}
        <section className="border-t border-border-subtle pt-6 space-y-6">
          <div className="border-b border-border-subtle pb-3">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              Anatomik Kas Katılımı
            </h2>
            <p className="text-xs text-text-muted">
              Antrenman yükü katsayısı, tamamlanan çalışma setlerinin kas gruplarına dağılımını hesaplamak için kullanılan uygulamaya özgü bir ağırlık değeridir.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Primary */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-text-muted mb-3 font-semibold">
                Ana Kaslar
              </h3>
              {primaryMuscles.length > 0 ? (
                <ul className="space-y-2.5">
                  {primaryMuscles.map(em => (
                    <li key={em.muscles!.id} className="flex items-center justify-between text-sm py-1 border-b border-border-subtle/40">
                      <span className="text-text-primary font-medium">
                        {displayMuscleName(em.muscles!.name)}
                      </span>
                      <span className="font-mono text-xs text-accent font-semibold">
                        {Number(em.exposure_factor).toFixed(2)}×
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-text-muted text-xs">Belirtilmedi</p>
              )}
            </div>

            {/* Contributing / Also Works */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-text-muted mb-3 font-semibold">
                Destekleyici Kaslar
              </h3>
              {secondaryMuscles.length > 0 ? (
                <ul className="space-y-2.5">
                  {secondaryMuscles.map(em => (
                    <li key={em.muscles!.id} className="flex items-center justify-between text-sm py-1 border-b border-border-subtle/40">
                      <span className="text-text-secondary">
                        {displayMuscleName(em.muscles!.name)}
                      </span>
                      <span className="font-mono text-xs text-text-secondary">
                        {Number(em.exposure_factor).toFixed(2)}×
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-text-muted text-xs">İkincil kas yok</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
