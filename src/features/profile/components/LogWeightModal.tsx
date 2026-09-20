'use client';

import { useState, useTransition } from 'react';
import { logWeightEntry } from '@/lib/supabase/weight';

interface LogWeightModalProps {
  userId: string;
  unitPreference: 'kg' | 'lb';
  isOpen: boolean;
  onClose: () => void;
}

function getLocalDateTimeString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function LogWeightModal({
  userId,
  unitPreference,
  isOpen,
  onClose,
}: LogWeightModalProps) {
  const [weight, setWeight] = useState('');
  const [recordedAt, setRecordedAt] = useState(getLocalDateTimeString);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedWeight = weight.trim();
    if (!trimmedWeight) {
      setError('Lütfen kilonuzu girin.');
      return;
    }

    startTransition(async () => {
      const result = await logWeightEntry(
        userId,
        trimmedWeight,
        recordedAt ? new Date(recordedAt).toISOString() : null,
        unitPreference
      );

      if (result.success) {
        setWeight('');
        onClose();
      } else {
        setError(result.error || 'Kilo kaydı eklenemedi.');
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-weight-modal-title"
    >
      <div className="w-full max-w-sm rounded-lg border border-border-subtle bg-surface p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle/50 pb-3">
          <h3 id="log-weight-modal-title" className="text-sm font-bold text-text-primary">
            Vücut Ağırlığını Kaydet
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
          {/* Weight Input */}
          <div className="space-y-1">
            <label htmlFor="log_weight_input" className="text-xs font-medium text-text-secondary block">
              Kilo ({unitPreference})
            </label>
            <div className="relative">
              <input
                id="log_weight_input"
                type="number"
                step="0.1"
                min="1"
                max={unitPreference === 'lb' ? 1100 : 500}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={unitPreference === 'lb' ? 'örn. 175,5' : 'örn. 79,5'}
                autoFocus
                disabled={isPending}
                className="w-full bg-surface-high border border-border-subtle rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-strong transition-colors"
              />
              <span className="absolute right-3 top-2.5 text-xs text-text-muted font-mono uppercase">
                {unitPreference}
              </span>
            </div>
          </div>

          {/* Date & Time Input */}
          <div className="space-y-1">
            <label htmlFor="log_weight_date" className="text-xs font-medium text-text-secondary block">
              Tarih ve saat
            </label>
            <input
              id="log_weight_date"
              type="datetime-local"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              disabled={isPending}
              className="w-full bg-surface-high border border-border-subtle rounded-md px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-border-strong transition-colors"
            />
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
              {isPending ? 'Kaydediliyor...' : 'Kiloyu Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
