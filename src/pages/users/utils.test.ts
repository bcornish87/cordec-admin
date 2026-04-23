import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  capitalize,
  formatPhone,
  formatPostCode,
  fullName,
  formatDate,
  formatDateTime,
} from './utils';
import type { UserRow } from './types';

describe('formatCurrency', () => {
  it('returns em-dash for null', () => {
    expect(formatCurrency(null)).toBe('—');
  });

  it('formats integer', () => {
    expect(formatCurrency(18)).toBe('£18.00');
  });

  it('formats decimal', () => {
    expect(formatCurrency(18.5)).toBe('£18.50');
  });

  it('rounds to 2 decimals', () => {
    expect(formatCurrency(18.005)).toBe('£18.00');
    expect(formatCurrency(18.996)).toBe('£19.00');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('£0.00');
  });
});

describe('capitalize', () => {
  it('returns empty string for null', () => {
    expect(capitalize(null)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(capitalize('')).toBe('');
  });

  it('capitalises first letter, lowercases rest', () => {
    expect(capitalize('john')).toBe('John');
    expect(capitalize('JOHN')).toBe('John');
    expect(capitalize('jOhN')).toBe('John');
  });

  it('handles single character', () => {
    expect(capitalize('j')).toBe('J');
  });
});

describe('formatPhone', () => {
  it('splits 11 digits as 5+6', () => {
    expect(formatPhone('07123456789')).toBe('07123 456789');
  });

  it('strips internal whitespace before splitting', () => {
    expect(formatPhone('07123 45 67 89')).toBe('07123 456789');
  });

  it('leaves short strings untouched (after stripping whitespace)', () => {
    expect(formatPhone('12345')).toBe('12345');
  });
});

describe('formatPostCode', () => {
  it('uppercases and inserts space before last 3', () => {
    expect(formatPostCode('sw1a1aa')).toBe('SW1A 1AA');
  });

  it('strips whitespace first', () => {
    expect(formatPostCode(' sw 1a 1aa ')).toBe('SW1A 1AA');
  });

  it('handles short codes without space insertion', () => {
    expect(formatPostCode('ab')).toBe('AB');
    expect(formatPostCode('abc')).toBe('ABC');
  });
});

function makeUser(overrides: Partial<UserRow>): UserRow {
  return {
    id: 'id', user_id: 'uid',
    first_name: null, last_name: null,
    email: null, phone: null, post_code: null,
    sort_code: null, account_number: null,
    national_insurance_number: null, utr_number: null,
    is_active: true, created_at: '', updated_at: '', last_seen_at: null,
    role: null, rate: null, role_id: null,
    notify_issue_report: false, notify_hourly_agreement: false,
    notify_sign_off: false, notify_quality_report: false, notify_invoice: false,
    ...overrides,
  };
}

describe('fullName', () => {
  it('joins first + last, both capitalised', () => {
    expect(fullName(makeUser({ first_name: 'john', last_name: 'smith' }))).toBe('John Smith');
  });

  it('returns placeholder when both null', () => {
    expect(fullName(makeUser({}))).toBe('(no name)');
  });

  it('returns single name when only first_name', () => {
    expect(fullName(makeUser({ first_name: 'alice' }))).toBe('Alice');
  });

  it('returns single name when only last_name', () => {
    expect(fullName(makeUser({ last_name: 'smith' }))).toBe('Smith');
  });
});

describe('formatDate', () => {
  it('returns em-dash for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('formats ISO date as day/month/year', () => {
    // 2025-03-05 → "5 Mar 2025" in en-GB
    expect(formatDate('2025-03-05T12:00:00Z')).toBe('5 Mar 2025');
  });
});

describe('formatDateTime', () => {
  it('returns em-dash for null', () => {
    expect(formatDateTime(null)).toBe('—');
  });

  it('includes day/month/year and hour/minute', () => {
    const result = formatDateTime('2025-03-05T12:30:00Z');
    // Output depends on timezone but will always include "2025" and a colon-separated time
    expect(result).toMatch(/2025/);
    expect(result).toMatch(/:/);
  });
});
