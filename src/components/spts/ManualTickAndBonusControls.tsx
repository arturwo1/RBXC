import type { SptsGainCalcMode } from '../../core/newSptsTypes';
import { SPTS_TICK_SECONDS, type SptsStatType } from '../../core/sptsData';
import { useT } from '../../i18n';
import { useFormatters } from '../../lib/formatters';

interface ManualTickAndBonusControlsProps {
  stat: SptsStatType;
  gainCalcMode: SptsGainCalcMode;
  customPerTick: string;
  customTickSeconds: string;
  equipmentBonusPercent: number;
  computedPerTick: number;
  computedTickSec: number;
  onChangeMode: (mode: SptsGainCalcMode) => void;
  onChangeCustomPerTick: (val: string) => void;
  onChangeCustomTickSeconds: (val: string) => void;
  onChangeEquipmentBonus: (val: number) => void;
}

const BONUS_QUICK_CHIPS = [0, 50, 270, 500];

export function ManualTickAndBonusControls({
  stat,
  gainCalcMode,
  customPerTick,
  customTickSeconds,
  equipmentBonusPercent,
  computedPerTick,
  computedTickSec,
  onChangeMode,
  onChangeCustomPerTick,
  onChangeCustomTickSeconds,
  onChangeEquipmentBonus
}: ManualTickAndBonusControlsProps) {
  const t = useT();
  const { fmtNum } = useFormatters();

  const safeBonus = Math.max(0, Number(equipmentBonusPercent) || 0);
  const effectivePerSec = computedTickSec > 0 ? computedPerTick / computedTickSec : 0;

  return (
    <div className="space-y-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 p-3">
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
          {t.newSpts.gainModeLabel}
        </div>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onChangeMode('auto')}
            className={`min-h-[34px] rounded-[var(--radius-control)] border px-2.5 text-left text-xs font-semibold transition-colors ${
              gainCalcMode === 'auto'
                ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.newSpts.gainModeAuto}
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('manual')}
            className={`min-h-[34px] rounded-[var(--radius-control)] border px-2.5 text-left text-xs font-semibold transition-colors ${
              gainCalcMode === 'manual'
                ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.newSpts.gainModeManual}
          </button>
        </div>
      </div>

      {gainCalcMode === 'manual' && (
        <div className="space-y-2 rounded-[var(--radius-control)] border border-[var(--accent)]/30 bg-[var(--bg-surface)]/70 p-2.5">
          <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
            {t.newSpts.manualModeHint}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label className="block space-y-1">
              <span className="block truncate text-[11px] font-medium text-[var(--text-secondary)]">
                {t.spts.manualPerTickLabel}
              </span>
              <input
                type="text"
                value={customPerTick}
                onChange={(e) => onChangeCustomPerTick(e.target.value)}
                placeholder={t.spts.manualPerTickPlaceholder}
                className="min-h-[36px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
            </label>
            <label className="block space-y-1">
              <span className="block truncate text-[11px] font-medium text-[var(--text-secondary)]">
                {t.spts.tickSecondsLabel}
              </span>
              <input
                type="number"
                step="0.05"
                min="0.05"
                value={customTickSeconds}
                onChange={(e) => onChangeCustomTickSeconds(e.target.value)}
                placeholder={String(SPTS_TICK_SECONDS[stat])}
                className="min-h-[36px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
            </label>
          </div>
        </div>
      )}

      <div className="space-y-1.5 border-t border-[var(--border-subtle)] pt-2.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={`equip-bonus-${stat}`}
            className="text-[11px] font-semibold text-[var(--text-secondary)]"
          >
            {t.newSpts.equipBonusLabel}
          </label>
          <span className="font-mono text-[11px] font-bold text-[var(--accent)]">
            +{safeBonus}% (×{(1 + safeBonus / 100).toFixed(2).replace(/\.00$/, '')})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            id={`equip-bonus-${stat}`}
            type="number"
            min={0}
            step={5}
            value={safeBonus}
            onChange={(e) => onChangeEquipmentBonus(Math.max(0, Number(e.target.value) || 0))}
            className="min-h-[36px] w-24 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 font-mono text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
          <div className="flex flex-wrap gap-1">
            {BONUS_QUICK_CHIPS.map((chip) => {
              const active = safeBonus === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => onChangeEquipmentBonus(chip)}
                  className={`rounded-md border px-2 py-1 font-mono text-[11px] font-semibold transition-colors ${
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent)]/60'
                  }`}
                >
                  +{chip}%
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-[10px] leading-relaxed text-[var(--text-secondary)]">
          {t.newSpts.equipBonusHint}
        </p>

        <div className="flex items-center justify-between rounded-[var(--radius-control)] bg-[var(--bg-surface)]/80 px-2.5 py-1.5 text-[11px]">
          <span className="text-[var(--text-secondary)]">
            {gainCalcMode === 'manual' ? t.newSpts.gainModeManual : t.newSpts.gainModeAuto}
          </span>
          <span className="font-mono font-bold text-[var(--text-primary)]">
            +{fmtNum(computedPerTick)} / {computedTickSec}
            {t.timeUnits.s} ({fmtNum(effectivePerSec)}/{t.timeUnits.s})
          </span>
        </div>
      </div>
    </div>
  );
}
