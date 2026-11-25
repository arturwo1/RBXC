import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { CustomQuestEntry, CustomQuestRepeatType } from '../../core/newSptsTypes';
import { parseNumber } from '../../core/numbers';
import type { SptsStatType } from '../../core/sptsData';
import { useT } from '../../i18n';
import { useFormatters } from '../../lib/formatters';

interface CustomQuestsBuilderProps {
  customQuests: CustomQuestEntry[];
  customPerSecond: number;
  onceReadyTokens: number;
  onChange: (next: CustomQuestEntry[]) => void;
}

const STAT_OPTIONS: SptsStatType[] = ['FS', 'BT', 'PP', 'MS', 'JF'];

function interp(template: string, vars: Record<string, string | number>): string {
  let out = template;
  for (const [key, val] of Object.entries(vars)) {
    out = out.replaceAll(`{${key}}`, String(val));
  }
  return out;
}

export function CustomQuestsBuilder({
  customQuests,
  customPerSecond,
  onceReadyTokens,
  onChange
}: CustomQuestsBuilderProps) {
  const t = useT();
  const { fmtNum } = useFormatters();

  const [title, setTitle] = useState('');
  const [repeatType, setRepeatType] = useState<CustomQuestRepeatType>('once');
  const [resetHoursRaw, setResetHoursRaw] = useState('6');
  const [stat, setStat] = useState<SptsStatType>('FS');
  const [targetRaw, setTargetRaw] = useState('');
  const [rewardRaw, setRewardRaw] = useState('');

  const activeCount = customQuests.filter((q) => q.enabled).length;

  const handleAdd = () => {
    const reward = Math.max(0, parseNumber(rewardRaw));
    if (reward <= 0) return;

    const entry: CustomQuestEntry = {
      id: `cq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim() || `${stat} Quest`,
      repeatType,
      resetHours: repeatType === 'custom_hours' ? Math.max(0.1, Number(resetHoursRaw) || 6) : undefined,
      stat,
      targetStat: Math.max(0, parseNumber(targetRaw)),
      tokensReward: reward,
      enabled: true,
      completed: false
    };

    onChange([...customQuests, entry]);
    setTitle('');
    setTargetRaw('');
    setRewardRaw('');
  };

  const toggleEnabled = (id: string) => {
    onChange(customQuests.map((q) => (q.id === id ? { ...q, enabled: !q.enabled } : q)));
  };

  const toggleCompleted = (id: string) => {
    onChange(customQuests.map((q) => (q.id === id ? { ...q, completed: !q.completed } : q)));
  };

  const removeQuest = (id: string) => {
    onChange(customQuests.filter((q) => q.id !== id));
  };

  const repeatLabel = (q: CustomQuestEntry) => {
    if (q.repeatType === 'once') return t.newSpts.customQuestRepeatOnce;
    if (q.repeatType === 'daily') return t.newSpts.customQuestRepeatDaily;
    if (q.repeatType === 'weekly') return t.newSpts.customQuestRepeatWeekly;
    return `${q.resetHours ?? 24}h`;
  };

  return (
    <div className="space-y-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 p-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-[var(--text-primary)]">{t.newSpts.customQuestsTitle}</span>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {activeCount > 0 && (
            <span className="font-mono text-[var(--accent)]">
              {interp(t.newSpts.customQuestSummaryLine, {
                count: activeCount,
                perSec: fmtNum(customPerSecond)
              })}
            </span>
          )}
          {onceReadyTokens > 0 && (
            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
              {interp(t.newSpts.customQuestOnceReadyLabel, { val: fmtNum(onceReadyTokens) })}
            </span>
          )}
        </div>
      </div>

      {/* Builder Row */}
      <div className="space-y-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 p-2.5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.newSpts.customQuestNamePlaceholder}
            className="min-h-[34px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />

          <div className="flex gap-1.5">
            <select
              value={repeatType}
              onChange={(e) => setRepeatType(e.target.value as CustomQuestRepeatType)}
              aria-label={t.newSpts.customQuestRepeatLabel}
              className="min-h-[34px] flex-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            >
              <option value="once">{t.newSpts.customQuestRepeatOnce}</option>
              <option value="daily">{t.newSpts.customQuestRepeatDaily}</option>
              <option value="weekly">{t.newSpts.customQuestRepeatWeekly}</option>
              <option value="custom_hours">{t.newSpts.customQuestRepeatHours}</option>
            </select>

            {repeatType === 'custom_hours' && (
              <input
                type="number"
                min={0.1}
                step={0.5}
                value={resetHoursRaw}
                onChange={(e) => setResetHoursRaw(e.target.value)}
                placeholder={t.newSpts.customQuestHoursPlaceholder}
                className="min-h-[34px] w-20 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 font-mono text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          <select
            value={stat}
            onChange={(e) => setStat(e.target.value as SptsStatType)}
            aria-label={t.newSpts.customQuestStatLabel}
            className="min-h-[34px] rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          >
            {STAT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={targetRaw}
            onChange={(e) => setTargetRaw(e.target.value)}
            placeholder={t.newSpts.customQuestReqPlaceholder}
            className="min-h-[34px] rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />

          <input
            type="text"
            value={rewardRaw}
            onChange={(e) => setRewardRaw(e.target.value)}
            placeholder={t.newSpts.customQuestRewardPlaceholder}
            className="min-h-[34px] rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />

          <button
            type="button"
            onClick={handleAdd}
            disabled={parseNumber(rewardRaw) <= 0}
            className="inline-flex min-h-[34px] items-center justify-center gap-1 rounded-[var(--radius-control)] bg-[var(--accent)] px-3 text-xs font-semibold text-[var(--accent-fg)] disabled:opacity-45"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t.newSpts.customQuestsAddBtn}</span>
          </button>
        </div>
      </div>

      {/* Existing Quests List */}
      {customQuests.length === 0 ? (
        <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
          {t.newSpts.customQuestsEmpty}
        </p>
      ) : (
        <div className="space-y-1.5">
          {customQuests.map((q) => (
            <div
              key={q.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 ${
                q.enabled ? '' : 'opacity-55'
              }`}
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={q.enabled}
                  onChange={() => toggleEnabled(q.id)}
                  className="h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
                />
                <div className="min-w-0">
                  <div className="truncate font-semibold text-[var(--text-primary)]">
                    {q.title}{' '}
                    <span className="font-mono text-[var(--accent)]">+{fmtNum(q.tokensReward)}</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    {repeatLabel(q)} · {q.stat} ≥ {fmtNum(q.targetStat)}
                  </div>
                </div>
              </label>

              <div className="flex items-center gap-2">
                {q.repeatType === 'once' && (
                  <label className="flex cursor-pointer items-center gap-1 text-[10px] text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={Boolean(q.completed)}
                      onChange={() => toggleCompleted(q.id)}
                      className="h-3.5 w-3.5 accent-[var(--accent)]"
                    />
                    <span>{t.newSpts.customQuestCompletedLabel}</span>
                  </label>
                )}

                <button
                  type="button"
                  onClick={() => removeQuest(q.id)}
                  aria-label={t.common.delete}
                  className="rounded p-1 text-[var(--text-secondary)] hover:bg-rose-500/15 hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
