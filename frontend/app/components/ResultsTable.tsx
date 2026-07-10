'use client';

import { useState } from 'react';
import type { ImportResult } from '@/lib/types';

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'accent' | 'good' | 'bad' | 'ink' }) {
  const toneClass = {
    accent: 'text-accent',
    good: 'text-good',
    bad: 'text-bad',
    ink: 'text-ink',
  }[tone];

  return (
    <div className="border border-line px-4 py-3">
      <div className="font-mono text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-1 font-display text-2xl font-medium ${toneClass}`}>{value}</div>
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

  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total rows" value={result.totalRows} tone="ink" />
        <StatCard label="Imported" value={result.totalImported} tone="good" />
        <StatCard label="Skipped" value={result.totalSkipped} tone="bad" />
      </div>

      <div className="mt-6 flex border-b border-line font-mono text-xs uppercase tracking-wide">
        <button
          onClick={() => setTab('imported')}
          className={`border-b-2 px-4 py-2 ${
            tab === 'imported' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          Imported ({result.totalImported})
        </button>
        <button
          onClick={() => setTab('skipped')}
          className={`border-b-2 px-4 py-2 ${
            tab === 'skipped' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          Skipped ({result.totalSkipped})
        </button>
      </div>

      <div className="border border-t-0 border-line">
        <div className="thin-scroll max-h-[480px] overflow-auto">
          {tab === 'imported' ? (
            result.imported.length === 0 ? (
              <EmptyState message="No records were successfully mapped." />
            ) : (
              <table className="w-full min-w-max border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-ink text-white">
                  <tr>
                    <th className="sticky left-0 z-20 border-r border-ink/40 bg-ink px-3 py-2 text-left font-mono text-xs font-normal text-white/50">
                      #
                    </th>
                    {fields.map((f) => (
                      <th
                        key={f}
                        className="whitespace-nowrap border-r border-white/10 px-3 py-2 text-left font-mono text-xs font-medium last:border-r-0"
                      >
                        {f}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.imported.map((r) => (
                    <tr key={r.sourceIndex} className="odd:bg-white even:bg-[#FAFAFA]">
                      <td className="sticky left-0 z-10 border-b border-r border-line bg-inherit px-3 py-1.5 font-mono text-xs text-muted">
                        {r.sourceIndex + 1}
                      </td>
                      {fields.map((f) => (
                        <td
                          key={f}
                          className="whitespace-nowrap border-b border-r border-line px-3 py-1.5 text-ink last:border-r-0"
                        >
                          {(r.fields as Record<string, string>)[f] || <span className="text-line">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : result.skipped.length === 0 ? (
            <EmptyState message="Nothing was skipped - every row had an email or mobile number." />
          ) : (
            <table className="w-full min-w-max border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-ink text-white">
                <tr>
                  <th className="sticky left-0 z-20 border-r border-ink/40 bg-ink px-3 py-2 text-left font-mono text-xs font-normal text-white/50">
                    #
                  </th>
                  <th className="whitespace-nowrap border-r border-white/10 px-3 py-2 text-left font-mono text-xs font-medium">
                    reason
                  </th>
                  {fields.map((f) => (
                    <th
                      key={f}
                      className="whitespace-nowrap border-r border-white/10 px-3 py-2 text-left font-mono text-xs font-medium last:border-r-0"
                    >
                      {f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.skipped.map((r) => (
                  <tr key={r.sourceIndex} className="odd:bg-white even:bg-[#FAFAFA]">
                    <td className="sticky left-0 z-10 border-b border-r border-line bg-inherit px-3 py-1.5 font-mono text-xs text-muted">
                      {r.sourceIndex + 1}
                    </td>
                    <td className="whitespace-nowrap border-b border-r border-line px-3 py-1.5 font-mono text-xs text-bad">
                      {r.reason}
                    </td>
                    {fields.map((f) => (
                      <td
                        key={f}
                        className="whitespace-nowrap border-b border-r border-line px-3 py-1.5 text-ink last:border-r-0"
                      >
                        {(r.fields as Record<string, string>)[f] || <span className="text-line">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="px-4 py-10 text-center text-sm text-muted">{message}</div>;
}
