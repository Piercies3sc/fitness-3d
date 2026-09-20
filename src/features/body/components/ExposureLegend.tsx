'use client';

import React from 'react';
import { EXPOSURE_COLOR_STOPS } from '@/lib/calculations/visualization';

export function ExposureLegend() {
  // Build CSS linear-gradient from the color stops
  const gradientStops = EXPOSURE_COLOR_STOPS
    .map(s => `${s.hex} ${s.t * 100}%`)
    .join(', ');

  return (
    <div className="w-full mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <h4 className="text-xs font-semibold text-text-primary tracking-tight">
          Göreli Antrenman Yükü
        </h4>
        <span className="text-[10px] text-text-muted leading-tight">
          Seçili aralıktaki en yüksek değere göre
        </span>
      </div>

      {/* Continuous gradient bar */}
      <div
        className="w-full h-2.5 rounded-sm"
        style={{ background: `linear-gradient(to right, ${gradientStops})` }}
        role="img"
        aria-label="Düşükten yükseğe antrenman yükü renk ölçeği"
      />

      {/* Labels beneath the gradient */}
      <div className="flex justify-between mt-1">
        {EXPOSURE_COLOR_STOPS.map((stop) => (
          <span
            key={stop.t}
            className="text-[10px] text-text-muted leading-tight"
            style={{ textAlign: stop.t === 0 ? 'left' : stop.t === 1 ? 'right' : 'center' }}
          >
            {stop.label}
          </span>
        ))}
      </div>

      <p className="mt-2 text-[10px] text-text-muted leading-relaxed">
        Renkler toparlanmayı veya kas gelişimini değil, göreli antrenman yükünü gösterir.
      </p>
    </div>
  );
}
