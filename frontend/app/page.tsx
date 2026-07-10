'use client';

import { useCallback, useState } from 'react';
import Papa from 'papaparse';
import { RotateCcw, AlertTriangle } from 'lucide-react';

import Dropzone from './components/Dropzone';
import PreviewTable from './components/PreviewTable';
import ProgressOverlay from './components/ProgressOverlay';
import ResultsTable from './components/ResultsTable';
import HeaderSelector from './components/HeaderSelector';
import SpreadsheetExport from './components/SpreadsheetExport';
import GridMotif from './components/GridMotif';
import { importCsv } from '@/lib/api';
import { CRM_FIELDS } from '@/lib/types';
import type { AppStage, ImportProgress, ImportResult } from '@/lib/types';

export default function Home() {
  const [stage, setStage] = useState<AppStage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // All CRM fields selected by default
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(CRM_FIELDS));

  const handleFile = useCallback((f: File) => {
    setError(null);
    setFile(f);

    // Client-side only parse for the preview step. 
    // No backend call happens until the user confirms.
    Papa.parse(f, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (res) => {
        const fields = (res.meta.fields || []).map((h) => h.trim());
        const parsedRows = (res.data as Record<string, string>[]).filter((row) =>
          Object.values(row).some((v) => v && String(v).trim() !== '')
        );
        setHeaders(fields);
        setRows(parsedRows);
        setStage('preview');
      },
      error: (err) => {
        setError(`Could not read that CSV: ${err.message}`);
      },
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!file) return;
    setStage('processing');
    setProgress(null);
    setError(null);
    try {
      const res = await importCsv(file, setProgress);
      setResult(res);
      setStage('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed unexpectedly.');
      setStage('preview');
    }
  }, [file]);

  const reset = useCallback(() => {
    setStage('upload');
    setFile(null);
    setHeaders([]);
    setRows([]);
    setProgress(null);
    setResult(null);
    setError(null);
    setSelectedFields(new Set(CRM_FIELDS));
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <header className="mb-10 flex items-start justify-between border-b border-line pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-wide text-accent">
            GrowEasy · CRM Import
          </span>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink">
            CSV → CRM Importer
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Upload a lead export from anywhere — Facebook, Google Ads, a
            spreadsheet, another CRM — and smart mapping converts it into GrowEasy&apos;s
            lead schema automatically.
          </p>
        </div>
        <GridMotif className="mt-1 hidden h-16 w-16 shrink-0 sm:block" />
      </header>

      {error && (
        <div className="mb-6 flex items-start gap-2 border border-bad/30 bg-red-50 px-4 py-3 text-sm text-bad">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {stage === 'upload' && <Dropzone onFileAccepted={handleFile} />}

      {stage === 'preview' && (
        <div>
          {/* Split layout: 75% table left, 25% header selector right */}
          <div className="flex gap-4" style={{ minHeight: '460px' }}>
            {/* Left — 75% preview table */}
            <div className="flex-[3] min-w-0">
              <PreviewTable headers={headers} rows={rows} />
            </div>
            {/* Right — 25% field selector */}
            <div className="flex-[1] min-w-0" style={{ minWidth: '200px', maxWidth: '260px' }}>
              <HeaderSelector
                selected={selectedFields}
                onChange={setSelectedFields}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={reset}
              className="flex items-center gap-1.5 border border-line px-4 py-2 font-mono text-xs uppercase tracking-wide text-muted hover:border-ink hover:text-ink"
            >
              <RotateCcw size={14} /> choose a different file
            </button>
            <button
              onClick={handleConfirm}
              className="border border-accent bg-accent px-6 py-2 font-mono text-xs uppercase tracking-wide text-white transition-colors hover:bg-accent-hover"
            >
              Confirm import → run smart mapping
            </button>
          </div>
        </div>
      )}

      {stage === 'processing' && <ProgressOverlay progress={progress} />}

      {stage === 'results' && result && (
        <div>
          <ResultsTable result={result} selectedFields={selectedFields} />
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={reset}
              className="flex items-center gap-1.5 border border-line px-4 py-2 font-mono text-xs uppercase tracking-wide text-muted hover:border-ink hover:text-ink"
            >
              <RotateCcw size={14} /> import another file
            </button>
            <SpreadsheetExport result={result} selectedFields={selectedFields} />
          </div>
        </div>
      )}
    </main>
  );
}
