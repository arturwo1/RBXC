import { formatMultiplierValue, formatNumber } from '../core/numbers';
import { formatEtaDate, formatTime } from '../core/time';
import { useT } from '../i18n';
import { useAppStore } from '../store/useAppStore';

export function useFormatters() {
  const settings = useAppStore((s) => s.settings);
  const t = useT();

  const unitLabels = settings.numberNotation === 'standard' ? t.numberUnits : undefined;

  const fmtNum = (val: number) =>
    formatNumber(val, {
      notation: settings.numberNotation,
      decimals: settings.numberDecimals,
      unitLabels
    });

  const fmtMult = (val: number) =>
    formatMultiplierValue(val, {
      notation: settings.numberNotation,
      decimals: settings.numberDecimals,
      unitLabels
    });

  const fmtTime = (seconds: number) =>
    formatTime(seconds, {
      showYearsAndMonths: settings.showYearsAndMonths,
      style: settings.timeStyle,
      decimals: settings.numberDecimals,
      unitLabels: t.timeUnits,
      numberFormat: {
        notation: settings.numberNotation,
        decimals: settings.numberDecimals,
        unitLabels
      }
    });

  const fmtEta = (seconds: number) =>
    settings.showEtaDate ? formatEtaDate(seconds, Date.now(), t.common.beyondYearLimit) : null;

  return { fmtNum, fmtMult, fmtTime, fmtEta, settings };
}
