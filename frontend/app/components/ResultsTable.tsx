'use client';

import { useState, useRef, useEffect } from 'react';
import type { ImportResult } from '@/lib/types';

const ROW_HEIGHT = 36;
const VISIBLE_ROWS = 15; // rows visible at once in virtualized view
const VIRTUALIZE_THRESHOLD = 100;

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'accent' | 'good' | 'bad' | 'ink' }) {
  const toneClass = {
    accent: 'text-accent',
    good: 'text-good',
    bad: 'text-bad',
    ink: 'text-ink dark:text-zinc-100',
  }[tone];

  return (
    <div className="border border-line px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="font-mono text-xs uppercase tracking-wide text-muted dark:text-zinc-500">{label}</div>
      <div className={`mt-1 font-display text-2xl font-medium ${toneClass}`}>{value}</div>
    </div>
  );
}

type TableRow = { sourceIndex: number; reason?: string; fields: Record<string, string> };

// Standard table for small datasets
function StandardTable({ rows, fields, showReason }: { rows: TableRow[]; fields: string[]; showReason: boolean }) {
  return (
    <div className="thin-scroll max-h-[480px] overflow-auto">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-ink text-white dark:bg-zinc-900">
          <tr>
            <th className="sticky left-0 z-20 border-r border-ink/40 bg-ink px-3 py-2 text-left font-mono text-xs font-normal text-white/50 dark:bg-zinc-900 dark:border-zinc-700">
              #
            </th>
            {showReason && (
              <th className="whitespace-nowrap border-r border-white/10 px-3 py-2 text-left font-mono text-xs font-medium dark:border-zinc-700">
                reason
              </th>
            )}
            {fields.map((f) => (
              <th key={f} className="whitespace-nowrap border-r border-white/10 px-3 py-2 text-left font-mono text-xs font-medium last:border-r-0 dark:border-zinc-700">
                {f}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sourceIndex} className="odd:bg-white even:bg-[#FAFAFA] dark:odd:bg-zinc-950 dark:even:bg-zinc-900">
              <td className="sticky left-0 z-10 border-b border-r border-line bg-inherit px-3 py-1.5 font-mono text-xs text-muted dark:border-zinc-800 dark:text-zinc-500">
                {r.sourceIndex + 1}
              </td>
              {showReason && (
                <td className="whitespace-nowrap border-b border-r border-line px-3 py-1.5 font-mono text-xs text-bad dark:border-zinc-800">
                  {r.reason || '—'}
                </td>
              )}
              {fields.map((f) => (
                <td key={f} className="whitespace-nowrap border-b border-r border-line px-3 py-1.5 text-ink last:border-r-0 dark:border-zinc-800 dark:text-zinc-300">
                  {r.fields[f] || <span className="text-line dark:text-zinc-700">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Windowed/virtualized table for large datasets using native scroll + absolute positioning
function VirtualizedTable({ rows, fields, showReason }: { rows: TableRow[]; fields: string[]; showReason: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = rows.length * ROW_HEIGHT;
  const viewHeight = VISIBLE_ROWS * ROW_HEIGHT;

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 3);
  const endIndex = Math.min(rows.length - 1, startIndex + VISIBLE_ROWS + 6);
  const visibleRows = rows.slice(startIndex, endIndex + 1);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div className="thin-scroll overflow-x-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex min-w-max bg-ink text-white dark:bg-zinc-900">
        <div className="w-12 shrink-0 border-r border-white/20 px-3 py-2 font-mono text-xs font-normal text-white/50 dark:border-zinc-700">#</div>
        {showReason && (
          <div className="w-48 shrink-0 border-r border-white/10 px-3 py-2 font-mono text-xs font-medium dark:border-zinc-700">reason</div>
        )}
        {fields.map((f) => (
          <div key={f} className="w-40 shrink-0 border-r border-white/10 px-3 py-2 font-mono text-xs font-medium last:border-r-0 dark:border-zinc-700">{f}</div>
        ))}
      </div>

      {/* Scrollable virtualized body */}
      <div
        ref={containerRef}
        style={{ height: viewHeight, overflowY: 'auto' }}
        onScroll={onScroll}
        className="relative thin-scroll"
      >
        {/* Spacer that gives the scroll container full height */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleRows.map((r, i) => {
            const absoluteIndex = startIndex + i;
            return (
              <div
                key={r.sourceIndex}
                style={{ position: 'absolute', top: absoluteIndex * ROW_HEIGHT, width: '100%', height: ROW_HEIGHT }}
                className={`flex items-center min-w-max ${absoluteIndex % 2 === 0 ? 'bg-white dark:bg-zinc-950' : 'bg-[#FAFAFA] dark:bg-zinc-900'}`}
              >
                <div className="w-12 shrink-0 border-r border-b border-line px-3 font-mono text-xs text-muted dark:border-zinc-800 dark:text-zinc-500">
                  {r.sourceIndex + 1}
                </div>
                {showReason && (
                  <div className="w-48 shrink-0 truncate border-r border-b border-line px-3 font-mono text-xs text-bad dark:border-zinc-800" title={r.reason}>
                    {r.reason || '—'}
                  </div>
                )}
                {fields.map((f) => (
                  <div
                    key={f}
                    className="w-40 shrink-0 truncate border-r border-b border-line px-3 text-sm text-ink last:border-r-0 dark:border-zinc-800 dark:text-zinc-300"
                    title={r.fields[f]}
                  >
                    {r.fields[f] || <span className="text-line dark:text-zinc-700">—</span>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ResultsTable({
  result,
  selectedFields,
}: {
  result: ImportResult;
  selectedFields: Set<string>;
}) {
  const [tab, setTab] = useState<'imported' | 'skipped'>('imported');
  const fields = [...selectedFields];

  const importedRows: TableRow[] = result.imported.map((r) => ({
    sourceIndex: r.sourceIndex,
    fields: r.fields as Record<string, string>,
  }));

  const skippedRows: TableRow[] = result.skipped.map((r) => ({
    sourceIndex: r.sourceIndex,
    reason: r.reason,
    fields: r.fields as Record<string, string>,
  }));

  const activeRows = tab === 'imported' ? importedRows : skippedRows;
  const useVirtualized = activeRows.length > VIRTUALIZE_THRESHOLD;

  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total rows" value={result.totalRows} tone="ink" />
        <StatCard label="Imported" value={result.totalImported} tone="good" />
        <StatCard label="Skipped" value={result.totalSkipped} tone="bad" />
      </div>

      {result.globalError && (
        <div className="mt-6 flex items-start gap-2 border border-bad/30 bg-red-50 px-4 py-3 text-sm text-bad dark:bg-red-950/30 dark:border-red-900/50">
          <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          <div>
            <strong>Mapping Engine Error:</strong> We could not process some batches due to an upstream service error (check your API quotas/keys).
            <details className="mt-1 cursor-pointer text-xs opacity-80">
              <summary>Technical Details</summary>
              <div className="mt-2 whitespace-pre-wrap font-mono">{result.globalError}</div>
            </details>
          </div>
        </div>
      )}

      {useVirtualized && (
        <div className="mt-4 flex items-center gap-2 border border-accent/30 bg-accent/5 px-3 py-2 font-mono text-xs text-accent">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          Virtualized rendering active — {activeRows.length} rows displayed efficiently
        </div>
      )}

      <div className="mt-4 flex border-b border-line font-mono text-xs uppercase tracking-wide dark:border-zinc-800">
        <button
          onClick={() => setTab('imported')}
          className={`border-b-2 px-4 py-2 ${
            tab === 'imported'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          Imported ({result.totalImported})
        </button>
        <button
          onClick={() => setTab('skipped')}
          className={`border-b-2 px-4 py-2 ${
            tab === 'skipped'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          Skipped ({result.totalSkipped})
        </button>
      </div>

      <div className="border border-t-0 border-line dark:border-zinc-800">
        {tab === 'imported' ? (
          importedRows.length === 0 ? (
            <EmptyState message="No records were successfully mapped." />
          ) : useVirtualized ? (
            <VirtualizedTable rows={importedRows} fields={fields} showReason={false} />
          ) : (
            <StandardTable rows={importedRows} fields={fields} showReason={false} />
          )
        ) : skippedRows.length === 0 ? (
          <EmptyState message="Nothing was skipped — every row had an email or mobile number." />
        ) : useVirtualized ? (
          <VirtualizedTable rows={skippedRows} fields={fields} showReason={true} />
        ) : (
          <StandardTable rows={skippedRows} fields={fields} showReason={true} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="px-4 py-10 text-center text-sm text-muted dark:text-zinc-500">{message}</div>;
}
