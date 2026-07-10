const { parseCsv, chunkRows } = require('./csvService');
const { extractBatch } = require('./aiService');
const { validateRecord } = require('./validationService');
const { BATCH_SIZE } = require('../config/constants');

/**
 * Runs the full CSV -> CRM pipeline for one uploaded file.
 *
 * @param {string} csvText raw CSV file contents
 * @param {(update: object) => void} onProgress called after each batch
 *   completes, so the route layer can stream progress to the client.
 */
async function runImport(csvText, onProgress = () => {}) {
  const { rows, errors: parseErrors } = parseCsv(csvText);

  if (rows.length === 0) {
    return {
      totalRows: 0,
      totalImported: 0,
      totalSkipped: 0,
      imported: [],
      skipped: [],
      parseErrors,
    };
  }

  const batches = chunkRows(rows, BATCH_SIZE);
  const imported = [];
  const skipped = [];
  let globalBatchError = null;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      const aiResults = await extractBatch(batch);
      const byRowId = new Map(aiResults.map((r) => [r.row_id, r]));

      for (const { sourceIndex } of batch) {
        const aiResult = byRowId.get(sourceIndex);
        if (!aiResult) {
          skipped.push({
            sourceIndex,
            reason: 'no_ai_result_for_row',
            fields: {},
          });
          continue;
        }
        const { valid, reason, fields } = validateRecord(aiResult.fields);
        if (valid) {
          imported.push({ sourceIndex, fields });
        } else {
          skipped.push({ sourceIndex, reason, fields });
        }
      }
    } catch (err) {
      // A whole batch failed even after retries inside extractBatch -
      // don't fail the entire import, skip just this batch's rows so
      // the rest of the file still gets processed.
      console.error('[importPipeline] batch failed:', err.message);
      globalBatchError = err.message;
      for (const { sourceIndex } of batch) {
        skipped.push({
          sourceIndex,
          reason: '',
          fields: {},
        });
      }
    }

    onProgress({
      batchIndex: i + 1,
      totalBatches: batches.length,
      rowsProcessed: Math.min((i + 1) * BATCH_SIZE, rows.length),
      totalRows: rows.length,
    });
  }

  imported.sort((a, b) => a.sourceIndex - b.sourceIndex);
  skipped.sort((a, b) => a.sourceIndex - b.sourceIndex);

  return {
    totalRows: rows.length,
    totalImported: imported.length,
    totalSkipped: skipped.length,
    imported,
    skipped,
    parseErrors,
    globalError: globalBatchError,
  };
}

module.exports = { runImport };
