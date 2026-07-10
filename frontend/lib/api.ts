import type { ImportProgress, ImportResult } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Uploads the CSV file and consumes the backend's Server-Sent Events
 * stream, calling onProgress as each batch completes and
 * resolving with the final ImportResult once the "done" event
 * arrives. Implemented with a raw fetch + ReadableStream reader
 * (rather than the browser EventSource API) because EventSource
 * cannot send a multipart POST body.
 */
export async function importCsv(
  file: File,
  onProgress: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/csv/import`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => '');
    let message = `Import failed (${response.status})`;
    try {
      message = JSON.parse(text).error || message;
    } catch {
      /* not JSON, use default message */
    }
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  return new Promise<ImportResult>((resolve, reject) => {
    (async () => {
      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const chunk of events) {
            const eventMatch = chunk.match(/^event: (.+)$/m);
            const dataMatch = chunk.match(/^data: (.+)$/m);
            if (!eventMatch || !dataMatch) continue;

            const eventName = eventMatch[1].trim();
            const payload = JSON.parse(dataMatch[1]);

            if (eventName === 'progress') {
              onProgress(payload as ImportProgress);
            } else if (eventName === 'done') {
              resolve(payload as ImportResult);
              return;
            } else if (eventName === 'error') {
              reject(new Error(payload.message || 'Import failed'));
              return;
            }
          }
        }
        reject(new Error('Stream ended without a completion event'));
      } catch (err) {
        reject(err as Error);
      }
    })();
  });
}

export function sampleCsvUrl(): string {
  return `${API_BASE}/api/csv/sample`;
}
