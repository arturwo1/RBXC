import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Info,
  Pause,
  Play,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Swords,
  Trophy,
  Zap
} from 'lucide-react';
import { AdSlot } from '../components/AdSlot';
import { FieldHeaderWithOverride } from '../components/OverrideToggle';
import { CustomQuestsBuilder } from '../components/spts/CustomQuestsBuilder';
import { ManualTickAndBonusControls } from '../components/spts/ManualTickAndBonusControls';
import { SptsVersionBanner } from '../components/spts/SptsVersionBanner';
import { formatNumber, parseNumber } from '../core/numbers';
import {
  buildAutoZoneProgression,
  calculateBloxyTrophy,
  calculateRobuxPackBreakdown,
  calculateTokenRate,
  computeBackgroundGrindDelta,
  computeBtDeathTrainEfficiency,
  estimatePlaytimeRange,
  evaluateBloxyTrophyInteraction,
  evaluateRobloxOgStatus,
  getNextZoneOrWeight,
  getSptsTickSeconds,
  inferBestWeightForStat,
  inferBestZoneForStat,
  simulatePvp,
  simulateStatProgress,
  type PvpActiveSkill,
  type PvpResolvedSkill,
  type QuestMode
} from '../core/spts';
import {
  BLOXY_TROPHY_TIERS,
  SPTS_CLASSIC_OG_BADGES,
  SPTS_DAILY_QUESTS,
  SPTS_LOCATIONS,
  SPTS_MULTIS,
  SPTS_QUESTS_DATA,
  SPTS_REPUTATION_TIERS,
  SPTS_VIP_PLANS,
  SPTS_WEEKLY_QUESTS,
  SPTS_WEIGHTS,
  SPTS_WIKI_ENTRIES,
  type BloxyTrophyRankId,
  type SptsQuestEntry,
  type SptsStatType
} from '../core/sptsData';
import { parseTime } from '../core/time';
import { useT } from '../i18n';
import { useFormatters } from '../lib/formatters';
import { usePageSeo } from '../lib/seo';
import {
  useActiveProfile,
  useAppStore,
  type GoalMode,
  type PlayerProfile,
  type RobloxClassicBadgeInfo,
  type SptsTab,
  type WikiCat,
  type WikiSection
} from '../store/useAppStore';

const STAT_OPTIONS: SptsStatType[] = ['FS', 'BT', 'PP', 'MS', 'JF'];
const STAT_GOAL_CHIPS_NUM = [1e6, 1e9, 1e12, 1e15, 1e18];
const TIME_GOAL_CHIPS = ['1h', '12h', '1d', '7d', '1mo'];
const VIP_DURATION_CHIPS = ['7d', '1mo', '3mo', ''];

type QuestGroupFilter = 'All' | SptsQuestEntry['group'];

function interp(template: string, vars: Record<string, string | number>): string {
  let out = template;
  for (const [key, val] of Object.entries(vars)) {
    out = out.replaceAll(`{${key}}`, String(val));
  }
  return out;
}

function formatStatPreserve(val: number): string {
  if (!Number.isFinite(val) || val <= 0) return '0';
  if (val < 1e6) {
    return Number.isInteger(val) ? String(val) : String(Number(val.toFixed(2)));
  }
  return formatNumber(val, { notation: 'standard', decimals: 4 });
}

function computeZoneAndGainPerSec(profile: PlayerProfile, stat: SptsStatType) {
  const { spts } = profile;
  const currentVal = parseNumber(spts.stats[stat]);
  const ppVal = parseNumber(spts.stats.PP);
  const multiVal = SPTS_MULTIS[spts.multis[stat]] ?? 1;
  const customTick = Number(spts.customTickSeconds[stat]);
  const tickSec = getSptsTickSeconds(
    stat,
    Number.isFinite(customTick) && customTick > 0 ? customTick : undefined
  );
  const customPerTick = parseNumber(spts.customPerTick);
  const equipBonusFactor = 1 + Math.max(0, Number(spts.equipmentBonusPercent) || 0) / 100;
  const deathReturnSec = parseTime(spts.btDeathReturnDuration);

  if (customPerTick > 0) {
    return {
      zoneId: 'custom',
      zoneMult: 1,
      minReq: 0,
      safeReq: 0,
      perTick: customPerTick * equipBonusFactor,
      tickSec,
      baseGainPerSec: customPerTick / tickSec,
      equipBonusFactor,
      isDeathTraining: false,
      deathEfficiency: 1,
      autoId:
        stat === 'MS' || stat === 'JF'
          ? inferBestWeightForStat(stat, currentVal).id
          : inferBestZoneForStat(stat, currentVal, ppVal, spts.safeAfkOnly).id,
      isAuto: false
    };
  }

  if (stat === 'MS' || stat === 'JF') {
    const autoW = inferBestWeightForStat(stat, currentVal);
    const chosenId = spts.weights[stat];
    const isAuto = !chosenId || chosenId === 'auto';
    const w = isAuto ? autoW : SPTS_WEIGHTS.find((x) => x.id === chosenId) ?? autoW;
    const perTick = multiVal * w.multiplier * equipBonusFactor;
    return {
      zoneId: w.id,
      zoneMult: w.multiplier,
      minReq: stat === 'MS' ? w.msRequirement : w.jfRequirement,
      safeReq: 0,
      perTick,
      tickSec,
      baseGainPerSec: w.multiplier / tickSec,
      equipBonusFactor,
      isDeathTraining: false,
      deathEfficiency: 1,
      autoId: autoW.id,
      isAuto
    };
  }

  const autoLoc = inferBestZoneForStat(stat, currentVal, ppVal, spts.safeAfkOnly);
  const chosenId = spts.locations[stat];
  const isAuto = !chosenId || chosenId === 'auto';

  if (stat === 'BT' && isAuto && !spts.safeAfkOnly && deathReturnSec > 0) {
    const steps = buildAutoZoneProgression('BT', tickSec, ppVal, false, deathReturnSec);
    let activeStep = steps[0];
    for (const step of steps) {
      if (currentVal >= step.minStat) activeStep = step;
    }
    const loc = SPTS_LOCATIONS.find((l) => l.id === activeStep.zoneId) ?? autoLoc;
    const eff = activeStep.isDeathTraining
      ? computeBtDeathTrainEfficiency(tickSec, deathReturnSec).efficiency
      : 1;
    return {
      zoneId: loc.id,
      zoneMult: loc.multiplier,
      minReq: loc.requirement,
      safeReq: loc.afkSafeRequirement ?? loc.requirement,
      perTick: multiVal * loc.multiplier * equipBonusFactor,
      tickSec,
      baseGainPerSec: (loc.multiplier * eff) / tickSec,
      equipBonusFactor,
      isDeathTraining: Boolean(activeStep.isDeathTraining),
      deathEfficiency: eff,
      autoId: loc.id,
      isAuto: true
    };
  }

  const loc = isAuto ? autoLoc : SPTS_LOCATIONS.find((l) => l.id === chosenId) ?? autoLoc;
  const safeReq = loc.afkSafeRequirement ?? loc.requirement;
  const isDeathTraining = stat === 'BT' && !spts.safeAfkOnly && loc.requirement > 0 && currentVal < safeReq;
  const deathEff =
    isDeathTraining && deathReturnSec > 0
      ? computeBtDeathTrainEfficiency(tickSec, deathReturnSec).efficiency
      : 1;
  const perTick = multiVal * loc.multiplier * equipBonusFactor;
  return {
    zoneId: loc.id,
    zoneMult: loc.multiplier,
    minReq: loc.requirement,
    safeReq,
    perTick,
    tickSec,
    baseGainPerSec: (loc.multiplier * deathEff) / tickSec,
    equipBonusFactor,
    isDeathTraining,
    deathEfficiency: deathEff,
    autoId: autoLoc.id,
    isAuto
  };
}

const ALL_PVP_SKILLS: PvpActiveSkill[] = [
  'fist',
  'bullet_punch',
  'energy_sphere',
  'psychic',
  'killing_intent',
  'hellfire',
  'soul_reap'
];

interface SkillMultiSelectProps {
  label: string;
  useAuto: boolean;
  selected: PvpActiveSkill[];
  onChange: (useAuto: boolean, selected: PvpActiveSkill[]) => void;
  autoLabel: string;
  noneLabel: string;
  selectedCountTemplate: string;
  selectAllLabel: string;
  selectNoneLabel: string;
  skillLabels: Record<PvpActiveSkill, string>;
}

