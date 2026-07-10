const {
  CRM_FIELDS,
  ALLOWED_CRM_STATUS,
  ALLOWED_DATA_SOURCE,
} = require('../config/constants');

/**
 * The model is asked to enforce these rules itself, but a production
 * system should never let the model be the sole authority over what
 * gets written to a CRM. This layer re-checks the hard rules
 * (allowed enums, the email/mobile skip criterion, date validity)
 * against the model's output and corrects or flags anything that
 * doesn't hold up, instead of trusting the "is_valid" flag
 * blindly.
 */
function normalizeFields(rawFields = {}) {
  const fields = {};
  for (const key of CRM_FIELDS) {
    const value = rawFields[key];
    fields[key] = typeof value === 'string' ? value.trim() : value || '';
  }
  return fields;
}

function isParseableDate(value) {
  if (!value) return true; // empty is allowed
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

/**
 * Validates and repairs a single extracted record.
 * Returns { valid: boolean, reason?: string, fields }
 */
function validateRecord(rawFields) {
  const fields = normalizeFields(rawFields);

  // Rule: crm_status must be one of the allowed enum values.
  if (fields.crm_status && !ALLOWED_CRM_STATUS.includes(fields.crm_status)) {
    fields.crm_note = [fields.crm_note, `(unmapped status: ${fields.crm_status})`]
      .filter(Boolean)
      .join(' ');
    fields.crm_status = '';
  }

  // Rule: data_source must be one of the allowed enum values, else blank.
  if (fields.data_source && !ALLOWED_DATA_SOURCE.includes(fields.data_source)) {
    fields.data_source = '';
  }

  // Rule: created_at must be usable by `new Date(...)`.
  if (!isParseableDate(fields.created_at)) {
    fields.crm_note = [fields.crm_note, `(original date: ${fields.created_at})`]
      .filter(Boolean)
      .join(' ');
    fields.created_at = '';
  }

  // Never let a literal newline leak into a field (keeps downstream
  // CSV export safe even though we transport JSON internally).
  for (const key of CRM_FIELDS) {
    if (typeof fields[key] === 'string' && fields[key].includes('\n')) {
      fields[key] = fields[key].replace(/\r?\n/g, '\\n');
    }
  }

  // Authoritative skip rule: a record with neither email nor mobile
  // must be skipped, regardless of what the model decided.
  const hasEmail = Boolean(fields.email && fields.email.includes('@'));
  const hasMobile = Boolean(
    fields.mobile_without_country_code &&
      fields.mobile_without_country_code.replace(/\D/g, '').length >= 6
  );

  if (!hasEmail && !hasMobile) {
    return { valid: false, reason: 'missing_email_and_mobile', fields };
  }

  return { valid: true, fields };
}

module.exports = { validateRecord, normalizeFields };
