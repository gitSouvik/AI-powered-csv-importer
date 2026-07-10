export const CRM_FIELDS = [
  'created_at',
  'name',
  'email',
  'country_code',
  'mobile_without_country_code',
  'company',
  'city',
  'state',
  'country',
  'lead_owner',
  'crm_status',
  'crm_note',
  'data_source',
  'possession_time',
  'description',
] as const;

export type CrmFieldKey = (typeof CRM_FIELDS)[number];

export type CrmRecord = Record<CrmFieldKey, string>;

export interface ParsedRow {
  sourceIndex: number;
  fields: CrmRecord;
}

export interface SkippedRow {
  sourceIndex: number;
  reason: string;
  fields: Partial<CrmRecord>;
}

export interface ImportResult {
  totalRows: number;
  totalImported: number;
  totalSkipped: number;
  imported: ParsedRow[];
  skipped: SkippedRow[];
  parseErrors?: unknown[];
  globalError?: string | null;
}

export interface ImportProgress {
  batchIndex: number;
  totalBatches: number;
  rowsProcessed: number;
  totalRows: number;
}

export type AppStage = 'upload' | 'preview' | 'processing' | 'results';
