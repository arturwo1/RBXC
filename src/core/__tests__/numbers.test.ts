import { describe, expect, it } from 'vitest';
import {
  formatMultiplierValue,
  formatNumber,
  NUMBER_UNITS,
  parseDecimal,
  parseNumber
} from '../numbers';

describe('numbers core', () => {
  it('parses standard suffixes and decimal separators', () => {
    expect(parseNumber('1.5M')).toBe(1_500_000);
    expect(parseNumber('2,5k')).toBe(2500);
    expect(parseNumber('58.5m')).toBe(58_500_000);
    expect(parseNumber('7Qa')).toBe(7e15);
    expect(parseNumber('3Qi')).toBe(3e18);
  });

  it('supports American aliases Qd -> Qa and Qn -> Qi', () => {
    expect(parseNumber('4Qd')).toBe(4e15);
    expect(parseNumber('9Qn')).toBe(9e18);
  });

  it('handles ultra-large suffixes up to Ce without losing exponent accuracy', () => {
    expect(NUMBER_UNITS).toHaveLength(33);
    const ce = parseDecimal('2.5Ce');
    expect(ce.toExponential()).toBe('2.5e+96');
    expect(formatNumber(ce)).toBe('2.5Ce');
  });

  it('formats in standard, american, and scientific notations', () => {
    expect(formatNumber(1_500_000_000_000_000)).toBe('1.5Qa');
    expect(formatNumber(1_500_000_000_000_000, { notation: 'american' })).toBe('1.5Qd');
    expect(formatNumber(1_500_000_000_000_000, { notation: 'scientific' })).toBe('1.5e15');
    expect(formatNumber(1000)).toBe('1K');
    expect(formatNumber(-2500)).toBe('-2.5K');
  });

  it('supports localized suffixes up to limit with English fallback beyond, and integer multipliers under 1M', () => {
    const ruUnits = ['', 'тыс.', 'млн', 'млрд', 'трлн', 'квдр', 'квнт', 'скст', 'спт', 'окт', 'нон', 'дец'];
    expect(formatNumber(15_000_000, { unitLabels: ruUnits })).toBe('15млн');
    expect(formatNumber(1e33, { unitLabels: ruUnits })).toBe('1дец');
    // Beyond Dc (1e36 = Ud), falls back to English
    expect(formatNumber(1e36, { unitLabels: ruUnits })).toBe('1Ud');
    expect(parseNumber('10млн')).toBe(10_000_000);
    expect(parseNumber('10квнт')).toBe(1e19);

    expect(formatMultiplierValue(512)).toBe('x512');
    expect(formatMultiplierValue(524288)).toBe('x524288');
    expect(formatMultiplierValue(1048576, { unitLabels: ruUnits })).toBe('x1.05млн');
  });
});
