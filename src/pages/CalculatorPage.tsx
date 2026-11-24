import { useMemo } from 'react';
import { AdSlot } from '../components/AdSlot';
import { convertTimeToUnit, evaluateArithmetic } from '../core/arithmetic';
import { parseTime, TIME_ABBREVIATIONS, TIME_UNITS } from '../core/time';
import { useT } from '../i18n';
import { useFormatters } from '../lib/formatters';
import { usePageSeo } from '../lib/seo';
import { useActiveProfile, useAppStore } from '../store/useAppStore';

export function CalculatorPage() {
  usePageSeo({
    title: 'Basic & Time Calculator — RBX Calculators',
    description:
      'Perform scientific arithmetic calculations and convert multi-unit durations accurately with RBX Calculators.',
    canonicalPath: '/calculator/'
  });

  const t = useT();
  const { fmtTime } = useFormatters();
  const activeProfile = useActiveProfile();
  const updateActiveProfile = useAppStore((s) => s.updateActiveProfile);

  const calcUi = activeProfile.calcUi;
  const updateCalc = (patch: Partial<typeof calcUi>) => {
    updateActiveProfile((p) => ({
      ...p,
      calcUi: { ...p.calcUi, ...patch }
    }));
  };

  const arithmeticResult = useMemo(() => {
    if (!calcUi.exprInput.trim()) return { ok: true, empty: true, display: '—' };
    try {
      const x = Number(calcUi.xValue) || 0;
      const val = evaluateArithmetic(calcUi.exprInput, x);
      return { ok: true, empty: false, display: String(val) };
    } catch (err) {
      return { ok: false, empty: false, display: err instanceof Error ? err.message : t.calc.invalidExpression };
    }
  }, [calcUi.exprInput, calcUi.xValue, t.calc.invalidExpression]);

  const timeResult = useMemo(() => {
    const trimmed = calcUi.timeInput.trim();
    if (!trimmed) return { ok: false, empty: true, display: '—' };
    const sec = parseTime(trimmed);
    const unitSec = TIME_UNITS[calcUi.targetUnit] ?? 1;
    const localUnit = t.timeUnits[calcUi.targetUnit] ?? calcUi.targetUnit;
    return {
      ok: true,
      empty: false,
      seconds: sec,
      converted:
        calcUi.targetUnit === 'auto' ? fmtTime(sec) : convertTimeToUnit(sec, localUnit, unitSec),
      human: fmtTime(sec)
    };
  }, [calcUi.targetUnit, calcUi.timeInput, fmtTime, t.timeUnits]);

  return (
    <div className="space-y-6">
      <div className="min-w-0 max-w-full rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-[var(--density-pad)]">
        <div className="mb-4 flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight">{t.calc.title}</h1>
            <p className="text-xs text-[var(--text-secondary)]">{t.calc.subtitle}</p>
          </div>
          <div className="grid w-full grid-cols-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-1 sm:flex sm:w-auto">
            <button
              type="button"
              onClick={() => updateCalc({ mode: 'arithmetic' })}
              className={`min-h-[40px] rounded-[var(--radius-control)] px-4 text-xs font-semibold transition-colors ${
                calcUi.mode === 'arithmetic'
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t.calc.arithmetic}
            </button>
            <button
              type="button"
              onClick={() => updateCalc({ mode: 'time' })}
              className={`min-h-[40px] rounded-[var(--radius-control)] px-4 text-xs font-semibold transition-colors ${
                calcUi.mode === 'time'
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t.calc.timeConverter}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="min-w-0 space-y-4 lg:col-span-6">
            {calcUi.mode === 'arithmetic' ? (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                    {t.calc.expression}
                  </span>
                  <input
                    type="text"
                    value={calcUi.exprInput}
                    onChange={(e) => updateCalc({ exprInput: e.target.value })}
                    placeholder={t.calc.expressionPlaceholder}
                    className="min-h-[46px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 font-mono text-sm"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                    {t.calc.variableX}
                  </span>
                  <input
                    type="number"
                    value={calcUi.xValue}
                    onChange={(e) => updateCalc({ xValue: e.target.value })}
                    placeholder="0"
                    className="min-h-[46px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 font-mono text-sm"
                  />
                </label>

                <div className="flex flex-wrap gap-2 pt-1">
                  {['2+2*2/4-1', '(2+3)^4', '5! * 2', 'sqrt(144) + log10(1000)'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => updateCalc({ exprInput: preset })}
                      className="min-h-[36px] rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-2.5 font-mono text-xs hover:border-[var(--accent)]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                    {t.calc.durationInput}
                  </span>
                  <input
                    type="text"
                    value={calcUi.timeInput}
                    onChange={(e) => updateCalc({ timeInput: e.target.value })}
                    placeholder={t.calc.durationPlaceholder}
                    className="min-h-[46px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 font-mono text-sm"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                    {t.calc.targetUnit}
                  </span>
                  <select
                    value={calcUi.targetUnit}
                    onChange={(e) => updateCalc({ targetUnit: e.target.value })}
                    className="min-h-[46px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 text-sm"
                  >
                    <option value="auto">{t.calc.autoFormatted}</option>
                    {Object.entries(TIME_ABBREVIATIONS).map(([abbr, name]) => (
                      <option key={abbr} value={abbr}>
                        {t.timeUnits[abbr] ?? abbr} — {t.help.timeUnitNames[abbr] ?? name}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-between gap-4 lg:col-span-6">
            <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 p-5">
              <div className="mb-1 text-xs font-semibold text-[var(--text-secondary)]">
                {calcUi.mode === 'arithmetic'
                  ? t.calc.result
                  : `${t.calc.result} (${calcUi.targetUnit === 'auto' ? t.calc.autoFormatted : (t.timeUnits[calcUi.targetUnit] ?? calcUi.targetUnit)})`}
              </div>
              {calcUi.mode === 'arithmetic' ? (
                <div
                  className={`font-mono text-2xl font-bold break-all tabular-nums ${
                    arithmeticResult.ok ? 'text-[var(--text-primary)]' : 'text-red-400 text-base'
                  }`}
                >
                  {arithmeticResult.display}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="font-mono text-2xl font-bold tabular-nums">
                    {'converted' in timeResult && timeResult.converted ? timeResult.converted : timeResult.display}
                  </div>
                  {'human' in timeResult && timeResult.human && (
                    <div className="text-xs text-[var(--text-secondary)]">
                      {t.calc.normalized}: <span className="font-mono">{timeResult.human}</span> ·{' '}
                      <span className="font-mono">{timeResult.seconds}{t.timeUnits.s}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/50 p-4 text-xs text-[var(--text-secondary)]">
              <div className="font-semibold text-[var(--text-primary)]">{t.calc.syntaxTitle}</div>
              <p>{calcUi.mode === 'arithmetic' ? t.calc.arithmeticSyntax : t.calc.timeSyntax}</p>
            </div>
          </div>
        </div>
      </div>

      <AdSlot variant="leaderboard" />
    </div>
  );
}
