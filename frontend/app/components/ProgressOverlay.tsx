'use client';

import type { ImportProgress } from '@/lib/types';

export default function ProgressOverlay({ progress }: { progress: ImportProgress | null }) {
  const pct = progress ? Math.round((progress.rowsProcessed / progress.totalRows) * 100) : 0;

  return (
    <div className="border border-line px-6 py-10">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wide text-muted">
          <span>Mapping rows to CRM fields</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-3 h-2 w-full border border-line bg-white">
          <div
            className="h-full bg-accent transition-all duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 text-center font-mono text-xs text-muted">
          {progress
            ? `Batch ${progress.batchIndex} / ${progress.totalBatches} · ${progress.rowsProcessed} / ${progress.totalRows} rows`
            : 'Uploading file…'}
        </div>
      </div>
    </div>
  );
}
