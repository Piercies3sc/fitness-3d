import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfileHubData } from '@/lib/supabase/profile';
import { BackLink } from '@/components/ui/BackLink';
import { ProfileEditForm } from '@/features/profile/components/ProfileEditForm';
import { BodyMetricsSection } from '@/features/profile/components/BodyMetricsSection';
import { WeightHistorySection } from '@/features/profile/components/WeightHistorySection';
import { displayExerciseName, displayMuscleName } from '@/lib/ui/turkish';

export const metadata = {
  title: 'Profil | Fitness 3D',
  description: 'Kişisel antrenman merkezin, antrenman özetin ve vücut ölçülerin.',
};

function getInitials(name: string | null, email: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email && email.length > 0) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'BEN';
}

export default async function ProfilePage() {
  const supabase = await createClient();

  // Authenticated check
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  const email = (authData?.claims?.email as string) || '';

  if (!userId) {
    redirect('/login');
  }

  // Fetch batched hub data
  const {
    profile,
    overview,
    activeWorkout,
    recentWorkout,
    recentPRs,
    topMuscles,
    routineCount,
    homeFriendlyCount,
    bodyMetrics,
    weightEntries,
    friends,
  } = await getProfileHubData(userId);

  const initials = getInitials(profile.displayName, email);

  return (
    <main className="page-shell flex-1 max-w-6xl">
      {/* Top Navigation */}
      <div className="page-header">
        <BackLink href="/home" text="Ana Sayfaya Dön" />
        <p className="page-eyebrow mb-2">Kişisel antrenman</p>
        <h1 className="page-title">Profil</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Özel antrenman merkezin, vücut ölçülerin ve aktivite özetin.
        </p>
      </div>

      {/* Main Content Layout: 1-col on mobile, 2-col on desktop */}
      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-12 lg:gap-8">
        {/* Left Column (Desktop) */}
        <div className="contents space-y-7 lg:col-span-5 lg:flex lg:flex-col">
          <section className="order-1 border-y border-border-subtle py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Arkadaşlar</h3>
                <p className="mt-2 text-sm text-text-secondary"><span className="font-mono text-text-primary">{friends.count}</span> arkadaş · <span className="font-mono text-text-primary">{friends.pendingCount}</span> bekleyen</p>
              </div>
              <div className="flex gap-2">
                <Link href="/friends" className="button-secondary inline-flex min-h-9 items-center px-2.5 text-[11px]">Arkadaşları Gör</Link>
                <Link href="/friends" className="button-secondary inline-flex min-h-9 items-center px-2.5 text-[11px]">Arkadaş Bul</Link>
              </div>
            </div>
          </section>
          {/* Identity Section (order-1 on mobile) */}
          <section className="surface-panel order-1 border-l-2 border-l-accent p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-surface-high border border-border-strong flex items-center justify-center text-accent font-bold text-lg shrink-0 select-none">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-text-primary truncate">
                {profile.displayName || 'Profilin'}
              </h2>
              <p className="text-xs text-text-secondary truncate mt-0.5" title={email}>
                {email || 'Giriş yapmış kullanıcı'}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-status-success"></span>
                <span>Aktif Üye</span>
              </div>
            </div>
          </section>

          {/* Train at Home Quick Start (order-4 on mobile) */}
          <section className="order-4 border-y border-border-subtle py-5 space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Evde Antrenman
              </h3>
              {homeFriendlyCount > 0 && (
                <span className="text-[11px] font-medium text-text-secondary font-mono">
                  {homeFriendlyCount} hareket
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Vücut ağırlığı, dambıl ve direnç bandı antrenmanı. Ev antrenmanına uygun hareketleri incele.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <Link
                href="/exercises"
                className="button-secondary w-full text-center"
              >
                Ev Hareketlerini İncele
              </Link>
            </div>
          </section>

          {/* Body Metrics Section (order-8 on mobile) */}
          <div className="order-8">
            <BodyMetricsSection
              userId={userId}
              metrics={bodyMetrics}
              unitPreference={profile.unitPreference}
            />
          </div>

          {/* Routines Overview (order-10 on mobile) */}
          <section className="order-10 border-y border-border-subtle py-5 space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Programlar
              </h3>
              <span className="text-xs font-mono text-text-secondary">
                {routineCount} program
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Planlı hareketler ve tekrar hedefleriyle antrenmanlarını düzenle.
            </p>
            <div className="flex gap-2 pt-1">
              <Link
                href="/workout/routines"
                className="button-secondary flex-1 text-center"
              >
                Programları Yönet
              </Link>
              <Link
                href="/workout/routines/new"
                className="flex-1 rounded border border-accent/30 bg-accent/10 px-3 py-2 text-center text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
              >
                + Yeni Program
              </Link>
            </div>
          </section>

          {/* Preferences (Client Component) (order-11 on mobile) */}
          <section className="order-11">
            <ProfileEditForm
              userId={userId}
              initialDisplayName={profile.displayName}
              initialUsername={profile.username}
              initialUnitPreference={profile.unitPreference}
            />
          </section>
        </div>

        {/* Right Column (Desktop) */}
        <div className="contents space-y-7 lg:col-span-7 lg:flex lg:flex-col">
          {/* Personal Training Overview (order-2 on mobile, 2x2 on mobile, 4-col on tablet/desktop) */}
          <section className="order-2 border-y border-border-subtle py-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
              Antrenman Özeti
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* This Week */}
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-text-muted mb-1">
                  Bu Hafta
                </span>
                <span className="metric-value text-2xl sm:text-3xl">
                  {overview.workoutsThisWeek}
                </span>
                <span className="text-[11px] text-text-secondary mt-0.5">
                  antrenman
                </span>
              </div>

              {/* Total Workouts */}
              <div className="flex flex-col border-l border-border-subtle/40 pl-4 sm:pl-4">
                <span className="text-[11px] uppercase tracking-wider text-text-muted mb-1">
                  Toplam
                </span>
                <span className="metric-value text-2xl sm:text-3xl">
                  {overview.totalWorkouts}
                </span>
                <span className="text-[11px] text-text-secondary mt-0.5">
                  antrenman
                </span>
              </div>

              {/* Working Sets */}
              <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-border-subtle/40 pt-3 sm:pt-0 sm:pl-4">
                <span className="text-[11px] uppercase tracking-wider text-text-muted mb-1">
                  Çalışma Setleri
                </span>
                <span className="metric-value text-2xl sm:text-3xl">
                  {overview.workingSets}
                </span>
                <span className="text-[11px] text-text-secondary mt-0.5">tamamlanan set</span>
              </div>

              {/* Personal Records */}
              <div className="flex flex-col border-t sm:border-t-0 border-l border-border-subtle/40 pt-3 sm:pt-0 pl-4">
                <span className="text-[11px] uppercase tracking-wider text-text-muted mb-1">
                  PRs
                </span>
                <span className="metric-value text-2xl sm:text-3xl text-accent">
                  {overview.personalRecords}
                </span>
                <span className="text-[11px] text-text-secondary mt-0.5">tüm zamanların rekoru</span>
              </div>
            </div>
          </section>

          {/* Active Workout Banner (order-3 on mobile) */}
          {activeWorkout && (
            <section className="order-3 border-l-2 border-accent bg-accent/5 px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                    Antrenman Devam Ediyor
                  </span>
                </div>
                <h4 className="text-sm font-bold text-text-primary truncate">
                  {activeWorkout.routine_name_snapshot || 'Aktif Antrenman'}
                </h4>
              </div>
              <Link
                href="/workout/active"
                className="button-primary shrink-0 min-h-10 text-xs"
              >
                Antrenmana Dön
              </Link>
            </section>
          )}

          {/* Recent Workout (order-5 on mobile) */}
          <section className="order-5 border-y border-border-subtle py-5 space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Son Antrenman
              </h3>
              {recentWorkout && (
                <span className="text-xs text-text-muted">{recentWorkout.dateStr}</span>
              )}
            </div>

            {!recentWorkout ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-xs text-text-muted">Henüz tamamlanan antrenman yok.</p>
                <div className="flex gap-2 justify-center">
                  <Link
                    href="/workout/routines/new"
                    className="text-xs text-accent hover:underline font-medium"
                  >
                    Program Oluştur
                  </Link>
                  <span className="text-text-muted text-xs">&bull;</span>
                  <Link href="/exercises" className="text-xs text-accent hover:underline font-medium">
                    Ev Hareketlerini İncele
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-text-primary leading-tight">
                      {recentWorkout.name}
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Süre: {recentWorkout.durationStr}
                    </p>
                  </div>
                  <Link
                    href={`/workout/history/${recentWorkout.id}`}
                    className="text-xs text-accent hover:underline font-medium shrink-0 pt-0.5"
                  >
                    Antrenmanı Gör &rarr;
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-subtle/40 text-xs">
                  <div>
                    <span className="text-text-muted block text-[11px]">Hareketler</span>
                    <span className="font-semibold text-text-primary font-mono">
                      {recentWorkout.exerciseCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[11px]">Çalışma Setleri</span>
                    <span className="font-semibold text-text-primary font-mono">
                      {recentWorkout.workingSetCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[11px]">Volume</span>
                    <span className="font-semibold text-text-primary font-mono truncate block">
                      {recentWorkout.volumeDisplay}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Recent PRs (order-6 on mobile) */}
          <section className="order-6 border-y border-border-subtle py-5 space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Son PR&apos;lar
              </h3>
              <span className="text-xs text-text-muted">En yeni başarılar</span>
            </div>

            {recentPRs.length === 0 ? (
              <p className="text-xs text-text-muted py-3 text-center">
                Henüz kişisel rekor kaydı yok. İlk antrenmanlar başlangıç seviyeni oluşturur.
              </p>
            ) : (
              <div className="divide-y divide-border-subtle/40">
                {recentPRs.map((pr) => (
                  <div key={pr.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-3">
                      <span className="font-semibold text-text-primary block truncate">
                        {displayExerciseName(pr.exerciseName)}
                      </span>
                      <span className="text-accent text-[11px] font-medium">
                        {pr.typeLabel}
                      </span>
                    </div>
                    <span className="font-mono text-text-primary font-semibold shrink-0">
                      {pr.detail}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Most Trained Muscles (Last 30 Days) (order-7 on mobile) */}
          <section className="order-7 border-y border-border-subtle py-5 space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                En Çok Çalıştırılan Kaslar
              </h3>
              <span className="text-xs text-text-muted">Son 30 Gün</span>
            </div>

            {topMuscles.length === 0 ? (
              <p className="text-xs text-text-muted py-3 text-center">
                Son 30 günde kas antrenman yükü kaydı yok.
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                {topMuscles.map((m) => (
                  <div
                    key={m.muscleName}
                    className="flex items-center justify-between text-xs py-1"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-xs shrink-0 border border-black/30"
                        style={{ backgroundColor: m.colorHex }}
                        aria-hidden="true"
                      />
                      <span className="font-medium text-text-primary truncate">
                        {displayMuscleName(m.muscleName)}
                      </span>
                    </div>
                    <span className="font-mono text-text-secondary font-semibold shrink-0">
                      {m.exposure} set
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-border-subtle/40 flex justify-end">
              <Link
                href="/body?range=30d"
                className="text-xs text-accent hover:underline font-medium"
              >
                Vücudu Gör &rarr;
              </Link>
            </div>
          </section>

          {/* Weight History Section (order-9 on mobile) */}
          <div className="order-9">
            <WeightHistorySection
              userId={userId}
              weightEntries={weightEntries}
              unitPreference={profile.unitPreference}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
