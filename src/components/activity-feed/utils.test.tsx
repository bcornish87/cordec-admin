import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { render } from '@testing-library/react';
import {
  timeAgo,
  formatDateTime,
  formatCurrency,
  statusBadge,
  DetailField,
  FORM_TYPE_CONFIG,
} from './utils';

describe('timeAgo', () => {
  const NOW = new Date('2025-03-05T12:00:00Z').getTime();

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('returns "just now" under 60s', () => {
    expect(timeAgo(new Date(NOW - 30_000).toISOString())).toBe('just now');
  });

  it('returns minutes for <1h', () => {
    expect(timeAgo(new Date(NOW - 5 * 60_000).toISOString())).toBe('5m ago');
  });

  it('returns hours for <24h', () => {
    expect(timeAgo(new Date(NOW - 3 * 3_600_000).toISOString())).toBe('3h ago');
  });

  it('returns days for <7d', () => {
    expect(timeAgo(new Date(NOW - 2 * 86_400_000).toISOString())).toBe('2d ago');
  });

  it('returns short date for >=7d', () => {
    const oldIso = new Date(NOW - 30 * 86_400_000).toISOString();
    const result = timeAgo(oldIso);
    expect(result).not.toMatch(/ago|now/);
    // should contain some date-ish characters
    expect(result.length).toBeGreaterThan(2);
  });
});

describe('formatDateTime', () => {
  it('returns em-dash for null', () => {
    expect(formatDateTime(null)).toBe('—');
  });

  it('formats ISO to en-GB date+time', () => {
    const result = formatDateTime('2025-03-05T12:30:00Z');
    expect(result).toMatch(/2025/);
    expect(result).toMatch(/:/);
  });
});

describe('formatCurrency', () => {
  it('returns em-dash for null', () => {
    expect(formatCurrency(null)).toBe('—');
  });

  it('formats to £ with 2 decimals', () => {
    expect(formatCurrency(0)).toBe('£0.00');
    expect(formatCurrency(99.5)).toBe('£99.50');
    expect(formatCurrency(1234)).toBe('£1234.00');
  });
});

describe('statusBadge', () => {
  it('returns null for null status', () => {
    expect(statusBadge(null)).toBeNull();
  });

  it('renders badge with capitalised text', () => {
    const { getByText } = render(<>{statusBadge('pending')}</>);
    expect(getByText('Pending')).toBeInTheDocument();
  });

  it('renders for each recognised state', () => {
    for (const status of ['pending', 'submitted', 'approved', 'completed', 'paid', 'flagged', 'rejected', 'other']) {
      const { container } = render(<>{statusBadge(status)}</>);
      expect(container.textContent?.toLowerCase()).toContain(status.slice(0, 3));
    }
  });
});

describe('DetailField', () => {
  it('renders label and value', () => {
    const { getByText } = render(<dl><DetailField label="Name" value="Alice" /></dl>);
    expect(getByText('Name')).toBeInTheDocument();
    expect(getByText('Alice')).toBeInTheDocument();
  });

  it('returns null for null value', () => {
    const { container } = render(<dl><DetailField label="Name" value={null} /></dl>);
    expect(container.querySelector('dt')).toBeNull();
  });

  it('returns null for empty string', () => {
    const { container } = render(<dl><DetailField label="Name" value="" /></dl>);
    expect(container.querySelector('dt')).toBeNull();
  });

  it('returns null for em-dash', () => {
    const { container } = render(<dl><DetailField label="Name" value="—" /></dl>);
    expect(container.querySelector('dt')).toBeNull();
  });

  it('renders numeric values', () => {
    const { getByText } = render(<dl><DetailField label="Count" value={42} /></dl>);
    expect(getByText('42')).toBeInTheDocument();
  });
});

describe('FORM_TYPE_CONFIG', () => {
  it('has an entry for every FormType', () => {
    for (const t of ['Issue Report', 'Hourly Instruction', 'Sign Off', 'Quality Report', 'Invoice'] as const) {
      expect(FORM_TYPE_CONFIG[t]).toBeDefined();
      expect(FORM_TYPE_CONFIG[t].icon).toBeTruthy();
      expect(FORM_TYPE_CONFIG[t].colour).toMatch(/^text-/);
    }
  });
});