function SkillMultiSelect({
  label,
  useAuto,
  selected,
  onChange,
  autoLabel,
  noneLabel,
  selectedCountTemplate,
  selectAllLabel,
  selectNoneLabel,
  skillLabels
}: SkillMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const summaryText = useAuto
    ? autoLabel
    : selected.length === 0
      ? noneLabel
      : selected.length <= 2
        ? selected.map((id) => skillLabels[id]).join(' + ')
        : interp(selectedCountTemplate, { count: selected.length });

  return (
    <div ref={rootRef} className="relative space-y-1">
      <div className="text-[11px] font-semibold text-[var(--text-secondary)]">{label}</div>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[38px] w-full items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 text-left text-xs text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]/60 focus:border-[var(--accent)] focus:outline-none"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              useAuto || selected.length > 0
                ? 'bg-[var(--accent)]'
                : 'bg-[var(--text-secondary)]/40'
            }`}
          />
          <span className="truncate font-medium">{summaryText}</span>
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-[var(--text-secondary)]" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--text-secondary)]" />
        )}
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 right-0 z-30 mt-1.5 space-y-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 shadow-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={useAuto}
                onChange={() => onChange(!useAuto, selected)}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
              />
              <span>{autoLabel}</span>
            </label>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => onChange(false, [...ALL_PVP_SKILLS])}
                className="font-medium text-[var(--accent)] hover:underline"
              >
                {selectAllLabel}
              </button>
              <button
                type="button"
                onClick={() => onChange(false, [])}
                className="font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline"
              >
                {selectNoneLabel}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {ALL_PVP_SKILLS.map((skillId) => {
              const checked = !useAuto && selected.includes(skillId);
              return (
                <label
                  key={skillId}
                  className={`flex cursor-pointer items-center gap-2 rounded-[var(--radius-control)] px-2 py-1.5 text-xs transition-colors hover:bg-[var(--bg-canvas)] ${
                    useAuto ? 'opacity-65' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const base = useAuto ? [] : selected;
                      const next = base.includes(skillId)
                        ? base.filter((x) => x !== skillId)
                        : [...base, skillId];
                      onChange(false, next);
                    }}
                    className="h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
                  />
                  <span className="truncate text-[var(--text-primary)]">
                    {skillLabels[skillId]}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function SptsClassicPage() {
  usePageSeo({
    title: 'SPTS Classic Calculator — Stats, Tokens, Bloxy Trophy & PVP | RBXC',
    description:
      'SPTS Classic calculator for Fist, Body, Psychic, Speed & Jump: auto-detected training zones, upgrade roadmap, Bloxy Trophy & OG checker, Robux packs, and PVP simulator.',
    canonicalPath: '/sptsc/',
    keywords:
      'SPTS Classic calculator, Super Power Training Simulator Classic, SPTS Bloxy Trophy, SPTS PVP calculator, SPTS playtime calculator, RBXC',
    breadcrumbs: [
      { name: 'Hub', path: '/' },
      { name: 'SPTS Classic Calculator', path: '/sptsc/' }
    ]
  });

  const t = useT();
  const { fmtNum, fmtMult, fmtTime, fmtEta } = useFormatters();

  const profiles = useAppStore((s) => s.profiles);
  const profile = useActiveProfile();
  const updateActiveProfile = useAppStore((s) => s.updateActiveProfile);

  const { spts, sptsUi, grindSession } = profile;

  const [zoneOverrideOpen, setZoneOverrideOpen] = useState(false);
  const [multiOverrideOpen, setMultiOverrideOpen] = useState(false);
  const [goalOverrideOpen, setGoalOverrideOpen] = useState(false);
  const [statsQuestsOpen, setStatsQuestsOpen] = useState(false);
  const [playtimeQuestsOpen, setPlaytimeQuestsOpen] = useState(false);
  const [wikiQuestGroup, setWikiQuestGroup] = useState<QuestGroupFilter>('All');
  const [pvpConditionsOpen, setPvpConditionsOpen] = useState(false);
  const [pvpLogOpen, setPvpLogOpen] = useState(false);

  const [ogQuery, setOgQuery] = useState(() => profile.robloxUsername ?? '');
  const [ogChecking, setOgChecking] = useState(false);
  const [ogError, setOgError] = useState<string | null>(null);
  const [ogLookup, setOgLookup] = useState<{
    userId: number;
    username: string;
    displayName: string;
    createdAt: string | null;
    avatarUrl: string | null;
    halfCooldown?: boolean;
    classicBadges: RobloxClassicBadgeInfo[];
    earliestClassicBadgeDate: string | null;
  } | null>(null);

  const [trophyTargetRank, setTrophyTargetRank] = useState<BloxyTrophyRankId>('elite');
  const [trophyTargetPowerRaw, setTrophyTargetPowerRaw] = useState('');
  const [trophyTargetInCombat, setTrophyTargetInCombat] = useState(false);

  const [nowMs, setNowMs] = useState(() => Date.now());

  const updateSpts = useCallback(
    (patch: Partial<typeof spts>) => {
      updateActiveProfile((p) => ({
        ...p,
        spts: { ...p.spts, ...patch }
      }));
    },
    [updateActiveProfile]
  );

  const updateSptsUi = useCallback(
    (patch: Partial<typeof sptsUi>) => {
      updateActiveProfile((p) => ({
        ...p,
        sptsUi: { ...p.sptsUi, ...patch }
      }));
    },
    [updateActiveProfile]
  );

  const activeStat = sptsUi.statType;
  const activeGoalRaw = sptsUi.statGoals?.[activeStat] ?? sptsUi.goalValueRaw ?? '';
  const activeGoalMode: GoalMode =
    sptsUi.statGoalModes?.[activeStat] ?? sptsUi.goalMode ?? 'amountToTime';

  const setActiveGoalRaw = useCallback(
    (raw: string, statKey: SptsStatType = activeStat) => {
      updateActiveProfile((p) => ({
        ...p,
        sptsUi: {
          ...p.sptsUi,
          goalValueRaw: raw,
          statGoals: {
            ...p.sptsUi.statGoals,
            [statKey]: raw
          }
        }
      }));
    },
    [activeStat, updateActiveProfile]
  );

  const setActiveGoalMode = useCallback(
    (mode: GoalMode, statKey: SptsStatType = activeStat) => {
      updateActiveProfile((p) => ({
        ...p,
        sptsUi: {
          ...p.sptsUi,
          goalMode: mode,
          statGoalModes: {
            ...p.sptsUi.statGoalModes,
            [statKey]: mode
          }
        }
      }));
    },
    [activeStat, updateActiveProfile]
  );

  // Individual Daily & Weekly quest toggles
  const selectedDailyIds = spts.selectedDailyQuests ?? [];
  const selectedWeeklyIds = spts.selectedWeeklyQuests ?? [];

  const toggleDailyQuest = useCallback(
    (id: string) => {
      const next = selectedDailyIds.includes(id)
        ? selectedDailyIds.filter((x) => x !== id)
        : [...selectedDailyIds, id];
      const total = SPTS_DAILY_QUESTS.filter((q) => next.includes(q.id)).reduce(
        (acc, q) => acc + q.tokens,
        0
      );
      updateSpts({
        selectedDailyQuests: next,
        dailyQuests: next.length > 0,
        dailyQuestValue: total
      });
    },
    [selectedDailyIds, updateSpts]
  );

  const setAllDailyQuests = useCallback(
    (selectAll: boolean) => {
      const next = selectAll ? SPTS_DAILY_QUESTS.map((q) => q.id) : [];
      const total = selectAll ? 100 : 0;
      updateSpts({
        selectedDailyQuests: next,
        dailyQuests: selectAll,
        dailyQuestValue: total
      });
    },
    [updateSpts]
  );

  const toggleWeeklyQuest = useCallback(
    (id: string) => {
      const next = selectedWeeklyIds.includes(id)
        ? selectedWeeklyIds.filter((x) => x !== id)
        : [...selectedWeeklyIds, id];
      const total = SPTS_WEEKLY_QUESTS.filter((q) => next.includes(q.id)).reduce(
        (acc, q) => acc + q.tokens,
        0
      );
      updateSpts({
        selectedWeeklyQuests: next,
        weeklyQuests: next.length > 0,
        weeklyQuestValue: total
      });
    },
    [selectedWeeklyIds, updateSpts]
  );

  const setAllWeeklyQuests = useCallback(
    (selectAll: boolean) => {
      const next = selectAll ? SPTS_WEEKLY_QUESTS.map((q) => q.id) : [];
      const total = selectAll ? 9300 : 0;
      updateSpts({
        selectedWeeklyQuests: next,
        weeklyQuests: selectAll,
        weeklyQuestValue: total
      });
    },
    [updateSpts]
  );

  const syncBackgroundGrind = useCallback((forceTickClock = false) => {
    const now = Date.now();
    if (forceTickClock) setNowMs(now);

    const store = useAppStore.getState();
    const currProfile = store.getActiveProfile();
    const gs = currProfile.grindSession;
    if (!gs.running || gs.lastCheckpointAtMs <= 0) return;

    const sessionStat = gs.statType || currProfile.sptsUi.statType;
    const rateInfo = computeZoneAndGainPerSec(currProfile, sessionStat);
    const totalGainPerSec = rateInfo.perTick / rateInfo.tickSec;
    const delta = computeBackgroundGrindDelta(gs.lastCheckpointAtMs, now, totalGainPerSec);

    if (delta.awaySeconds < 0.8) return;

    setNowMs(now);
    const isBackgroundReturn = delta.awaySeconds >= 5;

    store.updateActiveProfile((curr) => {
      const currentStatVal = parseNumber(curr.spts.stats[sessionStat]);
      const nextStatVal = currentStatVal + delta.gainedAmount;

      const prevBanner = curr.grindSession.pendingAwayBanner;
      const nextBanner = isBackgroundReturn
        ? {
            awaySeconds:
              prevBanner && prevBanner.statType === sessionStat
                ? prevBanner.awaySeconds + delta.awaySeconds
                : delta.awaySeconds,
            addedAmount:
              prevBanner && prevBanner.statType === sessionStat
                ? prevBanner.addedAmount + delta.gainedAmount
                : delta.gainedAmount,
            statType: sessionStat
          }
        : curr.grindSession.pendingAwayBanner;

      return {
        ...curr,
        spts: {
          ...curr.spts,
          stats: {
            ...curr.spts.stats,
            [sessionStat]:
              isBackgroundReturn || delta.gainedAmount >= 1
                ? formatStatPreserve(nextStatVal)
                : curr.spts.stats[sessionStat]
          }
        },
        grindSession: {
          ...curr.grindSession,
          lastCheckpointAtMs: now,
          accumulatedSeconds: curr.grindSession.accumulatedSeconds + delta.awaySeconds,
          sessionAddedAmount: curr.grindSession.sessionAddedAmount + delta.gainedAmount,
          pendingAwayBanner: nextBanner
        }
      };
    });
  }, []);

  useEffect(() => {
    if (!grindSession.running) return;
    syncBackgroundGrind(false);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncBackgroundGrind(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    const id = window.setInterval(() => syncBackgroundGrind(true), 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(id);
    };
  }, [grindSession.running, syncBackgroundGrind]);

  const toggleGrindSession = () => {
    const now = Date.now();
    if (grindSession.running) {
      const sessionStat = grindSession.statType || sptsUi.statType;
      const rateInfo = computeZoneAndGainPerSec(profile, sessionStat);
      const gainPerSec = rateInfo.perTick / rateInfo.tickSec;
      const delta = computeBackgroundGrindDelta(grindSession.lastCheckpointAtMs, now, gainPerSec);
      updateActiveProfile((curr) => {
        const nextVal = parseNumber(curr.spts.stats[sessionStat]) + delta.gainedAmount;
        return {
          ...curr,
          spts: {
            ...curr.spts,
            stats: {
              ...curr.spts.stats,
              [sessionStat]: formatStatPreserve(nextVal)
            }
          },
          grindSession: {
            ...curr.grindSession,
            running: false,
            lastCheckpointAtMs: now,
            accumulatedSeconds: curr.grindSession.accumulatedSeconds + delta.awaySeconds,
            sessionAddedAmount: curr.grindSession.sessionAddedAmount + delta.gainedAmount
          }
        };
      });
    } else {
      updateActiveProfile((curr) => ({
        ...curr,
        grindSession: {
          ...curr.grindSession,
          running: true,
          statType: sptsUi.statType,
          startedAtMs: curr.grindSession.startedAtMs || now,
          lastCheckpointAtMs: now
        }
      }));
    }
  };

  const resetGrindSession = () => {
    updateActiveProfile((curr) => ({
      ...curr,
      grindSession: {
        running: false,
        statType: sptsUi.statType,
        startedAtMs: 0,
        lastCheckpointAtMs: 0,
        accumulatedSeconds: 0,
        sessionAddedAmount: 0,
        pendingAwayBanner: null
      }
    }));
  };

  const discardAwayStats = () => {
    const banner = grindSession.pendingAwayBanner;
    if (!banner) return;
    const now = Date.now();
    updateActiveProfile((curr) => {
      const currentVal = parseNumber(curr.spts.stats[banner.statType]);
      const rolledBack = Math.max(0, currentVal - banner.addedAmount);
      return {
        ...curr,
        spts: {
          ...curr.spts,
          stats: {
            ...curr.spts.stats,
            [banner.statType]: rolledBack > 0 ? formatStatPreserve(rolledBack) : ''
          }
        },
        grindSession: {
          ...curr.grindSession,
          accumulatedSeconds: Math.max(0, curr.grindSession.accumulatedSeconds - banner.awaySeconds),
          sessionAddedAmount: Math.max(0, curr.grindSession.sessionAddedAmount - banner.addedAmount),
          lastCheckpointAtMs: now,
          pendingAwayBanner: null
        }
      };
    });
  };

  const dismissAwayBanner = () => {
    updateActiveProfile((curr) => ({
      ...curr,
      grindSession: {
        ...curr.grindSession,
        pendingAwayBanner: null
      }
    }));
  };

  // --- Shared Core Calculations ---
  const sptsStatsNum = useMemo(
    () => ({
      FS: parseNumber(spts.stats.FS),
      BT: parseNumber(spts.stats.BT),
      PP: parseNumber(spts.stats.PP),
      MS: parseNumber(spts.stats.MS),
      JF: parseNumber(spts.stats.JF)
    }),
    [spts.stats.BT, spts.stats.FS, spts.stats.JF, spts.stats.MS, spts.stats.PP]
  );

  const dailyQuestTimeSec = useMemo(
    () => parseTime(spts.dailyQuestDuration),
    [spts.dailyQuestDuration]
  );
  const weeklyQuestTimeSec = useMemo(
    () => parseTime(spts.weeklyQuestDuration),
    [spts.weeklyQuestDuration]
  );
  const btDeathReturnSec = useMemo(
    () => parseTime(spts.btDeathReturnDuration),
    [spts.btDeathReturnDuration]
  );

  const currentStatVal = sptsStatsNum[activeStat];
  const currentTokensVal = parseNumber(spts.tokens);
  const currentMultiKey = spts.multis[activeStat] || 'x1';
  const currentMultiVal = SPTS_MULTIS[currentMultiKey] ?? 1;

  const zoneCalc = useMemo(
    () => computeZoneAndGainPerSec(profile, activeStat),
    [activeStat, profile]
  );

  const btDeathEffPreview = useMemo(
    () => computeBtDeathTrainEfficiency(zoneCalc.tickSec, btDeathReturnSec),
    [btDeathReturnSec, zoneCalc.tickSec]
  );

  const nextZoneInfo = useMemo(
    () => getNextZoneOrWeight(activeStat, currentStatVal, spts.safeAfkOnly),
    [activeStat, currentStatVal, spts.safeAfkOnly]
  );

  const vipRemainingSeconds = useMemo(() => {
    if (!spts.vip) return 0;
    if (!spts.vipDuration.trim()) return Infinity;
    const parsed = parseTime(spts.vipDuration);
    return parsed > 0 ? parsed : Infinity;
  }, [spts.vip, spts.vipDuration]);

  const questConfig = useMemo(
    () => ({
      dailyQuests: spts.dailyQuests,
      weeklyQuests: spts.weeklyQuests,
      vip: spts.vip,
      vipRemainingSeconds,
      passiveTokensPerMinute: spts.passiveTokensPerMin,
      dailyQuestValue: spts.dailyQuestValue,
      weeklyQuestValue: spts.weeklyQuestValue,
      autoGateByStats: spts.autoGateQuestsByStats,
      currentStats: sptsStatsNum,
      trainedStat: activeStat,
      selectedDailyQuestIds: selectedDailyIds,
      selectedWeeklyQuestIds: selectedWeeklyIds,
      dailyQuestTimeSeconds: dailyQuestTimeSec,
      weeklyQuestTimeSeconds: weeklyQuestTimeSec,
      customQuests: spts.customQuests
    }),
    [
      activeStat,
      dailyQuestTimeSec,
      selectedDailyIds,
      selectedWeeklyIds,
      spts.autoGateQuestsByStats,
      spts.customQuests,
      spts.dailyQuestValue,
      spts.dailyQuests,
      spts.passiveTokensPerMin,
      spts.vip,
      spts.weeklyQuestValue,
      spts.weeklyQuests,
      sptsStatsNum,
      vipRemainingSeconds,
      weeklyQuestTimeSec
    ]
  );

  const tokenRate = useMemo(() => calculateTokenRate(questConfig), [questConfig]);

  // --- Stats Simulation with Auto-Zone Climbing ---
  const simulation = useMemo(() => {
    const hasCustomPerTick = parseNumber(spts.customPerTick) > 0;
    const effectiveBaseGainPerSec = hasCustomPerTick
      ? zoneCalc.baseGainPerSec / Math.max(1, currentMultiVal)
      : zoneCalc.baseGainPerSec;

    const autoProgression = zoneCalc.isAuto
      ? buildAutoZoneProgression(
          activeStat,
          zoneCalc.tickSec,
          sptsStatsNum.PP,
          spts.safeAfkOnly,
          btDeathReturnSec
        )
      : undefined;

    const effectiveRate = sptsUi.simulateUpgrades ? tokenRate.totalPerSecond : 0;

    if (activeGoalMode === 'amountToTime') {
      const target = parseNumber(activeGoalRaw);
      if (target <= currentStatVal || target <= 0) return null;
      return simulateStatProgress({
        currentStat: currentStatVal,
        goalStat: target,
        baseGainPerSecond: effectiveBaseGainPerSec,
        currentMultiKey,
        tokenPerSecond: effectiveRate,
        currentTokens: currentTokensVal,
        questMode: spts.questMode,
        questConfig,
        zoneProgression: autoProgression,
        simulateUpgrades: sptsUi.simulateUpgrades,
        equipmentBonusPercent: spts.equipmentBonusPercent
      });
    } else {
      const targetSec = parseTime(activeGoalRaw);
      if (targetSec <= 0) return null;
      return simulateStatProgress({
        currentStat: currentStatVal,
        goalStat: Infinity,
        baseGainPerSecond: effectiveBaseGainPerSec,
        currentMultiKey,
        tokenPerSecond: effectiveRate,
        currentTokens: currentTokensVal,
        maxTime: targetSec,
        questMode: spts.questMode,
        questConfig,
        zoneProgression: autoProgression,
        simulateUpgrades: sptsUi.simulateUpgrades,
        equipmentBonusPercent: spts.equipmentBonusPercent
      });
    }
  }, [
    activeGoalMode,
    activeGoalRaw,
    activeStat,
    btDeathReturnSec,
    currentMultiKey,
    currentMultiVal,
    currentStatVal,
    currentTokensVal,
    questConfig,
    spts.customPerTick,
    spts.equipmentBonusPercent,
    spts.questMode,
    spts.safeAfkOnly,
    sptsStatsNum.PP,
    sptsUi.simulateUpgrades,
    tokenRate.totalPerSecond,
    zoneCalc.baseGainPerSec,
    zoneCalc.isAuto,
    zoneCalc.tickSec
  ]);

  // --- Token Tab Calculations ---
  const tokenGoalAmount = parseNumber(sptsUi.tokenGoalRaw);
  const tokenGoalSeconds = parseTime(sptsUi.tokenGoalRaw);

  const tokenProjection = useMemo(() => {
    if (sptsUi.tokenGoalMode === 'amountToTime') {
      if (tokenGoalAmount <= currentTokensVal) return 0;
      const diff = tokenGoalAmount - currentTokensVal;
      return tokenRate.totalPerSecond > 0 ? diff / tokenRate.totalPerSecond : Infinity;
    } else {
      if (tokenGoalSeconds <= 0) return 0;
      return currentTokensVal + tokenGoalSeconds * tokenRate.totalPerSecond;
    }
  }, [currentTokensVal, sptsUi.tokenGoalMode, tokenGoalAmount, tokenGoalSeconds, tokenRate.totalPerSecond]);

  const robuxPlans = useMemo(() => {
    const desired = parseNumber(sptsUi.robuxTargetTokens);
    return calculateRobuxPackBreakdown(desired, sptsUi.packGroup, sptsUi.firstPurchaseX2);
  }, [sptsUi.firstPurchaseX2, sptsUi.packGroup, sptsUi.robuxTargetTokens]);

  // --- PlayTime Calculations ---
  const playtime = useMemo(() => {
    const vipDiv = spts.vip && vipRemainingSeconds > 0 ? 2 : 1;
    return estimatePlaytimeRange({
      currentMultis: spts.multis,
      currentTokens: currentTokensVal,
      assumptions: {
        tpm: spts.passiveTokensPerMin,
        dailyBase: tokenRate.dailyPayout / vipDiv,
        weeklyBase: tokenRate.weeklyPayout / vipDiv,
        customHoursPerSec: tokenRate.customHoursPerSecond / vipDiv
      }
    });
  }, [
    currentTokensVal,
    spts.multis,
    spts.passiveTokensPerMin,
    spts.vip,
    tokenRate.customHoursPerSecond,
    tokenRate.dailyPayout,
    tokenRate.weeklyPayout,
    vipRemainingSeconds
  ]);

  // --- Bloxy Trophy & OG Detection ---
  const bloxyTrophy = useMemo(
    () =>
      calculateBloxyTrophy({
        currentMultis: spts.multis,
        isOg: Boolean(spts.isOgPlayer),
        tokenPerSecond: tokenRate.totalPerSecond
      }),
    [spts.isOgPlayer, spts.multis, tokenRate.totalPerSecond]
  );

  const selfTotalPower = useMemo(
    () => STAT_OPTIONS.reduce((acc, st) => acc + parseNumber(spts.stats[st]), 0),
    [spts.stats]
  );

  const trophyInteraction = useMemo(
    () =>
      evaluateBloxyTrophyInteraction({
        selfRank: bloxyTrophy.effectiveRank,
        selfTotalPower,
        targetRank: trophyTargetRank,
        targetTotalPower: parseNumber(trophyTargetPowerRaw),
        targetInCombat: trophyTargetInCombat
      }),
    [
      bloxyTrophy.effectiveRank,
      selfTotalPower,
      trophyTargetInCombat,
      trophyTargetPowerRaw,
      trophyTargetRank
    ]
  );

  const activeOgSource = useMemo(() => {
    if (ogLookup) {
      return {
        displayName: ogLookup.displayName,
        username: ogLookup.username,
        userId: ogLookup.userId,
        avatarUrl: ogLookup.avatarUrl,
        createdAt: ogLookup.createdAt,
        classicBadges: ogLookup.classicBadges,
        earliestClassicBadgeDate: ogLookup.earliestClassicBadgeDate
      };
    }
    if (profile.robloxUserId) {
      return {
        displayName: profile.name,
        username: profile.robloxUsername ?? '',
        userId: profile.robloxUserId,
        avatarUrl: profile.avatarUrl ?? null,
        createdAt: profile.robloxCreatedAt ?? null,
        classicBadges: profile.robloxClassicBadges ?? [],
        earliestClassicBadgeDate: profile.robloxClassicEarliestBadgeAt ?? null
      };
    }
    return null;
  }, [
    ogLookup,
    profile.avatarUrl,
    profile.name,
    profile.robloxClassicBadges,
    profile.robloxClassicEarliestBadgeAt,
    profile.robloxCreatedAt,
    profile.robloxUserId,
    profile.robloxUsername
  ]);

  const activeOgEvaluation = useMemo(
    () =>
      activeOgSource
        ? evaluateRobloxOgStatus({
            accountCreatedAt: activeOgSource.createdAt,
            badgeAwardedDates:
              activeOgSource.classicBadges.length > 0
                ? activeOgSource.classicBadges.map((b) => b.awardedDate)
                : [activeOgSource.earliestClassicBadgeDate]
          })
        : null,
    [activeOgSource]
  );

  const handleCheckRobloxOg = async () => {
    const query = ogQuery.trim();
    if (!query) return;
    setOgChecking(true);
    setOgError(null);
    try {
      const res = await fetch(`/api/roblox-user?query=${encodeURIComponent(query)}`);
      const data = (await res.json()) as {
        userId?: number;
        username?: string;
        displayName?: string;
        createdAt?: string | null;
        avatarUrl?: string | null;
        gamepasses?: { halfCooldown?: boolean };
        classicBadges?: RobloxClassicBadgeInfo[];
        earliestClassicBadgeDate?: string | null;
        error?: string;
      };
      if (!res.ok || data.error || !data.userId || !data.username) {
        setOgError(data.error || t.profiles.lookupUnavailable);
      } else {
        setOgLookup({
          userId: data.userId,
          username: data.username,
          displayName: data.displayName || data.username,
          createdAt: data.createdAt ?? null,
          avatarUrl: data.avatarUrl ?? null,
          halfCooldown: data.gamepasses?.halfCooldown,
          classicBadges: Array.isArray(data.classicBadges) ? data.classicBadges : [],
          earliestClassicBadgeDate: data.earliestClassicBadgeDate ?? null
        });
      }
    } catch {
      setOgError(t.profiles.lookupUnreachable);
    } finally {
      setOgChecking(false);
    }
  };

  const applyOgLookupToProfile = () => {
    if (!ogLookup) return;
    const ogEval = evaluateRobloxOgStatus({
      accountCreatedAt: ogLookup.createdAt,
      badgeAwardedDates: ogLookup.classicBadges.map((b) => b.awardedDate)
    });
    updateActiveProfile((curr) => ({
      ...curr,
      robloxUsername: ogLookup.username,
      robloxUserId: ogLookup.userId,
      avatarUrl: ogLookup.avatarUrl,
      robloxCreatedAt: ogLookup.createdAt,
      robloxClassicEarliestBadgeAt: ogLookup.earliestClassicBadgeDate,
      robloxClassicBadges: ogLookup.classicBadges,
      spts: {
        ...curr.spts,
        halfCooldownPass:
          typeof ogLookup.halfCooldown === 'boolean'
            ? ogLookup.halfCooldown
            : curr.spts.halfCooldownPass,
        isOgPlayer: ogEval.suggestedIsOg ? true : curr.spts.isOgPlayer,
        classicStartYear:
          ogEval.suggestedStartYear !== null
            ? String(ogEval.suggestedStartYear)
            : curr.spts.classicStartYear
      }
    }));
  };

  const formatTrophyTitle = (rankId: BloxyTrophyRankId, isOgFlag: boolean) => {
    if (rankId === 'none') return t.spts.trophyNoTrophy;
    const prefix = isOgFlag ? t.spts.trophyPrefixOg : t.spts.trophyPrefixClassic;
    return `${prefix} ${t.spts.trophyRankNames[rankId]}`;
  };

  // --- PVP Simulation ---
  const otherProfiles = useMemo(
    () => profiles.filter((p) => p.id !== profile.id),
    [profile.id, profiles]
  );

  const selectedOpponentProfile = useMemo(
    () => otherProfiles.find((p) => p.id === sptsUi.opponentSourceId) ?? null,
    [otherProfiles, sptsUi.opponentSourceId]
  );

  const oppName = selectedOpponentProfile
    ? selectedOpponentProfile.name
    : sptsUi.manualOpponent.name || t.spts.pvpOpponentDefaultName;
  const oppFsRaw = selectedOpponentProfile
    ? selectedOpponentProfile.spts.stats.FS
    : sptsUi.manualOpponent.fs;
  const oppBtRaw = selectedOpponentProfile
    ? selectedOpponentProfile.spts.stats.BT
    : sptsUi.manualOpponent.bt;
  const oppPpRaw = selectedOpponentProfile
    ? selectedOpponentProfile.spts.stats.PP
    : sptsUi.manualOpponent.pp;
  const oppHalfCooldown = selectedOpponentProfile
    ? selectedOpponentProfile.spts.halfCooldownPass
    : Boolean(sptsUi.manualOpponent.halfCooldown);

  const pvpConditions = sptsUi.pvpConditions ?? {
    leftInvis: false,
    rightInvis: false,
    leftDodge: 0,
    rightDodge: 0,
    leftHellfire: false,
    rightHellfire: false
  };

  const pvpSelectedSkills = sptsUi.pvpSelectedSkills ?? ['fist', 'energy_sphere', 'bullet_punch', 'psychic'];
  const pvpUseAutoSkills = sptsUi.pvpUseAutoSkills ?? true;
  const pvpOpponentSelectedSkills = sptsUi.pvpOpponentSelectedSkills ?? [
    'fist',
    'energy_sphere',
    'bullet_punch',
    'psychic'
  ];
  const pvpOpponentUseAutoSkills = sptsUi.pvpOpponentUseAutoSkills ?? true;

  const pvpSkillLabels = useMemo<Record<PvpActiveSkill, string>>(
    () => ({
      fist: t.spts.pvpModeFist,
      bullet_punch: t.spts.pvpModeBullet,
      energy_sphere: t.spts.pvpModeSphere,
      psychic: t.spts.pvpModePsychic,
      killing_intent: t.spts.pvpModeKillingIntent,
      hellfire: t.spts.pvpModeHellfire,
      soul_reap: t.spts.pvpModeSoulReap
    }),
    [
      t.spts.pvpModeBullet,
      t.spts.pvpModeFist,
      t.spts.pvpModeHellfire,
      t.spts.pvpModeKillingIntent,
      t.spts.pvpModePsychic,
      t.spts.pvpModeSoulReap,
      t.spts.pvpModeSphere
    ]
  );

  const pvpSim = useMemo(
    () =>
      simulatePvp(
        {
          name: profile.name,
          fs: sptsStatsNum.FS,
          bt: sptsStatsNum.BT,
          pp: sptsStatsNum.PP,
          ms: sptsStatsNum.MS,
          jf: sptsStatsNum.JF,
          halfCooldown: spts.halfCooldownPass,
          invisibility: pvpConditions.leftInvis,
          dodgeChance: pvpConditions.leftDodge,
          hasHellfire: pvpConditions.leftHellfire
        },
        {
          name: oppName,
          fs: parseNumber(oppFsRaw),
          bt: parseNumber(oppBtRaw),
          pp: parseNumber(oppPpRaw),
          ms: 0,
          jf: 0,
          halfCooldown: oppHalfCooldown,
          invisibility: pvpConditions.rightInvis,
          dodgeChance: pvpConditions.rightDodge,
          hasHellfire: pvpConditions.rightHellfire
        },
        {
          mode: 'auto',
          attackerSkills: pvpUseAutoSkills ? undefined : pvpSelectedSkills,
          defenderSkills: pvpOpponentUseAutoSkills ? undefined : pvpOpponentSelectedSkills
        }
      ),
    [
      oppBtRaw,
      oppFsRaw,
      oppHalfCooldown,
      oppName,
      oppPpRaw,
      profile.name,
      pvpConditions.leftDodge,
      pvpConditions.leftHellfire,
      pvpConditions.leftInvis,
      pvpConditions.rightDodge,
      pvpConditions.rightHellfire,
      pvpConditions.rightInvis,
      pvpOpponentSelectedSkills,
      pvpOpponentUseAutoSkills,
      pvpSelectedSkills,
      pvpUseAutoSkills,
      spts.halfCooldownPass,
      sptsStatsNum.BT,
      sptsStatsNum.FS,
      sptsStatsNum.JF,
      sptsStatsNum.MS,
      sptsStatsNum.PP
    ]
  );

  // Localized zone/weight summary string for Current Stat sublabel
  const activeZoneLabel = useMemo(() => {
    if (zoneCalc.zoneId === 'custom') {
      return `${t.common.customLabel}: ${fmtNum(zoneCalc.perTick)} / ${zoneCalc.tickSec}${t.timeUnits.s}`;
    }
    const baseName =
      activeStat === 'MS' || activeStat === 'JF'
        ? t.spts.weights[zoneCalc.zoneId] ?? zoneCalc.zoneId
        : t.spts.locations[zoneCalc.zoneId] ?? zoneCalc.zoneId;
    const btBadge =
      activeStat === 'BT'
        ? ` · ${spts.safeAfkOnly ? t.spts.btModeSafe4x : t.spts.btModeRisky1x}`
        : '';
    if (zoneCalc.isAuto) {
      return `${t.spts.autoZoneDetected}: ${baseName} (${fmtMult(zoneCalc.zoneMult)})${btBadge}`;
    }
    return `${baseName} (${fmtMult(zoneCalc.zoneMult)})${btBadge}`;
  }, [
    activeStat,
    fmtMult,
    fmtNum,
    spts.safeAfkOnly,
    t.common.customLabel,
    t.spts.autoZoneDetected,
    t.spts.btModeRisky1x,
    t.spts.btModeSafe4x,
    t.spts.locations,
    t.spts.weights,
    t.timeUnits.s,
    zoneCalc.isAuto,
    zoneCalc.perTick,
    zoneCalc.tickSec,
    zoneCalc.zoneId,
    zoneCalc.zoneMult
  ]);

  const hasZoneOverride =
    spts.gainCalcMode === 'manual' ||
    spts.equipmentBonusPercent > 0 ||
    (activeStat === 'MS' || activeStat === 'JF'
      ? spts.weights[activeStat] !== 'auto'
      : spts.locations[activeStat] !== 'auto') ||
    spts.customPerTick.trim() !== '' ||
    spts.customTickSeconds[activeStat].trim() !== '';

  const hasQuestOverride =
    !spts.dailyQuests ||
    !spts.weeklyQuests ||
    spts.vip ||
    spts.autoGateQuestsByStats ||
    spts.dailyQuestDuration.trim() !== '' ||
    spts.weeklyQuestDuration.trim() !== '' ||
    spts.passiveTokensPerMin !== 5 ||
    spts.dailyQuestValue !== 100 ||
    spts.weeklyQuestValue !== 9300 ||
    spts.questMode !== 'discrete' ||
    activeGoalMode !== 'amountToTime';

  const btAfkWarning = useMemo(() => {
    if (activeStat !== 'BT' || zoneCalc.isAuto || zoneCalc.zoneId === 'custom') return null;
    if (currentStatVal < zoneCalc.minReq) {
      return interp(t.spts.afkWarningMinReq, {
        min: fmtNum(zoneCalc.minReq),
        curr: fmtNum(currentStatVal)
      });
    }
    if (zoneCalc.safeReq > 0 && currentStatVal < zoneCalc.safeReq) {
      return interp(t.spts.afkWarningSafeReq, {
        safe: fmtNum(zoneCalc.safeReq)
      });
    }
    return null;
  }, [
    activeStat,
    currentStatVal,
    fmtNum,
    t.spts.afkWarningMinReq,
    t.spts.afkWarningSafeReq,
    zoneCalc.isAuto,
    zoneCalc.minReq,
    zoneCalc.safeReq,
    zoneCalc.zoneId
  ]);

  const filteredWikiEntries = useMemo(() => {
    const q = sptsUi.wikiSearch.trim().toLowerCase();
    return SPTS_WIKI_ENTRIES.filter((entry) => {
      if (sptsUi.wikiCat !== 'All' && entry.category !== sptsUi.wikiCat) return false;
      if (!q) return true;
      const localized = t.spts.wikiEntries[entry.id];
      return (
        localized?.name.toLowerCase().includes(q) ||
        localized?.unlock.toLowerCase().includes(q) ||
        localized?.effect.toLowerCase().includes(q)
      );
    });
  }, [sptsUi.wikiCat, sptsUi.wikiSearch, t.spts.wikiEntries]);

  const filteredQuests = useMemo(() => {
    const q = sptsUi.wikiSearch.trim().toLowerCase();
    return SPTS_QUESTS_DATA.filter((entry) => {
      if (wikiQuestGroup !== 'All' && entry.group !== wikiQuestGroup) return false;
      if (!q) return true;
      const localized = t.spts.quests[entry.id];
      return (
        localized?.title.toLowerCase().includes(q) ||
        localized?.req.toLowerCase().includes(q) ||
        localized?.reward.toLowerCase().includes(q) ||
        (localized?.unlocks?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [sptsUi.wikiSearch, t.spts.quests, wikiQuestGroup]);

  const liveElapsedDisplay = useMemo(() => {
    if (!grindSession.running || grindSession.lastCheckpointAtMs <= 0) {
      return grindSession.accumulatedSeconds;
    }
    const extra = Math.max(0, (nowMs - grindSession.lastCheckpointAtMs) / 1000);
    return grindSession.accumulatedSeconds + extra;
  }, [grindSession.accumulatedSeconds, grindSession.lastCheckpointAtMs, grindSession.running, nowMs]);

  const displayTrackerStat =
    grindSession.running || grindSession.sessionAddedAmount > 0
      ? grindSession.statType
      : activeStat;

  const tabItems: { id: SptsTab; label: string }[] = [
    { id: 'stats', label: t.spts.tabStats },
    { id: 'tokens', label: t.spts.tabTokens },
    { id: 'playtime', label: t.spts.tabPlaytime },
    { id: 'trophy', label: t.spts.tabTrophy },
    { id: 'pvp', label: t.spts.tabPvp },
    { id: 'wiki', label: t.spts.tabWiki }
  ];

  const renderQuestCheckboxes = () => (
    <div className="space-y-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 p-3 text-xs">
      <div className="space-y-2 border-b border-[var(--border-subtle)] pb-2.5">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-primary)]">
          <input
            type="checkbox"
            checked={spts.autoGateQuestsByStats}
            onChange={(e) => updateSpts({ autoGateQuestsByStats: e.target.checked })}
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
              value={spts.dailyQuestDuration}
              onChange={(e) => updateSpts({ dailyQuestDuration: e.target.value })}
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
              value={spts.weeklyQuestDuration}
              onChange={(e) => updateSpts({ weeklyQuestDuration: e.target.value })}
              placeholder={t.spts.questDurationPlaceholder}
              className="min-h-[34px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>

        {(dailyQuestTimeSec > 0 || weeklyQuestTimeSec > 0) && (
          <div className="text-[10px] text-[var(--text-secondary)]">
            {interp(t.spts.questDowntimeHint, {
              pct: Math.round(tokenRate.questUptimeFraction * 100)
            })}
          </div>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="font-semibold text-[var(--text-primary)]">{t.spts.dailyQuestGroupTitle}</span>
          <div className="flex gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => setAllDailyQuests(true)}
              className="text-[var(--accent)] hover:underline"
            >
              {t.common.selectAll}
            </button>
            <button
              type="button"
              onClick={() => setAllDailyQuests(false)}
              className="text-[var(--text-secondary)] hover:underline"
            >
              {t.common.selectNone}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {SPTS_DAILY_QUESTS.map((dq) => {
            const checked = selectedDailyIds.includes(dq.id);
            const blocked = spts.autoGateQuestsByStats && sptsStatsNum[dq.stat] < dq.target;
            const qText = t.spts.quests[dq.id];
            return (
              <label
                key={dq.id}
                className={`flex cursor-pointer items-center gap-2 ${blocked ? 'opacity-50' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleDailyQuest(dq.id)}
                  className="h-3.5 w-3.5 accent-[var(--accent)]"
                />
                <span className="truncate">
                  {qText?.title ?? dq.id} (+{dq.tokens})
                  {blocked && (
                    <span className="ml-1 text-[10px] text-amber-400">
                      ({interp(t.spts.questBlockedLowStat, { req: fmtNum(dq.target) })})
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[var(--border-subtle)] pt-2.5">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="font-semibold text-[var(--text-primary)]">{t.spts.weeklyQuestGroupTitle}</span>
          <div className="flex gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => setAllWeeklyQuests(true)}
              className="text-[var(--accent)] hover:underline"
            >
              {t.common.selectAll}
            </button>
            <button
              type="button"
              onClick={() => setAllWeeklyQuests(false)}
              className="text-[var(--text-secondary)] hover:underline"
            >
              {t.common.selectNone}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {SPTS_WEEKLY_QUESTS.map((wq) => {
            const checked = selectedWeeklyIds.includes(wq.id);
            const blocked = spts.autoGateQuestsByStats && sptsStatsNum[wq.stat] < wq.target;
            const qText = t.spts.quests[wq.id];
            return (
              <label
                key={wq.id}
                className={`flex cursor-pointer items-center gap-2 ${blocked ? 'opacity-50' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleWeeklyQuest(wq.id)}
                  className="h-3.5 w-3.5 accent-[var(--accent)]"
                />
                <span className="truncate">
                  {qText?.title ?? wq.id} (+{fmtNum(wq.tokens)})
                  {blocked && (
                    <span className="ml-1 text-[10px] text-amber-400">
                      ({interp(t.spts.questBlockedLowStat, { req: fmtNum(wq.target) })})
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[var(--border-subtle)] pt-2.5">
        <CustomQuestsBuilder
          customQuests={spts.customQuests ?? []}
          customPerSecond={tokenRate.customPerSecond}
          onceReadyTokens={tokenRate.onceReadyTokens}
          onChange={(next) => updateSpts({ customQuests: next })}
        />
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <SptsVersionBanner mode="classic" />

      {/* Compact Page Title + Clean Responsive Tabs */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl">
            {t.spts.title}
          </h1>
          <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
            {t.spts.subtitle} · {profile.name} · {fmtMult(currentMultiVal)}
          </p>
        </div>

        <nav
          aria-label={t.spts.title}
          className="grid w-full grid-cols-3 gap-1 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 sm:grid-cols-6 md:inline-flex md:w-auto"
        >
          {tabItems.map((tab) => {
            const active = sptsUi.tab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => updateSptsUi({ tab: tab.id })}
                className={`min-h-[38px] truncate rounded-[var(--radius-control)] px-1.5 text-center text-[11px] font-semibold transition-colors sm:px-3.5 sm:text-xs ${
                  active
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Away / Offline Continuous Grind Notification Banner */}
      {grindSession.pendingAwayBanner && (
        <div className="flex flex-col justify-between gap-3 rounded-[var(--radius-card)] border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-3.5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
            <div className="text-xs leading-relaxed text-[var(--text-primary)] sm:text-sm">
              {interp(t.spts.awayAddedBanner, {
                away: fmtTime(grindSession.pendingAwayBanner.awaySeconds),
                amount: fmtNum(grindSession.pendingAwayBanner.addedAmount),
                stat: grindSession.pendingAwayBanner.statType
              })}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={discardAwayStats}
              className="min-h-[34px] rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)]"
            >
              {t.spts.discardBackgroundBtn}
            </button>
            <button
              type="button"
              onClick={dismissAwayBanner}
              className="min-h-[34px] rounded-[var(--radius-control)] bg-[var(--accent)] px-3 text-xs font-semibold text-[var(--accent-fg)]"
            >
              {t.spts.dismissBannerBtn}
            </button>
          </div>
        </div>
      )}

      {/* ==================== TAB 1: STATS (0.8s Google-Landing UX) ==================== */}
      {sptsUi.tab === 'stats' && (
        <div className="grid gap-5 lg:grid-cols-12">
          {/* LEFT: Clean Immediate Inputs + Mini-Arrow Overrides + Visible Tokens & Quests */}
          <section className="space-y-4 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 lg:col-span-5">
            {/* Stat Selector */}
            <div className="grid grid-cols-5 gap-1.5">
              {STAT_OPTIONS.map((st) => {
                const active = activeStat === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => updateSptsUi({ statType: st })}
                    className={`min-h-[40px] rounded-[var(--radius-control)] border text-xs font-bold transition-colors ${
                      active
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>

            {/* 1. Current Stat + Mini-Arrow Zone / Tick Override */}
            <div>
              <FieldHeaderWithOverride
                label={`${t.spts.currentStat} (${activeStat})`}
                open={zoneOverrideOpen}
                onToggle={() => setZoneOverrideOpen((v) => !v)}
                hasCustomOverride={hasZoneOverride}
              />
              <input
                type="text"
                inputMode="text"
                value={spts.stats[activeStat]}
                onChange={(e) =>
                  updateSpts({ stats: { ...spts.stats, [activeStat]: e.target.value } })
                }
                placeholder={t.spts.currentStatPlaceholder}
                className="min-h-[46px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 text-sm font-medium text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
              />
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-secondary)]">
                <span className="truncate">{activeZoneLabel}</span>
                <span className="font-mono font-semibold text-[var(--text-primary)]">
                  +{fmtNum(zoneCalc.perTick)} / {zoneCalc.tickSec}{t.timeUnits.s}
                </span>
              </div>

              {activeStat === 'BT' && (
                <div className="mt-2.5 space-y-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 p-2.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateSpts({ safeAfkOnly: true })}
                      className={`min-h-[32px] rounded-[var(--radius-control)] border px-2 text-[11px] font-semibold transition-colors ${
                        spts.safeAfkOnly
                          ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {t.spts.btModeSafe4x}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSpts({ safeAfkOnly: false })}
                      className={`min-h-[32px] rounded-[var(--radius-control)] border px-2 text-[11px] font-semibold transition-colors ${
                        !spts.safeAfkOnly
                          ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {t.spts.btModeRisky1x}
                    </button>
                  </div>

                  {!spts.safeAfkOnly && (
                    <div className="space-y-1.5 border-t border-[var(--border-subtle)] pt-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-[var(--text-secondary)]">
                          {t.spts.btDeathReturnLabel}:
                        </span>
                        <input
                          type="text"
                          value={spts.btDeathReturnDuration}
                          onChange={(e) => updateSpts({ btDeathReturnDuration: e.target.value })}
                          placeholder={t.spts.btDeathReturnPlaceholder}
                          className="min-h-[30px] min-w-[110px] flex-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                        />
                        {['0', '10s', '20s', '30s'].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => updateSpts({ btDeathReturnDuration: chip === '0' ? '' : chip })}
                            className="rounded border border-[var(--border-subtle)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)] hover:border-[var(--accent)]"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                      {btDeathReturnSec > 0 && (
                        <div className="text-[10px] text-amber-300/90">
                          {interp(t.spts.btDeathEfficiencyLine, {
                            surv: fmtTime(btDeathEffPreview.survivalSec),
                            walk: fmtTime(btDeathEffPreview.walkSec),
                            pct: Math.round(btDeathEffPreview.efficiency * 100)
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {zoneOverrideOpen && (
                <div className="mt-2.5 space-y-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 p-3">
                  <ManualTickAndBonusControls
                    stat={activeStat}
                    gainCalcMode={spts.gainCalcMode ?? 'auto'}
                    customPerTick={spts.customPerTick}
                    customTickSeconds={spts.customTickSeconds[activeStat]}
                    equipmentBonusPercent={spts.equipmentBonusPercent ?? 0}
                    computedPerTick={zoneCalc.perTick}
                    computedTickSec={zoneCalc.tickSec}
                    onChangeMode={(mode) =>
                      updateSpts({
                        gainCalcMode: mode,
                        customPerTick: mode === 'auto' ? '' : spts.customPerTick
                      })
                    }
                    onChangeCustomPerTick={(val) => updateSpts({ customPerTick: val })}
                    onChangeCustomTickSeconds={(val) =>
                      updateSpts({
                        customTickSeconds: {
                          ...spts.customTickSeconds,
                          [activeStat]: val
                        }
                      })
                    }
                    onChangeEquipmentBonus={(val) => updateSpts({ equipmentBonusPercent: val })}
                  />

                  {activeStat === 'MS' || activeStat === 'JF' ? (
                    <label className="block space-y-1">
                      <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                        {t.spts.weightSelect}
                      </span>
                      <select
                        value={spts.weights[activeStat]}
                        onChange={(e) =>
                          updateSpts({
                            weights: { ...spts.weights, [activeStat]: e.target.value }
                          })
                        }
                        className="min-h-[38px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                      >
                        <option value="auto">
                          {t.common.autoLabel}: {t.spts.weights[zoneCalc.autoId] ?? zoneCalc.autoId}
                        </option>
                        {SPTS_WEIGHTS.map((w) => (
                          <option key={w.id} value={w.id}>
                            {t.spts.weights[w.id] ?? w.name} ({fmtMult(w.multiplier)})
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <div className="space-y-2">
                      <label className="block space-y-1">
                        <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                          {t.spts.zoneSelect}
                        </span>
                        <select
                          value={spts.locations[activeStat]}
                          onChange={(e) =>
                            updateSpts({
                              locations: { ...spts.locations, [activeStat]: e.target.value }
                            })
                          }
                          className="min-h-[38px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                        >
                          <option value="auto">
                            {t.common.autoLabel}:{' '}
                            {t.spts.locations[zoneCalc.autoId] ?? zoneCalc.autoId}
                          </option>
                          {SPTS_LOCATIONS.filter((l) => l.stat === activeStat).map((l) => (
                            <option key={l.id} value={l.id}>
                              {t.spts.locations[l.id] ?? l.name} ({fmtMult(l.multiplier)})
                            </option>
                          ))}
                        </select>
                      </label>

                      {activeStat === 'BT' && (
                        <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-secondary)]">
                          <input
                            type="checkbox"
                            checked={spts.safeAfkOnly}
                            onChange={(e) => updateSpts({ safeAfkOnly: e.target.checked })}
                            className="h-4 w-4 accent-[var(--accent)]"
                          />
                          <span>{t.spts.safeAfkToggle}</span>
                        </label>
                      )}
                    </div>
                  )}

                  {hasZoneOverride && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeStat === 'MS' || activeStat === 'JF') {
                          updateSpts({
                            weights: { ...spts.weights, [activeStat]: 'auto' },
                            gainCalcMode: 'auto',
                            equipmentBonusPercent: 0,
                            customPerTick: '',
                            customTickSeconds: { ...spts.customTickSeconds, [activeStat]: '' }
                          });
                        } else {
                          updateSpts({
                            locations: { ...spts.locations, [activeStat]: 'auto' },
                            gainCalcMode: 'auto',
                            equipmentBonusPercent: 0,
                            customPerTick: '',
                            customTickSeconds: { ...spts.customTickSeconds, [activeStat]: '' }
                          });
                        }
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent)] hover:underline"
                    >
                      <RotateCcw className="h-3 w-3" />
                      {t.common.reset}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2. Multiplier + Mini-Arrow Upgrade Simulation Toggle */}
            <div>
              <FieldHeaderWithOverride
                label={t.spts.multiTier}
                open={multiOverrideOpen}
                onToggle={() => setMultiOverrideOpen((v) => !v)}
                hasCustomOverride={!sptsUi.simulateUpgrades}
              />
              <select
                value={currentMultiKey}
                onChange={(e) =>
                  updateSpts({ multis: { ...spts.multis, [activeStat]: e.target.value } })
                }
                className="min-h-[46px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              >
                {Object.entries(SPTS_MULTIS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {fmtMult(v)}
                  </option>
                ))}
              </select>

              {multiOverrideOpen && (
                <div className="mt-2.5 space-y-2.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 p-3">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-primary)]">
                    <input
                      type="checkbox"
                      checked={sptsUi.simulateUpgrades}
                      onChange={(e) => updateSptsUi({ simulateUpgrades: e.target.checked })}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <span>{t.spts.simulateUpgrades}</span>
                  </label>
                </div>
              )}
            </div>

            {/* 3. Independent Per-Stat Target Goal + Quick Chips */}
            <div>
              <FieldHeaderWithOverride
                label={`${t.spts.goalStatLabel} (${activeStat})`}
                open={goalOverrideOpen}
                onToggle={() => setGoalOverrideOpen((v) => !v)}
                hasCustomOverride={hasQuestOverride}
              />
              <input
                type="text"
                value={activeGoalRaw}
                onChange={(e) => setActiveGoalRaw(e.target.value)}
                placeholder={
                  activeGoalMode === 'amountToTime'
                    ? t.spts.goalStatPlaceholder
                    : t.spts.goalTimePlaceholder
                }
                className="min-h-[46px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />

              {/* Quick Goal Chips */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {activeGoalMode === 'amountToTime' ? (
                  <>
                    {nextZoneInfo && (
                      <button
                        type="button"
                        onClick={() => setActiveGoalRaw(fmtNum(nextZoneInfo.requirement))}
                        className="rounded-md border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-2 py-1 text-[11px] font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/20"
                      >
                        {t.spts.nextZoneBtn} ({fmtNum(nextZoneInfo.requirement)})
                      </button>
                    )}
                    {STAT_GOAL_CHIPS_NUM.map((val) => {
                      const chipLabel = fmtNum(val);
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setActiveGoalRaw(chipLabel)}
                          className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                        >
                          {chipLabel}
                        </button>
                      );
                    })}
                  </>
                ) : (
                  TIME_GOAL_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setActiveGoalRaw(chip)}
                      className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                    >
                      {chip}
                    </button>
                  ))
                )}
              </div>

              {goalOverrideOpen && (
                <div className="mt-2.5 space-y-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 p-3">
                  {/* Mode Switch */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveGoalMode('amountToTime')}
                      className={`min-h-[34px] rounded-[var(--radius-control)] border text-xs font-semibold ${
                        activeGoalMode === 'amountToTime'
                          ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                          : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {t.spts.amountToTime}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveGoalMode('timeToAmount')}
                      className={`min-h-[34px] rounded-[var(--radius-control)] border text-xs font-semibold ${
                        activeGoalMode === 'timeToAmount'
                          ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                          : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {t.spts.timeToAmount}
                    </button>
                  </div>

                  {/* Quest Token Amounts + Passive TPM */}
                  <div className="grid grid-cols-3 gap-2">
                    <label className="block space-y-1">
                      <span className="block truncate text-[10px] text-[var(--text-secondary)]">
                        {t.spts.dailyTokensLabel}
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={spts.dailyQuestValue}
                        onChange={(e) =>
                          updateSpts({ dailyQuestValue: Math.max(0, Number(e.target.value) || 0) })
                        }
                        className="min-h-[34px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-primary)]"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="block truncate text-[10px] text-[var(--text-secondary)]">
                        {t.spts.weeklyTokensLabel}
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={spts.weeklyQuestValue}
                        onChange={(e) =>
                          updateSpts({ weeklyQuestValue: Math.max(0, Number(e.target.value) || 0) })
                        }
                        className="min-h-[34px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-primary)]"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="block truncate text-[10px] text-[var(--text-secondary)]">
                        {t.spts.passiveTokensPerMinLabel}
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={spts.passiveTokensPerMin}
                        onChange={(e) =>
                          updateSpts({
                            passiveTokensPerMin: Math.max(0, Number(e.target.value) || 0)
                          })
                        }
                        className="min-h-[34px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-primary)]"
                      />
                    </label>
                  </div>

                  {/* Quest Timing Mode */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                      {t.spts.questMode}
                    </span>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {(['discrete', 'averaged'] as QuestMode[]).map((qm) => {
                        const active = spts.questMode === qm;
                        return (
                          <button
                            key={qm}
                            type="button"
                            onClick={() => updateSpts({ questMode: qm })}
                            className={`rounded-[var(--radius-control)] border p-2 text-left text-[11px] transition-colors ${
                              active
                                ? 'border-[var(--accent)] bg-[var(--accent)]/12 text-[var(--text-primary)]'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                            }`}
                          >
                            <div className="font-semibold">
                              {qm === 'averaged' ? t.spts.questAveraged : t.spts.questDiscrete}
                            </div>
                            <div className="mt-0.5 text-[10px] opacity-80">
                              {qm === 'averaged'
                                ? t.spts.questAveragedDesc
                                : t.spts.questDiscreteDesc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Clearly Visible Tokens & Quest Income Block right on Stats tab */}
            <div className="space-y-2.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/55 p-3">
              <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
                {t.spts.tokensAndQuestsBoxTitle}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    {t.spts.currentTokens}
                  </span>
                  <input
                    type="text"
                    value={spts.tokens}
                    onChange={(e) => updateSpts({ tokens: e.target.value })}
                    placeholder={t.spts.currentTokensPlaceholder}
                    className="min-h-[38px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </label>

                <div className="flex flex-wrap items-end gap-2.5 pb-1 text-xs">
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={spts.dailyQuests}
                      onChange={(e) => updateSpts({ dailyQuests: e.target.checked })}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <span>{t.spts.daily}</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={spts.weeklyQuests}
                      onChange={(e) => updateSpts({ weeklyQuests: e.target.checked })}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <span>{t.spts.weekly}</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={spts.vip}
                      onChange={(e) => updateSpts({ vip: e.target.checked })}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <span>{t.spts.vip}</span>
                  </label>
                </div>
              </div>

              {spts.vip && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    type="text"
                    value={spts.vipDuration}
                    onChange={(e) => updateSpts({ vipDuration: e.target.value })}
                    placeholder={t.spts.vipDurationPlaceholder}
                    className="min-h-[32px] min-w-[120px] flex-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-primary)]"
                  />
                  {VIP_DURATION_CHIPS.map((d) => (
                    <button
                      key={d || 'inf'}
                      type="button"
                      onClick={() => updateSpts({ vipDuration: d })}
                      className="rounded border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)] hover:border-[var(--accent)]"
                    >
                      {d || t.spts.vipForever}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-secondary)]">
                <span>
                  {interp(t.spts.selectedQuestsSummary, {
                    daily: tokenRate.eligibleDailyCount,
                    dVal: fmtNum(tokenRate.dailyPayout),
                    weekly: tokenRate.eligibleWeeklyCount,
                    wVal: fmtNum(tokenRate.weeklyPayout)
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => setStatsQuestsOpen((v) => !v)}
                  className="inline-flex items-center gap-1 font-semibold text-[var(--accent)] hover:underline"
                >
                  <span>{t.spts.questsPickerToggle}</span>
                  {statsQuestsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={spts.autoGateQuestsByStats}
                  onChange={(e) => updateSpts({ autoGateQuestsByStats: e.target.checked })}
                  className="h-3.5 w-3.5 accent-[var(--accent)]"
                />
                <span>{t.spts.autoGateQuestsToggle}</span>
              </label>

              {statsQuestsOpen && renderQuestCheckboxes()}
            </div>

            {btAfkWarning && (
              <div className="flex items-start gap-2 rounded-[var(--radius-control)] border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-200">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div>
                  <p>{btAfkWarning}</p>
                  <p className="mt-0.5 text-[11px] opacity-80">{t.spts.deathTrainNote}</p>
                </div>
              </div>
            )}
          </section>

          {/* RIGHT: Hero Forecast + Background Grind Tracker + Roadmap & Zone Unlocks */}
          <div className="space-y-4 lg:col-span-7">
            {/* Hero Output */}
            <section className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-[var(--text-secondary)]">
                    {activeGoalMode === 'amountToTime'
                      ? interp(t.spts.estimatedTimeTitle, {
                          goal: activeGoalRaw || '—',
                          stat: activeStat
                        })
                      : interp(t.spts.projectedGainTitle, {
                          stat: activeStat,
                          time: activeGoalRaw || '—'
                        })}
                  </div>
                  <div className="mt-1 font-mono text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                    {simulation
                      ? activeGoalMode === 'amountToTime'
                        ? fmtTime(simulation.totalTime)
                        : `${fmtNum(simulation.finalStat)} ${activeStat}`
                      : '—'}
                  </div>
                  {simulation && activeGoalMode === 'amountToTime' && fmtEta(simulation.totalTime) && (
                    <div className="mt-1 text-xs text-[var(--accent)]">
                      {t.common.eta}: {fmtEta(simulation.totalTime)}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-right sm:text-left">
                  <div className="rounded-[var(--radius-control)] bg-[var(--bg-canvas)] px-3 py-2">
                    <div className="text-[10px] text-[var(--text-secondary)]">
                      {t.spts.gainPerSecLabel}
                    </div>
                    <div className="font-mono text-xs font-bold text-[var(--text-primary)]">
                      +{fmtNum(zoneCalc.perTick / zoneCalc.tickSec)}/{t.timeUnits.s}
                    </div>
                  </div>
                  <div className="rounded-[var(--radius-control)] bg-[var(--bg-canvas)] px-3 py-2">
                    <div className="text-[10px] text-[var(--text-secondary)]">
                      {t.spts.finalMulti}
                    </div>
                    <div className="font-mono text-xs font-bold text-[var(--text-primary)]">
                      {fmtMult(SPTS_MULTIS[simulation?.finalMultiKey ?? currentMultiKey] ?? 1)}
                    </div>
                  </div>
                  <div className="rounded-[var(--radius-control)] bg-[var(--bg-canvas)] px-3 py-2">
                    <div className="text-[10px] text-[var(--text-secondary)]">
                      {t.spts.tokensSpent}
                    </div>
                    <div className="font-mono text-xs font-bold text-[var(--text-primary)]">
                      {simulation ? fmtNum(simulation.spentTokens) : '0'}
                    </div>
                  </div>
                  <div className="rounded-[var(--radius-control)] bg-[var(--bg-canvas)] px-3 py-2">
                    <div className="text-[10px] text-[var(--text-secondary)]">
                      {t.spts.timeSaved}
                    </div>
                    <div className="font-mono text-xs font-bold text-emerald-400">
                      {simulation ? fmtTime(simulation.timeSavedSeconds) : fmtTime(0)}
                    </div>
                  </div>
                </div>
              </div>

              {!simulation && (
                <p className="mt-3 text-xs text-[var(--text-secondary)]">
                  {t.common.enterGoalHint}
                </p>
              )}
            </section>

            {/* Continuous Background Grind Tracker */}
            <section className="flex flex-col justify-between gap-3 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                  <Clock className="h-4 w-4 text-[var(--accent)]" />
                  <span>{t.spts.liveTrackerTitle}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      grindSession.running
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {grindSession.running
                      ? t.spts.liveTrackerRunning
                      : t.spts.liveTrackerPaused}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-3 font-mono text-xs text-[var(--text-secondary)]">
                  <span>
                    {t.common.elapsed}:{' '}
                    <strong className="text-[var(--text-primary)]">
                      {fmtTime(liveElapsedDisplay)}
                    </strong>
                  </span>
                  <span>
                    +{fmtNum(grindSession.sessionAddedAmount)} {displayTrackerStat}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={toggleGrindSession}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--accent)] px-3.5 text-xs font-semibold text-[var(--accent-fg)]"
                >
                  {grindSession.running ? (
                    <>
                      <Pause className="h-3.5 w-3.5" />
                      {t.common.pause}
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      {t.common.startGrind}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetGrindSession}
                  className="inline-flex min-h-[38px] items-center gap-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] px-3 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t.common.reset}
                </button>
              </div>
            </section>

            {/* Zone Unlocks During Auto-Climb */}
            {simulation && simulation.zoneTransitions.length > 0 && (
              <section className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                <h2 className="mb-2 text-xs font-bold text-[var(--text-primary)]">
                  {t.spts.zoneUnlocksTitle}
                </h2>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {simulation.zoneTransitions.map((zt) => {
                    const zoneName =
                      activeStat === 'MS' || activeStat === 'JF'
                        ? t.spts.weights[zt.zoneId] ?? zt.zoneId
                        : t.spts.locations[zt.zoneId] ?? zt.zoneId;
                    return (
                      <div
                        key={`${zt.zoneId}-${zt.statThreshold}-${zt.isDeathTraining ? 'd' : 's'}`}
                        className="flex items-center justify-between gap-2 rounded-[var(--radius-control)] bg-[var(--bg-canvas)] px-3 py-1.5 text-[11px]"
                      >
                        <div className="min-w-0 truncate">
                          <span className="font-semibold text-[var(--text-primary)]">
                            {zoneName}
                          </span>{' '}
                          <span className="font-mono text-[var(--accent)]">
                            ({fmtMult(zt.multiplier)})
                          </span>
                          {zt.statThreshold > 0 && (
                            <span className="ml-1 text-[10px] text-[var(--text-secondary)]">
                              · {interp(t.spts.zoneThresholdLabel, { val: fmtNum(zt.statThreshold) })}
                            </span>
                          )}
                        </div>
                        <div className="shrink-0 font-mono text-[var(--text-secondary)]">
                          {fmtTime(zt.atTimeSeconds)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Roadmap */}
            <section className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  {t.spts.roadmapTitle}
                </h2>
                {simulation && simulation.upgradeSteps.length > 0 && (
                  <span className="text-xs font-medium text-[var(--accent)]">
                    {simulation.upgradeSteps.length} {t.spts.upgradesCount}
                  </span>
                )}
              </div>

              {!simulation ? (
                <p className="text-xs text-[var(--text-secondary)]">{t.spts.roadmapEmpty}</p>
              ) : simulation.upgradeSteps.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)]">
                  {interp(t.spts.roadmapAlreadyEnough, {
                    multi: fmtMult(SPTS_MULTIS[simulation.finalMultiKey] ?? 1)
                  })}
                </p>
              ) : (
                <div className="max-h-72 overflow-x-auto overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
                      <tr>
                        <th className="py-2 pr-3 font-medium">{t.spts.colTier}</th>
                        <th className="py-2 pr-3 font-medium">{t.spts.colCost}</th>
                        <th className="py-2 pr-3 font-medium">{t.spts.colAtTime}</th>
                        <th className="py-2 font-medium">{t.spts.colStatAtUpgrade}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]/50 font-mono">
                      {simulation.upgradeSteps.map((step) => (
                        <tr key={step.multiKey}>
                          <td className="py-2 pr-3 font-bold text-[var(--accent)]">
                            {fmtMult(step.multiValue)}
                          </td>
                          <td className="py-2 pr-3 text-[var(--text-secondary)]">
                            {fmtNum(step.price)}
                          </td>
                          <td className="py-2 pr-3 text-[var(--text-primary)]">
                            {fmtTime(step.atTimeSeconds)}
                          </td>
                          <td className="py-2 text-[var(--text-primary)]">
                            {fmtNum(step.statAtUpgrade)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: TOKENS & ROBUX ==================== */}
      {sptsUi.tab === 'tokens' && (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-12">
            {/* Quest & VIP Settings */}
            <section className="space-y-4 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 lg:col-span-5">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {t.spts.incomeProfileTitle}
              </h2>

              <div className="space-y-2 text-xs">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={spts.dailyQuests}
                    onChange={(e) => updateSpts({ dailyQuests: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>
                    {interp(t.spts.dailyQuestsLine, {
                      val: fmtNum(tokenRate.dailyPayout / (spts.vip && vipRemainingSeconds > 0 ? 2 : 1))
                    })}
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={spts.weeklyQuests}
                    onChange={(e) => updateSpts({ weeklyQuests: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>
                    {interp(t.spts.weeklyQuestsLine, {
                      val: fmtNum(tokenRate.weeklyPayout / (spts.vip && vipRemainingSeconds > 0 ? 2 : 1))
                    })}
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={spts.vip}
                    onChange={(e) => updateSpts({ vip: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>{t.spts.vipQuestsLine}</span>
                </label>
              </div>

              {renderQuestCheckboxes()}

              {spts.vip && (
                <div className="space-y-1.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3">
                  <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                    {t.spts.vipDurationLabel}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <input
                      type="text"
                      value={spts.vipDuration}
                      onChange={(e) => updateSpts({ vipDuration: e.target.value })}
                      placeholder={t.spts.vipDurationPlaceholder}
                      className="min-h-[36px] min-w-[140px] flex-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-xs text-[var(--text-primary)]"
                    />
                    {VIP_DURATION_CHIPS.map((d) => (
                      <button
                        key={d || 'inf'}
                        type="button"
                        onClick={() => updateSpts({ vipDuration: d })}
                        className="rounded border border-[var(--border-subtle)] px-2 text-[11px] text-[var(--text-secondary)] hover:border-[var(--accent)]"
                      >
                        {d || t.spts.vipForever}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    {t.spts.currentTokens}
                  </span>
                  <input
                    type="text"
                    value={spts.tokens}
                    onChange={(e) => updateSpts({ tokens: e.target.value })}
                    placeholder={t.spts.currentTokensPlaceholder}
                    className="min-h-[40px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 text-xs text-[var(--text-primary)]"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    {t.spts.passiveTokensPerMinLabel}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={spts.passiveTokensPerMin}
                    onChange={(e) =>
                      updateSpts({ passiveTokensPerMin: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="min-h-[40px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 text-xs text-[var(--text-primary)]"
                  />
                </label>
              </div>
            </section>

            {/* Token Goal Projection */}
            <section className="space-y-4 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 lg:col-span-7">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateSptsUi({ tokenGoalMode: 'amountToTime' })}
                  className={`min-h-[38px] rounded-[var(--radius-control)] border text-xs font-semibold ${
                    sptsUi.tokenGoalMode === 'amountToTime'
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]'
                      : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  {t.spts.amountToTime}
                </button>
                <button
                  type="button"
                  onClick={() => updateSptsUi({ tokenGoalMode: 'timeToAmount' })}
                  className={`min-h-[38px] rounded-[var(--radius-control)] border text-xs font-semibold ${
                    sptsUi.tokenGoalMode === 'timeToAmount'
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]'
                      : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  {t.spts.timeToAmount}
                </button>
              </div>

              <input
                type="text"
                value={sptsUi.tokenGoalRaw}
                onChange={(e) => updateSptsUi({ tokenGoalRaw: e.target.value })}
                placeholder={
                  sptsUi.tokenGoalMode === 'amountToTime'
                    ? t.spts.goalStatPlaceholder
                    : t.spts.goalTimePlaceholder
                }
                className="min-h-[44px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 text-sm text-[var(--text-primary)]"
              />

              <div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {sptsUi.tokenGoalMode === 'amountToTime'
                    ? interp(t.spts.tokenTargetTimeTitle, {
                        amount: sptsUi.tokenGoalRaw || '—'
                      })
                    : interp(t.spts.tokenTargetAmountTitle, {
                        time: sptsUi.tokenGoalRaw || '—'
                      })}
                </div>
                <div className="mt-1 font-mono text-2xl font-bold text-[var(--text-primary)]">
                  {sptsUi.tokenGoalRaw.trim()
                    ? sptsUi.tokenGoalMode === 'amountToTime'
                      ? fmtTime(tokenProjection)
                      : fmtNum(tokenProjection)
                    : '—'}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-[var(--radius-control)] bg-[var(--bg-canvas)] p-3">
                  <div className="text-[10px] text-[var(--text-secondary)]">{t.spts.perMinute}</div>
                  <div className="font-mono text-sm font-bold text-[var(--text-primary)]">
                    {fmtNum(tokenRate.totalPerSecond * 60)}
                  </div>
                </div>
                <div className="rounded-[var(--radius-control)] bg-[var(--bg-canvas)] p-3">
                  <div className="text-[10px] text-[var(--text-secondary)]">{t.spts.perDay}</div>
                  <div className="font-mono text-sm font-bold text-[var(--text-primary)]">
                    {fmtNum(tokenRate.totalPerSecond * 86400)}
                  </div>
                </div>
                <div className="rounded-[var(--radius-control)] bg-[var(--bg-canvas)] p-3">
                  <div className="text-[10px] text-[var(--text-secondary)]">{t.spts.perWeek}</div>
                  <div className="font-mono text-sm font-bold text-[var(--text-primary)]">
                    {fmtNum(tokenRate.totalPerSecond * 7 * 86400)}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Robux Planner */}
          <section className="space-y-4 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  {t.spts.robuxPlannerTitle}
                </h2>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {t.spts.robuxFirstX2Hint}
                </p>
              </div>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => updateSptsUi({ packGroup: 'classic' })}
                  className={`min-h-[34px] rounded-[var(--radius-control)] border px-3 text-xs font-semibold ${
                    sptsUi.packGroup === 'classic'
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]'
                      : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  {t.spts.robuxClassicBtn}
                </button>
                <button
                  type="button"
                  onClick={() => updateSptsUi({ packGroup: 'high' })}
                  className={`min-h-[34px] rounded-[var(--radius-control)] border px-3 text-xs font-semibold ${
                    sptsUi.packGroup === 'high'
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]'
                      : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  {t.spts.robuxHighBtn}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={sptsUi.robuxTargetTokens}
                onChange={(e) => updateSptsUi({ robuxTargetTokens: e.target.value })}
                placeholder={t.spts.robuxTargetPlaceholder}
                className="min-h-[42px] w-full max-w-xs rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 text-sm text-[var(--text-primary)]"
              />
              <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={sptsUi.firstPurchaseX2}
                  onChange={(e) => updateSptsUi({ firstPurchaseX2: e.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                <span>{t.spts.robuxFirstX2}</span>
              </label>
            </div>

            {robuxPlans.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)]">{t.spts.robuxEmptyHint}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
                    <tr>
                      <th className="py-2 pr-3 font-medium">{t.spts.colPack}</th>
                      <th className="py-2 pr-3 font-medium">{t.spts.colDelivered}</th>
                      <th className="py-2 pr-3 font-medium">{t.spts.colQty}</th>
                      <th className="py-2 pr-3 font-medium">{t.spts.colBreakdown}</th>
                      <th className="py-2 font-medium">{t.spts.colTotalRobux}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]/50 font-mono">
                    {robuxPlans.map((row) => (
                      <tr key={row.pack.id}>
                        <td className="py-2.5 pr-3 font-sans font-semibold text-[var(--text-primary)]">
                          {fmtNum(row.pack.tokens)} {t.common.tokens} ({row.pack.robux} R$)
                        </td>
                        <td className="py-2.5 pr-3 text-[var(--text-secondary)]">
                          {fmtNum(row.firstPackTokens)} / {fmtNum(row.repeatPackTokens)}
                        </td>
                        <td className="py-2.5 pr-3 text-[var(--text-primary)]">×{row.count}</td>
                        <td className="py-2.5 pr-3 font-sans text-[11px] text-[var(--text-secondary)]">
                          {row.firstPurchaseApplied
                            ? interp(t.spts.breakdownFirstPlus, {
                                rest: Math.max(0, row.count - 1)
                              })
                            : `${row.count}× ${fmtNum(row.repeatPackTokens)}`}
                        </td>
                        <td className="py-2.5 font-bold text-[var(--accent)]">
                          {fmtNum(row.totalRobux)} R$
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* VIP Plans */}
            <div className="border-t border-[var(--border-subtle)] pt-4">
              <div className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">
                {t.spts.vipPlansTitle}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {SPTS_VIP_PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-xs"
                  >
                    <span className="font-semibold text-[var(--text-primary)]">
                      {fmtTime(plan.seconds)} {t.spts.vip.split(' ')[0]}
                    </span>
                    <span className="font-mono font-bold text-[var(--accent)]">
                      {fmtNum(plan.robux)} R$
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ==================== TAB 3: PLAYTIME ==================== */}
      {sptsUi.tab === 'playtime' && (
        <div className="space-y-4">
          <section className="space-y-5 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {t.spts.playtimeEstimatedTitle}
              </h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {t.spts.playtimeLifetime}{' '}
                <strong className="font-mono text-[var(--text-primary)]">
                  {fmtNum(playtime.totalEarnedTokens)}
                </strong>{' '}
                ({fmtNum(playtime.totalSpentOnMultis)} {t.spts.playtimeSpentMultis})
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
                <div className="text-xs text-[var(--text-secondary)]">
                  {t.spts.playtimeSlowest}
                </div>
                <div className="mt-1 font-mono text-xl font-bold text-[var(--text-primary)]">
                  {fmtTime(playtime.seconds.slowest_noQuests)}
                </div>
              </div>
              <div className="rounded-[var(--radius-control)] border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-4">
                <div className="text-xs text-[var(--text-secondary)]">{t.spts.playtimeMid}</div>
                <div className="mt-1 font-mono text-xl font-bold text-[var(--accent)]">
                  {fmtTime(playtime.seconds.mid_allQuests_noVIP)}
                </div>
              </div>
              <div className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
                <div className="text-xs text-[var(--text-secondary)]">
                  {t.spts.playtimeFastest}
                </div>
                <div className="mt-1 font-mono text-xl font-bold text-emerald-400">
                  {fmtTime(playtime.seconds.fastest_allQuests_VIP)}
                </div>
              </div>
            </div>

            {/* Direct Current Tokens + Passive TPM + Selected Quests on PlayTime tab */}
            <div className="space-y-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/60 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                    {t.spts.currentTokens}
                  </span>
                  <input
                    type="text"
                    value={spts.tokens}
                    onChange={(e) => updateSpts({ tokens: e.target.value })}
                    placeholder={t.spts.currentTokensPlaceholder}
                    className="min-h-[38px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-primary)]"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                    {t.spts.passiveTokensPerMinLabel}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={spts.passiveTokensPerMin}
                    onChange={(e) =>
                      updateSpts({ passiveTokensPerMin: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="min-h-[38px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-primary)]"
                  />
                </label>
                <div className="flex flex-wrap items-end gap-3 pb-1 text-xs">
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={spts.dailyQuests}
                      onChange={(e) => updateSpts({ dailyQuests: e.target.checked })}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <span>{t.spts.daily}</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={spts.weeklyQuests}
                      onChange={(e) => updateSpts({ weeklyQuests: e.target.checked })}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <span>{t.spts.weekly}</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
                <span>
                  {interp(t.spts.selectedQuestsSummary, {
                    daily: tokenRate.eligibleDailyCount,
                    dVal: fmtNum(tokenRate.dailyPayout / (spts.vip && vipRemainingSeconds > 0 ? 2 : 1)),
                    weekly: tokenRate.eligibleWeeklyCount,
                    wVal: fmtNum(tokenRate.weeklyPayout / (spts.vip && vipRemainingSeconds > 0 ? 2 : 1))
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => setPlaytimeQuestsOpen((v) => !v)}
                  className="inline-flex items-center gap-1 font-semibold text-[var(--accent)] hover:underline"
                >
                  <span>{t.spts.questsPickerToggle}</span>
                  {playtimeQuestsOpen ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {playtimeQuestsOpen && renderQuestCheckboxes()}
            </div>

            {/* Quick Multi Tiers overview */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {STAT_OPTIONS.map((st) => (
                <label key={st} className="block space-y-1">
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                    {st} {t.spts.multiTier}
                  </span>
                  <select
                    value={spts.multis[st]}
                    onChange={(e) =>
                      updateSpts({ multis: { ...spts.multis, [st]: e.target.value } })
                    }
                    className="min-h-[38px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 text-xs text-[var(--text-primary)]"
                  >
                    {Object.entries(SPTS_MULTIS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {fmtMult(v)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            {/* Compact Bloxy Trophy Cross-Link Banner */}
            <div className="flex flex-col justify-between gap-3 rounded-[var(--radius-control)] border border-amber-500/35 bg-amber-500/10 p-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    {t.spts.trophyCurrentRankLabel}:{' '}
                    <span className="text-amber-300">
                      {formatTrophyTitle(bloxyTrophy.effectiveRank, bloxyTrophy.isOg)}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                    {fmtNum(bloxyTrophy.totalSpentOnMultis)} {t.spts.playtimeSpentMultis} ·{' '}
                    {bloxyTrophy.nextTier
                      ? interp(t.spts.trophyTokensNeeded, {
                          amount: fmtNum(bloxyTrophy.tokensToNextTier)
                        })
                      : t.spts.trophyMaxRankReached}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateSptsUi({ tab: 'trophy' })}
                className="inline-flex min-h-[36px] shrink-0 items-center justify-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--accent)] px-3 text-xs font-semibold text-[var(--accent-fg)]"
              >
                <span>{t.spts.trophyOpenTabBtn}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ==================== TAB 4: BLOXY TROPHY & NEW SPTS ==================== */}
      {sptsUi.tab === 'trophy' && (
        <div className="space-y-4">
          <section className="space-y-5 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)]">
                  <Trophy className="h-5 w-5 text-amber-400" />
                  <span>{t.spts.trophyCardTitle}</span>
                </h2>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {t.spts.trophyCardSubtitle}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs">
                <span className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1 font-mono text-[var(--text-secondary)]">
                  {t.spts.trophyCooldownValue}
                </span>
                {bloxyTrophy.tier.studs > 0 && (
                  <span className="rounded-[var(--radius-control)] border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 font-mono font-semibold text-amber-300">
                    {interp(t.spts.trophyStudsTemplate, { studs: bloxyTrophy.tier.studs })}
                  </span>
                )}
              </div>
            </div>

            {/* Main Trophy Hero Cards */}
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[var(--radius-control)] border border-amber-500/40 bg-amber-500/10 p-4">
                <div className="text-xs text-[var(--text-secondary)]">
                  {t.spts.trophyCurrentRankLabel}
                </div>
                <div className="mt-1 text-2xl font-extrabold tracking-tight text-amber-300">
                  {formatTrophyTitle(bloxyTrophy.effectiveRank, bloxyTrophy.isOg)}
                </div>
                <div className="mt-1 text-xs text-[var(--text-primary)]/90">
                  {t.spts.trophyReactions[bloxyTrophy.effectiveRank]}
                </div>
              </div>

              <div className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
                <div className="text-xs text-[var(--text-secondary)]">
                  {t.spts.trophyEngravedLabel}
                </div>
                <div className="mt-1 truncate font-mono text-base font-bold text-[var(--text-primary)]">
                  {interp(t.spts.trophyEngravedTemplate, {
                    name: profile.robloxUsername
                      ? `@${profile.robloxUsername}`
                      : profile.name,
                    year: spts.classicStartYear.trim() || '2026'
                  })}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                    <span>{t.spts.trophyStartYearLabel}:</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={spts.classicStartYear}
                      onChange={(e) =>
                        updateSpts({ classicStartYear: e.target.value.replace(/[^\d]/g, '') })
                      }
                      placeholder={t.spts.trophyYearPlaceholder}
                      className="w-20 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 font-mono text-xs text-[var(--text-primary)]"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
                <div className="text-xs text-[var(--text-secondary)]">
                  {t.spts.trophySpentProgressTitle}
                </div>
                <div className="mt-1 font-mono text-xl font-bold text-[var(--text-primary)]">
                  {fmtNum(bloxyTrophy.totalSpentOnMultis)}
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface)]">
                  <div
                    className="h-full w-full origin-left rounded-full bg-amber-400 transition-transform duration-300"
                    style={{
                      transform: `scaleX(${Math.min(100, Math.max(0, bloxyTrophy.progressPercent)) / 100})`
                    }}
                  />
                </div>
                <div className="mt-1.5 text-[11px] text-[var(--text-secondary)]">
                  {bloxyTrophy.nextTier ? (
                    <>
                      <span>
                        {t.spts.trophyNextRankLabel}:{' '}
                        <strong className="text-[var(--text-primary)]">
                          {formatTrophyTitle(bloxyTrophy.nextTier.id, bloxyTrophy.isOg)}
                        </strong>{' '}
                        ({fmtNum(bloxyTrophy.nextTier.minTokensSpent)})
                      </span>
                      <div className="font-mono text-amber-300">
                        {interp(t.spts.trophyTokensNeeded, {
                          amount: fmtNum(bloxyTrophy.tokensToNextTier)
                        })}
                        {bloxyTrophy.timeToNextTierSeconds !== null &&
                          ` · ${fmtTime(bloxyTrophy.timeToNextTierSeconds)}`}
                      </div>
                    </>
                  ) : (
                    <span className="font-semibold text-emerald-400">
                      {t.spts.trophyMaxRankReached}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* OG Status Toggle & Held Tokens Note */}
            <div className="space-y-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/60 p-3.5 text-xs">
              <label className="flex cursor-pointer items-center gap-2 font-semibold text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={Boolean(spts.isOgPlayer)}
                  onChange={(e) => updateSpts({ isOgPlayer: e.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                <span>{t.spts.trophyOgToggleLabel}</span>
              </label>
              <p className="text-[11px] text-[var(--text-secondary)]">{t.spts.trophyOgHint}</p>
              {currentTokensVal > 0 && (
                <p className="text-[11px] text-amber-300/90">
                  {interp(t.spts.trophyHeldTokensIgnored, { held: fmtNum(currentTokensVal) })}
                </p>
              )}
            </div>

            {/* 5 Classic Multipliers Editor */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {STAT_OPTIONS.map((st) => (
                <div
                  key={st}
                  className="space-y-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/50 p-2.5"
                >
                  <label className="block space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                      {st} {t.spts.multiTier}
                    </span>
                    <select
                      value={spts.multis[st]}
                      onChange={(e) =>
                        updateSpts({ multis: { ...spts.multis, [st]: e.target.value } })
                      }
                      className="min-h-[38px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-primary)]"
                    >
                      {Object.entries(SPTS_MULTIS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {fmtMult(v)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="font-mono text-[10px] text-[var(--text-secondary)]">
                    {fmtNum(bloxyTrophy.spentPerStat[st])} {t.common.tokens}
                  </div>
                </div>
              ))}
            </div>

            {/* Cheapest Path to Next Rank */}
            {bloxyTrophy.nextTier && bloxyTrophy.cheapestPathToNext.upgrades.length > 0 && (
              <div className="space-y-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 p-4">
                <div className="text-xs font-bold text-[var(--text-primary)]">
                  {t.spts.trophyCheapestPathTitle}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {interp(t.spts.trophyCheapestPathDesc, {
                    target: fmtNum(bloxyTrophy.nextTier.minTokensSpent)
                  })}
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {bloxyTrophy.cheapestPathToNext.upgrades.map((u) => (
                    <div
                      key={u.stat}
                      className="flex items-center justify-between rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs"
                    >
                      <span className="font-bold text-[var(--text-primary)]">
                        {u.stat}: {fmtMult(SPTS_MULTIS[u.fromMultiKey] ?? 1)} →{' '}
                        <span className="text-amber-300">
                          {fmtMult(SPTS_MULTIS[u.toMultiKey] ?? 1)}
                        </span>
                      </span>
                      <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                        +{fmtNum(u.tokensCost)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="font-mono text-[11px] text-emerald-400">
                  {interp(t.spts.trophyCheapestTotalCost, {
                    cost: fmtNum(bloxyTrophy.cheapestPathToNext.actualAddedCost),
                    total: fmtNum(bloxyTrophy.cheapestPathToNext.resultingTotalSpent)
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Roblox OG & Badge Age Checker */}
          <section className="space-y-4 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                <Award className="h-4 w-4 text-[var(--accent)]" />
                <span>{t.spts.trophyOgCheckerTitle}</span>
              </h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {t.spts.trophyOgCheckerDesc}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={ogQuery}
                onChange={(e) => setOgQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && ogQuery.trim()) {
                    e.preventDefault();
                    void handleCheckRobloxOg();
                  }
                }}
                placeholder={t.profiles.robloxPlaceholder}
                className="min-h-[42px] min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
              />
              <button
                type="button"
                onClick={() => void handleCheckRobloxOg()}
                disabled={ogChecking || !ogQuery.trim()}
                className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent-fg)] disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                <span>{ogChecking ? t.profiles.checking : t.spts.trophyCheckBtn}</span>
              </button>
              {ogLookup && (
                <button
                  type="button"
                  onClick={applyOgLookupToProfile}
                  className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-1.5 rounded-[var(--radius-control)] border border-emerald-500/40 bg-emerald-500/15 px-3 text-xs font-semibold text-emerald-300"
                >
                  {t.spts.trophyApplyToProfileBtn}
                </button>
              )}
            </div>

            {ogError && <p className="text-xs text-amber-400">{ogError}</p>}

            {activeOgSource && activeOgEvaluation && (
              <div className="space-y-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {activeOgSource.avatarUrl && (
                      <img
                        src={activeOgSource.avatarUrl}
                        alt={activeOgSource.displayName}
                        referrerPolicy="no-referrer"
                        className="h-10 w-10 rounded-full border border-[var(--border-subtle)] object-cover"
                      />
                    )}
                    <div>
                      <div className="text-sm font-bold text-[var(--text-primary)]">
                        {activeOgSource.displayName}{' '}
                        {activeOgSource.username && (
                          <span className="font-normal text-[var(--text-secondary)]">
                            @{activeOgSource.username}
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-[var(--text-secondary)]">
                        ID {activeOgSource.userId}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        {t.spts.trophyAccountCreatedLabel}
                      </div>
                      <div className="font-mono font-semibold text-[var(--text-primary)]">
                        {activeOgEvaluation.accountCreatedDate
                          ? activeOgEvaluation.accountCreatedDate.slice(0, 10)
                          : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        {t.spts.trophyEarliestBadgeLabel}
                      </div>
                      <div className="font-mono font-semibold text-amber-300">
                        {activeOgEvaluation.earliestBadgeDate
                          ? activeOgEvaluation.earliestBadgeDate.slice(0, 10)
                          : t.spts.trophyNoBadgeDate}
                      </div>
                    </div>
                  </div>
                </div>

                {/* OG Verdict Banner */}
                {activeOgEvaluation.status !== 'unknown' && (
                  <div
                    className={`rounded-[var(--radius-control)] border px-3 py-2 text-xs font-medium ${
                      activeOgEvaluation.status === 'confirmed_badge'
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : activeOgEvaluation.status === 'not_og_new_account'
                          ? 'border-red-500/40 bg-red-500/10 text-red-300'
                          : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                    }`}
                  >
                    {activeOgEvaluation.status === 'confirmed_badge' &&
                      interp(t.spts.trophyVerdictConfirmed, {
                        date: activeOgEvaluation.earliestBadgeDate?.slice(0, 10) ?? ''
                      })}
                    {activeOgEvaluation.status === 'possible_account_age' &&
                      interp(t.spts.trophyVerdictPossible, {
                        date: activeOgEvaluation.accountCreatedDate?.slice(0, 10) ?? ''
                      })}
                    {activeOgEvaluation.status === 'not_og_new_account' &&
                      interp(t.spts.trophyVerdictNewAccount, {
                        date: activeOgEvaluation.accountCreatedDate?.slice(0, 10) ?? ''
                      })}
                  </div>
                )}

                {/* 3 Milestone Badges Breakdown */}
                <div className="grid gap-2 sm:grid-cols-3">
                  {SPTS_CLASSIC_OG_BADGES.map((badgeDef) => {
                    const match = activeOgSource.classicBadges.find(
                      (b) => b.badgeId === badgeDef.badgeId
                    );
                    const dateStr = match?.awardedDate ? match.awardedDate.slice(0, 10) : null;
                    const isEarliest =
                      Boolean(match?.awardedDate) &&
                      match?.awardedDate === activeOgSource.earliestClassicBadgeDate;
                    return (
                      <a
                        key={badgeDef.badgeId}
                        href={badgeDef.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex flex-col justify-between gap-1 rounded-[var(--radius-control)] border p-2.5 text-xs transition-colors hover:border-[var(--accent)] ${
                          isEarliest
                            ? 'border-emerald-500/50 bg-emerald-500/10'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 font-semibold text-[var(--text-primary)]">
                          <span>{t.spts.trophyBadgeNames[badgeDef.key]}</span>
                          <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-[var(--text-secondary)]" />
                        </div>
                        <div
                          className={`font-mono text-[11px] ${
                            dateStr ? 'text-emerald-300' : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          {dateStr ?? t.spts.trophyNoBadgeDate}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Trophy Flex vs Target + Reference Table + New SPTS Update Highlights */}
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="space-y-3 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {t.spts.trophyFlexTitle}
                  </h3>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                    {t.spts.trophyFlexDesc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const oppTotal =
                      parseNumber(oppFsRaw) + parseNumber(oppBtRaw) + parseNumber(oppPpRaw);
                    if (oppTotal > 0) {
                      setTrophyTargetPowerRaw(formatStatPreserve(oppTotal));
                    }
                    if (selectedOpponentProfile) {
                      const oppTrophy = calculateBloxyTrophy({
                        currentMultis: selectedOpponentProfile.spts.multis,
                        isOg: Boolean(selectedOpponentProfile.spts.isOgPlayer)
                      });
                      setTrophyTargetRank(oppTrophy.effectiveRank);
                    }
                  }}
                  className="min-h-[32px] rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 text-[11px] font-semibold text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  {t.spts.trophyUsePvpOpponentBtn}
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                    {t.spts.trophyTargetRankLabel}
                  </span>
                  <select
                    value={trophyTargetRank}
                    onChange={(e) => setTrophyTargetRank(e.target.value as BloxyTrophyRankId)}
                    className="min-h-[38px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 text-xs text-[var(--text-primary)]"
                  >
                    {BLOXY_TROPHY_TIERS.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {t.spts.trophyRankNames[tier.id]}
                        {tier.minTokensSpent > 0 ? ` (${fmtNum(tier.minTokensSpent)})` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                    {t.spts.trophyTargetPowerLabel}
                  </span>
                  <input
                    type="text"
                    value={trophyTargetPowerRaw}
                    onChange={(e) => setTrophyTargetPowerRaw(e.target.value)}
                    placeholder={t.spts.currentStatPlaceholder}
                    className="min-h-[38px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 text-xs text-[var(--text-primary)]"
                  />
                </label>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={trophyTargetInCombat}
                  onChange={(e) => setTrophyTargetInCombat(e.target.checked)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                <span>{t.spts.trophyTargetCombatLabel}</span>
              </label>

              <div
                className={`rounded-[var(--radius-control)] border p-3 text-xs font-medium ${
                  trophyInteraction.outcome === 'reacts'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : trophyInteraction.outcome === 'bounced_back' ||
                        trophyInteraction.outcome === 'failed_power_gap'
                      ? 'border-red-500/40 bg-red-500/10 text-red-300'
                      : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                }`}
              >
                {interp(t.spts.trophyFlexOutcomes[trophyInteraction.outcome], {
                  studs: trophyInteraction.studs,
                  ratio: Number.isFinite(trophyInteraction.powerRatio)
                    ? fmtNum(trophyInteraction.powerRatio)
                    : '∞',
                  reaction: t.spts.trophyReactions[bloxyTrophy.effectiveRank]
                })}
              </div>
            </section>

            <section className="space-y-3 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {t.spts.trophyNewUpdateTitle}
              </h3>
              <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                {t.spts.trophyNewUpdateItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* All Ranks Reference Table */}
          <section className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <h3 className="mb-3 text-sm font-bold text-[var(--text-primary)]">
              {t.spts.trophyTableTitle}
            </h3>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  <th className="py-2 pr-3 font-semibold">{t.spts.trophyColRank}</th>
                  <th className="py-2 pr-3 font-semibold">{t.spts.trophyColSpent}</th>
                  <th className="py-2 pr-3 font-semibold">{t.spts.trophyColRadius}</th>
                  <th className="py-2 font-semibold">{t.spts.trophyColReaction}</th>
                </tr>
              </thead>
              <tbody>
                {BLOXY_TROPHY_TIERS.filter((tier) => tier.id !== 'none').map((tier) => {
                  const isCurrent = tier.id === bloxyTrophy.effectiveRank;
                  return (
                    <tr
                      key={tier.id}
                      className={`border-b border-[var(--border-subtle)]/50 ${
                        isCurrent ? 'bg-amber-500/10 font-semibold text-amber-300' : ''
                      }`}
                    >
                      <td className="py-2 pr-3">{t.spts.trophyRankNames[tier.id]}</td>
                      <td className="py-2 pr-3 font-mono">{fmtNum(tier.minTokensSpent)}</td>
                      <td className="py-2 pr-3 font-mono">
                        {tier.studs > 0
                          ? interp(t.spts.trophyStudsTemplate, { studs: tier.studs })
                          : '—'}
                      </td>
                      <td className="py-2">{t.spts.trophyReactions[tier.id]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {/* ==================== TAB 5: PVP SIMULATOR ==================== */}
      {sptsUi.tab === 'pvp' && (
        <div className="space-y-4">
          {/* PVP Title, Mechanics Guide + Collapsible Real PvP Conditions */}
          <section className="space-y-3 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                <Swords className="h-4 w-4 text-[var(--accent)]" />
                <span>{t.spts.pvpTitle}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                {t.spts.pvpSkillLoadoutHint}
              </p>
            </div>

            <div className="flex items-start gap-2.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 p-3 text-xs text-[var(--text-secondary)]">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
              <div>
                <div className="font-semibold text-[var(--text-primary)]">
                  {t.spts.pvpSkillHelpTitle}
                </div>
                <p className="mt-0.5 leading-relaxed">{t.spts.pvpSkillHelpBody}</p>
              </div>
            </div>

            {/* Compact Collapsible Real PvP Conditions */}
            <div className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/60">
              <button
                type="button"
                onClick={() => setPvpConditionsOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold text-[var(--text-primary)]"
              >
                <span>{t.spts.pvpConditionsTitle}</span>
                {pvpConditionsOpen ? (
                  <ChevronUp className="h-4 w-4 text-[var(--text-secondary)]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
                )}
              </button>

              {pvpConditionsOpen && (
                <div className="grid gap-3 border-t border-[var(--border-subtle)] p-3 md:grid-cols-2">
                  {/* Left Fighter Conditions */}
                  <div className="space-y-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5">
                    <div className="text-[11px] font-bold text-[var(--text-primary)]">
                      {profile.name}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
                      <label className="flex cursor-pointer items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={pvpConditions.leftInvis}
                          onChange={(e) =>
                            updateSptsUi({
                              pvpConditions: { ...pvpConditions, leftInvis: e.target.checked }
                            })
                          }
                          className="h-4 w-4 accent-[var(--accent)]"
                        />
                        <span>{t.spts.pvpInvisToggle}</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={pvpConditions.leftHellfire}
                          onChange={(e) =>
                            updateSptsUi({
                              pvpConditions: { ...pvpConditions, leftHellfire: e.target.checked }
                            })
                          }
                          className="h-4 w-4 accent-[var(--accent)]"
                        />
                        <span>{t.spts.pvpHellfireToggle}</span>
                      </label>
                    </div>
                    <label className="block space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                        <span>{t.spts.pvpDodgeSlider}</span>
                        <span className="font-mono font-semibold text-[var(--text-primary)]">
                          {Math.round(pvpConditions.leftDodge * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={85}
                        step={5}
                        value={Math.round(pvpConditions.leftDodge * 100)}
                        onChange={(e) =>
                          updateSptsUi({
                            pvpConditions: {
                              ...pvpConditions,
                              leftDodge: Number(e.target.value) / 100
                            }
                          })
                        }
                        className="w-full accent-[var(--accent)]"
                      />
                    </label>
                  </div>

                  {/* Right Fighter Conditions */}
                  <div className="space-y-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5">
                    <div className="text-[11px] font-bold text-[var(--text-primary)]">
                      {oppName}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
                      <label className="flex cursor-pointer items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={pvpConditions.rightInvis}
                          onChange={(e) =>
                            updateSptsUi({
                              pvpConditions: { ...pvpConditions, rightInvis: e.target.checked }
                            })
                          }
                          className="h-4 w-4 accent-[var(--accent)]"
                        />
                        <span>{t.spts.pvpInvisToggle}</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={pvpConditions.rightHellfire}
                          onChange={(e) =>
                            updateSptsUi({
                              pvpConditions: { ...pvpConditions, rightHellfire: e.target.checked }
                            })
                          }
                          className="h-4 w-4 accent-[var(--accent)]"
                        />
                        <span>{t.spts.pvpHellfireToggle}</span>
                      </label>
                    </div>
                    <label className="block space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                        <span>{t.spts.pvpDodgeSlider}</span>
                        <span className="font-mono font-semibold text-[var(--text-primary)]">
                          {Math.round(pvpConditions.rightDodge * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={85}
                        step={5}
                        value={Math.round(pvpConditions.rightDodge * 100)}
                        onChange={(e) =>
                          updateSptsUi({
                            pvpConditions: {
                              ...pvpConditions,
                              rightDodge: Number(e.target.value) / 100
                            }
                          })
                        }
                        className="w-full accent-[var(--accent)]"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Left vs Right Fighter Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <section className="space-y-3 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-[var(--text-secondary)]">{t.spts.pvpLeft}</div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">{profile.name}</div>
                </div>
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={spts.halfCooldownPass}
                    onChange={(e) => updateSpts({ halfCooldownPass: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>{t.spts.halfCooldownPass}</span>
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['FS', 'BT', 'PP'] as const).map((k) => (
                  <label key={k} className="block space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                      {k}
                    </span>
                    <input
                      type="text"
                      value={spts.stats[k]}
                      onChange={(e) =>
                        updateSpts({ stats: { ...spts.stats, [k]: e.target.value } })
                      }
                      placeholder="0"
                      className="min-h-[38px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 text-xs text-[var(--text-primary)]"
                    />
                  </label>
                ))}
              </div>
              <SkillMultiSelect
                label={t.spts.pvpSkillsFieldLabel}
                useAuto={pvpUseAutoSkills}
                selected={pvpSelectedSkills}
                onChange={(useAuto, nextSkills) =>
                  updateSptsUi({ pvpUseAutoSkills: useAuto, pvpSelectedSkills: nextSkills })
                }
                autoLabel={t.spts.pvpModeAuto}
                noneLabel={t.spts.pvpSkillsNone}
                selectedCountTemplate={t.spts.pvpSkillsSelectedCount}
                selectAllLabel={t.common.selectAll}
                selectNoneLabel={t.common.selectNone}
                skillLabels={pvpSkillLabels}
              />
            </section>

            <section className="space-y-3 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-[var(--text-secondary)]">{t.spts.pvpRight}</div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">{oppName}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      disabled={Boolean(selectedOpponentProfile)}
                      checked={oppHalfCooldown}
                      onChange={(e) =>
                        updateSptsUi({
                          manualOpponent: {
                            ...sptsUi.manualOpponent,
                            halfCooldown: e.target.checked
                          }
                        })
                      }
                      className="h-4 w-4 accent-[var(--accent)] disabled:opacity-60"
                    />
                    <span>{t.spts.halfCooldownShort}</span>
                  </label>
                  <select
                    value={sptsUi.opponentSourceId}
                    onChange={(e) => updateSptsUi({ opponentSourceId: e.target.value })}
                    className="min-h-[34px] rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 text-xs text-[var(--text-primary)]"
                  >
                    <option value="manual">{t.spts.pvpManualInput}</option>
                    {otherProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {t.spts.pvpProfilePrefix}: {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['fs', 'bt', 'pp'] as const).map((k) => (
                  <label key={k} className="block space-y-1">
                    <span className="text-[11px] font-semibold uppercase text-[var(--text-secondary)]">
                      {k}
                    </span>
                    <input
                      type="text"
                      disabled={Boolean(selectedOpponentProfile)}
                      value={
                        selectedOpponentProfile
                          ? selectedOpponentProfile.spts.stats[k.toUpperCase() as 'FS' | 'BT' | 'PP']
                          : sptsUi.manualOpponent[k]
                      }
                      onChange={(e) =>
                        updateSptsUi({
                          manualOpponent: { ...sptsUi.manualOpponent, [k]: e.target.value }
                        })
                      }
                      placeholder="0"
                      className="min-h-[38px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 text-xs text-[var(--text-primary)] disabled:opacity-60"
                    />
                  </label>
                ))}
              </div>
              <SkillMultiSelect
                label={t.spts.pvpSkillsFieldLabel}
                useAuto={pvpOpponentUseAutoSkills}
                selected={pvpOpponentSelectedSkills}
                onChange={(useAuto, nextSkills) =>
                  updateSptsUi({
                    pvpOpponentUseAutoSkills: useAuto,
                    pvpOpponentSelectedSkills: nextSkills
                  })
                }
                autoLabel={t.spts.pvpModeAuto}
                noneLabel={t.spts.pvpSkillsNone}
                selectedCountTemplate={t.spts.pvpSkillsSelectedCount}
                selectAllLabel={t.common.selectAll}
                selectNoneLabel={t.common.selectNone}
                skillLabels={pvpSkillLabels}
              />
            </section>
          </div>

          {/* Winner Banner + Localized Explanations */}
          <section className="space-y-4 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="text-xs text-[var(--text-secondary)]">{t.spts.pvpOutcome}</div>
                <div className="mt-0.5 text-xl font-extrabold text-[var(--text-primary)]">
                  {pvpSim.winner === 'draw'
                    ? t.spts.pvpDraw
                    : interp(t.spts.pvpWinnerWins, {
                        name: pvpSim.winner === 'attacker' ? profile.name : oppName
                      })}
                </div>
                <div className="mt-1 text-xs text-[var(--accent)]">
                  {interp(t.spts.pvpUsingSkill, {
                    left:
                      pvpSim.chosenAttackerSkills.length > 0
                        ? pvpSim.chosenAttackerSkills.map((sk) => t.spts.pvpSkillsMap[sk]).join(' + ')
                        : t.spts.pvpSkillsMap[pvpSim.chosenAttackerSkill as PvpResolvedSkill],
                    right:
                      pvpSim.chosenDefenderSkills.length > 0
                        ? pvpSim.chosenDefenderSkills.map((sk) => t.spts.pvpSkillsMap[sk]).join(' + ')
                        : t.spts.pvpSkillsMap[pvpSim.chosenDefenderSkill as PvpResolvedSkill]
                  })}
                </div>
              </div>

              {pvpSim.winner !== 'attacker' && pvpSim.winOptions.some((o) => o.farmGap > 0) && (
                <div className="flex flex-wrap gap-2">
                  {pvpSim.winOptions
                    .filter((o) => o.farmGap > 0)
                    .map((opt, optIdx) => {
                      const handleFarmClick = () => {
                        const formattedGoal = formatNumber(opt.targetValue, { decimals: 2 });
                        updateActiveProfile((p) => ({
                          ...p,
                          sptsUi: {
                            ...p.sptsUi,
                            tab: 'stats',
                            statType: opt.statType,
                            goalMode: 'amountToTime',
                            goalValueRaw: formattedGoal,
                            statGoals: {
                              ...p.sptsUi.statGoals,
                              [opt.statType]: formattedGoal
                            },
                            statGoalModes: {
                              ...p.sptsUi.statGoalModes,
                              [opt.statType]: 'amountToTime'
                            }
                          }
                        }));
                      };
                      const btnLabel =
                        optIdx === 0
                          ? pvpSim.cannotWinWithFsOnly && opt.statType !== 'FS'
                            ? interp(t.spts.pvpCannotWinFsBtn, {
                                amount: fmtNum(opt.farmGap),
                                stat: opt.statType
                              })
                            : interp(t.spts.pvpFarmBtn, {
                                amount: fmtNum(opt.farmGap),
                                stat: opt.statType
                              })
                          : interp(t.spts.pvpAltFarmBtn, {
                              amount: fmtNum(opt.farmGap),
                              stat: opt.statType
                            });

                      return (
                        <button
                          key={opt.statType}
                          type="button"
                          onClick={handleFarmClick}
                          className={
                            optIdx === 0
                              ? 'inline-flex min-h-[40px] items-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-xs font-bold text-[var(--accent-fg)]'
                              : 'inline-flex min-h-[40px] items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--accent)] bg-[var(--bg-canvas)] px-3.5 text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent)]/10'
                          }
                        >
                          <span>{btnLabel}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                <Zap className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span>{t.spts.pvpWhyTitle}</span>
              </div>
              <ul className="list-disc space-y-1 pl-4 text-xs text-[var(--text-secondary)]">
                {pvpSim.reasons.map((r, idx) => (
                  <li key={`${r.code}-${idx}`}>
                    {interp(t.spts.pvpReasons[r.code], r.params ?? {})}
                  </li>
                ))}
              </ul>
            </div>

            {/* 4 Metrics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-[var(--radius-control)] bg-[var(--bg-canvas)] p-3">
                <div className="text-[10px] text-[var(--text-secondary)]">{t.spts.pvpYourDps}</div>
                <div className="font-mono text-sm font-bold text-[var(--text-primary)]">
                  {fmtNum(pvpSim.attackerDps)}/{t.timeUnits.s}
                </div>
                {pvpSim.attackerDamagePerHit > 0 && (
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    {interp(t.spts.pvpPerHitLabel, { dmg: fmtNum(pvpSim.attackerDamagePerHit) })}
                  </div>
                )}
              </div>
              <div className="rounded-[var(--radius-control)] bg-[var(--bg-canvas)] p-3">
                <div className="text-[10px] text-[var(--text-secondary)]">{t.spts.pvpYourTtk}</div>
                <div className="font-mono text-sm font-bold text-[var(--text-primary)]">
                  {Number.isFinite(pvpSim.ttkAttackerWinsSeconds)
                    ? fmtTime(pvpSim.ttkAttackerWinsSeconds)
                    : '∞'}
                </div>
                {Number.isFinite(pvpSim.attackerHitsNeeded) && (
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    {interp(t.spts.pvpHitsLabel, { hits: pvpSim.attackerHitsNeeded })}
                  </div>
                )}
              </div>
              <div className="rounded-[var(--radius-control)] bg-[var(--bg-canvas)] p-3">
                <div className="text-[10px] text-[var(--text-secondary)]">{t.spts.pvpEnemyTtk}</div>
                <div className="font-mono text-sm font-bold text-[var(--text-primary)]">
                  {Number.isFinite(pvpSim.ttkDefenderWinsSeconds)
                    ? fmtTime(pvpSim.ttkDefenderWinsSeconds)
                    : '∞'}
                </div>
                {pvpSim.attackerDiedFromReflect ? (
                  <div className="text-[10px] text-amber-400">
                    {interp(t.spts.pvpReflectDeathSub, {
                      hits: pvpSim.attackerReflectDeathHits,
                      pct: pvpSim.attackerReflectDeathPercent
                    })}
                  </div>
                ) : (
                  Number.isFinite(pvpSim.defenderHitsNeeded) && (
                    <div className="text-[10px] text-[var(--text-secondary)]">
                      {interp(t.spts.pvpHitsLabel, { hits: pvpSim.defenderHitsNeeded })}
                    </div>
                  )
                )}
              </div>
              <div className="rounded-[var(--radius-control)] bg-[var(--bg-canvas)] p-3">
                <div className="text-[10px] text-[var(--text-secondary)]">
                  {t.spts.pvpDamageReflect}
                </div>
                <div className="font-mono text-sm font-bold text-[var(--text-primary)]">
                  {pvpSim.reflectPercent}%
                </div>
              </div>
            </div>

            {/* Collapsible Combat Log (50ms ticks) */}
            <div className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70">
              <button
                type="button"
                onClick={() => setPvpLogOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs font-semibold text-[var(--text-primary)]"
              >
                <span className="flex items-center gap-2">
                  <span>{t.spts.pvpLogTitle}</span>
                  <span className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]">
                    {pvpSim.combatLog.length}
                  </span>
                </span>
                {pvpLogOpen ? (
                  <ChevronUp className="h-4 w-4 text-[var(--text-secondary)]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
                )}
              </button>
              {pvpLogOpen && (
                <div className="max-h-64 overflow-y-auto border-t border-[var(--border-subtle)] px-3.5 py-2.5 font-mono text-[11px] leading-relaxed">
                  {pvpSim.combatLog.length === 0 ? (
                    <div className="text-[var(--text-secondary)]">{t.spts.pvpLogEmpty}</div>
                  ) : (
                    <ul className="space-y-1">
                      {pvpSim.combatLog.map((entry, idx) => {
                        const actorName = entry.actor === 'attacker' ? profile.name : oppName;
                        const targetName = entry.target === 'attacker' ? profile.name : oppName;
                        const skillName = entry.skill ? t.spts.pvpSkillsMap[entry.skill] : '';
                        const lineText = interp(t.spts.pvpLogEvents[entry.kind], {
                          actor: actorName,
                          target: targetName,
                          skill: skillName,
                          dmg: entry.damage !== undefined ? fmtNum(entry.damage) : '0',
                          hp: entry.targetHpAfter !== undefined ? fmtNum(entry.targetHpAfter) : '0',
                          maxHp: entry.targetMaxHp !== undefined ? fmtNum(entry.targetMaxHp) : '0',
                          pct: entry.reflectPercent ?? 0
                        });
                        const rowColor =
                          entry.kind === 'ko'
                            ? 'font-bold text-[var(--accent)]'
                            : entry.kind === 'reflect' || entry.kind === 'backfire'
                              ? 'text-amber-400'
                              : entry.kind === 'miss_invis' || entry.kind === 'miss_dodge'
                                ? 'text-[var(--text-secondary)]'
                                : 'text-[var(--text-primary)]';
                        return (
                          <li key={idx} className={`flex gap-2 ${rowColor}`}>
                            <span className="shrink-0 text-[var(--text-secondary)]">
                              [{fmtTime(entry.timeSec)}]
                            </span>
                            <span>{lineText}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ==================== TAB 5: WIKI & QUESTS ==================== */}
      {sptsUi.tab === 'wiki' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-3 gap-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 sm:inline-flex">
              {(
                [
                  ['skills', t.spts.wikiTabSkills],
                  ['quests', t.spts.wikiTabQuests],
                  ['reputation', t.spts.wikiTabReputation]
                ] as [WikiSection, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => updateSptsUi({ wikiSection: id })}
                  className={`min-h-[34px] truncate rounded-[var(--radius-control)] px-2.5 text-xs font-semibold ${
                    sptsUi.wikiSection === id
                      ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {sptsUi.wikiSection !== 'reputation' && (
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  value={sptsUi.wikiSearch}
                  onChange={(e) => updateSptsUi({ wikiSearch: e.target.value })}
                  placeholder={t.spts.wikiSearchPlaceholder}
                  className="min-h-[38px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-8 pr-3 text-xs text-[var(--text-primary)]"
                />
              </div>
            )}
          </div>

          {sptsUi.wikiSection === 'skills' && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ['All', t.spts.wikiCatAll],
                    ['Skill', t.spts.wikiCatSkill],
                    ['Passive', t.spts.wikiCatPassive],
                    ['Mechanic', t.spts.wikiCatMechanic]
                  ] as [WikiCat, string][]
                ).map(([cat, label]) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => updateSptsUi({ wikiCat: cat })}
                    className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                      sptsUi.wikiCat === cat
                        ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {filteredWikiEntries.map((entry) => {
                  const info = t.spts.wikiEntries[entry.id];
                  if (!info) return null;
                  return (
                    <article
                      key={entry.id}
                      className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">{info.name}</h3>
                        <span className="shrink-0 rounded bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                          {entry.category === 'Skill'
                            ? t.spts.wikiCatSkill
                            : entry.category === 'Passive'
                              ? t.spts.wikiCatPassive
                              : t.spts.wikiCatMechanic}
                        </span>
                      </div>
                      <div className="mt-1 text-xs font-medium text-[var(--accent)]">
                        {t.spts.wikiReqPrefix} {info.unlock}
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                        {info.effect}
                      </p>
                      {info.tiers && (
                        <div className="mt-2 text-[11px] text-[var(--text-secondary)]">
                          <span className="font-semibold text-[var(--text-primary)]">
                            {t.spts.wikiTiersPrefix}{' '}
                          </span>
                          {info.tiers.join(' · ')}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {sptsUi.wikiSection === 'quests' && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ['All', t.spts.wikiQuestGroupAll],
                    ['Main', t.spts.wikiQuestGroupMain],
                    ['Daily', t.spts.wikiQuestGroupDaily],
                    ['Weekly', t.spts.wikiQuestGroupWeekly],
                    ['Special', t.spts.wikiQuestGroupSpecial]
                  ] as [QuestGroupFilter, string][]
                ).map(([grp, label]) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setWikiQuestGroup(grp)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                      wikiQuestGroup === grp
                        ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {filteredQuests.map((q) => {
                  const info = t.spts.quests[q.id];
                  if (!info) return null;
                  return (
                    <article
                      key={q.id}
                      className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4"
                    >
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">{info.title}</h3>
                      <div className="mt-1 text-xs text-[var(--text-secondary)]">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {t.spts.wikiReqPrefix}{' '}
                        </span>
                        {info.req}
                      </div>
                      <div className="mt-1 text-xs text-emerald-400">{info.reward}</div>
                      {info.unlocks && (
                        <div className="mt-1 text-xs text-[var(--accent)]">
                          {t.spts.wikiUnlocksPrefix} {info.unlocks}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {sptsUi.wikiSection === 'reputation' && (
            <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
                  <tr>
                    <th className="py-2 pr-3">{t.spts.wikiColHeroRep}</th>
                    <th className="py-2 pr-3">{t.spts.wikiColHero}</th>
                    <th className="py-2 pr-3">{t.spts.wikiColVillainRep}</th>
                    <th className="py-2">{t.spts.wikiColVillain}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]/50">
                  {SPTS_REPUTATION_TIERS.map((tier) => (
                    <tr key={tier.heroRep}>
                      <td className="py-2 pr-3 font-mono text-emerald-400">+{fmtNum(tier.heroRep)}</td>
                      <td className="py-2 pr-3 font-medium text-[var(--text-primary)]">
                        {t.spts.reputationHeroTitles[tier.heroRep] ?? tier.heroTitle}
                      </td>
                      <td className="py-2 pr-3 font-mono text-rose-400">
                        {tier.villainRep === 0 ? '0' : `-${fmtNum(Math.abs(tier.villainRep))}`}
                      </td>
                      <td className="py-2 font-medium text-[var(--text-primary)]">
                        {t.spts.reputationVillainTitles[tier.villainRep] ?? tier.villainTitle}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Subtle Responsive In-Feed Ad Slot */}
      <AdSlot variant="infeed" />
    </div>
  );
}
