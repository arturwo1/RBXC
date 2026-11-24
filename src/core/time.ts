import { formatNumber, type NumberFormatOptions } from './numbers';

export const TIME_UNITS: Record<string, number> = {
  qs: 1e-30,
  rs: 1e-27,
  ys: 1e-24,
  zs: 1e-21,
  as: 1e-18,
  fs: 1e-15,
  ps: 1e-12,
  ns: 1e-9,
  us: 1e-6,
  ms: 1e-3,
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
  mo: 2629746,
  y: 31557600,
  dec: 315576000,
  c: 3155760000,
  ky: 3.15576e10,
  My: 3.15576e13,
  Gy: 3.15576e16,
  Ty: 3.15576e19,
  Py: 3.15576e22,
  Ey: 3.15576e25,
  Zy: 3.15576e28,
  Yy: 3.15576e31,
  Ry: 3.15576e34,
  Qy: 3.15576e37
};

export const TIME_ABBREVIATIONS: Record<string, string> = {
  qs: 'quectosecond',
  rs: 'rontosecond',
  ys: 'yoctosecond',
  zs: 'zeptosecond',
  as: 'attosecond',
  fs: 'femtosecond',
  ps: 'picosecond',
  ns: 'nanosecond',
  us: 'microsecond',
  ms: 'millisecond',
  s: 'second',
  m: 'minute',
  h: 'hour',
  d: 'day',
  w: 'week',
  mo: 'month',
  y: 'year',
  dec: 'decade',
  c: 'century',
  ky: 'kilo-year',
  My: 'mega-year',
  Gy: 'giga-year',
  Ty: 'tera-year',
  Py: 'peta-year',
  Ey: 'exa-year',
  Zy: 'zetta-year',
  Yy: 'yotta-year',
  Ry: 'ronna-year',
  Qy: 'quetta-year'
};

const LOWERCASE_TIME_UNITS: Record<string, number> = Object.fromEntries(
  Object.entries(TIME_UNITS).map(([k, v]) => [k.toLowerCase(), v])
);

export type TimeDisplayStyle = 'units' | 'hours';

export interface TimeFormatOptions {
  maxUnits?: number;
  decimals?: number;
  showYearsAndMonths?: boolean;
  style?: TimeDisplayStyle;
  numberFormat?: NumberFormatOptions;
  unitLabels?: Partial<Record<string, string>>;
}

export function parseTime(value: string | null | undefined): number {
  if (!value) return 0;
  const trimmed = String(value).trim().replace(/,/g, '.');
  if (!trimmed) return 0;

  if (/^\d+:\d+(?::\d+)?$/.test(trimmed)) {
    const parts = trimmed.split(':').map((p) => parseInt(p, 10) || 0);
    if (parts.length === 2) {
      return parts[0] * 3600 + parts[1] * 60;
    }
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  const unitKeys = Object.keys(TIME_UNITS).sort((a, b) => b.length - a.length).join('|');
  const re = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${unitKeys})\\b`, 'gi');

  let sec = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(trimmed)) !== null) {
    const num = parseFloat(m[1]);
    const rawUnit = m[2];
    if (!Number.isFinite(num)) continue;
    const factor = TIME_UNITS[rawUnit] ?? LOWERCASE_TIME_UNITS[rawUnit.toLowerCase()];
    if (factor) sec += num * factor;
  }

  return sec;
}

export function formatTime(secInput: number, options: TimeFormatOptions = {}): string {
  const {
    maxUnits = 4,
    decimals = 2,
    showYearsAndMonths = false,
    style = 'units',
    numberFormat,
    unitLabels
  } = options;

  const labelFor = (unitKey: string) => unitLabels?.[unitKey] ?? unitKey;

  if (!Number.isFinite(secInput)) return '∞';
  const sec = Math.max(0, Number(secInput) || 0);

  if (style === 'hours') {
    const hours = sec / 3600;
    const formatted = formatNumber(hours, { ...numberFormat, decimals });
    return `${formatted}${labelFor('h')}`;
  }

  const order = Object.entries(TIME_UNITS)
    .sort((a, b) => b[1] - a[1])
    .filter(([name]) => (showYearsAndMonths ? true : name !== 'y' && name !== 'mo'));

  const LARGE_UNIT_THRESHOLD = 1e6;

  if (order.length > 0) {
    const [largestName, largestValue] = order[0];
    const amtLargest = sec / largestValue;
    if (amtLargest >= LARGE_UNIT_THRESHOLD) {
      return `${formatNumber(amtLargest, numberFormat)} ${labelFor(largestName)}`;
    }
  }

  const parts: string[] = [];
  let remaining = sec;

  for (let i = 0; i < order.length; i++) {
    const [name, value] = order[i];
    if (parts.length >= maxUnits) break;

    const slotsLeft = maxUnits - parts.length;
    if (slotsLeft === 1) {
      const amt = remaining / value;
      const rounded = Number(amt.toFixed(decimals));
      if (rounded > 0) {
        parts.push(`${rounded}${labelFor(name)}`);
      }
      remaining = 0;
    } else {
      const amt = Math.floor(remaining / value);
      if (amt > 0) {
        parts.push(`${amt}${labelFor(name)}`);
        remaining -= amt * value;
      }
    }
  }

  return parts.length > 0 ? parts.join(' ') : `0${labelFor('s')}`;
}

export function formatEtaDate(
  seconds: number,
  nowMs = Date.now(),
  beyondYearText = 'Beyond Year 275,760'
): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  const maxSafeOffsetMs = 8.64e15 - nowMs - 1000;
  const offsetMs = seconds * 1000;
  if (offsetMs > maxSafeOffsetMs) return beyondYearText;

  const d = new Date(nowMs + offsetMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
