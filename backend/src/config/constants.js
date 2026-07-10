/**
 * Central configuration for the CSV -> CRM extraction pipeline.
 * Keeping these as named constants (rather than scattering magic
 * strings across services) makes the allowed-value lists and batching
 * behaviour easy to audit and change in one place.
 */

const CRM_FIELDS = [
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
];

const ALLOWED_CRM_STATUS = [
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
];

const ALLOWED_DATA_SOURCE = [
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
];

module.exports = {
  CRM_FIELDS,
  ALLOWED_CRM_STATUS,
  ALLOWED_DATA_SOURCE,

  // How many source rows are sent to the mapping engine in a single request.
  // Smaller batches -> more resilient to partial failures & easier to
  // keep the model's output well-formed; larger batches -> fewer calls.
  BATCH_SIZE: Number(process.env.BATCH_SIZE) || 15,

  // Retry behaviour for a failing batch call.
  MAX_RETRIES: Number(process.env.MAX_RETRIES) || 3,
  RETRY_BASE_DELAY_MS: Number(process.env.RETRY_BASE_DELAY_MS) || 800,

  MAX_UPLOAD_SIZE_BYTES: 5 * 1024 * 1024, // 5MB, matches frontend copy

  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
};
