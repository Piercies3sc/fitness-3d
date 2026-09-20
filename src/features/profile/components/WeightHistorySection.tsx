'use client';

import { useState, useTransition, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  WeightEntryItem,
  WeightRange,
  filterWeightEntriesByRange,
  getWeightChartData,
  calculateWeightChange,
  getLatestWeight,
} from '@/lib/calculations/body-metrics';
import { kgToLb } from '@/utils/weight-conversion';
import { deleteWeightEntry } from '@/lib/supabase/weight';
import { LogWeightModal } from './LogWeightModal';

interface WeightHistorySectionProps {
  userId: string;
  weightEntries: WeightEntryItem[];
  unitPreference: 'kg' | 'lb';
}

const emptySubscribe = () => () => {};

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR', {
    month: 'short',
    day: 'numeric',
  });
}

function formatDateWithYear(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDateTime(dateStr: string): string {
  return `${formatDateWithYear(dateStr)} · ${formatTime(dateStr)}`;
}

function formatChartDate(dateStr: string, mode: 'intraday' | 'daily'): string {
  return mode === 'intraday' ? formatTime(dateStr) : formatDateShort(dateStr);
}

export function WeightHistorySection({
  userId,
  weightEntries,
  unitPreference,
}: WeightHistorySectionProps) {
  const router = useRouter();
  const [range, setRange] = useState<WeightRange>('3m');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const totalCount = weightEntries.length;

  // Determine latest weight strictly by recorded_at timestamp
  const latestWeightKg = getLatestWeight(weightEntries);

  // Find latest entry for timestamp display
  const sortedByDateDesc = [...weightEntries].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );
  const latestEntry = sortedByDateDesc.length > 0 ? sortedByDateDesc[0] : null;

  // Format latest weight
  let latestWeightDisplay = '—';
  if (latestWeightKg !== null) {
    const val = unitPreference === 'lb' ? kgToLb(latestWeightKg) : latestWeightKg;
    latestWeightDisplay = `${val.toFixed(1)} ${unitPreference}`;
  }

  // Filter raw entries for selected range
  const entriesInRange = filterWeightEntriesByRange(weightEntries, range);

  // Build from filtered raw rows: preserve intraday points or reduce to daily latest points.
  const chart = getWeightChartData(entriesInRange);
  const chartMode = chart?.mode ?? null;
  const changeSummary = calculateWeightChange(
    chart?.points ?? [],
    range,
    unitPreference,
    chartMode === 'intraday' ? 'today' : 'range'
  );

  const chartData = (chart?.points ?? []).map((point) => {
    const val = unitPreference === 'lb' ? kgToLb(point.weight_kg) : point.weight_kg;
    return {
      id: point.id,
      displayDate: formatChartDate(point.recorded_at, chartMode ?? 'daily'),
      fullDate:
        chartMode === 'intraday'
          ? formatDateTime(point.recorded_at)
          : formatDateWithYear(point.recorded_at),
      weight: Math.round(val * 10) / 10,
    };
  });

  // Calculate domain around data values (never forced to zero)
  let yDomain: [number, number] = [0, 100];
  if (chartData.length > 0) {
    const weights = chartData.map((d) => d.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const padding = Math.max((maxWeight - minWeight) * 0.1, 0.5);
    yDomain = [minWeight - padding, maxWeight + padding];
  }

  // Count entries per calendar day for timestamp context in recent entries
  const dayCounts = new Map<string, number>();
  for (const e of weightEntries) {
    const d = new Date(e.recorded_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
  }

  function formatRecentEntryDate(dateStr: string): string {
    const d = new Date(dateStr);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const hasMultiple = (dayCounts.get(key) || 0) > 1;
    const datePart = d.toLocaleDateString('tr-TR', {
      month: 'short',
      day: 'numeric',
    });
    if (!hasMultiple) return datePart;
    const timePart = d.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${datePart} · ${timePart}`;
  }

  // Recent 5 entries (newest first, preserving all raw records)
  const recentEntries = sortedByDateDesc.slice(0, 5);

  const handleDelete = (entryId: string) => {
    startDeleteTransition(async () => {
      const res = await deleteWeightEntry(userId, entryId);
      if (res.success) {
        setDeleteConfirmId(null);
        router.refresh();
      }
    });
  };

  return (
    <>
      <section className="border-y border-border-subtle py-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Kilo Geçmişi
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsLogModalOpen(true)}
            className="text-xs text-accent hover:underline font-medium cursor-pointer"
          >
            + Kilo Ekle
          </button>
        </div>

        {/* 0 Entries State */}
        {totalCount === 0 ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-xs text-text-muted">Henüz kilo kaydı yok.</p>
            <button
              type="button"
              onClick={() => setIsLogModalOpen(true)}
              className="button-primary min-h-10 px-3.5 text-xs cursor-pointer inline-flex"
            >
              Kilo Ekle
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top Stat Row: Latest Weight + Factual Change + Range Selector */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
              <div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-bold text-text-primary font-mono tracking-tight">
                    {latestWeightDisplay}
                  </span>
                  {changeSummary.hasTrend && (
                    <span className="text-xs font-mono text-text-secondary">
                      {changeSummary.formatted}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-text-muted">
                  Latest entry: {latestEntry ? formatDateWithYear(latestEntry.recorded_at) : '—'}
                </span>
              </div>

              {/* Range Toggle Buttons */}
              <div className="flex gap-1 bg-surface-high p-0.5 rounded-md border border-border-subtle/60 self-start sm:self-auto">
                {(['30d', '3m', '6m', '1y'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded transition-colors cursor-pointer uppercase ${
                      range === r
                        ? 'bg-accent/15 border border-accent/60 text-accent font-semibold shadow-xs'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Area */}
            {entriesInRange.length < 2 ? (
              <div className="py-8 text-center border border-dashed border-border-subtle/60 rounded-md bg-surface-high/30 px-4">
                <p className="text-xs text-text-secondary">
                  {entriesInRange.length === 0
                    ? 'Bu aralıkta kilo kaydı yok.'
                    : 'Değişimi görmek için bir kayıt daha ekle.'}
                </p>
                {entriesInRange.length === 1 && (
                  <p className="text-[11px] text-text-muted mt-1">
                    Aynı gün kaydedilmiş olsa bile iki kayıt yeterlidir.
                  </p>
                )}
              </div>
            ) : (
              <div className="w-full h-48 sm:h-56 pt-2">
                {isClient && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="displayDate"
                        stroke="#6b7280"
                        fontSize={10}
                        tickLine={false}
                        axisLine={{ stroke: '#374151' }}
                        dy={6}
                        interval="preserveStartEnd"
                        minTickGap={20}
                      />
                      <YAxis
                        stroke="#6b7280"
                        fontSize={10}
                        tickLine={false}
                        axisLine={{ stroke: '#374151' }}
                        domain={yDomain}
                        tickFormatter={(v) => `${v}`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-surface-high border border-border-strong px-2.5 py-1.5 rounded shadow-lg text-xs">
                                <span className="text-text-muted block text-[10px]">
                                  {data.fullDate}
                                </span>
                                <span className="font-mono font-bold text-text-primary">
                                  {data.weight} {unitPreference}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#FF5A36"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#FF5A36', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#FF5A36', stroke: '#181C1F', strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {/* Recent Entries List */}
            {recentEntries.length > 0 && (
              <div className="pt-2 border-t border-border-subtle/50 space-y-2">
                <span className="text-[11px] uppercase tracking-wider text-text-muted block">
                  Son Kayıtlar
                </span>
                <div className="divide-y divide-border-subtle/40">
                  {recentEntries.map((entry) => {
                    const val =
                      unitPreference === 'lb'
                        ? kgToLb(entry.weight_kg)
                        : entry.weight_kg;
                    const isConfirming = deleteConfirmId === entry.id;

                    return (
                      <div
                        key={entry.id}
                        className="py-2 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-text-secondary font-mono">
                            {formatRecentEntryDate(entry.recorded_at)}
                          </span>
                          <span className="font-mono font-semibold text-text-primary">
                            {val.toFixed(1)} {unitPreference}
                          </span>
                        </div>

                        {/* Restrained delete confirmation */}
                        <div className="flex items-center">
                          {!isConfirming ? (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(entry.id)}
                              className="text-[11px] text-text-muted hover:text-status-danger transition-colors cursor-pointer px-1"
                              title="Delete entry"
                            >
                              Sil
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 bg-surface-high px-2 py-0.5 rounded border border-border-subtle">
                              <span className="text-[10px] text-text-muted">Silinsin mi?</span>
                              <button
                                type="button"
                                onClick={() => handleDelete(entry.id)}
                                disabled={isDeleting}
                                className="text-[11px] text-status-danger font-semibold hover:underline cursor-pointer disabled:opacity-50"
                              >
                                Onayla
                              </button>
                              <span className="text-text-muted text-[10px]">&bull;</span>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                disabled={isDeleting}
                                className="text-[11px] text-text-secondary hover:text-text-primary cursor-pointer"
                              >
                                Vazgeç
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Log Weight Modal */}
      <LogWeightModal
        userId={userId}
        unitPreference={unitPreference}
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
      />
    </>
  );
}
