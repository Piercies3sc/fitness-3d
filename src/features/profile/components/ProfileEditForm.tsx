'use client';

import { useState, useTransition } from 'react';
import { updateProfilePreferences } from '@/lib/supabase/profile';

interface ProfileEditFormProps {
  userId: string;
  initialDisplayName: string | null;
  initialUsername: string | null;
  initialUnitPreference: 'kg' | 'lb';
}

export function ProfileEditForm({
  userId,
  initialDisplayName,
  initialUsername,
  initialUnitPreference,
}: ProfileEditFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(initialDisplayName || '');
  const [username, setUsername] = useState(initialUsername || '');
  const [unitPreference, setUnitPreference] = useState<'kg' | 'lb'>(initialUnitPreference);
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const trimmed = displayName.trim();
    if (trimmed.length > 50) {
      setStatusMessage({ type: 'error', text: 'Görünen ad en fazla 50 karakter olabilir.' });
      return;
    }

    startTransition(async () => {
      const result = await updateProfilePreferences(
        userId,
        trimmed.length > 0 ? trimmed : null,
        unitPreference,
        username
      );

      if (result.success) {
        setStatusMessage({ type: 'success', text: result.message || 'Profil güncellendi.' });
        setIsEditing(false);
      } else {
        setStatusMessage({ type: 'error', text: result.error || 'Profil güncellenemedi.' });
      }
    });
  };

  const handleCancel = () => {
    setDisplayName(initialDisplayName || '');
    setUsername(initialUsername || '');
    setUnitPreference(initialUnitPreference);
    setStatusMessage(null);
    setIsEditing(false);
  };

  return (
    <div className="border-y border-border-subtle py-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Tercihler
        </h3>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs text-accent hover:underline font-medium"
          >
            Düzenle
          </button>
        )}
      </div>

      {statusMessage && (
        <div
          className={`text-xs px-3 py-2 rounded mb-3 border ${
            statusMessage.type === 'success'
              ? 'bg-status-success/10 border-status-success/30 text-status-success'
              : 'bg-status-danger/10 border-status-danger/30 text-status-danger'
          }`}
          role="alert"
        >
          {statusMessage.text}
        </div>
      )}

      {!isEditing ? (
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-border-subtle/40">
            <span className="text-text-muted">Görünen ad</span>
            <span className="text-text-primary font-medium">
              {displayName || <span className="text-text-muted italic">Belirtilmedi</span>}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-border-subtle/40">
            <span className="text-text-muted">Kullanıcı adı</span>
            <span className="text-text-primary font-medium">{username ? `@${username}` : <span className="text-text-muted italic">Belirtilmedi</span>}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-text-muted">Birim tercihi</span>
            <span className="text-text-primary font-medium uppercase font-mono">
              {unitPreference}
            </span>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="username" className="text-xs text-text-secondary font-medium">Kullanıcı adı</label>
            <input id="username" type="text" maxLength={20} value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="e.g. alex_lifts" disabled={isPending} className="field-control w-full px-3 text-sm" />
            <p className="text-[11px] text-text-muted">3–20 küçük harf, sayı veya alt çizgi kullanın.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4 pt-1">
          {/* Display Name Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label htmlFor="display_name" className="text-text-secondary font-medium">
                Görünen ad
              </label>
              <span className="text-text-muted text-[11px]">{displayName.length}/50</span>
            </div>
            <input
              id="display_name"
              type="text"
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex"
              disabled={isPending}
              className="field-control w-full px-3 text-sm"
            />
          </div>

          {/* Unit Preference Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs text-text-secondary font-medium block">
              Birim tercihi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUnitPreference('kg')}
                disabled={isPending}
                className={`min-h-11 py-2 px-3 text-xs font-semibold rounded border transition-colors ${
                  unitPreference === 'kg'
                    ? 'bg-accent border-accent text-white'
                    : 'bg-surface-high border-border-subtle text-text-secondary hover:text-text-primary'
                }`}
              >
                kg (Kilogram)
              </button>
              <button
                type="button"
                onClick={() => setUnitPreference('lb')}
                disabled={isPending}
                className={`min-h-11 py-2 px-3 text-xs font-semibold rounded border transition-colors ${
                  unitPreference === 'lb'
                    ? 'bg-accent border-accent text-white'
                    : 'bg-surface-high border-border-subtle text-text-secondary hover:text-text-primary'
                }`}
              >
                lb (Pound)
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="button-secondary min-h-10 px-3.5 text-xs cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="button-primary min-h-10 px-4 text-xs cursor-pointer disabled:opacity-50"
            >
              {isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
