'use client';

import { MuscleTrainingExposure } from '@/lib/calculations/exposure';
import { displayMuscleName } from '@/lib/ui/turkish';

interface SelectedMuscleInfoProps {
  selectedSlug: string | null;
  exposureData: MuscleTrainingExposure[];
  rangeLabel: string;
}

export function SelectedMuscleInfo({
  selectedSlug,
  exposureData,
  rangeLabel,
}: SelectedMuscleInfoProps) {
  if (!selectedSlug) {
    return (
      <div className="border-b border-border-subtle py-4 mb-6 text-center text-sm text-text-muted">
        Ayrıntıları görmek için modelden bir kas seç.
      </div>
    );
  }

  const data = exposureData.find(m => m.muscleSlug === selectedSlug);

  if (!data) {
    return (
      <div className="border-b border-border-subtle py-4 mb-6 text-center text-sm text-text-muted">
        Ayrıntıları görmek için modelden bir kas seç.
      </div>
    );
  }

  // Compute max exposure for relative percentage
  let maxExposure = 0;
  for (const m of exposureData) {
    if (m.exposure > maxExposure) maxExposure = m.exposure;
  }

  const isZero = data.exposure === 0;
  const formattedExposure = data.exposure.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
  const relativePercent = maxExposure > 0
    ? Math.round((data.exposure / maxExposure) * 100)
    : 0;

  return (
    <div className="border-y border-border-subtle py-4 mb-6">
      <p className="section-eyebrow mb-1">Seçili kas</p>
      <h3 className="section-heading text-base mb-3">{displayMuscleName(data.muscleName)}</h3>
      <div className="flex items-baseline gap-6">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-text-muted block mb-0.5">
            Antrenman Yükü
          </span>
          <span className={`metric-value text-xl ${isZero ? 'text-text-muted' : 'text-text-primary'}`}>
            {formattedExposure}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-text-muted block mb-0.5">
            Göreli
          </span>
          <span className={`metric-value text-xl ${isZero ? 'text-text-muted' : 'text-text-primary'}`}>
            {relativePercent}%
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-text-muted block mb-0.5">
            Aralık
          </span>
          <span className="text-sm font-medium text-text-secondary">
            {rangeLabel}
          </span>
        </div>
      </div>
      {isZero && (
        <p className="text-xs text-text-muted mt-2">Bu aralıkta tamamlanan çalışma seti yok.</p>
      )}
    </div>
  );
}
