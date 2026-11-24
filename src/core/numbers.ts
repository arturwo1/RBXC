import Decimal from 'decimal.js';

Decimal.set({
  precision: 64,
  toExpPos: 120,
  toExpNeg: -60
});

export type NumberNotation = 'standard' | 'american' | 'scientific';

export interface NumberFormatOptions {
  notation?: NumberNotation;
  decimals?: number;
  unitLabels?: readonly string[];
}

export const NUMBER_UNITS: readonly string[] = [
  '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc',
  'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg',
  'Uvg', 'Dvg', 'Tvg', 'Qavg', 'Qivg', 'Sxvg', 'Spvg', 'Ocvg', 'Novg', 'Tg', 'Ce'
];

export const AMERICAN_UNITS: readonly string[] = [
  '', 'K', 'M', 'B', 'T', 'Qd', 'Qn', 'Sx', 'Sp', 'Oc', 'No', 'Dc',
  'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg',
  'Uvg', 'Dvg', 'Tvg', 'Qavg', 'Qivg', 'Sxvg', 'Spvg', 'Ocvg', 'Novg', 'Tg', 'Ce'
];

export const SUFFIXES: Record<string, number> = Object.fromEntries(
  NUMBER_UNITS.map((unit, index) => [unit.toLowerCase(), 10 ** (index * 3)])
);

export const SUFFIX_DECIMALS: Record<string, Decimal> = Object.fromEntries(
  NUMBER_UNITS.map((unit, index) => [unit.toLowerCase(), new Decimal(10).pow(index * 3)])
);

const EXTRA_LOCALE_SUFFIX_INDEX: Record<string, number> = {
  'к': 1,
  'тыс': 1,
  'тыс.': 1,
  'м': 2,
  'млн': 2,
  'млрд': 3,
  'б': 3,
  'трлн': 4,
  'т': 4,
  'квдр': 5,
  'квнт': 6,
  'кви': 6,
  'скст': 7,
  'спт': 8,
  'окт': 9,
  'нон': 10,
  'дец': 11
};

for (const [alias, idx] of Object.entries(EXTRA_LOCALE_SUFFIX_INDEX)) {
  SUFFIX_DECIMALS[alias] = new Decimal(10).pow(idx * 3);
}

export function parseDecimal(value: string | number | Decimal | null | undefined): Decimal {
  if (value instanceof Decimal) return value.isFinite() ? value : new Decimal(0);
  if (value == null) return new Decimal(0);

  let normalized = String(value).trim().replace(/\s+/g, '').toLowerCase();
  if (normalized === '') return new Decimal(0);

  normalized = normalized.replace(/,/g, '.').replace(/qn/g, 'qi').replace(/qd/g, 'qa');

  const sciMatch = normalized.match(/^(-?\d+(?:\.\d+)?e[+-]?\d+)$/);
  if (sciMatch) {
    try {
      const d = new Decimal(sciMatch[1]);
      return d.isFinite() ? d : new Decimal(0);
    } catch {
      return new Decimal(0);
    }
  }

  const suffixMatch = normalized.match(/^(-?\d+(?:\.\d+)?)([a-zа-яё.]*)$/i);
  if (!suffixMatch) {
    const fallback = Number(normalized);
    return Number.isFinite(fallback) ? new Decimal(fallback) : new Decimal(0);
  }

  try {
    const num = new Decimal(suffixMatch[1]);
    const rawSuf = (suffixMatch[2] || '').toLowerCase();
    const cleanSuf = rawSuf.endsWith('.') && !(rawSuf in SUFFIX_DECIMALS) ? rawSuf.slice(0, -1) : rawSuf;
    const mult = SUFFIX_DECIMALS[rawSuf] ?? SUFFIX_DECIMALS[cleanSuf] ?? new Decimal(1);
    const result = num.mul(mult);
    return result.isFinite() ? result : new Decimal(0);
  } catch {
    return new Decimal(0);
  }
}

export function parseNumber(value: string | number | Decimal | null | undefined): number {
  const dec = parseDecimal(value);
  const num = dec.toNumber();
  return Number.isFinite(num) ? num : 0;
}

export function formatNumber(
  value: number | Decimal,
  options: NumberFormatOptions = {}
): string {
  const notation = options.notation ?? 'standard';
  const decimals = Math.min(6, Math.max(0, options.decimals ?? 2));

  let dec: Decimal;
  try {
    dec = value instanceof Decimal ? value : new Decimal(value);
  } catch {
    return '—';
  }

  if (!dec.isFinite()) return '—';

  const isNeg = dec.isNegative();
  let abs = dec.abs();

  if (notation === 'scientific') {
    if (abs.lt(1000)) {
      const fixed = abs.toFixed(decimals).replace(new RegExp(`(\\.\\d*?[1-9])0+$|\\.0+$`), '$1');
      return `${isNeg && !abs.isZero() ? '-' : ''}${fixed}`;
    }
    const expStr = abs.toExponential(decimals);
    const [mantissa, exponent] = expStr.split('e');
    const cleanMantissa = mantissa.replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
    const cleanExp = exponent.replace(/^\+/, '');
    return `${isNeg ? '-' : ''}${cleanMantissa}e${cleanExp}`;
  }

  const baseUnits = notation === 'american' ? AMERICAN_UNITS : NUMBER_UNITS;
  let index = 0;
  const thousand = new Decimal(1000);

  while (abs.gte(thousand) && index < baseUnits.length - 1) {
    abs = abs.div(thousand);
    index++;
  }

  let str = abs.toFixed(decimals);
  if (decimals > 0) {
    str = str.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
  }

  // Use localized unit up to where unitLabels covers, then gracefully fall back to English baseUnits
  const customUnit =
    options.unitLabels && index < options.unitLabels.length && options.unitLabels[index] !== undefined
      ? options.unitLabels[index]
      : baseUnits[index];

  return `${isNeg && !dec.isZero() ? '-' : ''}${str}${customUnit}`;
}

/**
 * In-game multipliers are shown as exact integers without abbreviation up to 999,999,
 * then compactly abbreviated starting at 1,000,000 (1M+).
 */
export function formatMultiplierValue(
  mult: number,
  options: NumberFormatOptions = {}
): string {
  if (!Number.isFinite(mult) || mult <= 0) return 'x1';
  if (mult < 1_000_000) {
    return `x${Math.round(mult)}`;
  }
  return `x${formatNumber(mult, options)}`;
}
