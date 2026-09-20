import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BackLink } from '@/components/ui/BackLink';
import { Avatar } from '@/components/ui/Avatar';
import { getSignedAvatarUrl } from '@/lib/supabase/profile';
import { friendVisibleProfile, formatFriendWeight, getInitials } from '@/lib/calculations/friends';
import { displayExerciseName, displayMuscleName } from '@/lib/ui/turkish';

export default async function FriendProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect('/login');

  const [{ data }, { data: viewer }] = await Promise.all([
    supabase.rpc('get_friend_training_profile', { target_username: username }),
    supabase.from('profiles').select('unit_preference').eq('id', claims.claims.sub).single(),
  ]);

  if (!data) notFound();

  const profile = friendVisibleProfile(data as never);
  const unit = viewer?.unit_preference === 'lb' ? 'lb' : 'kg';
  const avatarPath = (data as { avatar_path?: string | null })?.avatar_path || null;
  const avatarUrl = await getSignedAvatarUrl(avatarPath);

  return (
    <main className="page-shell">
      <header className="page-header">
        <BackLink href="/friends" text="Arkadaşlar" />
        <p className="page-eyebrow">Salt okunur antrenman profili</p>
        <div className="mt-3 flex items-center gap-3">
          <Avatar
            src={avatarUrl}
            name={profile.display_name || profile.username}
            initials={getInitials(profile.display_name, profile.username)}
            size="md"
          />
          <div>
            <h1 className="page-title">{profile.display_name || profile.username}</h1>
            <p className="text-sm text-text-muted">@{profile.username}</p>
          </div>
        </div>
      </header>

      <div className="space-y-7">
        <section className="border-y border-border-subtle py-5">
          <h2 className="section-heading">Antrenman Özeti</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ['Bu hafta', profile.overview.workouts_this_week],
              ['Antrenmanlar', profile.overview.total_workouts],
              ['Çalışma setleri', profile.overview.working_sets],
              ['Programlar', profile.overview.routine_count],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <p className="metric-value">{value}</p>
                <p className="text-[11px] uppercase tracking-wide text-text-muted">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border-subtle py-5">
          <h2 className="section-heading">Son Antrenmanlar</h2>
          {profile.recent_workouts.length ? (
            profile.recent_workouts.map((workout) => (
              <div
                key={`${workout.name}-${workout.completed_at}`}
                className="flex justify-between border-b border-border-subtle/50 py-3 text-sm last:border-b-0"
              >
                <span>{workout.name}</span>
                <span className="text-text-muted">
                  {new Date(workout.completed_at).toLocaleDateString('tr-TR')}
                </span>
              </div>
            ))
          ) : (
            <p className="mt-3 text-xs text-text-muted">Henüz paylaşılan tamamlanmış antrenman yok.</p>
          )}
        </section>

        <section className="border-y border-border-subtle py-5">
          <h2 className="section-heading">Son PR&apos;lar</h2>
          {profile.recent_prs.length ? (
            profile.recent_prs.map((pr) => (
              <div
                key={`${pr.exercise_name}-${pr.completed_at}`}
                className="flex justify-between border-b border-border-subtle/50 py-3 text-sm last:border-b-0"
              >
                <span>{displayExerciseName(pr.exercise_name)}</span>
                <span className="font-mono text-text-secondary">{formatFriendWeight(pr.weight_kg, unit)}</span>
              </div>
            ))
          ) : (
            <p className="mt-3 text-xs text-text-muted">Henüz paylaşılan PR yok.</p>
          )}
        </section>

        <section className="border-y border-border-subtle py-5">
          <h2 className="section-heading">En Çok Çalıştırılan Kaslar · 30G</h2>
          {profile.top_muscles.length ? (
            profile.top_muscles.map((muscle) => (
              <div
                key={muscle.name}
                className="flex justify-between border-b border-border-subtle/50 py-3 text-sm last:border-b-0"
              >
                <span>{displayMuscleName(muscle.name)}</span>
                <span className="font-mono text-text-secondary">{muscle.exposure} set</span>
              </div>
            ))
          ) : (
            <p className="mt-3 text-xs text-text-muted">Henüz paylaşılan antrenman yükü yok.</p>
          )}
        </section>
      </div>
    </main>
  );
}
