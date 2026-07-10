const Papa = require('papaparse');

/**
 * Parses raw CSV text into an array of row objects keyed by the CSV's
 * own header row. We deliberately do NOT assume any fixed set of
 * column names here - that mapping problem is handed to the smart mapping layer.
 *
 * @param {string} csvText
 * @returns {{ rows: Record<string, string>[], headers: string[], errors: any[] }}
 */
function parseCsv(csvText) {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
    transform: (value) => (typeof value === 'string' ? value.trim() : value),
  });

  const errors = (result.errors || []).filter(
    // Papaparse flags "TooFewFields"/"TooManyFields" on ragged rows;
    // we don't want to hard-fail the whole import over a stray blank
    // trailing column, so only surface fatal-type errors upstream.
    (e) => e.type !== 'FieldMismatch'
  );

  const rows = (result.data || []).filter((row) =>
    Object.values(row).some((v) => v !== '' && v !== null && v !== undefined)
  );

  return {
    rows,
    headers: result.meta && result.meta.fields ? result.meta.fields : [],
    errors,
  };
}

/**
 * Splits an array into fixed-size chunks, preserving original order.
 * Each row also carries its original index so results can be
 * re-associated with the source CSV row after batch processing.
 */
function chunkRows(rows, batchSize) {
  const batches = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(
      rows.slice(i, i + batchSize).map((row, idx) => ({
        sourceIndex: i + idx,
        row,
      }))
    );
  }
  return batches;
}

module.exports = { parseCsv, chunkRows };
