'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { updateProfilePreferences, uploadAvatar, removeAvatar } from '@/lib/supabase/profile';
import { Avatar } from '@/components/ui/Avatar';
import { AvatarCropModal } from './AvatarCropModal';

interface ProfileEditFormProps {
  userId: string;
  initialDisplayName: string | null;
  initialUsername: string | null;
  initialUnitPreference: 'kg' | 'lb';
  initialAvatarUrl?: string | null;
  initials: string;
}

export function ProfileEditForm({
  userId,
  initialDisplayName,
  initialUsername,
  initialUnitPreference,
  initialAvatarUrl,
  initials,
}: ProfileEditFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(initialDisplayName || '');
  const [username, setUsername] = useState(initialUsername || '');
  const [unitPreference, setUnitPreference] = useState<'kg' | 'lb'>(initialUnitPreference);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl || null);

  // Local pending states for avatar selection & removal
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPendingRemoval, setIsPendingRemoval] = useState(false);

  // Raw file state for active crop modal
  const [rawCropImageSrc, setRawCropImageSrc] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount or when URLs change
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (rawCropImageSrc) {
        URL.revokeObjectURL(rawCropImageSrc);
      }
    };
  }, [previewUrl, rawCropImageSrc]);

  const handleDiscardPendingAvatar = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPendingAvatarFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropCancel = () => {
    if (rawCropImageSrc) {
      URL.revokeObjectURL(rawCropImageSrc);
      setRawCropImageSrc(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropApply = (croppedBlob: Blob) => {
    if (rawCropImageSrc) {
      URL.revokeObjectURL(rawCropImageSrc);
      setRawCropImageSrc(null);
    }

    const croppedFile = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(croppedBlob);
    setPendingAvatarFile(croppedFile);
    setPreviewUrl(nextPreviewUrl);
    setIsPendingRemoval(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setStatusMessage({ type: 'error', text: 'Yalnızca JPEG, PNG veya WebP formatları desteklenir.' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Fotoğraf boyutu 2 MB\'tan küçük olmalıdır.' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setStatusMessage(null);

    // Revoke previous raw crop URL if any
    if (rawCropImageSrc) {
      URL.revokeObjectURL(rawCropImageSrc);
    }

    const rawUrl = URL.createObjectURL(file);
    setRawCropImageSrc(rawUrl);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMarkForRemoval = () => {
    handleDiscardPendingAvatar();
    handleCropCancel();
    setIsPendingRemoval(true);
    setStatusMessage(null);
  };

  const handleUndoRemoval = () => {
    setIsPendingRemoval(false);
    setStatusMessage(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const trimmed = displayName.trim();
    if (trimmed.length > 50) {
      setStatusMessage({ type: 'error', text: 'Görünen ad en fazla 50 karakter olabilir.' });
      return;
    }

    startTransition(async () => {
      // 1. Handle pending removal
      if (isPendingRemoval) {
        try {
          const removeRes = await removeAvatar();
          if (!removeRes.success) {
            setStatusMessage({ type: 'error', text: removeRes.error || 'Fotoğraf kaldırılamadı.' });
            return;
          }
          setAvatarUrl(null);
          setIsPendingRemoval(false);
        } catch {
          setStatusMessage({ type: 'error', text: 'Fotoğraf kaldırılırken bir hata oluştu.' });
          return;
        }
      }
      // 2. Handle pending upload
      else if (pendingAvatarFile) {
        try {
          const formData = new FormData();
          formData.append('avatar', pendingAvatarFile);
          const uploadRes = await uploadAvatar(formData);
          if (!uploadRes.success || !uploadRes.avatarUrl) {
            setStatusMessage({ type: 'error', text: uploadRes.error || 'Fotoğraf yüklenemedi.' });
            return;
          }
          setAvatarUrl(uploadRes.avatarUrl);
          handleDiscardPendingAvatar();
        } catch {
          setStatusMessage({ type: 'error', text: 'Fotoğraf yüklenirken bir hata oluştu.' });
          return;
        }
      }

      // 3. Update profile preferences
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
    handleDiscardPendingAvatar();
    handleCropCancel();
    setIsPendingRemoval(false);
    setDisplayName(initialDisplayName || '');
    setUsername(initialUsername || '');
    setUnitPreference(initialUnitPreference);
    setStatusMessage(null);
    setIsEditing(false);
  };

  // Determine which avatar source to show in edit mode
  const currentDisplayAvatarSrc = pendingAvatarFile && previewUrl
    ? previewUrl
    : isPendingRemoval
    ? null
    : avatarUrl;

  return (
    <section className="border-b border-border-subtle pb-6">
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
        <div className="flex items-center gap-4">
          <Avatar
            src={avatarUrl}
            name={displayName || 'Profilin'}
            initials={initials}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold tracking-[-0.04em] text-text-primary">
              {displayName || 'Profilin'}
            </h2>
            <p className="mt-0.5 truncate text-xs text-text-secondary">
              {username ? `@${username}` : 'Kullanıcı adı belirlenmedi'}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-text-muted">{unitPreference}</p>
          </div>
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
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          {/* Profile Photo Section in Edit Mode */}
          <div className="space-y-2 pb-3 border-b border-border-subtle/40">
            <div className="flex items-center justify-between">
              <label className="text-xs text-text-secondary font-medium block">
                Profil Fotoğrafı
              </label>
              {pendingAvatarFile && previewUrl && (
                <span className="text-[10px] uppercase font-semibold text-accent tracking-wider">
                  ● Kaydedilmedi
                </span>
              )}
              {isPendingRemoval && (
                <span className="text-[10px] uppercase font-semibold text-status-warning tracking-wider">
                  ● Kaldırılacak (Kaydedilmedi)
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Avatar
                src={currentDisplayAvatarSrc}
                name={displayName || 'Profil'}
                initials={initials}
                size="lg"
              />
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarFileSelect}
                  className="hidden"
                  disabled={isPending}
                />

                {pendingAvatarFile && previewUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isPending}
                      className="button-secondary min-h-9 px-3 text-xs cursor-pointer disabled:opacity-50"
                    >
                      Fotoğrafı Değiştir
                    </button>
                    <button
                      type="button"
                      onClick={handleDiscardPendingAvatar}
                      disabled={isPending}
                      className="button-secondary min-h-9 px-3 text-xs cursor-pointer disabled:opacity-50"
                    >
                      Seçimi İptal Et
                    </button>
                  </>
                ) : isPendingRemoval ? (
                  <>
                    <button
                      type="button"
                      onClick={handleUndoRemoval}
                      disabled={isPending}
                      className="button-secondary min-h-9 px-3 text-xs cursor-pointer disabled:opacity-50"
                    >
                      Kaldırmayı Geri Al
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isPending}
                      className="button-secondary min-h-9 px-3 text-xs cursor-pointer disabled:opacity-50"
                    >
                      Yeni Fotoğraf Seç
                    </button>
                  </>
                ) : avatarUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isPending}
                      className="button-secondary min-h-9 px-3 text-xs cursor-pointer disabled:opacity-50"
                    >
                      Fotoğrafı Değiştir
                    </button>
                    <button
                      type="button"
                      onClick={handleMarkForRemoval}
                      disabled={isPending}
                      className="button-destructive min-h-9 px-3 text-xs cursor-pointer disabled:opacity-50"
                    >
                      Fotoğrafı Kaldır
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPending}
                    className="button-secondary min-h-9 px-3 text-xs cursor-pointer disabled:opacity-50"
                  >
                    Fotoğraf Yükle
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

      {rawCropImageSrc && (
        <AvatarCropModal
          imageSrc={rawCropImageSrc}
          onApply={handleCropApply}
          onCancel={handleCropCancel}
        />
      )}
    </section>
  );
}

