import { describe, expect, it } from 'vitest';
import { formatTime, parseTime, TIME_UNITS } from '../time';

describe('time core', () => {
  it('parses multi-unit strings and hh:mm format', () => {
    expect(parseTime('1d 2h 30m 45s')).toBe(86400 + 7200 + 1800 + 45);
    expect(parseTime('01:30')).toBe(5400);
    expect(parseTime('0,5d')).toBe(43200);
    expect(parseTime('1My')).toBe(TIME_UNITS.My);
  });

  it('formats durations with and without years & months', () => {
    const fortyDays = 40 * 86400;
    expect(formatTime(fortyDays, { showYearsAndMonths: false })).toBe('5w 5d');
    expect(formatTime(fortyDays, { showYearsAndMonths: true })).toContain('1mo');
  });

  it('supports hours-only formatting mode', () => {
    expect(formatTime(5400, { style: 'hours' })).toBe('1.5h');
  });
});
