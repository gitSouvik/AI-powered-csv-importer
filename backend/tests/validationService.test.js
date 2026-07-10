const { validateRecord } = require('../src/services/validationService');

function baseFields(overrides = {}) {
  return {
    created_at: '2026-05-13 14:20:48',
    name: 'John Doe',
    email: 'john@example.com',
    country_code: '+91',
    mobile_without_country_code: '9876543210',
    company: '',
    city: '',
    state: '',
    country: '',
    lead_owner: '',
    crm_status: 'GOOD_LEAD_FOLLOW_UP',
    crm_note: '',
    data_source: '',
    possession_time: '',
    description: '',
    ...overrides,
  };
}

describe('validateRecord', () => {
  test('accepts a well-formed record', () => {
    const { valid, fields } = validateRecord(baseFields());
    expect(valid).toBe(true);
    expect(fields.email).toBe('john@example.com');
  });

  test('skips a record with neither email nor mobile', () => {
    const { valid, reason } = validateRecord(
      baseFields({ email: '', mobile_without_country_code: '' })
    );
    expect(valid).toBe(false);
    expect(reason).toBe('missing_email_and_mobile');
  });

  test('keeps a record that has only a mobile number', () => {
    const { valid } = validateRecord(baseFields({ email: '' }));
    expect(valid).toBe(true);
  });

  test('keeps a record that has only an email', () => {
    const { valid } = validateRecord(
      baseFields({ mobile_without_country_code: '' })
    );
    expect(valid).toBe(true);
  });

  test('blanks out an invalid crm_status instead of rejecting the row', () => {
    const { valid, fields } = validateRecord(
      baseFields({ crm_status: 'NOT_A_REAL_STATUS' })
    );
    expect(valid).toBe(true);
    expect(fields.crm_status).toBe('');
    expect(fields.crm_note).toMatch(/unmapped status/);
  });

  test('blanks out an invalid data_source', () => {
    const { fields } = validateRecord(
      baseFields({ data_source: 'some_random_project' })
    );
    expect(fields.data_source).toBe('');
  });

  test('keeps a valid data_source', () => {
    const { fields } = validateRecord(baseFields({ data_source: 'eden_park' }));
    expect(fields.data_source).toBe('eden_park');
  });

  test('blanks an unparseable created_at date', () => {
    const { fields } = validateRecord(baseFields({ created_at: 'not-a-date' }));
    expect(fields.created_at).toBe('');
    expect(fields.crm_note).toMatch(/original date/);
  });

  test('escapes literal newlines in text fields', () => {
    const { fields } = validateRecord(
      baseFields({ crm_note: 'line one\nline two' })
    );
    expect(fields.crm_note).toBe('line one\\nline two');
  });
});
