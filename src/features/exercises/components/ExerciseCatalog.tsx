'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ExerciseWithMuscles } from '@/lib/supabase/exercises';
import { displayExerciseName, displayMuscleName } from '@/lib/ui/turkish';

const REGION_ORDER = [
  { key: 'chest', label: 'Göğüs' },
  { key: 'back', label: 'Sırt' },
  { key: 'shoulders', label: 'Omuz' },
  { key: 'biceps', label: 'Biceps' },
  { key: 'triceps', label: 'Triceps' },
  { key: 'quadriceps', label: 'Ön Bacak' },
  { key: 'hamstrings', label: 'Arka Bacak' },
  { key: 'glutes', label: 'Kalça' },
  { key: 'calves', label: 'Baldır' },
  { key: 'core', label: 'Karın' },
] as const;

interface ExerciseCatalogProps {
  exercises: ExerciseWithMuscles[];
}

export function ExerciseCatalog({ exercises }: ExerciseCatalogProps) {
  // Home is the default filter per HOME-WORKOUT-FIRST product direction
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Counts for filters
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: exercises.length,
      home: exercises.filter((ex) => ex.home_friendly).length,
    };
    for (const ex of exercises) {
      const r = ex.body_region || 'other';
      counts[r] = (counts[r] || 0) + 1;
    }
    return counts;
  }, [exercises]);

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return exercises.filter((ex) => {
      // Home filter
      if (activeFilter === 'home' && !ex.home_friendly) {
        return false;
      }
      // Region filter
      if (
        activeFilter !== 'home' &&
        activeFilter !== 'all' &&
        (ex.body_region || '').toLowerCase() !== activeFilter
      ) {
        return false;
      }
      // Search query check
      if (q) {
        const nameMatch = ex.name.toLowerCase().includes(q) || displayExerciseName(ex.name).toLowerCase().includes(q);
        const equipMatch = (ex.equipment || '').toLowerCase().includes(q);
        const regionMatch = (ex.body_region || '').toLowerCase().includes(q);
        const muscleMatch = ex.exercise_muscles?.some((em) =>
          em.muscles && (em.muscles.name.toLowerCase().includes(q) || displayMuscleName(em.muscles.name).toLowerCase().includes(q))
        );
        return nameMatch || equipMatch || regionMatch || muscleMatch;
      }
      return true;
    });
  }, [exercises, activeFilter, searchQuery]);

  // Grouped by region when viewing Home or All without search
  const isGroupedView =
    (activeFilter === 'home' || activeFilter === 'all') && searchQuery.trim() === '';

  const groupedByRegion = useMemo(() => {
    if (!isGroupedView) return null;
    const map = new Map<string, ExerciseWithMuscles[]>();
    for (const reg of REGION_ORDER) {
      map.set(reg.key, []);
    }
    for (const ex of filteredExercises) {
      const r = (ex.body_region || 'other').toLowerCase();
      if (!map.has(r)) {
        map.set(r, []);
      }
      map.get(r)!.push(ex);
    }
    return map;
  }, [filteredExercises, isGroupedView]);

  return (
    <div className="space-y-8">
      {/* Controls: Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true">⌕</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hareket, ekipman veya kas ara..."
            className="h-12 w-full rounded-none border-border-strong bg-white px-10 pr-10 text-sm text-[#222] placeholder:text-[#9199a7] focus:border-accent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text-primary"
              aria-label="Aramayı temizle"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills: All (80), Home (55), then regions */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-[10px] font-semibold uppercase tracking-wide [-webkit-overflow-scrolling:touch]">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`shrink-0 border px-4 py-2 transition-colors ${
              activeFilter === 'all'
                ? 'border-text-primary bg-transparent text-accent'
                : 'border-border-strong bg-transparent text-text-muted hover:text-text-primary hover:border-text-secondary'
            }`}
          >
            Tümü ({filterCounts.all || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('home')}
            className={`shrink-0 border px-4 py-2 transition-colors ${
              activeFilter === 'home'
                ? 'border-text-primary bg-transparent text-accent'
                : 'border-border-strong bg-transparent text-text-muted hover:text-text-primary hover:border-text-secondary'
            }`}
          >
            Ev ({filterCounts.home || 0})
          </button>
          {REGION_ORDER.map(({ key, label }) => {
            const count = filterCounts[key] || 0;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFilter(key)}
                className={`shrink-0 border px-4 py-2 transition-colors ${
                  activeFilter === key
                    ? 'border-text-primary bg-transparent text-accent'
                    : 'border-border-strong bg-transparent text-text-muted hover:text-text-primary hover:border-text-secondary'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Catalog Display */}
      {isGroupedView && groupedByRegion ? (
        <div className="space-y-9">
          {REGION_ORDER.map(({ key, label }) => {
            const items = groupedByRegion.get(key) || [];
            if (items.length === 0) return null;

            return (
              <section key={key} aria-labelledby={`region-${key}`} className="space-y-3">
                <div className="flex items-baseline justify-between border-b border-border-subtle pb-1.5">
                  <h2
                    id={`region-${key}`}
                  className="page-eyebrow"
                  >
                    {label}
                  </h2>
                  <span className="text-[11px] text-text-muted">
                    {items.length} hareket
                  </span>
                </div>
                <div className="divide-y divide-border-subtle border-y border-border-subtle">
                  {items.map((ex) => (
                    <ExerciseCard key={ex.id} exercise={ex} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>
              {filteredExercises.length}{' '}
              hareket bulundu
            </span>
            {(activeFilter !== 'home' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('home');
                  setSearchQuery('');
                }}
                className="text-accent hover:underline"
              >
                Ev filtresine dön
              </button>
            )}
          </div>

          {filteredExercises.length === 0 ? (
            <div className="surface-panel p-8 text-center">
              <p className="text-text-muted text-sm">Arama ölçütlerinle eşleşen hareket yok.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle border-y border-border-subtle">
              {filteredExercises.map((ex) => (
                <ExerciseCard key={ex.id} exercise={ex} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExerciseCard({ exercise }: { exercise: ExerciseWithMuscles }) {
  const primaryMuscles =
    exercise.exercise_muscles
      ?.filter((em) => em.role === 'primary' && em.muscles)
      .map((em) => displayMuscleName(em.muscles!.name))
      .join(', ') || 'Yok';

  const secondaryMuscles = exercise.exercise_muscles
    ?.filter((em) => em.role === 'secondary' && em.muscles)
    .map((em) => displayMuscleName(em.muscles!.name))
    .join(', ');

  return (
    <Link
      href={`/exercises/${exercise.slug}`}
      className="group grid min-h-[4.25rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-3 first:pt-3 last:pb-3 transition-colors hover:bg-surface-high/30 sm:px-1"
    >
      <div className="min-w-0">
        <h3 className="text-sm font-medium text-text-primary transition-colors group-hover:text-accent">
          {displayExerciseName(exercise.name)}
        </h3>
        <span className="mt-0.5 block text-xs text-text-muted">{exercise.equipment || 'Ekipman belirtilmedi'}</span>
      </div>

      <div className="col-span-2 min-w-0 text-xs text-text-muted">
        <div className="truncate">
          <span className="text-text-muted">Ana kaslar: </span>
          <span className="text-text-primary font-medium">{primaryMuscles}</span>
        </div>
        {secondaryMuscles && (
          <div className="truncate text-text-muted">
            <span>Diğer: </span>
            <span>{secondaryMuscles}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 justify-self-end text-[11px] text-text-muted">
        {exercise.home_friendly && <span className="text-accent">Ev</span>}
        {exercise.movement_type && <span>{exercise.movement_type}</span>}
        <span className="text-text-secondary transition-transform group-hover:translate-x-0.5">›</span>
      </div>
    </Link>
  );
}
