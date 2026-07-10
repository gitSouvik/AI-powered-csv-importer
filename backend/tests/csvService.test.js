const { parseCsv, chunkRows } = require('../src/services/csvService');

describe('parseCsv', () => {
  test('parses rows keyed by whatever headers the file actually has', () => {
    const csv = 'Full Name,Email Address\nJohn Doe,john@example.com';
    const { rows, headers } = parseCsv(csv);
    expect(headers).toEqual(['Full Name', 'Email Address']);
    expect(rows).toEqual([{ 'Full Name': 'John Doe', 'Email Address': 'john@example.com' }]);
  });

  test('drops fully-blank rows', () => {
    const csv = 'name,email\nJohn,j@x.com\n,\n';
    const { rows } = parseCsv(csv);
    expect(rows).toHaveLength(1);
  });

  test('trims whitespace from headers and values', () => {
    const csv = ' name , email \n John Doe , j@x.com ';
    const { rows, headers } = parseCsv(csv);
    expect(headers).toEqual(['name', 'email']);
    expect(rows[0].name).toBe('John Doe');
  });
});

describe('chunkRows', () => {
  test('splits rows into batches of the given size, preserving order', () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({ id: i }));
    const batches = chunkRows(rows, 2);
    expect(batches).toHaveLength(3);
    expect(batches[0].map((b) => b.sourceIndex)).toEqual([0, 1]);
    expect(batches[2].map((b) => b.sourceIndex)).toEqual([4]);
  });
});
