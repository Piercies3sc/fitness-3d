'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/Avatar';

type Person = { id?: string; user_id: string; username: string; display_name: string | null; avatar_url?: string | null };
type Overview = { username: string | null; incoming: Person[]; outgoing: Person[]; friends: Person[]; blocked: Person[] };

function PersonRow({ person, actions, href }: { person: Person; actions: React.ReactNode; href?: string }) {
  const content = <>
    <Avatar src={person.avatar_url} name={person.display_name || person.username} size="sm" />
    <div className="min-w-0">
      <p className="text-sm font-medium text-text-primary truncate">{person.display_name || person.username}</p>
      <p className="mt-0.5 text-xs text-text-muted truncate">@{person.username}</p>
    </div>
  </>;
  return (
    <div className="flex min-h-[4.6rem] items-center justify-between gap-3 border-b border-border-subtle/60 py-3 last:border-b-0">
      {href ? <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">{content}</Link> : <div className="flex min-w-0 flex-1 items-center gap-3">{content}</div>}
      <div className="flex items-center gap-2 shrink-0">{actions}</div>
    </div>
  );
}

export function FriendsHub({ initial }: { initial: Overview }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<Person & { relationship_state: string }>>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const call = (fn: string, args: Record<string, string>) => startTransition(async () => {
    const supabase = createClient();
    const { error } = await supabase.rpc(fn, args);
    setMessage(error ? 'İşlem tamamlanamadı.' : null);
    if (!error) router.refresh();
  });

  const search = async () => {
    if (query.trim().length < 2) return setResults([]);
    const { data, error } = await createClient().rpc('search_users_for_friends', { search_text: query });
    setResults(error ? [] : (data || []));
  };

  const button = (label: string, fn: string, args: Record<string, string>, kind = 'button-secondary') => (
    <button
      type="button"
      disabled={isPending}
      onClick={() => call(fn, args)}
      className={`${kind} min-h-9 px-2.5 text-[11px] cursor-pointer disabled:opacity-50`}
    >
      {label}
    </button>
  );

  if (!initial.username) {
    return (
      <section className="surface-panel p-5">
        <h2 className="section-heading">Arkadaşlar</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Arkadaşlar özelliğini kullanmak için bir kullanıcı adı belirle.
        </p>
        <Link href="/profile" className="button-primary mt-4 inline-flex min-h-10 px-3 text-xs">
          Profile Git
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-9 pt-7">
      <section>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value.toLowerCase())}
            onKeyDown={(event) => event.key === 'Enter' && search()}
            placeholder="Kullanıcı ara..."
            className="h-12 w-full rounded-none border border-border-strong bg-white px-10 pr-12 text-sm text-[#222] placeholder:text-[#9199a7] focus:border-accent"
          />
          <button onClick={search} type="button" className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center text-text-secondary hover:text-accent" aria-label="Kullanıcı ara">
            →
          </button>
        </div>
        {results.length > 0 && (
          <div className="mt-3 border-t border-border-subtle">
            {results.map((person) => (
              <PersonRow
                key={person.user_id}
                person={person}
                actions={
                  person.relationship_state === 'none' ? (
                    button('Arkadaş Ekle', 'send_friend_request', { target_user_id: person.user_id }, 'button-primary')
                  ) : (
                    <span className="text-[11px] text-text-muted capitalize">
                      {person.relationship_state === 'pending' ? 'İstek Gönderildi' : 'Arkadaş'}
                    </span>
                  )
                }
              />
            ))}
          </div>
        )}
      </section>

      {message && <p role="alert" className="text-xs text-status-danger">{message}</p>}

      <section>
        <h2 className="page-eyebrow mb-3">İstekler ({initial.incoming.length})</h2>
        {initial.incoming.length ? (
          initial.incoming.map((person) => (
            <PersonRow
              key={person.id}
              person={person}
              actions={
                <>
                  {button('Kabul Et', 'accept_friend_request', { request_id: person.id! }, 'button-primary')}
                  {button('Reddet', 'decline_friend_request', { request_id: person.id! })}
                  {button('Engelle', 'block_user', { target_user_id: person.user_id })}
                </>
              }
            />
          ))
        ) : (
          <p className="mt-3 text-xs text-text-muted">Bekleyen arkadaşlık isteği yok.</p>
        )}
      </section>

      <section>
        <h2 className="page-eyebrow mb-3">Gönderilen İstekler</h2>
        {initial.outgoing.length ? (
          initial.outgoing.map((person) => (
            <PersonRow
              key={person.id}
              person={person}
              actions={
                <>
                  {button('İsteği İptal Et', 'cancel_friend_request', { request_id: person.id! })}
                  {button('Engelle', 'block_user', { target_user_id: person.user_id })}
                </>
              }
            />
          ))
        ) : (
          <p className="mt-3 text-xs text-text-muted">Bekleyen arkadaşlık isteği yok.</p>
        )}
      </section>

      <section>
        <h2 className="page-eyebrow mb-3">Arkadaşlar ({initial.friends.length})</h2>
        {initial.friends.length ? (
          initial.friends.map((person) => (
            <PersonRow
              key={person.user_id}
              person={person}
              href={`/friends/${person.username}`}
              actions={
                <>
                  <Link
                    href={`/friends/${person.username}`}
                    className="button-secondary inline-flex min-h-9 items-center px-2.5 text-[11px]"
                  >
                    Profili Gör
                  </Link>
                  {button('Arkadaşlıktan Çıkar', 'remove_friend', { target_user_id: person.user_id })}
                  {button('Engelle', 'block_user', { target_user_id: person.user_id })}
                </>
              }
            />
          ))
        ) : (
          <p className="mt-3 text-xs text-text-muted">Henüz arkadaşın yok.</p>
        )}
      </section>

      <section className="border-b border-border-subtle pb-3">
        <h2 className="page-eyebrow mb-3">Engellenen Kullanıcılar ({initial.blocked.length})</h2>
        {initial.blocked.length ? (
          initial.blocked.map((person) => (
            <PersonRow
              key={person.user_id}
              person={person}
              actions={button('Engeli Kaldır', 'unblock_user', { target_user_id: person.user_id })}
            />
          ))
        ) : (
          <p className="mt-3 text-xs text-text-muted">Engellenen kullanıcı yok.</p>
        )}
      </section>
    </div>
  );
}
