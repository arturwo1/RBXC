import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { AdSlot } from '../components/AdSlot';
import { FieldHeaderWithOverride } from '../components/OverrideToggle';
import { parseNumber } from '../core/numbers';
import {
  calculateSptlAmountInTime,
  calculateSptlRate,
  calculateSptlTokensInTime,
  calculateSptlTokenTimeToGoal,
  calculateSptlTimeToGoal,
  SPTL_STAT_TICKS,
  type SptlStatType
} from '../core/sptl';
import { parseTime } from '../core/time';
import { useT } from '../i18n';
import { useFormatters } from '../lib/formatters';
import { usePageSeo } from '../lib/seo';
import { useActiveProfile, useAppStore } from '../store/useAppStore';

export function SptlPage() {
  usePageSeo({
    title: 'SPTL Stats & Tokens Calculator — RBX Calculators',
    description:
      'Super Power Training League (SPTL) Stats & Tokens Calculator — calculate tick speed with Faster Train and Skill Tree boosts, live timer, and token gain.',
    canonicalPath: '/sptlc/'
  });

  const t = useT();
  const activeProfile = useActiveProfile();
  const updateActiveProfile = useAppStore((s) => s.updateActiveProfile);
  const { fmtNum, fmtTime, fmtEta } = useFormatters();

  const sptl = activeProfile.sptl;
  const [tickClock, setTickClock] = useState(() => Date.now());
  const [boostOverrideOpen, setBoostOverrideOpen] = useState(false);
  const [intervalOverrideOpen, setIntervalOverrideOpen] = useState(false);

  const updateSptl = (patch: Partial<typeof sptl>) => {
    updateActiveProfile((p) => ({
      ...p,
      sptl: { ...p.sptl, ...patch }
    }));
  };

  useEffect(() => {
    if (!sptl.liveRunning) return;
    const timer = window.setInterval(() => setTickClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [sptl.liveRunning]);

  const liveElapsed = sptl.liveRunning
    ? sptl.liveAccumulatedSec + Math.max(0, (tickClock - sptl.liveStartedAtMs) / 1000)
    : sptl.liveAccumulatedSec;

  const perTickNum = parseNumber(sptl.perTick);
  const currentStatNum = parseNumber(sptl.currentStat);

  const rate = calculateSptlRate({
    statType: sptl.statType,
    hasFastTrain: sptl.fasterTrain,
    boostValue: sptl.boostValue,
    boostMode: sptl.boostMode,
    perTick: perTickNum,
    currentStat: currentStatNum
  });

  const hasStatGoal = sptl.statGoalRaw.trim().length > 0;
  const statGoalAmount = parseNumber(sptl.statGoalRaw);
  const statGoalTimeSec = parseTime(sptl.statGoalRaw);

  const timeToStatGoal = calculateSptlTimeToGoal(currentStatNum, statGoalAmount, rate.gainPerSecond);
  const amountInStatTime = calculateSptlAmountInTime(statGoalTimeSec, rate.gainPerSecond);

  const liveCurrentStat =
    sptl.tab === 'stats'
      ? currentStatNum + rate.gainPerSecond * liveElapsed
      : parseNumber(sptl.currentTokens) +
        (sptl.tokenInterval > 0 ? (parseNumber(sptl.tokensPerTick) / sptl.tokenInterval) * liveElapsed : 0);

  const hasTokenGoal = sptl.tokenGoalRaw.trim().length > 0;
  const currentTokensNum = parseNumber(sptl.currentTokens);
  const tokensPerTickNum = parseNumber(sptl.tokensPerTick);
  const tokenGoalAmount = parseNumber(sptl.tokenGoalRaw);
  const tokenGoalTimeSec = parseTime(sptl.tokenGoalRaw);

  const timeToTokenGoal = calculateSptlTokenTimeToGoal(
    currentTokensNum,
    tokenGoalAmount,
    tokensPerTickNum,
    sptl.tokenInterval
  );
  const tokensInTime = calculateSptlTokensInTime(
    tokenGoalTimeSec,
    tokensPerTickNum,
    sptl.tokenInterval
  );

  return (
    <div className="space-y-6">
      <div className="min-w-0 max-w-full rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-[var(--density-pad)]">
        <div className="mb-5 flex min-w-0 flex-col justify-between gap-3 border-b border-[var(--border-subtle)] pb-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight">{t.sptl.title}</h1>
            <p className="truncate text-xs text-[var(--text-secondary)]">
              {t.sptl.subtitle} · {t.common.activeProfile}: {activeProfile.name}
            </p>
          </div>

          <div className="grid w-full grid-cols-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-1 sm:flex sm:w-auto">
            {(
              [
                { id: 'stats', label: t.sptl.tabStats },
                { id: 'tokens', label: t.sptl.tabTokens },
                { id: 'formulas', label: t.sptl.tabFormulas }
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => updateSptl({ tab: item.id })}
                className={`min-h-[38px] rounded-[var(--radius-control)] px-3 text-xs font-semibold transition-colors sm:px-4 ${
                  sptl.tab === item.id
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {sptl.tab === 'formulas' ? (
          <div className="space-y-4 text-sm text-[var(--text-secondary)]">
            <p>{t.sptl.formulasDesc}</p>
            <pre className="overflow-x-auto rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 font-mono text-xs text-[var(--text-primary)]">
{`realBoost = boostMode === 'levels' ? boost / 20 : boost / 100
tick = Math.floor(baseTickSeconds / ((hasFastTrain ? 1.25 : 1) + realBoost) * 100) / 100
gainPerSecond = perTick / tick`}
            </pre>
            <div className="overflow-x-auto">
              <table className="w-full max-w-md border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                    <th className="py-2">{t.sptl.colStat}</th>
                    <th className="py-2 text-right">{t.sptl.colBaseTick}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]/50 font-mono">
                  {Object.entries(SPTL_STAT_TICKS).map(([statName, sec]) => (
                    <tr key={statName}>
                      <td className="py-2 font-sans font-semibold text-[var(--text-primary)]">{statName}</td>
                      <td className="py-2 text-right tabular-nums">{sec.toFixed(1)}{t.timeUnits.s}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="min-w-0 space-y-4 lg:col-span-5">
              {sptl.tab === 'stats' ? (
                <>
                  <div>
                    <FieldHeaderWithOverride
                      label={t.sptl.statTypeLabel}
                      open={boostOverrideOpen}
                      onToggle={() => setBoostOverrideOpen((v) => !v)}
                      hasCustomOverride={sptl.fasterTrain || sptl.boostValue > 0}
                    />
                    <select
                      value={sptl.statType}
                      onChange={(e) => updateSptl({ statType: e.target.value as SptlStatType })}
                      className="min-h-[46px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 text-sm"
                    >
                      {Object.keys(SPTL_STAT_TICKS).map((k) => (
                        <option key={k} value={k}>
                          {k} ({SPTL_STAT_TICKS[k as SptlStatType]}{t.timeUnits.s})
                        </option>
                      ))}
                    </select>

                    {boostOverrideOpen && (
                      <div className="mt-2 space-y-2.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/60 p-3 text-xs">
                        <label className="flex min-h-[38px] cursor-pointer items-center gap-2.5 font-medium">
                          <input
                            type="checkbox"
                            checked={sptl.fasterTrain}
                            onChange={(e) => updateSptl({ fasterTrain: e.target.checked })}
                            className="h-4 w-4 accent-[var(--accent)]"
                          />
                          <span>{t.sptl.fasterTrain}</span>
                        </label>
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-[var(--text-secondary)]">
                              {sptl.boostMode === 'levels' ? t.sptl.fasterStatLevels : t.sptl.fasterStatPercent}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateSptl({
                                  boostMode: sptl.boostMode === 'levels' ? 'percent' : 'levels',
                                  boostValue:
                                    sptl.boostMode === 'levels'
                                      ? sptl.boostValue * 5
                                      : Math.round(sptl.boostValue / 5)
                                })
                              }
                              className="font-semibold text-[var(--accent)] hover:underline"
                            >
                              {sptl.boostMode === 'levels' ? t.sptl.switchToPercent : t.sptl.switchToLevels}
                            </button>
                          </div>
                          <input
                            type="number"
                            min={0}
                            max={sptl.boostMode === 'levels' ? 5 : 25}
                            value={sptl.boostValue}
                            onChange={(e) => updateSptl({ boostValue: Number(e.target.value) || 0 })}
                            className="min-h-[40px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 font-mono text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                        {t.sptl.perTick}
                      </span>
                      <input
                        type="text"
                        value={sptl.perTick}
                        onChange={(e) => updateSptl({ perTick: e.target.value })}
                        placeholder="e.g. 2.08K"
                        className="min-h-[46px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 font-mono text-sm"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                        {t.sptl.currentStat}
                      </span>
                      <input
                        type="text"
                        value={sptl.currentStat}
                        onChange={(e) => updateSptl({ currentStat: e.target.value })}
                        placeholder="e.g. 58.5M"
                        className="min-h-[46px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 font-mono text-sm"
                      />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <div className="flex rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-1">
                      <button
                        type="button"
                        onClick={() => updateSptl({ statGoalMode: 'amountToTime' })}
                        className={`min-h-[38px] flex-1 rounded-[var(--radius-control)] text-xs font-semibold ${
                          sptl.statGoalMode === 'amountToTime'
                            ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                            : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {t.spts.amountToTime}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSptl({ statGoalMode: 'timeToAmount' })}
                        className={`min-h-[38px] flex-1 rounded-[var(--radius-control)] text-xs font-semibold ${
                          sptl.statGoalMode === 'timeToAmount'
                            ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                            : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {t.spts.timeToAmount}
                      </button>
                    </div>

                    <input
                      type="text"
                      value={sptl.statGoalRaw}
                      onChange={(e) => updateSptl({ statGoalRaw: e.target.value })}
                      placeholder={
                        sptl.statGoalMode === 'amountToTime'
                          ? t.sptl.goalStatPlaceholder
                          : t.sptl.goalTimePlaceholder
                      }
                      className="min-h-[46px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 font-mono text-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <FieldHeaderWithOverride
                      label={t.sptl.tokensPerTick}
                      open={intervalOverrideOpen}
                      onToggle={() => setIntervalOverrideOpen((v) => !v)}
                      hasCustomOverride={sptl.tokenInterval !== 45}
                    />
                    <input
                      type="text"
                      value={sptl.tokensPerTick}
                      onChange={(e) => updateSptl({ tokensPerTick: e.target.value })}
                      placeholder="50"
                      className="min-h-[46px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 font-mono text-sm"
                    />
                    {intervalOverrideOpen && (
                      <label className="mt-2 block rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/60 p-3 text-xs">
                        <span className="mb-1 block text-[var(--text-secondary)]">{t.sptl.tickInterval}</span>
                        <input
                          type="number"
                          min={1}
                          max={300}
                          value={sptl.tokenInterval}
                          onChange={(e) => updateSptl({ tokenInterval: Number(e.target.value) || 45 })}
                          className="min-h-[40px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 font-mono text-xs"
                        />
                      </label>
                    )}
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                      {t.sptl.currentTokens}
                    </span>
                    <input
                      type="text"
                      value={sptl.currentTokens}
                      onChange={(e) => updateSptl({ currentTokens: e.target.value })}
                      placeholder="1.2K"
                      className="min-h-[46px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 font-mono text-sm"
                    />
                  </label>

                  <div className="space-y-2">
                    <div className="flex rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-1">
                      <button
                        type="button"
                        onClick={() => updateSptl({ tokenGoalMode: 'amountToTime' })}
                        className={`min-h-[38px] flex-1 rounded-[var(--radius-control)] text-xs font-semibold ${
                          sptl.tokenGoalMode === 'amountToTime'
                            ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                            : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {t.spts.amountToTime}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSptl({ tokenGoalMode: 'timeToAmount' })}
                        className={`min-h-[38px] flex-1 rounded-[var(--radius-control)] text-xs font-semibold ${
                          sptl.tokenGoalMode === 'timeToAmount'
                            ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                            : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {t.spts.timeToAmount}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={sptl.tokenGoalRaw}
                      onChange={(e) => updateSptl({ tokenGoalRaw: e.target.value })}
                      placeholder={
                        sptl.tokenGoalMode === 'amountToTime'
                          ? t.sptl.goalTokenPlaceholder
                          : t.sptl.goalTimePlaceholder
                      }
                      className="min-h-[46px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 font-mono text-sm"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="min-w-0 space-y-4 lg:col-span-7">
              <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/65 p-5 space-y-4">
                {sptl.tab === 'stats' ? (
                  <>
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-secondary)]">
                        {!hasStatGoal
                          ? t.common.enterGoalHint
                          : sptl.statGoalMode === 'amountToTime'
                            ? t.spts.estimatedTimeTitle
                                .replace('{goal}', fmtNum(statGoalAmount))
                                .replace('{stat}', sptl.statType)
                            : t.spts.projectedGainTitle
                                .replace('{stat}', sptl.statType)
                                .replace('{time}', fmtTime(statGoalTimeSec))}
                      </div>
                      <div className="mt-1 font-mono text-3xl font-extrabold tabular-nums">
                        {!hasStatGoal
                          ? '—'
                          : sptl.statGoalMode === 'amountToTime'
                            ? fmtTime(timeToStatGoal)
                            : `${fmtNum(amountInStatTime)} ${sptl.statType}`}
                      </div>
                      {hasStatGoal &&
                        fmtEta(sptl.statGoalMode === 'amountToTime' ? timeToStatGoal : statGoalTimeSec) && (
                          <div className="mt-1 text-xs text-[var(--text-secondary)]">
                            {t.common.eta}:{' '}
                            <span className="font-mono">
                              {fmtEta(sptl.statGoalMode === 'amountToTime' ? timeToStatGoal : statGoalTimeSec)}
                            </span>
                          </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-[var(--border-subtle)] pt-4 text-xs sm:grid-cols-3">
                      <div>
                        <div className="text-[var(--text-secondary)]">{t.sptl.effectiveTick}</div>
                        <div className="font-mono text-sm font-bold tabular-nums">
                          {rate.tickSeconds}{t.timeUnits.s}
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--text-secondary)]">{t.sptl.gainPerSec}</div>
                        <div className="font-mono text-sm font-bold tabular-nums">
                          {fmtNum(rate.gainPerSecond)}/{t.timeUnits.s}
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--text-secondary)]">{t.sptl.gainPerHour}</div>
                        <div className="font-mono text-sm font-bold tabular-nums">
                          {fmtNum(rate.gainPerSecond * 3600)}/{t.timeUnits.h}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="text-xs font-semibold text-[var(--text-secondary)]">
                      {!hasTokenGoal
                        ? t.common.enterGoalHint
                        : sptl.tokenGoalMode === 'amountToTime'
                          ? t.spts.tokenTargetTimeTitle.replace('{amount}', fmtNum(tokenGoalAmount))
                          : t.spts.tokenTargetAmountTitle.replace('{time}', fmtTime(tokenGoalTimeSec))}
                    </div>
                    <div className="mt-1 font-mono text-3xl font-extrabold tabular-nums">
                      {!hasTokenGoal
                        ? '—'
                        : sptl.tokenGoalMode === 'amountToTime'
                          ? fmtTime(timeToTokenGoal)
                          : `${fmtNum(tokensInTime)} ${t.common.tokens}`}
                    </div>
                    {hasTokenGoal &&
                      fmtEta(sptl.tokenGoalMode === 'amountToTime' ? timeToTokenGoal : tokenGoalTimeSec) && (
                        <div className="mt-1 text-xs text-[var(--text-secondary)]">
                          {t.common.eta}:{' '}
                          <span className="font-mono">
                            {fmtEta(sptl.tokenGoalMode === 'amountToTime' ? timeToTokenGoal : tokenGoalTimeSec)}
                          </span>
                        </div>
                      )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4">
                  <div className="text-xs">
                    <div className="text-[var(--text-secondary)]">{t.spts.liveTrackerTitle}</div>
                    <div className="font-mono text-sm font-bold tabular-nums">
                      {fmtNum(liveCurrentStat)} {sptl.tab === 'stats' ? sptl.statType : t.common.tokens} ·{' '}
                      {fmtTime(liveElapsed)} {t.common.elapsed}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (sptl.liveRunning) {
                          const now = Date.now();
                          const totalSec = sptl.liveAccumulatedSec + Math.max(0, (now - sptl.liveStartedAtMs) / 1000);
                          updateSptl({ liveRunning: false, liveAccumulatedSec: totalSec, liveStartedAtMs: 0 });
                        } else {
                          updateSptl({ liveRunning: true, liveStartedAtMs: Date.now() });
                        }
                      }}
                      className="flex min-h-[40px] items-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--accent)] px-3.5 text-xs font-semibold text-[var(--accent-fg)]"
                    >
                      {sptl.liveRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {sptl.liveRunning ? t.common.pause : t.common.startGrind}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSptl({ liveRunning: false, liveStartedAtMs: 0, liveAccumulatedSec: 0 })
                      }
                      aria-label={t.common.reset}
                      className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <AdSlot variant="rectangle" />
            </div>
          </div>
        )}
      </div>

      <AdSlot variant="leaderboard" />
    </div>
  );
}
