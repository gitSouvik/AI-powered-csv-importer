'use client';

import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { UploadCloud, FileWarning } from 'lucide-react';
import { sampleCsvUrl } from '@/lib/api';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export default function Dropzone({
  onFileAccepted,
}: {
  onFileAccepted: (file: File) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) {
        const first = rejections[0];
        if (first.errors.some((e) => e.code === 'file-too-large')) {
          setError('File is larger than 5MB. Please split it and try again.');
        } else if (first.errors.some((e) => e.code === 'file-invalid-type')) {
          setError('Only .csv files are supported.');
        } else {
          setError('That file could not be accepted.');
        }
        return;
      }
      setError(null);
      if (accepted[0]) onFileAccepted(accepted[0]);
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_SIZE_BYTES,
    maxFiles: 1,
    accept: { 'text/csv': ['.csv'] },
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`group relative flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed px-6 py-16 text-center transition-colors ${
          isDragActive
            ? 'border-accent bg-accent/5'
            : 'border-zinc-800 hover:border-accent bg-zinc-900/30'
        }`}
      >
        <input {...getInputProps()} aria-label="Upload CSV file" />
        <UploadCloud
          size={32}
          strokeWidth={1.5}
          className={isDragActive ? 'text-accent' : 'text-zinc-600 group-hover:text-accent'}
        />
        <div>
          <p className="text-base font-medium text-zinc-200">
            Drop your CSV file here
          </p>
          <p className="mt-1 text-sm text-zinc-500">or click to browse files</p>
        </div>
        <span className="font-mono text-xs uppercase tracking-wide text-zinc-600">
          Supported file: .csv (max 5MB)
        </span>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-bad">
          <FileWarning size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-zinc-600">
        <span>
          Required headers: created_at, name, email, country_code,
          mobile_without_country_code, company, city, state, country,
          lead_owner, crm_status, crm_note, data_source, possession_time,
          description
        </span>
        <a
          href={sampleCsvUrl()}
          className="whitespace-nowrap border border-zinc-700 px-2 py-1 text-zinc-400 hover:border-accent hover:text-accent"
          download
        >
          ↓ sample.csv
        </a>
      </div>
    </div>
  );
}
