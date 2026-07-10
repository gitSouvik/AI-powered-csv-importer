const { GoogleGenerativeAI } = require('@google/generative-ai');
const {
  CRM_FIELDS,
  ALLOWED_CRM_STATUS,
  ALLOWED_DATA_SOURCE,
  MAX_RETRIES,
  RETRY_BASE_DELAY_MS,
  GEMINI_MODEL,
} = require('../config/constants');

let genAI = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY is not set. Add it to your .env file (see .env.example).'
    );
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Builds the extraction prompt for a single batch of raw CSV rows.
 *
 * Design notes:
 *  - The model is given the *exact* target schema, not a vague
 *    description, so it can't invent field names.
 *  - Every business rule is encoded explicitly and numbered.
 *  - The model returns ONLY a JSON array - one object per input row,
 *    in the same order - so we can zip results back to source rows
 *    positionally even when a row is later flagged as skippable.
 *  - Skip/validity decisions are also cross-checked in code
 *    (validationService) rather than trusted blindly, since the model's
 *    output is a strong prior, not the final authority.
 */
function buildPrompt(batchRows) {
  const schema = CRM_FIELDS.map((f) => `- ${f}`).join('\n');
  const rowsPayload = batchRows.map(({ sourceIndex, row }) => ({
    row_id: sourceIndex,
    fields: row,
  }));

  return `You are a data-mapping engine that converts messy, arbitrarily-formatted CRM lead exports into a fixed target schema. You will receive raw CSV rows exported from many different tools (Facebook Lead Ads, Google Ads, generic spreadsheets, custom CRMs, etc). Column names and layouts vary between sources; your job is to figure out which source column(s) correspond to which target field, using semantic understanding, not exact string matching.

TARGET SCHEMA (use exactly these field names, nothing else):
${schema}

RULES:
1. crm_status must be exactly one of: ${ALLOWED_CRM_STATUS.join(', ')}. If nothing in the row confidently matches one of these, leave crm_status as an empty string.
2. data_source must be exactly one of: ${ALLOWED_DATA_SOURCE.join(', ')}. If nothing matches confidently, leave data_source as an empty string. Do not guess.
3. created_at must be a string parseable by JavaScript's "new Date(string)". Prefer ISO-like "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DD". If no date is present, leave it as an empty string.
4. Put remarks, follow-up notes, extra comments, extra phone numbers, extra email addresses, or any useful information that doesn't fit another field into crm_note.
5. If a row has multiple email addresses, use only the first as "email" and append the rest into crm_note (e.g. "Additional email: x@y.com"). Do the same for multiple phone numbers ("Additional phone: ...").
6. Never put literal newline characters inside any field value. If you need to represent a line break inside a value (e.g. inside crm_note), use the two characters backslash-n ("\\n") instead of an actual newline, so the value stays safe to store as a single CSV/JSON field.
7. Split any phone number you find into "country_code" (e.g. "+91") and "mobile_without_country_code" (digits only, no spaces/dashes). If no country code is present in the source data, infer "+91" only if other rows/context strongly imply India; otherwise leave country_code empty.
8. is_valid must be false ONLY if the row has neither a usable email NOR a usable mobile number anywhere in its source fields; otherwise true. This is the single skip criterion - do not skip rows for any other reason (missing name, missing company, etc. are all fine).
9. Do not fabricate data that is not present or reasonably inferable from the row.

INPUT ROWS (JSON array, each item has a "row_id" you must echo back unchanged, and "fields" which are the raw source columns for that row exactly as they appeared in the CSV):
${JSON.stringify(rowsPayload, null, 2)}

OUTPUT FORMAT:
Return ONLY a JSON array (no markdown fences, no commentary, no surrounding text), with exactly one object per input row, in the same order as the input, each shaped as:
{
  "row_id": <same integer you were given>,
  "is_valid": <boolean>,
  "fields": {
    "created_at": "", "name": "", "email": "", "country_code": "",
    "mobile_without_country_code": "", "company": "", "city": "",
    "state": "", "country": "", "lead_owner": "", "crm_status": "",
    "crm_note": "", "data_source": "", "possession_time": "", "description": ""
  }
}
All 15 keys must always be present under "fields" even when empty (use "").`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Strips accidental markdown code fences and extracts the first
 * top-level JSON array from a model response. Models occasionally
 * wrap JSON in ```json ... ``` even when told not to.
 */
function extractJsonArray(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('[');
  const end = candidate.lastIndexOf(']');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('Model response did not contain a JSON array');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

async function callModel(prompt) {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.1,
    },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Runs one batch through the model, retrying on transient failures
 * (rate limits, network hiccups, malformed JSON) with exponential
 * backoff. Throws only after all retries are exhausted, so the
 * caller can decide how to surface a permanently-failed batch.
 */
async function extractBatch(batchRows) {
  const prompt = buildPrompt(batchRows);
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const text = await callModel(prompt);
      const parsed = extractJsonArray(text);
      if (!Array.isArray(parsed)) {
        throw new Error('Model response was not a JSON array');
      }
      return parsed;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
      }
    }
  }
  throw new Error(
    `Extraction failed after ${MAX_RETRIES + 1} attempts: ${lastError.message}`
  );
}

module.exports = { buildPrompt, extractBatch, extractJsonArray };
