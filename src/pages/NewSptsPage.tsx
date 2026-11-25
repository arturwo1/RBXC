import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  Info,
  Package,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Play,
  Pause
} from 'lucide-react';
import { AdSlot } from '../components/AdSlot';
import { FieldHeaderWithOverride } from '../components/OverrideToggle';
import { CustomQuestsBuilder } from '../components/spts/CustomQuestsBuilder';
import { ManualTickAndBonusControls } from '../components/spts/ManualTickAndBonusControls';
import { SptsVersionBanner } from '../components/spts/SptsVersionBanner';
import { TieredQuestsSelector } from '../components/spts/TieredQuestsSelector';
import {
  EQUIPMENT_SLOTS_REGISTRY,
  HUNT_INDEX_MOBS,
  NEW_SPTS_CONFIG,
  NEW_SPTS_DAILY_MAX_TOTAL,
  NEW_SPTS_DAILY_QUESTS,
  NEW_SPTS_EQUIPMENT_STUBS,
  NEW_SPTS_PASSIVE_TOKENS_PER_MIN,
  NEW_SPTS_WEEKLY_MAX_TOTAL,
  NEW_SPTS_WEEKLY_QUESTS
} from '../core/newSptsData';
import { formatNumber, parseNumber } from '../core/numbers';
import {
  buildAutoZoneProgression,
  calculateTokenRate,
  computeBackgroundGrindDelta,
  computeBtDeathTrainEfficiency,
  estimatePlaytimeRange,
  getNextZoneOrWeight,
  getSptsTickSeconds,
  inferBestWeightForStat,
  inferBestZoneForStat,
  simulateStatProgress,
  type QuestMode
} from '../core/spts';
import {
  SPTS_LOCATIONS,
  SPTS_MULTIS,
  SPTS_TICK_SECONDS,
  SPTS_WEIGHTS,
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
  type NewSptsTab,
  type PlayerProfile
} from '../store/useAppStore';

const STAT_OPTIONS: SptsStatType[] = ['FS', 'BT', 'PP', 'MS', 'JF'];
const STAT_GOAL_CHIPS_NUM = [1e6, 1e9, 1e12, 1e15, 1e18];
const TIME_GOAL_CHIPS = ['1h', '12h', '1d', '7d', '1mo'];
const VIP_DURATION_CHIPS = ['7d', '1mo', '3mo', ''];

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

