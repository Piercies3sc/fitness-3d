'use client';

import { useState, useTransition, useRef } from 'react';
import { updateProfilePreferences, uploadAvatar, removeAvatar } from '@/lib/supabase/profile';
import { Avatar } from '@/components/ui/Avatar';

interface ProfileEditFormProps {
  userId: string;
  initialDisplayName: string | null;
  initialUsername: string | null;
  initialUnitPreference: 'kg' | 'lb';
  initialAvatarUrl?: string | null;
}

export function ProfileEditForm({
  userId,
  initialDisplayName,
  initialUsername,
  initialUnitPreference,
  initialAvatarUrl,
}: ProfileEditFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(initialDisplayName || '');
  const [username, setUsername] = useState(initialUsername || '');
  const [unitPreference, setUnitPreference] = useState<'kg' | 'lb'>(initialUnitPreference);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl || null);
  const [isPending, startTransition] = useTransition();
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Fotoğraf boyutu 2 MB\'tan küçük olmalıdır.' });
      return;
    }

    setStatusMessage(null);
    setAvatarLoading(true);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await uploadAvatar(formData);
      if (res.success && res.avatarUrl) {
        setAvatarUrl(res.avatarUrl);
        setStatusMessage({ type: 'success', text: 'Profil fotoğrafı yüklendi.' });
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Fotoğraf yüklenemedi.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Fotoğraf yüklenirken bir hata oluştu.' });
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAvatarRemove = async () => {
    setStatusMessage(null);
    setAvatarLoading(true);

    try {
      const res = await removeAvatar();
      if (res.success) {
        setAvatarUrl(null);
        setStatusMessage({ type: 'success', text: 'Profil fotoğrafı kaldırıldı.' });
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Fotoğraf kaldırılamadı.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Fotoğraf kaldırılırken bir hata oluştu.' });
    } finally {
      setAvatarLoading(false);
    }
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Tercihler
        </h3>
        {!isEditing && (
          <button
            type="button"
            onClick={() => {
              setStatusMessage(null);
              setIsEditing(true);
            }}
            className="button-secondary min-h-8 px-3 text-xs cursor-pointer hover:border-border-strong transition-colors"
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
        <div className="divide-y divide-border-subtle/40 text-xs">
          <div className="flex items-center justify-between py-2.5">
            <span className="text-text-muted">Görünen ad</span>
            <span className="text-text-primary font-medium truncate max-w-[220px]">
              {displayName || <span className="text-text-muted italic">Belirtilmedi</span>}
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-text-muted">Kullanıcı adı</span>
            <span className="text-text-primary font-medium font-mono truncate max-w-[220px]">
              {username ? `@${username}` : <span className="text-text-muted italic">Belirtilmedi</span>}
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-text-muted">Birim tercihi</span>
            <span className="text-text-primary font-medium uppercase font-mono">
              {unitPreference}
            </span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4 pt-1">
          {/* Profile Photo Section in Edit Mode */}
          <div className="space-y-2 pb-3 border-b border-border-subtle/40">
            <label className="text-xs text-text-secondary font-medium block">
              Profil Fotoğrafı
            </label>
            <div className="flex items-center gap-4">
              <Avatar
                src={avatarUrl}
                name={displayName || 'Profil'}
                initials={displayName?.slice(0, 2).toUpperCase() || 'BEN'}
                size="lg"
              />
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={avatarLoading || isPending}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading || isPending}
                  className="button-secondary min-h-9 px-3 text-xs cursor-pointer disabled:opacity-50"
                >
                  {avatarLoading ? 'Yükleniyor...' : avatarUrl ? 'Fotoğrafı Değiştir' : 'Fotoğraf Yükle'}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleAvatarRemove}
                    disabled={avatarLoading || isPending}
                    className="button-destructive min-h-9 px-3 text-xs cursor-pointer disabled:opacity-50"
                  >
                    Kaldır
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-text-muted">
              JPEG, PNG veya WebP. Maksimum 2 MB.
            </p>
          </div>

          {/* Display Name Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label htmlFor="display_name" className="text-text-secondary font-medium">
                Görünen ad
              </label>
              <span className="text-text-muted text-[11px] font-mono">{displayName.length}/50</span>
            </div>
            <input
              id="display_name"
              type="text"
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Örn: Alex"
              disabled={isPending}
              className="field-control w-full px-3 text-sm"
            />
          </div>

          {/* Username Input */}
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-xs text-text-secondary font-medium block">
              Kullanıcı adı
            </label>
            <input
              id="username"
              type="text"
              maxLength={20}
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="Örn: alex_lifts"
              disabled={isPending}
              className="field-control w-full px-3 text-sm font-mono"
            />
            <p className="text-[11px] text-text-muted">3–20 küçük harf, sayı veya alt çizgi kullanın.</p>
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
                className={`min-h-11 py-2 px-3 text-xs font-semibold rounded border transition-colors cursor-pointer ${
                  unitPreference === 'kg'
                    ? 'bg-accent/15 border-accent/60 text-accent font-semibold'
                    : 'bg-surface-high border-border-subtle text-text-secondary hover:text-text-primary'
                }`}
              >
                kg (Kilogram)
              </button>
              <button
                type="button"
                onClick={() => setUnitPreference('lb')}
                disabled={isPending}
                className={`min-h-11 py-2 px-3 text-xs font-semibold rounded border transition-colors cursor-pointer ${
                  unitPreference === 'lb'
                    ? 'bg-accent/15 border-accent/60 text-accent font-semibold'
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
              className="button-secondary min-h-10 px-4 text-xs cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="button-primary min-h-10 px-5 text-xs cursor-pointer disabled:opacity-50 font-semibold"
            >
              {isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
