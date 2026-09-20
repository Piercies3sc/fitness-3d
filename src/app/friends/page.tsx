import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BackLink } from '@/components/ui/BackLink';
import { FriendsHub } from '@/features/friends/components/FriendsHub';

export const metadata = {
  title: 'Arkadaşlar | Fitness 3D',
  description: 'Kabul edilen arkadaşlarınla salt okunur antrenman özetini paylaş.',
};

export default async function FriendsPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect('/login');

  const { data } = await supabase.rpc('get_friends_overview');

  const overviewData = (data || {
    username: null,
    incoming: [],
    outgoing: [],
    friends: [],
    blocked: [],
  }) as {
    username: string | null;
    incoming: Array<{ id: string; user_id: string; username: string; display_name: string | null; avatar_path?: string | null }>;
    outgoing: Array<{ id: string; user_id: string; username: string; display_name: string | null; avatar_path?: string | null }>;
    friends: Array<{ user_id: string; username: string; display_name: string | null; avatar_path?: string | null }>;
    blocked: Array<{ user_id: string; username: string; display_name: string | null; avatar_path?: string | null }>;
  };

  // Generate server-signed URLs for all avatars
  const allPersons = [
    ...(overviewData.incoming || []),
    ...(overviewData.outgoing || []),
    ...(overviewData.friends || []),
    ...(overviewData.blocked || []),
  ];

  const paths = allPersons.map((p) => p.avatar_path).filter(Boolean) as string[];
  const urlMap = new Map<string, string>();

  if (paths.length > 0) {
    try {
      const { data: signedList } = await supabase.storage.from('avatars').createSignedUrls(paths, 3600);
      for (const item of signedList || []) {
        if (item.path && item.signedUrl) {
          urlMap.set(item.path, item.signedUrl);
        }
      }
    } catch (err) {
      console.error('Error generating signed avatar URLs for friends:', err);
    }
  }

  const attachAvatar = <T extends { avatar_path?: string | null }>(p: T) => ({
    ...p,
    avatar_url: p.avatar_path ? urlMap.get(p.avatar_path) || null : null,
  });

  const hydrated = {
    ...overviewData,
    incoming: (overviewData.incoming || []).map(attachAvatar),
    outgoing: (overviewData.outgoing || []).map(attachAvatar),
    friends: (overviewData.friends || []).map(attachAvatar),
    blocked: (overviewData.blocked || []).map(attachAvatar),
  };

  return (
    <main className="mx-auto w-full max-w-[24rem] px-6 pb-12 pt-12 sm:max-w-2xl sm:px-8">
      <header className="border-b border-border-subtle pb-8">
        <div className="mb-9 flex items-center justify-between">
          <p className="page-eyebrow text-text-primary">Fitness 3D</p>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
        </div>
        <BackLink href="/profile" text="Profil" />
        <p className="page-eyebrow mb-3">Sosyal</p>
        <h1 className="text-[2rem] font-medium tracking-[-0.055em] text-text-primary">Arkadaşlar</h1>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Kabul edilen arkadaşlarınla salt okunur antrenman özetini paylaş.
        </p>
      </header>
      <FriendsHub initial={hydrated} />
    </main>
  );
}
