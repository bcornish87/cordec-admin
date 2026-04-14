import { describe, it, expect } from 'vitest';
import { cellKey, customKey, parsePastedGrid, cleanNumericInput } from './utils';

describe('cellKey', () => {
  it('joins plotId and templateId with a colon', () => {
    expect(cellKey('plot-1', 'tpl-2')).toBe('plot-1:tpl-2');
  });
});

describe('customKey', () => {
  it('uses c: prefix + type + name to avoid UUID collisions', () => {
    expect(customKey('plot-1', 'internal', 'Feature wall')).toBe('plot-1:c:internal:Feature wall');
  });

  it('handles variation type', () => {
    expect(customKey('abc', 'variation', 'Extra')).toBe('abc:c:variation:Extra');
  });
});

describe('parsePastedGrid', () => {
  it('returns empty array for empty string', () => {
    expect(parsePastedGrid('')).toEqual([]);
  });

  it('returns empty array for whitespace-only string', () => {
    expect(parsePastedGrid('\n\n')).toEqual([]);
  });

  it('parses single cell', () => {
    expect(parsePastedGrid('42')).toEqual([['42']]);
  });

  it('parses tab-separated row', () => {
    expect(parsePastedGrid('a\tb\tc')).toEqual([['a', 'b', 'c']]);
  });

  it('parses multi-row grid with LF', () => {
    expect(parsePastedGrid('a\tb\nc\td')).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('normalises CRLF to LF', () => {
    expect(parsePastedGrid('a\tb\r\nc\td')).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('normalises CR to LF', () => {
    expect(parsePastedGrid('a\tb\rc\td')).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('strips trailing newlines', () => {
    expect(parsePastedGrid('a\tb\n\n\n')).toEqual([['a', 'b']]);
  });

  it('preserves empty cells', () => {
    expect(parsePastedGrid('a\t\tb')).toEqual([['a', '', 'b']]);
  });
});

describe('cleanNumericInput', () => {
  it('returns empty string untouched', () => {
    expect(cleanNumericInput('')).toBe('');
  });

  it('strips commas', () => {
    expect(cleanNumericInput('1,234,567')).toBe('1234567');
  });

  it('strips pound sign', () => {
    expect(cleanNumericInput('£1234')).toBe('1234');
  });

  it('strips dollar sign', () => {
    expect(cleanNumericInput('$99')).toBe('99');
  });

  it('strips whitespace', () => {
    expect(cleanNumericInput(' 1 234 ')).toBe('1234');
  });

  it('strips currency + separators + whitespace combined', () => {
    expect(cleanNumericInput(' £1,234.56 ')).toBe('1234.56');
  });

  it('preserves decimal point', () => {
    expect(cleanNumericInput('1234.56')).toBe('1234.56');
  });

  it('preserves minus sign', () => {
    expect(cleanNumericInput('-99.50')).toBe('-99.50');
  });
});
