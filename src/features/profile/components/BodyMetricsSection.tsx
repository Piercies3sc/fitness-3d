'use client';

import { useState } from 'react';
import { BodyMetricsSummary } from '@/lib/supabase/profile';
import { formatBMI, formatEstimatedBMR } from '@/lib/calculations/body-metrics';
import { kgToLb } from '@/utils/weight-conversion';
import { BodyMetricsEditModal } from './BodyMetricsEditModal';
import { LogWeightModal } from './LogWeightModal';

interface BodyMetricsSectionProps {
  userId: string;
  metrics: BodyMetricsSummary;
  unitPreference: 'kg' | 'lb';
}

export function BodyMetricsSection({
  userId,
  metrics,
  unitPreference,
}: BodyMetricsSectionProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogWeightModalOpen, setIsLogWeightModalOpen] = useState(false);

  // Format weight
  let weightDisplay = '—';
  if (metrics.weightKg !== null && metrics.weightKg > 0) {
    const val = unitPreference === 'lb' ? kgToLb(metrics.weightKg) : metrics.weightKg;
    weightDisplay = `${val.toFixed(1)} ${unitPreference}`;
  }

  // Format height
  const heightDisplay = metrics.heightCm ? `${metrics.heightCm} cm` : '—';

  // Format BMI
  const bmiDisplay = formatBMI(metrics.bmi);

  // Format Estimated BMR
  const bmrDisplay = formatEstimatedBMR(metrics.estimatedBMR);

  return (
    <>
      <section className="border-y border-border-subtle py-5">
        <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2 mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Vücut Ölçüleri
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLogWeightModalOpen(true)}
              className="px-2.5 py-1 rounded-md bg-accent/10 border border-accent/40 text-xs text-accent hover:bg-accent/20 font-medium cursor-pointer transition-colors"
            >
              + Kilo Ekle
            </button>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="px-2.5 py-1 rounded-md border border-border-subtle text-xs text-text-secondary hover:text-text-primary hover:border-border-strong font-medium cursor-pointer transition-colors"
            >
              Düzenle
            </button>
          </div>
        </div>

        {/* 2x2 layout on mobile (~390px), 4-col on larger screens */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Weight */}
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-text-muted mb-1">
              Kilo
            </span>
            <span className="metric-value text-xl sm:text-2xl">
              {weightDisplay}
            </span>
            <span className="text-[11px] text-text-secondary mt-0.5">
              {metrics.weightKg ? 'son kayıt' : 'kayıt yok'}
            </span>
          </div>

          {/* Height */}
          <div className="flex flex-col border-l border-border-subtle/40 pl-4 sm:pl-4">
            <span className="text-[11px] uppercase tracking-wider text-text-muted mb-1">
              Boy
            </span>
            <span className="metric-value text-xl sm:text-2xl">
              {heightDisplay}
            </span>
            <span className="text-[11px] text-text-secondary mt-0.5">boy uzunluğu</span>
          </div>

          {/* BMI */}
          <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-border-subtle/40 pt-3 sm:pt-0 sm:pl-4">
            <span className="text-[11px] uppercase tracking-wider text-text-muted mb-1">
              BMI
            </span>
            <span className="metric-value text-xl sm:text-2xl">
              {bmiDisplay}
            </span>
            <span className="text-[11px] text-text-secondary mt-0.5">oran</span>
          </div>

          {/* Estimated BMR */}
          <div className="flex flex-col border-t sm:border-t-0 border-l border-border-subtle/40 pt-3 sm:pt-0 pl-4">
            <span className="text-[11px] uppercase tracking-wider text-text-muted mb-1">
              Tahmini BMR
            </span>
            <span className="metric-value text-lg sm:text-xl text-accent truncate">
              {bmrDisplay}
            </span>
            <span className="text-[11px] text-text-secondary mt-0.5 leading-snug">
              {metrics.estimatedBMR !== null
                ? 'Mifflin–St Jeor'
                : metrics.bmrMissingMessage || 'Hesaplamak için gerekli ölçüleri ekleyin.'}
            </span>
          </div>
        </div>
      </section>

      {/* Edit Metrics Modal */}
      <BodyMetricsEditModal
        userId={userId}
        initialHeightCm={metrics.heightCm}
        initialDateOfBirth={metrics.dateOfBirth}
        initialBmrSex={metrics.bmrSex}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Log Weight Modal */}
      <LogWeightModal
        userId={userId}
        unitPreference={unitPreference}
        isOpen={isLogWeightModalOpen}
        onClose={() => setIsLogWeightModalOpen(false)}
      />
    </>
  );
}
