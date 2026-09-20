'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Person = { id?: string; user_id: string; username: string; display_name: string | null };
type Overview = { username: string | null; incoming: Person[]; outgoing: Person[]; friends: Person[]; blocked: Person[] };

function PersonRow({ person, actions }: { person: Person; actions: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3.5 border-b border-border-subtle/50 last:border-b-0 px-1">
      <div className="min-w-0 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-surface-high border border-border-subtle flex items-center justify-center text-xs font-mono font-bold text-text-secondary select-none shrink-0">
          {(person.display_name || person.username).slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            {person.display_name || person.username}
          </p>
          <p className="text-xs font-mono text-text-muted truncate">
            @{person.username}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actions}
      </div>
    </div>
  );
}

export function FriendsHub({ initial }: { initial: Overview }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<Person & { relationship_state: string }>>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const call = (fn: string, args: Record<string, string>) =>
    startTransition(async () => {
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

  const renderButton = (
    label: string,
    fn: string,
    args: Record<string, string>,
    kind: 'primary' | 'secondary' | 'destructive' = 'secondary'
  ) => {
    const className =
      kind === 'primary'
        ? 'button-primary min-h-9 px-3 text-xs cursor-pointer disabled:opacity-50'
        : kind === 'destructive'
        ? 'button-destructive min-h-9 px-3 text-xs cursor-pointer disabled:opacity-50'
        : 'button-secondary min-h-9 px-3 text-xs cursor-pointer disabled:opacity-50';

    return (
      <button
        type="button"
        disabled={isPending}
        onClick={() => call(fn, args)}
        className={className}
      >
        {label}
      </button>
    );
  };

  if (!initial.username) {
    return (
      <section className="surface-panel p-6 border-l-2 border-l-accent">
        <h2 className="section-heading">Kullanıcı Adı Gerekli</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Arkadaşlar özelliğini kullanmak için önce profilinden bir kullanıcı adı belirle.
        </p>
        <Link href="/profile" className="button-primary mt-4 inline-flex min-h-10 px-4 text-xs">
          Profile Git
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-7">
      {/* Search section */}
      <section className="border-y border-border-subtle py-5">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
          <h2 className="section-heading">Arkadaş Ara</h2>
        </div>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value.toLowerCase())}
            onKeyDown={(event) => event.key === 'Enter' && search()}
            placeholder="Kullanıcı adıyla ara..."
            className="field-control min-w-0 flex-1 px-3.5 text-sm"
          />
          <button
            onClick={search}
            type="button"
            className="button-primary min-h-11 px-5 text-xs font-semibold"
          >
            Ara
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-4 divide-y divide-border-subtle/50 border-t border-border-subtle">
            {results.map((person) => (
              <PersonRow
                key={person.user_id}
                person={person}
                actions={
                  person.relationship_state === 'none' ? (
                    renderButton('Arkadaş Ekle', 'send_friend_request', { target_user_id: person.user_id }, 'primary')
                  ) : (
                    <span className="text-xs font-mono text-text-muted px-2 py-1 rounded bg-surface-high border border-border-subtle">
                      {person.relationship_state === 'pending' ? 'İstek Gönderildi' : 'Arkadaş'}
                    </span>
                  )
                }
              />
            ))}
          </div>
        )}
      </section>

      {message && (
        <div className="p-3 rounded-md bg-status-danger/10 border border-status-danger/20 text-status-danger text-xs">
          {message}
        </div>
      )}

      {/* Incoming Requests */}
      <section className="border-y border-border-subtle py-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-heading">Gelen İstekler</h2>
          {initial.incoming.length > 0 && (
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">
              {initial.incoming.length}
            </span>
          )}
        </div>
        {initial.incoming.length ? (
          <div className="divide-y divide-border-subtle/50">
            {initial.incoming.map((person) => (
              <PersonRow
                key={person.id}
                person={person}
                actions={
                  <>
                    {renderButton('Kabul Et', 'accept_friend_request', { request_id: person.id! }, 'primary')}
                    {renderButton('Reddet', 'decline_friend_request', { request_id: person.id! }, 'secondary')}
                    {renderButton('Engelle', 'block_user', { target_user_id: person.user_id }, 'destructive')}
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-muted py-2">Bekleyen arkadaşlık isteği yok.</p>
        )}
      </section>

      {/* Outgoing Requests */}
      <section className="border-y border-border-subtle py-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-heading">Gönderilen İstekler</h2>
          {initial.outgoing.length > 0 && (
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-high text-text-secondary font-semibold">
              {initial.outgoing.length}
            </span>
          )}
        </div>
        {initial.outgoing.length ? (
          <div className="divide-y divide-border-subtle/50">
            {initial.outgoing.map((person) => (
              <PersonRow
                key={person.id}
                person={person}
                actions={
                  <>
                    {renderButton('İptal Et', 'cancel_friend_request', { request_id: person.id! }, 'secondary')}
                    {renderButton('Engelle', 'block_user', { target_user_id: person.user_id }, 'destructive')}
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-muted py-2">Bekleyen giden istek yok.</p>
        )}
      </section>

      {/* Friends List */}
      <section className="border-y border-border-subtle py-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-heading">Arkadaşlar</h2>
          <span className="text-xs font-mono text-text-secondary font-medium">
            {initial.friends.length} arkadaş
          </span>
        </div>
        {initial.friends.length ? (
          <div className="divide-y divide-border-subtle/50">
            {initial.friends.map((person) => (
              <PersonRow
                key={person.user_id}
                person={person}
                actions={
                  <>
                    <Link
                      href={`/friends/${person.username}`}
                      className="button-secondary min-h-9 px-3 text-xs inline-flex items-center"
                    >
                      Profili Gör
                    </Link>
                    {renderButton('Çıkar', 'remove_friend', { target_user_id: person.user_id }, 'secondary')}
                    {renderButton('Engelle', 'block_user', { target_user_id: person.user_id }, 'destructive')}
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-muted py-2">Henüz arkadaşın yok.</p>
        )}
      </section>

      {/* Blocked Users */}
      {initial.blocked.length > 0 && (
        <section className="border-y border-border-subtle py-5">
          <h2 className="section-heading mb-3">Engellenen Kullanıcılar</h2>
          <div className="divide-y divide-border-subtle/50">
            {initial.blocked.map((person) => (
              <PersonRow
                key={person.user_id}
                person={person}
                actions={renderButton('Engeli Kaldır', 'unblock_user', { target_user_id: person.user_id }, 'secondary')}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
