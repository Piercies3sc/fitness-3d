'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { MuscleTrainingExposure } from '@/lib/calculations/exposure';
import { normalizeExposure, buildReverseMeshMapping } from '@/lib/calculations/visualization';
import { SelectedMuscleInfo } from './SelectedMuscleInfo';
import { ExposureLegend } from './ExposureLegend';
import { displayMuscleName } from '@/lib/ui/turkish';

// Dynamically import BodyViewer with ssr: false
const BodyViewer = dynamic(
  () => import('./BodyViewer').then(mod => mod.BodyViewer),
  { ssr: false, loading: () => (
    <div className="w-full h-[380px] sm:h-[500px] flex items-center justify-center bg-background rounded-lg border border-border-subtle mb-6">
      <div className="text-text-muted text-sm font-medium animate-pulse">3B Model Yükleniyor...</div>
    </div>
  )}
);

interface BodyClientContainerProps {
  exposureData: MuscleTrainingExposure[];
  muscleMeshes: Record<string, string[]>;
  rangeLabel: string;
}

export function BodyClientContainer({
  exposureData,
  muscleMeshes,
  rangeLabel
}: BodyClientContainerProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const normalizedExposure = React.useMemo(() => normalizeExposure(exposureData), [exposureData]);
  const reverseMapping = React.useMemo(() => buildReverseMeshMapping(muscleMeshes), [muscleMeshes]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      {/* 3D Viewer Column */}
      <div className="min-w-0 flex-1 lg:max-w-3xl">
        {/* Legend placed between range selector and 3D viewer */}
        <ExposureLegend />

        <BodyViewer 
          normalizedExposure={normalizedExposure}
          reverseMapping={reverseMapping}
          selectedSlug={selectedSlug}
          onSelect={setSelectedSlug}
        />

        <SelectedMuscleInfo 
          selectedSlug={selectedSlug} 
          exposureData={exposureData} 
          rangeLabel={rangeLabel} 
        />
      </div>

      {/* Interactive Muscle List Column */}
      <div className="flex-1 lg:max-w-sm">
        <div className="border-y border-border-subtle lg:border lg:rounded-[10px] overflow-hidden">
          <div className="px-4 py-3 bg-surface-high border-b border-border-subtle flex justify-between items-center">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Kas</span>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Yük</span>
          </div>
          
          <ul className="divide-y divide-border-subtle">
            {exposureData.map((muscle) => {
              const isZero = muscle.exposure === 0;
              const isSelected = muscle.muscleSlug === selectedSlug;
              const formattedExposure = muscle.exposure.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
              
              return (
                <li key={muscle.muscleId}>
                  <button
                    onClick={() => setSelectedSlug(isSelected ? null : muscle.muscleSlug)}
                    className={`w-full min-h-11 flex justify-between items-center px-4 py-2.5 text-left transition-colors ${
                      isSelected ? 'bg-surface-high border-l-2 border-accent' : 'hover:bg-surface-high border-l-2 border-transparent'
                    } ${isZero ? 'opacity-50' : ''}`}
                  >
                    <span className={`text-sm ${isZero ? 'text-text-muted' : (isSelected ? 'text-accent font-semibold' : 'text-text-primary font-medium')}`}>
                      {displayMuscleName(muscle.muscleName)}
                    </span>
                    <span className={`text-sm font-mono tabular-nums ${isZero ? 'text-text-muted' : (isSelected ? 'text-text-primary font-bold' : 'text-text-primary font-semibold')}`}>
                      {formattedExposure}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
