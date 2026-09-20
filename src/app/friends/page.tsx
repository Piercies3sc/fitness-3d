import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BackLink } from '@/components/ui/BackLink';
import { FriendsHub } from '@/features/friends/components/FriendsHub';

export default async function FriendsPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect('/login');
  const { data } = await supabase.rpc('get_friends_overview');
  return <main className="page-shell"><header className="page-header"><BackLink href="/profile" text="Profil" /><p className="page-eyebrow">Özel bağlantılar</p><h1 className="page-title">Arkadaşlar</h1><p className="text-sm text-text-secondary">Kabul edilen arkadaşlarınla salt okunur antrenman özetini paylaş.</p></header><FriendsHub initial={(data || { username: null, incoming: [], outgoing: [], friends: [], blocked: [] }) as never} /></main>;
}