function computeNewSptsZoneAndGain(profile: PlayerProfile, stat: SptsStatType) {
  const { newSpts } = profile;
  const currentVal = parseNumber(newSpts.stats[stat]);
  const ppVal = parseNumber(newSpts.stats.PP);
  const multiVal = SPTS_MULTIS[newSpts.multis[stat]] ?? 1;
  const customTick = Number(newSpts.customTickSeconds[stat]);
  const tickSec = getSptsTickSeconds(
    stat,
    Number.isFinite(customTick) && customTick > 0 ? customTick : undefined
  );
  const customPerTick = parseNumber(newSpts.customPerTick);
  const equipBonusFactor = 1 + Math.max(0, Number(newSpts.equipmentBonusPercent) || 0) / 100;
  const deathReturnSec = parseTime(newSpts.btDeathReturnDuration);

  const isManualActive = newSpts.gainCalcMode === 'manual' && customPerTick > 0;
  if (isManualActive) {
    const perTick = customPerTick * equipBonusFactor;
    return {
      zoneId: 'custom',
      zoneMult: 1,
      minReq: 0,
      safeReq: 0,
      perTick,
      tickSec,
      baseGainPerSec: customPerTick / tickSec,
      equipBonusFactor,
      isDeathTraining: false,
      deathEfficiency: 1,
      autoId:
        stat === 'MS' || stat === 'JF'
          ? inferBestWeightForStat(stat, currentVal).id
          : inferBestZoneForStat(stat, currentVal, ppVal, newSpts.safeAfkOnly).id,
      isAuto: false
    };
  }

  if (stat === 'MS' || stat === 'JF') {
    const autoW = inferBestWeightForStat(stat, currentVal);
    const chosenId = newSpts.weights[stat];
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

  const autoLoc = inferBestZoneForStat(stat, currentVal, ppVal, newSpts.safeAfkOnly);
  const chosenId = newSpts.locations[stat];
  const isAuto = !chosenId || chosenId === 'auto';

  if (stat === 'BT' && isAuto && !newSpts.safeAfkOnly && deathReturnSec > 0) {
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
  const isDeathTraining =
    stat === 'BT' && !newSpts.safeAfkOnly && loc.requirement > 0 && currentVal < safeReq;
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

export function NewSptsPage() {
  usePageSeo({
    title: 'The New SPTS Calculator (2026) — Stats, Quests & Tokens | RBXC',
    description:
      'Updated Super Power Training Simulator (Nov 25, 2026) calculator: +500 passive tokens/min, 18 Daily & 17 Weekly tiered quests, equipment bonus %, manual ticks, custom story quests, and playtime planner.',
    canonicalPath: '/spts/',
    keywords:
      'The New SPTS calculator, Super Power Training Simulator 2026, New SPTS quests tokens, SPTS remastered calculator, RBXC',
    breadcrumbs: [
      { name: 'Hub', path: '/' },
      { name: 'The New SPTS (2026)', path: '/spts/' }
    ]
  });

  const t = useT();
  const { fmtNum, fmtMult, fmtTime, fmtEta } = useFormatters();

  const profile = useActiveProfile();
  const updateActiveProfile = useAppStore((s) => s.updateActiveProfile);

  const { newSpts, newSptsUi, newSptsGrindSession } = profile;

  const [zoneOverrideOpen, setZoneOverrideOpen] = useState(false);
  const [multiOverrideOpen, setMultiOverrideOpen] = useState(false);
  const [goalOverrideOpen, setGoalOverrideOpen] = useState(false);
  const [statsQuestsOpen, setStatsQuestsOpen] = useState(false);
  const [playtimeQuestsOpen, setPlaytimeQuestsOpen] = useState(false);
  const [customQuestsOpen, setCustomQuestsOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const updateNewSpts = useCallback(
    (patch: Partial<typeof newSpts>) => {
      updateActiveProfile((p) => ({
        ...p,
        newSpts: { ...p.newSpts, ...patch }
      }));
    },
    [updateActiveProfile]
  );

  const updateNewSptsUi = useCallback(
    (patch: Partial<typeof newSptsUi>) => {
      updateActiveProfile((p) => ({
        ...p,
        newSptsUi: { ...p.newSptsUi, ...patch }
      }));
    },
    [updateActiveProfile]
  );

  const activeStat = newSptsUi.statType;
  const activeGoalRaw = newSptsUi.statGoals?.[activeStat] ?? newSptsUi.goalValueRaw ?? '';
  const activeGoalMode: GoalMode =
    newSptsUi.statGoalModes?.[activeStat] ?? newSptsUi.goalMode ?? 'amountToTime';

  const setActiveGoalRaw = useCallback(
    (raw: string, statKey: SptsStatType = activeStat) => {
      updateActiveProfile((p) => ({
        ...p,
        newSptsUi: {
          ...p.newSptsUi,
          goalValueRaw: raw,
          statGoals: {
            ...p.newSptsUi.statGoals,
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
        newSptsUi: {
          ...p.newSptsUi,
          goalMode: mode,
          statGoalModes: {
            ...p.newSptsUi.statGoalModes,
            [statKey]: mode
          }
        }
      }));
    },
    [activeStat, updateActiveProfile]
  );

  // Quest selection callbacks
  const selectedDailyIds = newSpts.selectedDailyQuests ?? [];
  const selectedWeeklyIds = newSpts.selectedWeeklyQuests ?? [];

  const toggleDailyQuest = useCallback(
    (id: string) => {
      const next = selectedDailyIds.includes(id)
        ? selectedDailyIds.filter((x) => x !== id)
        : [...selectedDailyIds, id];
      updateNewSpts({
        selectedDailyQuests: next,
        dailyQuests: next.length > 0
      });
    },
    [selectedDailyIds, updateNewSpts]
  );

  const toggleDailyTier = useCallback(
    (ids: string[], enable: boolean) => {
      const set = new Set(selectedDailyIds);
      for (const id of ids) {
        if (enable) set.add(id);
        else set.delete(id);
      }
      const next = Array.from(set);
      updateNewSpts({
        selectedDailyQuests: next,
        dailyQuests: next.length > 0
      });
    },
    [selectedDailyIds, updateNewSpts]
  );

  const setAllDailyQuests = useCallback(
    (enable: boolean) => {
      updateNewSpts({
        selectedDailyQuests: enable ? NEW_SPTS_DAILY_QUESTS.map((q) => q.id) : [],
        dailyQuests: enable
      });
    },
    [updateNewSpts]
  );

  const toggleWeeklyQuest = useCallback(
    (id: string) => {
      const next = selectedWeeklyIds.includes(id)
        ? selectedWeeklyIds.filter((x) => x !== id)
        : [...selectedWeeklyIds, id];
      updateNewSpts({
        selectedWeeklyQuests: next,
        weeklyQuests: next.length > 0
      });
    },
    [selectedWeeklyIds, updateNewSpts]
  );

  const toggleWeeklyTier = useCallback(
    (ids: string[], enable: boolean) => {
      const set = new Set(selectedWeeklyIds);
      for (const id of ids) {
        if (enable) set.add(id);
        else set.delete(id);
      }
      const next = Array.from(set);
      updateNewSpts({
        selectedWeeklyQuests: next,
        weeklyQuests: next.length > 0
      });
    },
    [selectedWeeklyIds, updateNewSpts]
  );

  const setAllWeeklyQuests = useCallback(
    (enable: boolean) => {
      updateNewSpts({
        selectedWeeklyQuests: enable ? NEW_SPTS_WEEKLY_QUESTS.map((q) => q.id) : [],
        weeklyQuests: enable
      });
    },
    [updateNewSpts]
  );

  // Background Grind Session Loop
  const syncBackgroundGrind = useCallback((forceTickClock = false) => {
    const now = Date.now();
    if (forceTickClock) setNowMs(now);

    const store = useAppStore.getState();
    const currProfile = store.getActiveProfile();
    const gs = currProfile.newSptsGrindSession;
    if (!gs.running || gs.lastCheckpointAtMs <= 0) return;

    const sessionStat = gs.statType || currProfile.newSptsUi.statType;
    const rateInfo = computeNewSptsZoneAndGain(currProfile, sessionStat);
    const totalGainPerSec = rateInfo.perTick / rateInfo.tickSec;
    const delta = computeBackgroundGrindDelta(gs.lastCheckpointAtMs, now, totalGainPerSec);

    if (delta.awaySeconds < 0.8) return;

    setNowMs(now);
    const isBackgroundReturn = delta.awaySeconds >= 5;

    store.updateActiveProfile((curr) => {
      const currentStatVal = parseNumber(curr.newSpts.stats[sessionStat]);
      const nextStatVal = currentStatVal + delta.gainedAmount;

      const prevBanner = curr.newSptsGrindSession.pendingAwayBanner;
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
        : curr.newSptsGrindSession.pendingAwayBanner;

      return {
        ...curr,
        newSpts: {
          ...curr.newSpts,
          stats: {
            ...curr.newSpts.stats,
            [sessionStat]:
              isBackgroundReturn || delta.gainedAmount >= 1
                ? formatStatPreserve(nextStatVal)
                : curr.newSpts.stats[sessionStat]
          }
        },
        newSptsGrindSession: {
          ...curr.newSptsGrindSession,
          lastCheckpointAtMs: now,
          accumulatedSeconds: curr.newSptsGrindSession.accumulatedSeconds + delta.awaySeconds,
          sessionAddedAmount: curr.newSptsGrindSession.sessionAddedAmount + delta.gainedAmount,
          pendingAwayBanner: nextBanner
        }
      };
    });
  }, []);

  useEffect(() => {
    if (!newSptsGrindSession.running) return;
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
  }, [newSptsGrindSession.running, syncBackgroundGrind]);

  const toggleGrindSession = () => {
    const now = Date.now();
    if (newSptsGrindSession.running) {
      const sessionStat = newSptsGrindSession.statType || newSptsUi.statType;
      const rateInfo = computeNewSptsZoneAndGain(profile, sessionStat);
      const gainPerSec = rateInfo.perTick / rateInfo.tickSec;
      const delta = computeBackgroundGrindDelta(
        newSptsGrindSession.lastCheckpointAtMs,
        now,
        gainPerSec
      );
      updateActiveProfile((curr) => {
        const nextVal = parseNumber(curr.newSpts.stats[sessionStat]) + delta.gainedAmount;
        return {
          ...curr,
          newSpts: {
            ...curr.newSpts,
            stats: {
              ...curr.newSpts.stats,
              [sessionStat]: formatStatPreserve(nextVal)
            }
          },
          newSptsGrindSession: {
            ...curr.newSptsGrindSession,
            running: false,
            lastCheckpointAtMs: now,
            accumulatedSeconds: curr.newSptsGrindSession.accumulatedSeconds + delta.awaySeconds,
            sessionAddedAmount: curr.newSptsGrindSession.sessionAddedAmount + delta.gainedAmount
          }
        };
      });
    } else {
      updateActiveProfile((curr) => ({
        ...curr,
        newSptsGrindSession: {
          ...curr.newSptsGrindSession,
          running: true,
          statType: newSptsUi.statType,
          startedAtMs: curr.newSptsGrindSession.startedAtMs || now,
          lastCheckpointAtMs: now
        }
      }));
    }
  };

  const resetGrindSession = () => {
    updateActiveProfile((curr) => ({
      ...curr,
      newSptsGrindSession: {
        running: false,
        statType: newSptsUi.statType,
        startedAtMs: 0,
        lastCheckpointAtMs: 0,
        accumulatedSeconds: 0,
        sessionAddedAmount: 0,
        pendingAwayBanner: null
      }
    }));
  };

  const discardAwayStats = () => {
    const banner = newSptsGrindSession.pendingAwayBanner;
    if (!banner) return;
    const now = Date.now();
    updateActiveProfile((curr) => {
      const currentVal = parseNumber(curr.newSpts.stats[banner.statType]);
      const rolledBack = Math.max(0, currentVal - banner.addedAmount);
      return {
        ...curr,
        newSpts: {
          ...curr.newSpts,
          stats: {
            ...curr.newSpts.stats,
            [banner.statType]: rolledBack > 0 ? formatStatPreserve(rolledBack) : ''
          }
        },
        newSptsGrindSession: {
          ...curr.newSptsGrindSession,
          accumulatedSeconds: Math.max(
            0,
            curr.newSptsGrindSession.accumulatedSeconds - banner.awaySeconds
          ),
          sessionAddedAmount: Math.max(
            0,
            curr.newSptsGrindSession.sessionAddedAmount - banner.addedAmount
          ),
          lastCheckpointAtMs: now,
          pendingAwayBanner: null
        }
      };
    });
  };

  const dismissAwayBanner = () => {
    updateActiveProfile((curr) => ({
      ...curr,
      newSptsGrindSession: {
        ...curr.newSptsGrindSession,
        pendingAwayBanner: null
      }
    }));
  };

  // --- Shared Core Calculations ---
  const newSptsStatsNum = useMemo(
    () => ({
      FS: parseNumber(newSpts.stats.FS),
      BT: parseNumber(newSpts.stats.BT),
      PP: parseNumber(newSpts.stats.PP),
      MS: parseNumber(newSpts.stats.MS),
      JF: parseNumber(newSpts.stats.JF)
    }),
    [newSpts.stats.BT, newSpts.stats.FS, newSpts.stats.JF, newSpts.stats.MS, newSpts.stats.PP]
  );

  const dailyQuestTimeSec = useMemo(
    () => parseTime(newSpts.dailyQuestDuration),
    [newSpts.dailyQuestDuration]
  );
  const weeklyQuestTimeSec = useMemo(
    () => parseTime(newSpts.weeklyQuestDuration),
    [newSpts.weeklyQuestDuration]
  );
  const btDeathReturnSec = useMemo(
    () => parseTime(newSpts.btDeathReturnDuration),
    [newSpts.btDeathReturnDuration]
  );

  const currentStatVal = newSptsStatsNum[activeStat];
  const currentTokensVal = parseNumber(newSpts.tokens);
  const currentMultiKey = newSpts.multis[activeStat] || 'x1';
  const currentMultiVal = SPTS_MULTIS[currentMultiKey] ?? 1;

  const zoneCalc = useMemo(
    () => computeNewSptsZoneAndGain(profile, activeStat),
    [activeStat, profile]
  );

  const btDeathEffPreview = useMemo(
    () => computeBtDeathTrainEfficiency(zoneCalc.tickSec, btDeathReturnSec),
    [btDeathReturnSec, zoneCalc.tickSec]
  );

  const nextZoneInfo = useMemo(
    () => getNextZoneOrWeight(activeStat, currentStatVal, newSpts.safeAfkOnly),
    [activeStat, currentStatVal, newSpts.safeAfkOnly]
  );

  const vipRemainingSeconds = useMemo(() => {
    if (!newSpts.vip) return 0;
    if (!newSpts.vipDuration.trim()) return Infinity;
    const parsed = parseTime(newSpts.vipDuration);
    return parsed > 0 ? parsed : Infinity;
  }, [newSpts.vip, newSpts.vipDuration]);

  const dailySelectedSum = useMemo(
    () =>
      NEW_SPTS_DAILY_QUESTS.filter((q) => selectedDailyIds.includes(q.id)).reduce(
        (s, q) => s + q.tokens,
        0
      ),
    [selectedDailyIds]
  );

  const weeklySelectedSum = useMemo(
    () =>
      NEW_SPTS_WEEKLY_QUESTS.filter((q) => selectedWeeklyIds.includes(q.id)).reduce(
        (s, q) => s + q.tokens,
        0
      ),
    [selectedWeeklyIds]
  );

  const questConfig = useMemo(
    () => ({
      dailyQuests: newSpts.dailyQuests,
      weeklyQuests: newSpts.weeklyQuests,
      vip: newSpts.vip,
      vipRemainingSeconds,
      passiveTokensPerMinute: newSpts.passiveTokensPerMin,
      dailyQuestValue: newSpts.dailyQuests ? dailySelectedSum : 0,
      weeklyQuestValue: newSpts.weeklyQuests ? weeklySelectedSum : 0,
      autoGateByStats: newSpts.autoGateQuestsByStats,
      currentStats: newSptsStatsNum,
      trainedStat: activeStat,
      selectedDailyQuestIds: selectedDailyIds,
      selectedWeeklyQuestIds: selectedWeeklyIds,
      dailyQuestTimeSeconds: dailyQuestTimeSec,
      weeklyQuestTimeSeconds: weeklyQuestTimeSec,
      gameConfig: NEW_SPTS_CONFIG,
      customQuests: newSpts.customQuests
    }),
    [
      activeStat,
      dailyQuestTimeSec,
      dailySelectedSum,
      newSpts.autoGateQuestsByStats,
      newSpts.customQuests,
      newSpts.dailyQuests,
      newSpts.passiveTokensPerMin,
      newSpts.vip,
      newSpts.weeklyQuests,
      newSptsStatsNum,
      selectedDailyIds,
      selectedWeeklyIds,
      vipRemainingSeconds,
      weeklyQuestTimeSec,
      weeklySelectedSum
    ]
  );

  const tokenRate = useMemo(() => calculateTokenRate(questConfig), [questConfig]);

  // --- Stats Simulation ---
  const simulation = useMemo(() => {
    const isManualPerTick =
      newSpts.gainCalcMode === 'manual' && parseNumber(newSpts.customPerTick) > 0;
    const effectiveBaseGainPerSec = isManualPerTick
      ? zoneCalc.baseGainPerSec / Math.max(1, currentMultiVal)
      : zoneCalc.baseGainPerSec;

    const autoProgression =
      !isManualPerTick && zoneCalc.isAuto
        ? buildAutoZoneProgression(
            activeStat,
            zoneCalc.tickSec,
            newSptsStatsNum.PP,
            newSpts.safeAfkOnly,
            btDeathReturnSec
          )
        : undefined;

    const effectiveRate = newSptsUi.simulateUpgrades ? tokenRate.totalPerSecond : 0;

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
        questMode: newSpts.questMode,
        questConfig,
        zoneProgression: autoProgression,
        simulateUpgrades: newSptsUi.simulateUpgrades,
        gameConfig: NEW_SPTS_CONFIG,
        equipmentBonusPercent: newSpts.equipmentBonusPercent
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
        questMode: newSpts.questMode,
        questConfig,
        zoneProgression: autoProgression,
        simulateUpgrades: newSptsUi.simulateUpgrades,
        gameConfig: NEW_SPTS_CONFIG,
        equipmentBonusPercent: newSpts.equipmentBonusPercent
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
    newSpts.customPerTick,
    newSpts.equipmentBonusPercent,
    newSpts.gainCalcMode,
    newSpts.questMode,
    newSpts.safeAfkOnly,
    newSptsStatsNum.PP,
    newSptsUi.simulateUpgrades,
    questConfig,
    tokenRate.totalPerSecond,
    zoneCalc.baseGainPerSec,
    zoneCalc.isAuto,
    zoneCalc.tickSec
  ]);

  // --- Token Tab Calculations ---
  const tokenGoalAmount = parseNumber(newSptsUi.tokenGoalRaw);
  const tokenGoalSeconds = parseTime(newSptsUi.tokenGoalRaw);

  const tokenProjection = useMemo(() => {
    if (newSptsUi.tokenGoalMode === 'amountToTime') {
      if (tokenGoalAmount <= currentTokensVal) return 0;
      const diff = tokenGoalAmount - currentTokensVal;
      return tokenRate.totalPerSecond > 0 ? diff / tokenRate.totalPerSecond : Infinity;
    } else {
      if (tokenGoalSeconds <= 0) return 0;
      return currentTokensVal + tokenGoalSeconds * tokenRate.totalPerSecond;
    }
  }, [
    currentTokensVal,
    newSptsUi.tokenGoalMode,
    tokenGoalAmount,
    tokenGoalSeconds,
    tokenRate.totalPerSecond
  ]);

  // --- PlayTime Calculations ---
  const playtime = useMemo(() => {
    const vipDiv = newSpts.vip && vipRemainingSeconds > 0 ? 2 : 1;
    return estimatePlaytimeRange({
      currentMultis: newSpts.multis,
      currentTokens: currentTokensVal,
      assumptions: {
        tpm: newSpts.passiveTokensPerMin,
        dailyBase: tokenRate.dailyPayout / vipDiv,
        weeklyBase: tokenRate.weeklyPayout / vipDiv,
        customHoursPerSec: tokenRate.customHoursPerSecond / vipDiv
      },
      gameConfig: NEW_SPTS_CONFIG
    });
  }, [
    currentTokensVal,
    newSpts.multis,
    newSpts.passiveTokensPerMin,
    newSpts.vip,
    tokenRate.customHoursPerSecond,
    tokenRate.dailyPayout,
    tokenRate.weeklyPayout,
    vipRemainingSeconds
  ]);

  // Localized zone/weight label
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
        ? ` · ${newSpts.safeAfkOnly ? t.spts.btModeSafe4x : t.spts.btModeRisky1x}`
        : '';
    if (zoneCalc.isAuto) {
      return `${t.spts.autoZoneDetected}: ${baseName} (${fmtMult(zoneCalc.zoneMult)})${btBadge}`;
    }
    return `${baseName} (${fmtMult(zoneCalc.zoneMult)})${btBadge}`;
  }, [
    activeStat,
    fmtMult,
    fmtNum,
    newSpts.safeAfkOnly,
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
    newSpts.gainCalcMode === 'manual' ||
    newSpts.equipmentBonusPercent > 0 ||
    (activeStat === 'MS' || activeStat === 'JF'
      ? newSpts.weights[activeStat] !== 'auto'
      : newSpts.locations[activeStat] !== 'auto') ||
    newSpts.customPerTick.trim() !== '' ||
    newSpts.customTickSeconds[activeStat].trim() !== '';

  const hasQuestOverride =
    !newSpts.dailyQuests ||
    !newSpts.weeklyQuests ||
    newSpts.vip ||
    newSpts.autoGateQuestsByStats ||
    newSpts.dailyQuestDuration.trim() !== '' ||
    newSpts.weeklyQuestDuration.trim() !== '' ||
    newSpts.passiveTokensPerMin !== NEW_SPTS_PASSIVE_TOKENS_PER_MIN ||
    selectedDailyIds.length !== NEW_SPTS_DAILY_QUESTS.length ||
    selectedWeeklyIds.length !== NEW_SPTS_WEEKLY_QUESTS.length ||
    newSpts.customQuests.length > 0 ||
    newSpts.questMode !== 'discrete' ||
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

  const liveElapsedDisplay = useMemo(() => {
    if (!newSptsGrindSession.running || newSptsGrindSession.lastCheckpointAtMs <= 0) {
      return newSptsGrindSession.accumulatedSeconds;
    }
    const extra = Math.max(0, (nowMs - newSptsGrindSession.lastCheckpointAtMs) / 1000);
    return newSptsGrindSession.accumulatedSeconds + extra;
  }, [
    newSptsGrindSession.accumulatedSeconds,
    newSptsGrindSession.lastCheckpointAtMs,
    newSptsGrindSession.running,
    nowMs
  ]);

  const displayTrackerStat =
    newSptsGrindSession.running || newSptsGrindSession.sessionAddedAmount > 0
      ? newSptsGrindSession.statType
      : activeStat;

  const filteredQuestsTable = useMemo(() => {
    const q = newSptsUi.wikiSearch.trim().toLowerCase();
    const combined = [...NEW_SPTS_DAILY_QUESTS, ...NEW_SPTS_WEEKLY_QUESTS];
    if (!q) return combined;
    return combined.filter(
      (entry) =>
        entry.stat.toLowerCase().includes(q) ||
        entry.period.toLowerCase().includes(q) ||
        fmtNum(entry.target).toLowerCase().includes(q) ||
        fmtNum(entry.tokens).toLowerCase().includes(q)
    );
  }, [fmtNum, newSptsUi.wikiSearch]);

  const tabItems: { id: NewSptsTab; label: string }[] = [
    { id: 'stats', label: t.newSpts.tabStats },
    { id: 'tokens', label: t.newSpts.tabTokens },
    { id: 'playtime', label: t.newSpts.tabPlaytime },
    { id: 'inventory', label: t.newSpts.tabInventory },
    { id: 'wiki', label: t.newSpts.tabWiki }
  ];

  const toggleStubEquip = (id: string) => {
    const curr = newSpts.equippedIds ?? [];
    const next = curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id];
    updateNewSpts({ equippedIds: next });
  };

  const toggleMultiTrainStat = (st: SptsStatType) => {
    const curr = newSpts.multiTrainStats ?? ['FS'];
    const next = curr.includes(st) ? curr.filter((x) => x !== st) : [...curr, st];
    updateNewSpts({ multiTrainStats: next.length > 0 ? next : [st] });
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <SptsVersionBanner mode="new" />

      {/* Title + Tabs */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl">
            <Flame className="h-5 w-5 shrink-0 text-[var(--accent)]" />
            <span className="truncate">{t.newSpts.title}</span>
          </h1>
          <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
            {t.newSpts.subtitle} · {profile.name} · {fmtMult(currentMultiVal)}
          </p>
        </div>

        <nav
          aria-label={t.newSpts.title}
          className="grid w-full grid-cols-3 gap-1 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 sm:grid-cols-5 md:inline-flex md:w-auto"
        >
          {tabItems.map((tab) => {
            const active = newSptsUi.tab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => updateNewSptsUi({ tab: tab.id })}
                className={`min-h-[38px] truncate rounded-[var(--radius-control)] px-2 text-center text-[11px] font-semibold transition-colors sm:px-3.5 sm:text-xs ${
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

      {/* Offline Continuous Grind Banner */}
      {newSptsGrindSession.pendingAwayBanner && (
        <div className="flex flex-col justify-between gap-3 rounded-[var(--radius-card)] border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-3.5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
            <div className="text-xs leading-relaxed text-[var(--text-primary)] sm:text-sm">
              {interp(t.spts.awayAddedBanner, {
                away: fmtTime(newSptsGrindSession.pendingAwayBanner.awaySeconds),
                amount: fmtNum(newSptsGrindSession.pendingAwayBanner.addedAmount),
                stat: newSptsGrindSession.pendingAwayBanner.statType
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

      {/* ==================== TAB 1: STATS ==================== */}
      {newSptsUi.tab === 'stats' && (
        <div className="grid gap-5 lg:grid-cols-12">
          <section className="space-y-4 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 lg:col-span-5">
            {/* Stat Selector */}
            <div className="grid grid-cols-5 gap-1.5">
              {STAT_OPTIONS.map((st) => {
                const active = activeStat === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => updateNewSptsUi({ statType: st })}
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

            {/* 1. Current Stat + Zone + Manual Tick & Bonus % */}
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
                value={newSpts.stats[activeStat]}
                onChange={(e) =>
                  updateNewSpts({ stats: { ...newSpts.stats, [activeStat]: e.target.value } })
                }
                placeholder={t.spts.currentStatPlaceholder}
                className="min-h-[46px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 text-sm font-medium text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
              />
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-secondary)]">
                <span className="truncate">{activeZoneLabel}</span>
                <span className="font-mono font-semibold text-[var(--text-primary)]">
                  +{fmtNum(zoneCalc.perTick)} / {zoneCalc.tickSec}
                  {t.timeUnits.s}
                </span>
              </div>

              {activeStat === 'BT' && (
                <div className="mt-2.5 space-y-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 p-2.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateNewSpts({ safeAfkOnly: true })}
                      className={`min-h-[32px] rounded-[var(--radius-control)] border px-2 text-[11px] font-semibold transition-colors ${
                        newSpts.safeAfkOnly
                          ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {t.spts.btModeSafe4x}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateNewSpts({ safeAfkOnly: false })}
                      className={`min-h-[32px] rounded-[var(--radius-control)] border px-2 text-[11px] font-semibold transition-colors ${
                        !newSpts.safeAfkOnly
                          ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {t.spts.btModeRisky1x}
                    </button>
                  </div>

                  {!newSpts.safeAfkOnly && (
                    <div className="space-y-1.5 border-t border-[var(--border-subtle)] pt-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-[var(--text-secondary)]">
                          {t.spts.btDeathReturnLabel}:
                        </span>
                        <input
                          type="text"
                          value={newSpts.btDeathReturnDuration}
                          onChange={(e) => updateNewSpts({ btDeathReturnDuration: e.target.value })}
                          placeholder={t.spts.btDeathReturnPlaceholder}
                          className="min-h-[30px] min-w-[110px] flex-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                        />
                        {['0', '10s', '20s', '30s'].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() =>
                              updateNewSpts({ btDeathReturnDuration: chip === '0' ? '' : chip })
                            }
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
                <div className="mt-2.5 space-y-3">
                  <ManualTickAndBonusControls
                    stat={activeStat}
                    gainCalcMode={newSpts.gainCalcMode}
                    customPerTick={newSpts.customPerTick}
                    customTickSeconds={newSpts.customTickSeconds[activeStat]}
                    equipmentBonusPercent={newSpts.equipmentBonusPercent}
                    computedPerTick={zoneCalc.perTick}
                    computedTickSec={zoneCalc.tickSec}
                    onChangeMode={(mode) => updateNewSpts({ gainCalcMode: mode })}
                    onChangeCustomPerTick={(val) => updateNewSpts({ customPerTick: val })}
                    onChangeCustomTickSeconds={(val) =>
                      updateNewSpts({
                        customTickSeconds: { ...newSpts.customTickSeconds, [activeStat]: val }
                      })
                    }
                    onChangeEquipmentBonus={(val) => updateNewSpts({ equipmentBonusPercent: val })}
                  />

                  {newSpts.gainCalcMode === 'auto' && (
                    <div className="space-y-2.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 p-3">
                      {activeStat === 'MS' || activeStat === 'JF' ? (
                        <label className="block space-y-1">
                          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                            {t.spts.weightSelect}
                          </span>
                          <select
                            value={newSpts.weights[activeStat]}
                            onChange={(e) =>
                              updateNewSpts({
                                weights: { ...newSpts.weights, [activeStat]: e.target.value }
                              })
                            }
                            className="min-h-[38px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                          >
                            <option value="auto">
                              {t.common.autoLabel}:{' '}
                              {t.spts.weights[zoneCalc.autoId] ?? zoneCalc.autoId}
                            </option>
                            {SPTS_WEIGHTS.map((w) => (
                              <option key={w.id} value={w.id}>
                                {t.spts.weights[w.id] ?? w.name} ({fmtMult(w.multiplier)})
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : (
                        <label className="block space-y-1">
                          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                            {t.spts.zoneSelect}
                          </span>
                          <select
                            value={newSpts.locations[activeStat]}
                            onChange={(e) =>
                              updateNewSpts({
                                locations: { ...newSpts.locations, [activeStat]: e.target.value }
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
                      )}

                      <label className="block space-y-1">
                        <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                          {t.spts.tickSecondsLabel}
                        </span>
                        <input
                          type="number"
                          step="0.05"
                          min="0.05"
                          value={newSpts.customTickSeconds[activeStat]}
                          onChange={(e) =>
                            updateNewSpts({
                              customTickSeconds: {
                                ...newSpts.customTickSeconds,
                                [activeStat]: e.target.value
                              }
                            })
                          }
                          placeholder={String(SPTS_TICK_SECONDS[activeStat])}
                          className="min-h-[36px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                        />
                      </label>
                    </div>
                  )}

                  {hasZoneOverride && (
                    <button
                      type="button"
                      onClick={() =>
                        updateNewSpts({
                          gainCalcMode: 'auto',
                          equipmentBonusPercent: 0,
                          customPerTick: '',
                          customTickSeconds: { ...newSpts.customTickSeconds, [activeStat]: '' },
                          weights:
                            activeStat === 'MS' || activeStat === 'JF'
                              ? { ...newSpts.weights, [activeStat]: 'auto' }
                              : newSpts.weights,
                          locations:
                            activeStat !== 'MS' && activeStat !== 'JF'
                              ? { ...newSpts.locations, [activeStat]: 'auto' }
                              : newSpts.locations
                        })
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent)] hover:underline"
                    >
                      <RotateCcw className="h-3 w-3" />
                      {t.common.reset}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2. Multiplier + Upgrade Simulation Toggle */}
            <div>
              <FieldHeaderWithOverride
                label={t.spts.multiTier}
                open={multiOverrideOpen}
                onToggle={() => setMultiOverrideOpen((v) => !v)}
                hasCustomOverride={!newSptsUi.simulateUpgrades}
              />
              <select
                value={currentMultiKey}
                onChange={(e) =>
                  updateNewSpts({ multis: { ...newSpts.multis, [activeStat]: e.target.value } })
                }
                className="min-h-[46px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              >
                {Object.entries(SPTS_MULTIS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {fmtMult(v)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
                {t.newSpts.multiExtrapolatedNote}
              </p>

              {multiOverrideOpen && (
                <div className="mt-2.5 space-y-2.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 p-3">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-primary)]">
                    <input
                      type="checkbox"
                      checked={newSptsUi.simulateUpgrades}
                      onChange={(e) => updateNewSptsUi({ simulateUpgrades: e.target.checked })}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <span>{t.spts.simulateUpgrades}</span>
                  </label>
                </div>
              )}
            </div>

            {/* 3. Target Goal + Quick Chips */}
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

                  <label className="block space-y-1">
                    <span className="block truncate text-[10px] text-[var(--text-secondary)]">
                      {t.spts.passiveTokensPerMinLabel}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={newSpts.passiveTokensPerMin}
                      onChange={(e) =>
                        updateNewSpts({
                          passiveTokensPerMin: Math.max(0, Number(e.target.value) || 0)
                        })
                      }
                      className="min-h-[34px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-primary)]"
                    />
                  </label>

                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                      {t.spts.questMode}
                    </span>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {(['discrete', 'averaged'] as QuestMode[]).map((qm) => {
                        const active = newSpts.questMode === qm;
                        return (
                          <button
                            key={qm}
                            type="button"
                            onClick={() => updateNewSpts({ questMode: qm })}
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

            {/* 4. Tokens, Tiered Quests & Custom Quests Builder */}
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
                    value={newSpts.tokens}
                    onChange={(e) => updateNewSpts({ tokens: e.target.value })}
                    placeholder={t.spts.currentTokensPlaceholder}
                    className="min-h-[38px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </label>

                <div className="flex flex-wrap items-end gap-2.5 pb-1 text-xs">
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={newSpts.dailyQuests}
                      onChange={(e) => updateNewSpts({ dailyQuests: e.target.checked })}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <span>{t.spts.daily}</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={newSpts.weeklyQuests}
                      onChange={(e) => updateNewSpts({ weeklyQuests: e.target.checked })}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <span>{t.spts.weekly}</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={newSpts.vip}
                      onChange={(e) => updateNewSpts({ vip: e.target.checked })}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <span>{t.spts.vip}</span>
                  </label>
                </div>
              </div>

              {newSpts.vip && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    type="text"
                    value={newSpts.vipDuration}
                    onChange={(e) => updateNewSpts({ vipDuration: e.target.value })}
                    placeholder={t.spts.vipDurationPlaceholder}
                    className="min-h-[32px] min-w-[120px] flex-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-primary)]"
                  />
                  {VIP_DURATION_CHIPS.map((d) => (
                    <button
                      key={d || 'inf'}
                      type="button"
                      onClick={() => updateNewSpts({ vipDuration: d })}
                      className="rounded border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)] hover:border-[var(--accent)]"
                    >
                      {d || t.spts.vipForever}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-secondary)]">
                <span>
                  {interp(t.newSpts.selectedQuestsSummary, {
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
                  {statsQuestsOpen ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {statsQuestsOpen && (
                <TieredQuestsSelector
                  dailyQuests={NEW_SPTS_DAILY_QUESTS}
                  weeklyQuests={NEW_SPTS_WEEKLY_QUESTS}
                  selectedDailyIds={selectedDailyIds}
                  selectedWeeklyIds={selectedWeeklyIds}
                  autoGateByStats={newSpts.autoGateQuestsByStats}
                  currentStats={newSptsStatsNum}
                  dailyQuestDuration={newSpts.dailyQuestDuration}
                  weeklyQuestDuration={newSpts.weeklyQuestDuration}
                  questUptimeFraction={tokenRate.questUptimeFraction}
                  dailyDowntimeSec={dailyQuestTimeSec}
                  weeklyDowntimeSec={weeklyQuestTimeSec}
                  onToggleDaily={toggleDailyQuest}
                  onToggleDailyTier={toggleDailyTier}
                  onSetAllDaily={setAllDailyQuests}
                  onToggleWeekly={toggleWeeklyQuest}
                  onToggleWeeklyTier={toggleWeeklyTier}
                  onSetAllWeekly={setAllWeeklyQuests}
                  onToggleAutoGate={(val) => updateNewSpts({ autoGateQuestsByStats: val })}
                  onChangeDailyDuration={(val) => updateNewSpts({ dailyQuestDuration: val })}
                  onChangeWeeklyDuration={(val) => updateNewSpts({ weeklyQuestDuration: val })}
                />
              )}

              <div className="border-t border-[var(--border-subtle)] pt-2">
                <button
                  type="button"
                  onClick={() => setCustomQuestsOpen((v) => !v)}
                  className="flex w-full items-center justify-between text-[11px] font-semibold text-[var(--accent)] hover:underline"
                >
                  <span>
                    {t.newSpts.customQuestsTitle} (
                    {newSpts.customQuests.filter((q) => q.enabled).length})
                  </span>
                  {customQuestsOpen ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>

                {customQuestsOpen && (
                  <div className="mt-2">
                    <CustomQuestsBuilder
                      customQuests={newSpts.customQuests}
                      customPerSecond={tokenRate.customPerSecond}
                      onceReadyTokens={tokenRate.onceReadyTokens}
                      onChange={(next) => updateNewSpts({ customQuests: next })}
                    />
                  </div>
                )}
              </div>
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

          {/* RIGHT COLUMN */}
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
                      newSptsGrindSession.running
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {newSptsGrindSession.running
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
                    +{fmtNum(newSptsGrindSession.sessionAddedAmount)} {displayTrackerStat}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={toggleGrindSession}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--accent)] px-3.5 text-xs font-semibold text-[var(--accent-fg)]"
                >
                  {newSptsGrindSession.running ? (
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

      {/* ==================== TAB 2: TOKENS ==================== */}
      {newSptsUi.tab === 'tokens' && (
        <div className="grid gap-5 lg:grid-cols-12">
          <section className="space-y-4 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 lg:col-span-5">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              {t.spts.incomeProfileTitle}
            </h2>

            <div className="space-y-2 text-xs">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={newSpts.dailyQuests}
                  onChange={(e) => updateNewSpts({ dailyQuests: e.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                <span>
                  {interp(t.spts.dailyQuestsLine, {
                    val: fmtNum(
                      tokenRate.dailyPayout / (newSpts.vip && vipRemainingSeconds > 0 ? 2 : 1)
                    )
                  })}
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={newSpts.weeklyQuests}
                  onChange={(e) => updateNewSpts({ weeklyQuests: e.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                <span>
                  {interp(t.spts.weeklyQuestsLine, {
                    val: fmtNum(
                      tokenRate.weeklyPayout / (newSpts.vip && vipRemainingSeconds > 0 ? 2 : 1)
                    )
                  })}
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={newSpts.vip}
                  onChange={(e) => updateNewSpts({ vip: e.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                <span>{t.spts.vipQuestsLine}</span>
              </label>
            </div>

            {newSpts.vip && (
              <div className="space-y-1.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3">
                <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                  {t.spts.vipDurationLabel}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <input
                    type="text"
                    value={newSpts.vipDuration}
                    onChange={(e) => updateNewSpts({ vipDuration: e.target.value })}
                    placeholder={t.spts.vipDurationPlaceholder}
                    className="min-h-[36px] min-w-[140px] flex-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-xs text-[var(--text-primary)]"
                  />
                  {VIP_DURATION_CHIPS.map((d) => (
                    <button
                      key={d || 'inf'}
                      type="button"
                      onClick={() => updateNewSpts({ vipDuration: d })}
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
                  value={newSpts.tokens}
                  onChange={(e) => updateNewSpts({ tokens: e.target.value })}
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
                  value={newSpts.passiveTokensPerMin}
                  onChange={(e) =>
                    updateNewSpts({ passiveTokensPerMin: Math.max(0, Number(e.target.value) || 0) })
                  }
                  className="min-h-[40px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 text-xs text-[var(--text-primary)]"
                />
              </label>
            </div>

            <TieredQuestsSelector
              dailyQuests={NEW_SPTS_DAILY_QUESTS}
              weeklyQuests={NEW_SPTS_WEEKLY_QUESTS}
              selectedDailyIds={selectedDailyIds}
              selectedWeeklyIds={selectedWeeklyIds}
              autoGateByStats={newSpts.autoGateQuestsByStats}
              currentStats={newSptsStatsNum}
              dailyQuestDuration={newSpts.dailyQuestDuration}
              weeklyQuestDuration={newSpts.weeklyQuestDuration}
              questUptimeFraction={tokenRate.questUptimeFraction}
              dailyDowntimeSec={dailyQuestTimeSec}
              weeklyDowntimeSec={weeklyQuestTimeSec}
              onToggleDaily={toggleDailyQuest}
              onToggleDailyTier={toggleDailyTier}
              onSetAllDaily={setAllDailyQuests}
              onToggleWeekly={toggleWeeklyQuest}
              onToggleWeeklyTier={toggleWeeklyTier}
              onSetAllWeekly={setAllWeeklyQuests}
              onToggleAutoGate={(val) => updateNewSpts({ autoGateQuestsByStats: val })}
              onChangeDailyDuration={(val) => updateNewSpts({ dailyQuestDuration: val })}
              onChangeWeeklyDuration={(val) => updateNewSpts({ weeklyQuestDuration: val })}
            />

            <CustomQuestsBuilder
              customQuests={newSpts.customQuests}
              customPerSecond={tokenRate.customPerSecond}
              onceReadyTokens={tokenRate.onceReadyTokens}
              onChange={(next) => updateNewSpts({ customQuests: next })}
            />
          </section>

          <section className="space-y-4 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 lg:col-span-7">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateNewSptsUi({ tokenGoalMode: 'amountToTime' })}
                className={`min-h-[38px] rounded-[var(--radius-control)] border text-xs font-semibold ${
                  newSptsUi.tokenGoalMode === 'amountToTime'
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]'
                    : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                {t.spts.amountToTime}
              </button>
              <button
                type="button"
                onClick={() => updateNewSptsUi({ tokenGoalMode: 'timeToAmount' })}
                className={`min-h-[38px] rounded-[var(--radius-control)] border text-xs font-semibold ${
                  newSptsUi.tokenGoalMode === 'timeToAmount'
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]'
                    : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                {t.spts.timeToAmount}
              </button>
            </div>

            <input
              type="text"
              value={newSptsUi.tokenGoalRaw}
              onChange={(e) => updateNewSptsUi({ tokenGoalRaw: e.target.value })}
              placeholder={
                newSptsUi.tokenGoalMode === 'amountToTime'
                  ? t.spts.goalStatPlaceholder
                  : t.spts.goalTimePlaceholder
              }
              className="min-h-[44px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 text-sm text-[var(--text-primary)]"
            />

            <div>
              <div className="text-xs text-[var(--text-secondary)]">
                {newSptsUi.tokenGoalMode === 'amountToTime'
                  ? interp(t.spts.tokenTargetTimeTitle, {
                      amount: newSptsUi.tokenGoalRaw || '—'
                    })
                  : interp(t.spts.tokenTargetAmountTitle, {
                      time: newSptsUi.tokenGoalRaw || '—'
                    })}
              </div>
              <div className="mt-1 font-mono text-2xl font-bold text-[var(--text-primary)]">
                {newSptsUi.tokenGoalRaw.trim()
                  ? newSptsUi.tokenGoalMode === 'amountToTime'
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

            {(tokenRate.customPerSecond > 0 || tokenRate.onceReadyTokens > 0) && (
              <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-control)] border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-3 text-xs">
                {tokenRate.customPerSecond > 0 && (
                  <span className="font-mono font-semibold text-[var(--accent)]">
                    +{fmtNum(tokenRate.customPerSecond * 86400)}/d custom
                  </span>
                )}
                {tokenRate.onceReadyTokens > 0 && (
                  <span className="font-mono font-semibold text-emerald-400">
                    {interp(t.newSpts.customQuestOnceReadyLabel, {
                      val: fmtNum(tokenRate.onceReadyTokens)
                    })}
                  </span>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ==================== TAB 3: PLAYTIME ==================== */}
      {newSptsUi.tab === 'playtime' && (
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
              <div className="text-xs text-[var(--text-secondary)]">{t.spts.playtimeSlowest}</div>
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
              <div className="text-xs text-[var(--text-secondary)]">{t.spts.playtimeFastest}</div>
              <div className="mt-1 font-mono text-xl font-bold text-emerald-400">
                {fmtTime(playtime.seconds.fastest_allQuests_VIP)}
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/60 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  {t.spts.currentTokens}
                </span>
                <input
                  type="text"
                  value={newSpts.tokens}
                  onChange={(e) => updateNewSpts({ tokens: e.target.value })}
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
                  value={newSpts.passiveTokensPerMin}
                  onChange={(e) =>
                    updateNewSpts({ passiveTokensPerMin: Math.max(0, Number(e.target.value) || 0) })
                  }
                  className="min-h-[38px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-primary)]"
                />
              </label>
              <div className="flex flex-wrap items-end gap-3 pb-1 text-xs">
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={newSpts.dailyQuests}
                    onChange={(e) => updateNewSpts({ dailyQuests: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>{t.spts.daily}</span>
                </label>
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={newSpts.weeklyQuests}
                    onChange={(e) => updateNewSpts({ weeklyQuests: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>{t.spts.weekly}</span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
              <span>
                {interp(t.newSpts.selectedQuestsSummary, {
                  daily: tokenRate.eligibleDailyCount,
                  dVal: fmtNum(
                    tokenRate.dailyPayout / (newSpts.vip && vipRemainingSeconds > 0 ? 2 : 1)
                  ),
                  weekly: tokenRate.eligibleWeeklyCount,
                  wVal: fmtNum(
                    tokenRate.weeklyPayout / (newSpts.vip && vipRemainingSeconds > 0 ? 2 : 1)
                  )
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

            {playtimeQuestsOpen && (
              <TieredQuestsSelector
                dailyQuests={NEW_SPTS_DAILY_QUESTS}
                weeklyQuests={NEW_SPTS_WEEKLY_QUESTS}
                selectedDailyIds={selectedDailyIds}
                selectedWeeklyIds={selectedWeeklyIds}
                autoGateByStats={newSpts.autoGateQuestsByStats}
                currentStats={newSptsStatsNum}
                dailyQuestDuration={newSpts.dailyQuestDuration}
                weeklyQuestDuration={newSpts.weeklyQuestDuration}
                questUptimeFraction={tokenRate.questUptimeFraction}
                dailyDowntimeSec={dailyQuestTimeSec}
                weeklyDowntimeSec={weeklyQuestTimeSec}
                onToggleDaily={toggleDailyQuest}
                onToggleDailyTier={toggleDailyTier}
                onSetAllDaily={setAllDailyQuests}
                onToggleWeekly={toggleWeeklyQuest}
                onToggleWeeklyTier={toggleWeeklyTier}
                onSetAllWeekly={setAllWeeklyQuests}
                onToggleAutoGate={(val) => updateNewSpts({ autoGateQuestsByStats: val })}
                onChangeDailyDuration={(val) => updateNewSpts({ dailyQuestDuration: val })}
                onChangeWeeklyDuration={(val) => updateNewSpts({ weeklyQuestDuration: val })}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {STAT_OPTIONS.map((st) => (
              <label key={st} className="block space-y-1">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  {st} {t.spts.multiTier}
                </span>
                <select
                  value={newSpts.multis[st]}
                  onChange={(e) =>
                    updateNewSpts({ multis: { ...newSpts.multis, [st]: e.target.value } })
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
        </section>
      )}

      {/* ==================== TAB 4: GEAR & HUNT INDEX ==================== */}
      {newSptsUi.tab === 'inventory' && (
        <div className="space-y-4">
          <section className="space-y-4 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  {t.newSpts.inventoryStubTitle}
                </h2>
              </div>
              <span className="rounded-md border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                {t.newSpts.inventoryStubBadge}
              </span>
            </div>

            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              {t.newSpts.inventoryStubDesc}
            </p>

            {/* Equipment Slots Registry */}
            <div>
              <h3 className="mb-2 text-xs font-bold text-[var(--text-primary)]">
                {t.newSpts.inventorySlotsTitle}
              </h3>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {EQUIPMENT_SLOTS_REGISTRY.map((slotMeta) => {
                  const stub = NEW_SPTS_EQUIPMENT_STUBS.find((s) => s.slot === slotMeta.slot);
                  const equipped = stub ? (newSpts.equippedIds ?? []).includes(stub.id) : false;
                  return (
                    <div
                      key={slotMeta.slot}
                      className={`rounded-[var(--radius-control)] border p-3 ${
                        equipped
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold capitalize text-[var(--text-primary)]">
                          {slotMeta.slot}
                        </span>
                        <span className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]">
                          {t.newSpts.comingSoonTag}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-[var(--text-secondary)]">
                        {slotMeta.affectedStats.join(' · ')}
                      </div>
                      {stub && (
                        <button
                          type="button"
                          onClick={() => toggleStubEquip(stub.id)}
                          className="mt-2 w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 text-left text-[11px] font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
                        >
                          {stub.name}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hunt Index */}
            <div className="border-t border-[var(--border-subtle)] pt-4">
              <h3 className="text-xs font-bold text-[var(--text-primary)]">
                {t.newSpts.huntIndexTitle}
              </h3>
              <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                {t.newSpts.huntIndexDesc}
              </p>

              <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                {HUNT_INDEX_MOBS.map((mob) => (
                  <div
                    key={mob.id}
                    className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[var(--text-primary)]">{mob.name}</span>
                      <span className="font-mono text-[11px] text-[var(--accent)]">
                        {mob.gearPieces}/{mob.totalPieces}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-[var(--text-secondary)]">
                      {mob.location} ·{' '}
                      {mob.setBonusPercent > 0
                        ? `+${mob.setBonusPercent}% ${mob.setBonusType}`
                        : t.newSpts.comingSoonTag}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Multi-Train Slots */}
            <div className="border-t border-[var(--border-subtle)] pt-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-[var(--text-primary)]">
                  {t.newSpts.multiTrainTitle}
                </h3>
                <span className="rounded bg-[var(--bg-canvas)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]">
                  {t.newSpts.comingSoonTag}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                {t.newSpts.multiTrainDesc}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {STAT_OPTIONS.map((st) => {
                  const active = (newSpts.multiTrainStats ?? ['FS']).includes(st);
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => toggleMultiTrainStat(st)}
                      className={`rounded-[var(--radius-control)] border px-3 py-1.5 text-xs font-bold transition-colors ${
                        active
                          ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ==================== TAB 5: GUIDE / QUESTS WIKI ==================== */}
      {newSptsUi.tab === 'wiki' && (
        <div className="space-y-4">
          <section className="space-y-3 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <div className="flex items-start gap-2.5">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  {t.newSpts.wikiHeaderTitle}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                  {t.newSpts.wikiHeaderDesc}
                </p>
              </div>
            </div>

            <ul className="grid gap-2 pt-1 text-xs text-[var(--text-primary)] sm:grid-cols-2">
              {t.newSpts.wikiUpdateHighlights.map((line, i) => (
                <li
                  key={i}
                  className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 leading-relaxed"
                >
                  {line}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div className="text-xs text-[var(--text-secondary)]">
                Daily: <strong className="text-[var(--text-primary)]">{fmtNum(NEW_SPTS_DAILY_MAX_TOTAL)}</strong> · Weekly:{' '}
                <strong className="text-[var(--text-primary)]">{fmtNum(NEW_SPTS_WEEKLY_MAX_TOTAL)}</strong>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="search"
                  value={newSptsUi.wikiSearch}
                  onChange={(e) => updateNewSptsUi({ wikiSearch: e.target.value })}
                  placeholder={t.spts.wikiSearchPlaceholder}
                  className="min-h-[36px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] pl-8 pr-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
                  <tr>
                    <th className="py-2 pr-3 font-medium">{t.newSpts.customQuestRepeatLabel}</th>
                    <th className="py-2 pr-3 font-medium">{t.newSpts.customQuestStatLabel}</th>
                    <th className="py-2 pr-3 font-medium">{t.common.tokens}</th>
                    <th className="py-2 font-medium">{t.spts.vip}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]/50 font-mono">
                  {filteredQuestsTable.map((q) => (
                    <tr key={q.id}>
                      <td className="py-2 pr-3 font-sans font-semibold text-[var(--text-primary)]">
                        {q.period === 'daily' ? t.spts.daily : t.spts.weekly}
                      </td>
                      <td className="py-2 pr-3 text-[var(--text-primary)]">
                        {q.stat} ≥ {fmtNum(q.target)}
                      </td>
                      <td className="py-2 pr-3 font-bold text-[var(--accent)]">
                        +{fmtNum(q.tokens)}
                      </td>
                      <td className="py-2 text-emerald-400">+{fmtNum(q.tokens * 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      <AdSlot variant="leaderboard" />
    </div>
  );
}
