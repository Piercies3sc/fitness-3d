'use client';

import { useState, useTransition } from 'react';
import { updateBodyMetrics } from '@/lib/supabase/weight';

interface BodyMetricsEditModalProps {
  userId: string;
  initialHeightCm: number | null;
  initialDateOfBirth: string | null;
  initialBmrSex: 'male' | 'female' | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BodyMetricsEditModal({
  userId,
  initialHeightCm,
  initialDateOfBirth,
  initialBmrSex,
  isOpen,
  onClose,
}: BodyMetricsEditModalProps) {
  const [height, setHeight] = useState(initialHeightCm ? String(initialHeightCm) : '');
  const [dob, setDob] = useState(initialDateOfBirth || '');
  const [bmrSex, setBmrSex] = useState<'male' | 'female' | ''>(initialBmrSex || '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateBodyMetrics(
        userId,
        height.trim() === '' ? null : height,
        dob.trim() === '' ? null : dob,
        bmrSex === '' ? null : bmrSex
      );

      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Vücut ölçüleri güncellenemedi.');
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="metrics-modal-title"
    >
      <div className="w-full max-w-sm rounded-lg border border-border-subtle bg-surface p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle/50 pb-3">
          <h3 id="metrics-modal-title" className="text-sm font-bold text-text-primary">
            Vücut Ölçülerini Düzenle
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-text-muted hover:text-text-primary text-xs p-1 cursor-pointer"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            className="text-xs px-3 py-2 rounded border bg-status-danger/10 border-status-danger/30 text-status-danger"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Height Input */}
          <div className="space-y-1">
            <label htmlFor="modal_height" className="text-xs font-medium text-text-secondary block">
              Boy (cm)
            </label>
            <input
              id="modal_height"
              type="number"
              step="0.5"
              min="1"
              max="300"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="örn. 180"
              disabled={isPending}
              className="w-full bg-surface-high border border-border-subtle rounded-md px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-strong transition-colors"
            />
          </div>

          {/* Date of Birth Input */}
          <div className="space-y-1">
            <label htmlFor="modal_dob" className="text-xs font-medium text-text-secondary block">
              Doğum tarihi
            </label>
            <input
              id="modal_dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              disabled={isPending}
              className="w-full bg-surface-high border border-border-subtle rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-border-strong transition-colors"
            />
            <span className="text-[11px] text-text-muted block">
              Yalnızca BMR denkleminde yaş hesaplamak için kullanılır.
            </span>
          </div>

          {/* Sex for BMR Input */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary block">
              Cinsiyet (BMR tahmini için)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBmrSex('male')}
                disabled={isPending}
                className={`py-1.5 px-2 text-xs font-medium rounded border transition-colors cursor-pointer ${
                  bmrSex === 'male'
                    ? 'bg-accent border-accent text-white'
                    : 'bg-surface-high border-border-subtle text-text-secondary hover:text-text-primary'
                }`}
              >
                Erkek
              </button>
              <button
                type="button"
                onClick={() => setBmrSex('female')}
                disabled={isPending}
                className={`py-1.5 px-2 text-xs font-medium rounded border transition-colors cursor-pointer ${
                  bmrSex === 'female'
                    ? 'bg-accent border-accent text-white'
                    : 'bg-surface-high border-border-subtle text-text-secondary hover:text-text-primary'
                }`}
              >
                Kadın
              </button>
              <button
                type="button"
                onClick={() => setBmrSex('')}
                disabled={isPending}
                className={`py-1.5 px-2 text-xs font-medium rounded border transition-colors cursor-pointer ${
                  bmrSex === ''
                    ? 'bg-surface-high border-border-strong text-text-primary'
                    : 'bg-surface-high border-border-subtle text-text-muted hover:text-text-secondary'
                }`}
              >
                Belirtme
              </button>
            </div>
            <span className="text-[11px] text-text-muted block">
              Mifflin–St Jeor formül sabitleri için gereklidir.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle/50">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-medium rounded border border-border-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-1.5 text-xs font-semibold rounded bg-accent hover:bg-accent-hover text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPending ? 'Kaydediliyor...' : 'Ölçüleri Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
