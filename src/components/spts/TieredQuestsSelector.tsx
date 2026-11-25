import { getQuestsGroupedByTier } from '../../core/newSptsData';
import type { SptsRepeatableQuest, SptsStatType } from '../../core/sptsData';
import { useT } from '../../i18n';
import { useFormatters } from '../../lib/formatters';

interface TieredQuestsSelectorProps {
  dailyQuests: SptsRepeatableQuest[];
  weeklyQuests: SptsRepeatableQuest[];
  selectedDailyIds: string[];
  selectedWeeklyIds: string[];
  autoGateByStats: boolean;
  currentStats: Record<SptsStatType, number>;
  dailyQuestDuration: string;
  weeklyQuestDuration: string;
  questUptimeFraction: number;
  dailyDowntimeSec: number;
  weeklyDowntimeSec: number;
  onToggleDaily: (id: string) => void;
  onToggleDailyTier: (ids: string[], enable: boolean) => void;
  onSetAllDaily: (enable: boolean) => void;
  onToggleWeekly: (id: string) => void;
  onToggleWeeklyTier: (ids: string[], enable: boolean) => void;
  onSetAllWeekly: (enable: boolean) => void;
  onToggleAutoGate: (val: boolean) => void;
  onChangeDailyDuration: (val: string) => void;
  onChangeWeeklyDuration: (val: string) => void;
}

function interp(template: string, vars: Record<string, string | number>): string {
  let out = template;
  for (const [key, val] of Object.entries(vars)) {
    out = out.replaceAll(`{${key}}`, String(val));
  }
  return out;
}

export function TieredQuestsSelector({
  dailyQuests,
  weeklyQuests,
  selectedDailyIds,
  selectedWeeklyIds,
  autoGateByStats,
  currentStats,
  dailyQuestDuration,
  weeklyQuestDuration,
  questUptimeFraction,
  dailyDowntimeSec,
  weeklyDowntimeSec,
  onToggleDaily,
  onToggleDailyTier,
  onSetAllDaily,
  onToggleWeekly,
  onToggleWeeklyTier,
  onSetAllWeekly,
  onToggleAutoGate,
  onChangeDailyDuration,
  onChangeWeeklyDuration
}: TieredQuestsSelectorProps) {
  const t = useT();
  const { fmtNum } = useFormatters();

  const dailyTiers = getQuestsGroupedByTier(dailyQuests);
  const weeklyTiers = getQuestsGroupedByTier(weeklyQuests);

  const renderTierList = (
    tiers: ReturnType<typeof getQuestsGroupedByTier>,
    selectedIds: string[],
    onToggleQuest: (id: string) => void,
    onToggleTier: (ids: string[], enable: boolean) => void
  ) => (
    <div className="space-y-2">
      {tiers.map((group) => {
        const tierIds = group.quests.map((q) => q.id);
        const allSelected = tierIds.every((id) => selectedIds.includes(id));

        return (
          <div
            key={group.tokens}
            className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 p-2"
          >
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-[var(--accent)]">
                {interp(t.newSpts.tierRewardLabel, { val: fmtNum(group.tokens) })}
              </span>
              <button
                type="button"
                onClick={() => onToggleTier(tierIds, !allSelected)}
                className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
              >
                {allSelected ? t.common.selectNone : t.newSpts.selectTierBtn}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {group.quests.map((q) => {
                const checked = selectedIds.includes(q.id);
                const blocked = autoGateByStats && currentStats[q.stat] < q.target;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => onToggleQuest(q.id)}
                    aria-pressed={checked}
                    className={`inline-flex min-h-[28px] items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
                      checked
                        ? blocked
                          ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 opacity-75'
                          : 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--text-primary)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        checked
                          ? blocked
                            ? 'bg-amber-400'
                            : 'bg-[var(--accent)]'
                          : 'bg-[var(--text-secondary)]/40'
                      }`}
                    />
                    <span className="font-mono">
                      {q.stat} ({fmtNum(q.target)})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 p-3 text-xs">
      <div className="space-y-2 border-b border-[var(--border-subtle)] pb-2.5">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-primary)]">
          <input
            type="checkbox"
            checked={autoGateByStats}
            onChange={(e) => onToggleAutoGate(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          <span>{t.spts.autoGateQuestsToggle}</span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1">
            <span className="block truncate text-[10px] text-[var(--text-secondary)]">
              {t.spts.dailyQuestDurationLabel}
            </span>
            <input
              type="text"
              value={dailyQuestDuration}
              onChange={(e) => onChangeDailyDuration(e.target.value)}
              placeholder={t.spts.questDurationPlaceholder}
              className="min-h-[34px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="block space-y-1">
            <span className="block truncate text-[10px] text-[var(--text-secondary)]">
              {t.spts.weeklyQuestDurationLabel}
            </span>
            <input
              type="text"
              value={weeklyQuestDuration}
              onChange={(e) => onChangeWeeklyDuration(e.target.value)}
              placeholder={t.spts.questDurationPlaceholder}
              className="min-h-[34px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>

        {(dailyDowntimeSec > 0 || weeklyDowntimeSec > 0) && (
          <div className="text-[10px] text-[var(--text-secondary)]">
            {interp(t.spts.questDowntimeHint, {
              pct: Math.round(questUptimeFraction * 100)
            })}
          </div>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="font-semibold text-[var(--text-primary)]">
            {t.newSpts.dailyGroupTitle}
          </span>
          <div className="flex gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => onSetAllDaily(true)}
              className="text-[var(--accent)] hover:underline"
            >
              {t.common.selectAll}
            </button>
            <button
              type="button"
              onClick={() => onSetAllDaily(false)}
              className="text-[var(--text-secondary)] hover:underline"
            >
              {t.common.selectNone}
            </button>
          </div>
        </div>
        {renderTierList(dailyTiers, selectedDailyIds, onToggleDaily, onToggleDailyTier)}
      </div>

      <div className="border-t border-[var(--border-subtle)] pt-2.5">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="font-semibold text-[var(--text-primary)]">
            {t.newSpts.weeklyGroupTitle}
          </span>
          <div className="flex gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => onSetAllWeekly(true)}
              className="text-[var(--accent)] hover:underline"
            >
              {t.common.selectAll}
            </button>
            <button
              type="button"
              onClick={() => onSetAllWeekly(false)}
              className="text-[var(--text-secondary)] hover:underline"
            >
              {t.common.selectNone}
            </button>
          </div>
        </div>
        {renderTierList(weeklyTiers, selectedWeeklyIds, onToggleWeekly, onToggleWeeklyTier)}
      </div>
    </div>
  );
}
