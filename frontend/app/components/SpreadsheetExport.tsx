'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ExternalLink, Download, Sheet, FileSpreadsheet, Table2 } from 'lucide-react';
import type { ImportResult, CrmFieldKey } from '@/lib/types';

interface SpreadsheetExportProps {
  result: ImportResult;
  selectedFields: Set<string>;
}

type ExportTarget = 'google_sheets' | 'excel' | 'csv' | 'airtable' | 'notion';

const EXPORT_OPTIONS: { id: ExportTarget; label: string; icon: typeof Sheet; description: string }[] = [
  { id: 'google_sheets', label: 'Google Sheets', icon: Sheet, description: 'Open in browser' },
  { id: 'excel', label: 'Microsoft Excel', icon: FileSpreadsheet, description: 'Download .xlsx' },
  { id: 'csv', label: 'Download CSV', icon: Download, description: 'Raw CSV file' },
  { id: 'airtable', label: 'Airtable', icon: Table2, description: 'CSV import guide' },
];

function buildCsvContent(result: ImportResult, fields: string[]): string {
  const headers = fields.join(',');
  const rows = result.imported.map((r) =>
    fields
      .map((f) => {
        const val = (r.fields as Record<string, string>)[f] || '';
        // Escape commas and quotes
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      })
      .join(',')
  );
  return [headers, ...rows].join('\n');
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function openInGoogleSheets(csvContent: string) {
  // Encode CSV as a data URI and open the Google Sheets import URL
  const encoded = encodeURIComponent(csvContent);
  const dataUri = `data:text/csv;charset=utf-8,${encoded}`;
  // Download first, then open Google Sheets import (browser security prevents direct upload)
  downloadCsv(csvContent, 'crm_leads.csv');
  setTimeout(() => {
    window.open('https://sheets.new', '_blank');
  }, 400);
}

function buildXlsxLike(csvContent: string): Blob {
  // We can't build a real .xlsx without a library, so we output a CSV with .xlsx extension
  // which Excel opens natively
  return new Blob([csvContent], { type: 'application/vnd.ms-excel' });
}

export default function SpreadsheetExport({ result, selectedFields }: SpreadsheetExportProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ExportTarget>('google_sheets');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleExport() {
    const fields = [...selectedFields];
    const csvContent = buildCsvContent(result, fields);

    switch (selected) {
      case 'google_sheets':
        openInGoogleSheets(csvContent);
        break;
      case 'excel': {
        const blob = buildXlsxLike(csvContent);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'crm_leads.csv';
        a.click();
        URL.revokeObjectURL(url);
        break;
      }
      case 'csv':
        downloadCsv(csvContent, 'crm_leads.csv');
        break;
      case 'airtable':
        downloadCsv(csvContent, 'crm_leads.csv');
        setTimeout(() => {
          window.open('https://airtable.com/import/csv', '_blank');
        }, 400);
        break;
      case 'notion':
        downloadCsv(csvContent, 'crm_leads.csv');
        setTimeout(() => {
          window.open(
            'https://www.notion.so/help/guides/import-data-into-notion#importing-from-csv',
            '_blank'
          );
        }, 400);
        break;
    }
  }

  const currentOption = EXPORT_OPTIONS.find((o) => o.id === selected)!;
  const Icon = currentOption.icon;

  return (
    <div className="flex items-center gap-2" ref={dropdownRef}>
      {/* Open button */}
      <button
        onClick={handleExport}
        className="flex items-center gap-2 border border-accent bg-accent px-4 py-2 font-mono text-xs uppercase tracking-wide text-white transition-colors hover:bg-accent-hover"
      >
        <ExternalLink size={13} />
        Open in {currentOption.label}
      </button>

      {/* Dropdown trigger */}
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 border border-accent px-3 py-2 font-mono text-xs text-accent transition hover:bg-accent hover:text-white"
        >
          <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 w-52 border border-line bg-white shadow-lg">
            {EXPORT_OPTIONS.map((opt) => {
              const OptIcon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSelected(opt.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[#FAFAFA] ${
                    selected === opt.id ? 'bg-accent/5 text-accent' : 'text-ink'
                  }`}
                >
                  <OptIcon size={14} className="shrink-0" />
                  <div>
                    <div className="font-mono text-xs font-medium">{opt.label}</div>
                    <div className="font-mono text-[10px] text-muted">{opt.description}</div>
                  </div>
                  {selected === opt.id && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
