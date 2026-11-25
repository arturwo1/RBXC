import type { CustomQuestEntry, SptsGameConfig } from './newSptsTypes';
import {
  BLOXY_TROPHY_TIERS,
  SPTS_DAILY_QUESTS,
  SPTS_LOCATIONS,
  SPTS_MULTIS,
  SPTS_NEW_LAUNCH_ISO,
  SPTS_PRICES,
  SPTS_TICK_SECONDS,
  SPTS_TOKEN_PACKS,
  SPTS_WEEKLY_QUESTS,
  SPTS_WEIGHTS,
  type BloxyTrophyRankId,
  type BloxyTrophyTier,
  type SptsLocation,
  type SptsStatType,
  type SptsTokenPack,
  type SptsWeightTier
} from './sptsData';

export type QuestMode = 'averaged' | 'discrete';

export interface QuestConfig {
  dailyQuests: boolean;
  weeklyQuests: boolean;
  vip: boolean;
  vipRemainingSeconds?: number;
  passiveTokensPerMinute?: number;
  dailyQuestValue?: number;
  weeklyQuestValue?: number;
  autoGateByStats?: boolean;
  currentStats?: Partial<Record<SptsStatType, number>>;
  trainedStat?: SptsStatType;
  selectedDailyQuestIds?: string[];
  selectedWeeklyQuestIds?: string[];
  dailyQuestTimeSeconds?: number;
  weeklyQuestTimeSeconds?: number;
  gameConfig?: SptsGameConfig;
  customQuests?: CustomQuestEntry[];
}

export interface TokenRateResult {
  passivePerSecond: number;
  dailyPerSecond: number;
  weeklyPerSecond: number;
  customHoursPerSecond: number;
  customPerSecond: number;
  totalPerSecond: number;
  dailyPayout: number;
  weeklyPayout: number;
  customDailyAdded: number;
  customWeeklyAdded: number;
  onceReadyTokens: number;
  eligibleDailyCount: number;
  eligibleWeeklyCount: number;
  questUptimeFraction: number;
}

export interface UpgradeStep {
  multiKey: string;
  multiValue: number;
  price: number;
  atTimeSeconds: number;
  statAtUpgrade: number;
  cumulativeSpentTokens: number;
}

export interface ZoneProgressionStep {
  minStat: number;
  baseGainPerSecond: number;
  zoneId: string;
  multiplier: number;
  isDeathTraining?: boolean;
  effectiveMultiplier?: number;
}

export interface ZoneTransitionStep {
  zoneId: string;
  multiplier: number;
  atTimeSeconds: number;
  statThreshold: number;
  isDeathTraining?: boolean;
}

export interface SimulateStatProgressParams {
  currentStat: number;
  goalStat: number;
  baseGainPerSecond: number;
  currentMultiKey: string;
  tokenPerSecond: number;
  currentTokens?: number;
  maxTime?: number;
  questMode?: QuestMode;
  questConfig?: QuestConfig;
  zoneProgression?: ZoneProgressionStep[];
  simulateUpgrades?: boolean;
  gameConfig?: SptsGameConfig;
  equipmentBonusPercent?: number;
}

export interface SimulateStatProgressResult {
  totalTime: number;
  finalStat: number;
  spentTokens: number;
  totalEarnedTokens: number;
  remainingTokens: number;
  upgrades: string[];
  upgradeSteps: UpgradeStep[];
  zoneTransitions: ZoneTransitionStep[];
  timeWithoutUpgrades: number;
  timeSavedSeconds: number;
  finalMultiKey: string;
  finalZoneId?: string;
}

export interface PlaytimeRangeResult {
  totalSpentOnMultis: number;
  totalEarnedTokens: number;
  tps: {
    min: number;
    mid: number;
    max: number;
  };
  seconds: {
    slowest_noQuests: number;
    mid_allQuests_noVIP: number;
    fastest_allQuests_VIP: number;
    med: number;
  };
}

export const SPTS_PVP_CONFIG = {
  BASE_HP: 100,
  HP_PER_BT: 10,
  REGEN_PER_SEC: 0.01,
  TICK_MS: 50,
  MAX_SIM_SECONDS: 240,
  REFLECT_MIN_BT: 1000,
  STUN_DURATION_SEC: 2.0,
  MAX_DODGE: 0.85,
  SKILLS: {
    fist: { mult: 1.0, cdMs: 650, halfAffected: false, minFs: 0 },
    energy_sphere: { mult: 3.0, cdMs: 2000, halfAffected: true, minFs: 1000 },
    bullet_punch: { mult: 2.0, cdMs: 2000, halfAffected: true, minFs: 100_000 },
    psychic: { cdMs: 1500, halfAffected: true, minPp: 100_000 },
    killing_intent: { cdMs: 8000, halfAffected: true, minPp: 100_000_000 },
    hellfire: { pulseMs: 500, burnFracPerSec: 0.25, halfAffected: false },
    soul_reap: { cdMs: 5000, halfAffected: true, minStat: 10e12 }
  }
} as const;

export interface PvpFighter {
  name: string;
  fs: number;
  bt: number;
  pp: number;
  ms: number;
  jf: number;
  halfCooldown?: boolean;
  invisibility?: boolean;
  dodgeChance?: number;
  hasHellfire?: boolean;
}

export type PvpAttackMode =
  | 'auto'
  | 'fist'
  | 'bullet_punch'
  | 'energy_sphere'
  | 'psychic'
  | 'killing_intent'
  | 'hellfire'
  | 'soul_reap';

export type PvpResolvedSkill = Exclude<PvpAttackMode, 'auto'> | 'combo' | 'none';
export type PvpAtomicSkill = Exclude<PvpAttackMode, 'auto'> | 'none';
export type PvpActiveSkill = Exclude<PvpAttackMode, 'auto'>;

export interface PvpWinOption {
  statType: 'FS' | 'PP' | 'BT';
  targetValue: number;
  farmGap: number;
}

export interface PvpSimulateOptions {
  mode?: PvpAttackMode;
  attackerSkills?: PvpActiveSkill[];
  defenderSkills?: PvpActiveSkill[];
}

export type PvpCombatEventKind =
  | 'attack'
  | 'reflect'
  | 'backfire'
  | 'miss_invis'
  | 'miss_dodge'
  | 'stun'
  | 'burn'
  | 'ko';

export interface PvpCombatLogEntry {
  timeSec: number;
  actor: 'attacker' | 'defender';
  target: 'attacker' | 'defender';
  kind: PvpCombatEventKind;
  skill?: PvpAtomicSkill;
  damage?: number;
  targetHpAfter?: number;
  targetMaxHp?: number;
  reflectPercent?: number;
  koReason?:
    | 'hp_zero'
    | 'reflect'
    | 'backfire'
    | 'soul_reap'
    | 'killing_intent'
    | 'fs_instakill'
    | 'psychic_instakill';
}

export type PvpReasonCode =
  | 'target_reflects_100'
  | 'self_reflects_100'
  | 'attacker_died_from_reflect'
  | 'defender_died_from_reflect'
  | 'attacker_has_psychic_advantage'
  | 'defender_has_psychic_advantage'
  | 'psychic_exact_10x_blocked'
  | 'psychic_backfire'
  | 'psychic_instakill'
  | 'target_invis_evaded'
  | 'killing_intent_stun'
  | 'soul_reap_exec'
  | 'hellfire_burn'
  | 'auto_picked_psychic'
  | 'auto_picked_physical_combo'
  | 'mutual_stalemate'
  | 'higher_dps_wins'
  | 'switch_to_psychic_hint'
  | 'cannot_win_fs_only';

export interface PvpReasonItem {
  code: PvpReasonCode;
  params?: Record<string, string | number>;
}

export interface PvpSimulationResult {
  mode: PvpAttackMode;
  chosenAttackerSkill: PvpResolvedSkill;
  chosenDefenderSkill: PvpResolvedSkill;
  chosenAttackerSkills: PvpActiveSkill[];
  chosenDefenderSkills: PvpActiveSkill[];
  attackerDps: number;
  defenderDps: number;
  attackerDamagePerHit: number;
  defenderDamagePerHit: number;
  attackerHitsNeeded: number;
  defenderHitsNeeded: number;
  defenderEffectiveHp: number;
  attackerEffectiveHp: number;
  reflectPercent: number;
  defenderReflectPercent: number;
  reflectDamagePerHit: number;
  psychicBackfire: boolean;
  psychicInstantKill: boolean;
  attackerDiedFromReflect: boolean;
  attackerReflectDeathSeconds: number;
  attackerReflectDeathHits: number;
  attackerReflectDeathPercent: number;
  defenderDiedFromReflect: boolean;
  cannotWinWithFsOnly: boolean;
  ttkAttackerWinsSeconds: number;
  ttkDefenderWinsSeconds: number;
  winner: 'attacker' | 'defender' | 'draw';
  requiredStatToWin: number;
  requiredStatType: 'FS' | 'PP' | 'BT';
  farmGap: number;
  winOptions: PvpWinOption[];
  reasons: PvpReasonItem[];
  combatLog: PvpCombatLogEntry[];
}

export interface RobuxPackBreakdownRow {
  pack: SptsTokenPack;
  count: number;
  firstPurchaseApplied: boolean;
  firstPackTokens: number;
  repeatPackTokens: number;
  totalDeliveredTokens: number;
  totalRobux: number;
  effectiveTokensPerRobux: number;
}

function getOrderedMultisFromConfig(gameConfig?: SptsGameConfig) {
  const multisMap = gameConfig?.multis ?? SPTS_MULTIS;
  const pricesMap = gameConfig?.prices ?? SPTS_PRICES;
  return Object.entries(multisMap)
    .map(([key, value]) => ({ key, value, price: pricesMap[value] || 0 }))
    .sort((a, b) => a.value - b.value);
}

const ORDERED_MULTIS = getOrderedMultisFromConfig();

export function getSptsTickSeconds(statType: SptsStatType, customTick?: number): number {
  if (customTick && customTick > 0) {
    return customTick;
  }
  return SPTS_TICK_SECONDS[statType] ?? 1;
}

export function inferBestZoneForStat(
  statType: 'FS' | 'BT' | 'PP',
  statValue: number,
  ppValue = 0,
  preferAfkSafe = true
): SptsLocation {
  const candidates = SPTS_LOCATIONS.filter((loc) => loc.stat === statType);
  let best = candidates[0];

  for (const loc of candidates) {
    if (loc.requiresFly && statType === 'FS') {
      const hasFly = ppValue >= 1e4 || (ppValue === 0 && statValue >= 1e6);
      if (!hasFly) continue;
    }
    const threshold =
      statType === 'BT' && preferAfkSafe && loc.afkSafeRequirement
        ? loc.afkSafeRequirement
        : loc.requirement;
    if (statValue >= threshold && loc.multiplier >= best.multiplier) {
      best = loc;
    }
  }

  if (statType === 'FS' && best.id === 'fs-none') {
    const rock = candidates.find((l) => l.id === 'fs-rock');
    if (rock) best = rock;
  }

  return best;
}

export function inferBestWeightForStat(statType: 'MS' | 'JF', statValue: number): SptsWeightTier {
  let best = SPTS_WEIGHTS[0];
  for (const w of SPTS_WEIGHTS) {
    const req = statType === 'MS' ? w.msRequirement : w.jfRequirement;
    if (statValue >= req && w.multiplier >= best.multiplier) {
      best = w;
    }
  }
  return best;
}

export const BT_DEATH_SURVIVAL_TICKS = 2;

export function computeBtDeathTrainEfficiency(
  tickSeconds: number,
  deathTrainReturnSeconds: number
): { survivalSec: number; walkSec: number; efficiency: number } {
  const safeTick = tickSeconds > 0 ? tickSeconds : SPTS_TICK_SECONDS.BT;
  const survivalSec = BT_DEATH_SURVIVAL_TICKS * safeTick;
  const walkSec = Math.max(0, deathTrainReturnSeconds);
  if (walkSec <= 0) {
    return { survivalSec, walkSec: 0, efficiency: 1 };
  }
  return {
    survivalSec,
    walkSec,
    efficiency: survivalSec / (survivalSec + walkSec)
  };
}

/**
 * Builds chronological auto-progression steps across zones/weights so simulations
 * starting from low stats (e.g. 0 PP -> 10Qi PP) automatically move into higher zones as unlocked.
 */
export function buildAutoZoneProgression(
  statType: SptsStatType,
  tickSeconds: number,
  ppValue = 0,
  preferAfkSafe = true,
  deathTrainReturnSeconds = 0
): ZoneProgressionStep[] {
  const safeTick = tickSeconds > 0 ? tickSeconds : SPTS_TICK_SECONDS[statType] ?? 1;

  if (statType === 'MS' || statType === 'JF') {
    return SPTS_WEIGHTS.map((w) => ({
      minStat: statType === 'MS' ? w.msRequirement : w.jfRequirement,
      baseGainPerSecond: w.multiplier / safeTick,
      zoneId: w.id,
      multiplier: w.multiplier
    })).sort((a, b) => a.minStat - b.minStat);
  }

  const list = SPTS_LOCATIONS.filter((l) => l.stat === statType);

  // For BT when Death Training is enabled AND walk-back time > 0, compare effective
  // death-training speed against the best already-safe AFK zone at each breakpoint!
  if (statType === 'BT' && !preferAfkSafe && deathTrainReturnSeconds > 0) {
    const { efficiency } = computeBtDeathTrainEfficiency(safeTick, deathTrainReturnSeconds);
    const breakpoints = new Set<number>([0]);
    for (const loc of list) {
      breakpoints.add(loc.requirement);
      if (loc.afkSafeRequirement) breakpoints.add(loc.afkSafeRequirement);
    }
    const sortedPoints = Array.from(breakpoints).sort((a, b) => a - b);
    const steps: ZoneProgressionStep[] = [];

    for (const pt of sortedPoints) {
      let bestLoc = list[0];
      let bestRate = 0;
      let bestIsDeath = false;
      let bestEffMult = 1;

      for (const loc of list) {
        if (pt < loc.requirement) continue;
        const safeReq = loc.afkSafeRequirement ?? loc.requirement;
        const isSafe = pt >= safeReq;
        const effMult = isSafe ? loc.multiplier : loc.multiplier * efficiency;
        const rate = effMult / safeTick;
        if (rate > bestRate + 1e-12) {
          bestRate = rate;
          bestLoc = loc;
          bestIsDeath = !isSafe;
          bestEffMult = effMult;
        }
      }

      const prev = steps[steps.length - 1];
      if (
        !prev ||
        prev.zoneId !== bestLoc.id ||
        Boolean(prev.isDeathTraining) !== bestIsDeath ||
        Math.abs(prev.baseGainPerSecond - bestRate) > 1e-12
      ) {
        steps.push({
          minStat: pt,
          baseGainPerSecond: bestRate,
          zoneId: bestLoc.id,
          multiplier: bestLoc.multiplier,
          isDeathTraining: bestIsDeath,
          effectiveMultiplier: bestEffMult
        });
      }
    }
    return steps;
  }

  const steps: ZoneProgressionStep[] = [];

  for (const loc of list) {
    if (statType === 'FS') {
      if (loc.id === 'fs-none') continue; // Starter is The Rock (x10, 0 req)
      if (loc.id === 'fs-crystal' && ppValue < 1e4) {
        // Without 10K PP fly is not guaranteed until mid-game; allow crystal if PP >= 10K
        continue;
      }
    }
    const minStat =
      statType === 'BT' && preferAfkSafe && loc.afkSafeRequirement
        ? loc.afkSafeRequirement
        : loc.requirement;
    steps.push({
      minStat,
      baseGainPerSecond: loc.multiplier / safeTick,
      zoneId: loc.id,
      multiplier: loc.multiplier,
      isDeathTraining: false,
      effectiveMultiplier: loc.multiplier
    });
  }

  return steps.sort((a, b) => a.minStat - b.minStat || a.multiplier - b.multiplier);
}

export function getNextZoneOrWeight(
  statType: SptsStatType,
  currentStatVal: number,
  preferAfkSafe = true
): { name: string; id: string; requirement: number; multiplierLabel: string } | null {
  if (statType === 'MS' || statType === 'JF') {
    const nextW = SPTS_WEIGHTS.find((w) => {
      const req = statType === 'MS' ? w.msRequirement : w.jfRequirement;
      return req > currentStatVal;
    });
    return nextW
      ? {
          id: nextW.id,
          name: nextW.name,
          requirement: statType === 'MS' ? nextW.msRequirement : nextW.jfRequirement,
          multiplierLabel: `x${nextW.multiplier}`
        }
      : null;
  }

  const nextLoc = SPTS_LOCATIONS.find((l) => {
    if (l.stat !== statType) return false;
    const req = statType === 'BT' && preferAfkSafe && l.afkSafeRequirement ? l.afkSafeRequirement : l.requirement;
    return req > currentStatVal;
  });

  return nextLoc
    ? {
        id: nextLoc.id,
        name: nextLoc.name,
        requirement:
          statType === 'BT' && preferAfkSafe && nextLoc.afkSafeRequirement
            ? nextLoc.afkSafeRequirement
            : nextLoc.requirement,
        multiplierLabel: nextLoc.multiplierLabel
      }
    : null;
}

export function computeCustomQuestsBreakdown({
  customQuests = [],
  autoGateByStats = false,
  currentStats
}: {
  customQuests?: CustomQuestEntry[];
  autoGateByStats?: boolean;
  currentStats?: Partial<Record<SptsStatType, number>>;
}): {
  dailyAdded: number;
  weeklyAdded: number;
  customHoursPerSecBase: number;
  customHoursQuests: CustomQuestEntry[];
  onceReadyTokens: number;
} {
  let dailyAdded = 0;
  let weeklyAdded = 0;
  let customHoursPerSecBase = 0;
  const customHoursQuests: CustomQuestEntry[] = [];
  let onceReadyTokens = 0;

  for (const q of customQuests) {
    if (!q.enabled) continue;
    const reward = Math.max(0, Number(q.tokensReward) || 0);
    if (reward <= 0) continue;
    const req = Math.max(0, Number(q.targetStat) || 0);
    const statVal = currentStats?.[q.stat] ?? 0;

    if (q.repeatType === 'once') {
      if (!q.completed && statVal >= req) {
        onceReadyTokens += reward;
      }
      continue;
    }

    if (autoGateByStats && statVal < req) continue;

    if (q.repeatType === 'daily') {
      dailyAdded += reward;
    } else if (q.repeatType === 'weekly') {
      weeklyAdded += reward;
    } else if (q.repeatType === 'custom_hours') {
      const hours = Math.max(0.1, Number(q.resetHours) || 24);
      customHoursPerSecBase += reward / (hours * 3600);
      customHoursQuests.push(q);
    }
  }

  return {
    dailyAdded,
    weeklyAdded,
    customHoursPerSecBase,
    customHoursQuests,
    onceReadyTokens
  };
}

export function computeEligibleQuestTotals(config: {
  dailyQuests: boolean;
  weeklyQuests: boolean;
  selectedDailyQuestIds?: string[];
  selectedWeeklyQuestIds?: string[];
  dailyQuestValue?: number;
  weeklyQuestValue?: number;
  autoGateByStats?: boolean;
  currentStats?: Partial<Record<SptsStatType, number>>;
  gameConfig?: SptsGameConfig;
  customQuests?: CustomQuestEntry[];
}): {
  dailyBase: number;
  weeklyBase: number;
  customDailyAdded: number;
  customWeeklyAdded: number;
  customHoursPerSecBase: number;
  customHoursQuests: CustomQuestEntry[];
  onceReadyTokens: number;
  eligibleDailyIds: string[];
  eligibleWeeklyIds: string[];
} {
  const dailySource = config.gameConfig?.dailyQuests ?? SPTS_DAILY_QUESTS;
  const weeklySource = config.gameConfig?.weeklyQuests ?? SPTS_WEEKLY_QUESTS;

  const dailyPool = config.selectedDailyQuestIds
    ? dailySource.filter((q) => config.selectedDailyQuestIds!.includes(q.id))
    : dailySource;
  const weeklyPool = config.selectedWeeklyQuestIds
    ? weeklySource.filter((q) => config.selectedWeeklyQuestIds!.includes(q.id))
    : weeklySource;

  const eligibleDaily = config.autoGateByStats
    ? dailyPool.filter((q) => (config.currentStats?.[q.stat] ?? 0) >= q.target)
    : dailyPool;
  const eligibleWeekly = config.autoGateByStats
    ? weeklyPool.filter((q) => (config.currentStats?.[q.stat] ?? 0) >= q.target)
    : weeklyPool;

  const dailySum = eligibleDaily.reduce((acc, q) => acc + q.tokens, 0);
  const weeklySum = eligibleWeekly.reduce((acc, q) => acc + q.tokens, 0);

  const customBreakdown = computeCustomQuestsBreakdown({
    customQuests: config.customQuests,
    autoGateByStats: config.autoGateByStats,
    currentStats: config.currentStats
  });

  const baseDailyFromQuests = !config.dailyQuests
    ? 0
    : config.autoGateByStats
      ? dailySum
      : (config.dailyQuestValue ?? dailySum);

  const baseWeeklyFromQuests = !config.weeklyQuests
    ? 0
    : config.autoGateByStats
      ? weeklySum
      : (config.weeklyQuestValue ?? weeklySum);

  return {
    dailyBase: baseDailyFromQuests + customBreakdown.dailyAdded,
    weeklyBase: baseWeeklyFromQuests + customBreakdown.weeklyAdded,
    customDailyAdded: customBreakdown.dailyAdded,
    customWeeklyAdded: customBreakdown.weeklyAdded,
    customHoursPerSecBase: customBreakdown.customHoursPerSecBase,
    customHoursQuests: customBreakdown.customHoursQuests,
    onceReadyTokens: customBreakdown.onceReadyTokens,
    eligibleDailyIds: config.dailyQuests ? eligibleDaily.map((q) => q.id) : [],
    eligibleWeeklyIds: config.weeklyQuests ? eligibleWeekly.map((q) => q.id) : []
  };
}

export function computeQuestUptimeFraction(
  dailyBase: number,
  weeklyBase: number,
  dailyQuestTimeSeconds = 0,
  weeklyQuestTimeSeconds = 0
): number {
  const dailyDown = dailyBase > 0 ? Math.min(86000, Math.max(0, dailyQuestTimeSeconds)) : 0;
  const weeklyDown = weeklyBase > 0 ? Math.min(7 * 86400 - 100, Math.max(0, weeklyQuestTimeSeconds)) : 0;
  return Math.max(0.01, 1 - dailyDown / 86400 - weeklyDown / (7 * 86400));
}

export function calculateTokenRate(config: QuestConfig): TokenRateResult {
  const tpm = config.passiveTokensPerMinute ?? config.gameConfig?.passiveTokensPerMinute ?? 5;
  const passivePerSecond = Math.max(0, tpm) / 60;
  const {
    dailyBase,
    weeklyBase,
    customDailyAdded,
    customWeeklyAdded,
    customHoursPerSecBase,
    onceReadyTokens,
    eligibleDailyIds,
    eligibleWeeklyIds
  } = computeEligibleQuestTotals(config);
  const vipActive =
    config.vip && (config.vipRemainingSeconds === undefined || config.vipRemainingSeconds > 0);
  const vipMult = vipActive ? 2 : 1;

  const dailyPayout = dailyBase * vipMult;
  const weeklyPayout = weeklyBase * vipMult;

  const dailyPerSecond = dailyPayout / 86400;
  const weeklyPerSecond = weeklyPayout / (7 * 86400);
  const customHoursPerSecond = customHoursPerSecBase * vipMult;
  const customPerSecond =
    customHoursPerSecond +
    (customDailyAdded * vipMult) / 86400 +
    (customWeeklyAdded * vipMult) / (7 * 86400);
  const totalPerSecond = passivePerSecond + dailyPerSecond + weeklyPerSecond + customHoursPerSecond;
  const questUptimeFraction = computeQuestUptimeFraction(
    dailyBase,
    weeklyBase,
    config.dailyQuestTimeSeconds,
    config.weeklyQuestTimeSeconds
  );

  return {
    passivePerSecond,
    dailyPerSecond,
    weeklyPerSecond,
    customHoursPerSecond,
    customPerSecond,
    totalPerSecond,
    dailyPayout,
    weeklyPayout,
    customDailyAdded,
    customWeeklyAdded,
    onceReadyTokens,
    eligibleDailyCount: eligibleDailyIds.length,
    eligibleWeeklyCount: eligibleWeeklyIds.length,
    questUptimeFraction
  };
}

export function inferLocationMatch(
  statType: SptsStatType,
  perTick: number,
  currentMultiKey: string
): { location: SptsLocation; estimatedRatio: number } | null {
  if (perTick <= 0) return null;
  if (statType !== 'FS' && statType !== 'BT' && statType !== 'PP') return null;

  const multi = SPTS_MULTIS[currentMultiKey] ?? 1;
  const candidates = SPTS_LOCATIONS.filter((loc) => loc.stat === statType);
  if (candidates.length === 0) return null;

  let best = candidates[0];
  let bestDiff = Infinity;
  for (const loc of candidates) {
    const expected = multi * loc.multiplier;
    const diff = Math.abs(Math.log10(Math.max(1e-9, perTick)) - Math.log10(Math.max(1e-9, expected)));
    if (diff < bestDiff) {
      bestDiff = diff;
      best = loc;
    }
  }

  return {
    location: best,
    estimatedRatio: perTick / (multi * best.multiplier)
  };
}

export function simulateStatProgress({
  currentStat,
  goalStat,
  baseGainPerSecond,
  currentMultiKey,
  tokenPerSecond,
  currentTokens = 0,
  maxTime = Infinity,
  questMode = 'averaged',
  questConfig,
  zoneProgression,
  simulateUpgrades = true,
  gameConfig,
  equipmentBonusPercent = 0
}: SimulateStatProgressParams): SimulateStatProgressResult {
  const activeGameConfig = gameConfig ?? questConfig?.gameConfig;
  const orderedMultis = activeGameConfig
    ? getOrderedMultisFromConfig(activeGameConfig)
    : ORDERED_MULTIS;

  const equipBonusFactor = 1 + Math.max(0, Number(equipmentBonusPercent) || 0) / 100;

  let stat = currentStat;
  let tokens = currentTokens;
  let time = 0;
  let spentTokens = 0;
  let totalEarnedTokens = 0;

  let idx = orderedMultis.findIndex((m) => m.key === currentMultiKey);
  if (idx < 0) idx = 0;

  const sortedZones =
    zoneProgression && zoneProgression.length > 0
      ? [...zoneProgression].sort((a, b) => a.minStat - b.minStat || a.multiplier - b.multiplier)
      : null;

  let zoneIdx = 0;
  if (sortedZones) {
    for (let z = 0; z < sortedZones.length; z++) {
      if (stat >= sortedZones[z].minStat) {
        zoneIdx = z;
      }
    }
  }

  let activeBaseGainPerSec = sortedZones ? sortedZones[zoneIdx].baseGainPerSecond : baseGainPerSecond;
  let activeZoneId = sortedZones ? sortedZones[zoneIdx].zoneId : undefined;

  const initialMulti = orderedMultis[idx].value;
  let multi = initialMulti;
  let gainPerSec = activeBaseGainPerSec * multi * equipBonusFactor;
  const upgrades: string[] = [];
  const upgradeSteps: UpgradeStep[] = [];
  const zoneTransitions: ZoneTransitionStep[] = [];

  const tpm =
    questConfig?.passiveTokensPerMinute ?? activeGameConfig?.passiveTokensPerMinute ?? 5;
  const passiveRate = Math.max(0, tpm) / 60;
  const vipEnabled = Boolean(questConfig?.vip);
  const vipLimitSec = vipEnabled ? (questConfig?.vipRemainingSeconds ?? Infinity) : 0;

  const customQuests = questConfig?.customQuests ?? [];
  const claimedOnceIds = new Set<string>();
  const customHoursSchedule: Array<{ quest: CustomQuestEntry; periodSec: number; nextAt: number }> =
    customQuests
      .filter((q) => q.enabled && q.repeatType === 'custom_hours' && (q.tokensReward || 0) > 0)
      .map((q) => {
        const periodSec = Math.max(0.1, Number(q.resetHours) || 24) * 3600;
        return { quest: q, periodSec, nextAt: periodSec };
      });

  const processOneTimeCustomQuests = (sVal: number) => {
    if (!simulateUpgrades || customQuests.length === 0) return;
    for (const q of customQuests) {
      if (!q.enabled || q.completed || q.repeatType !== 'once') continue;
      if (claimedOnceIds.has(q.id)) continue;
      const reward = Math.max(0, Number(q.tokensReward) || 0);
      if (reward <= 0) continue;
      const req = Math.max(0, Number(q.targetStat) || 0);
      const effectiveStat =
        q.stat === (questConfig?.trainedStat ?? 'FS')
          ? sVal
          : questConfig?.currentStats?.[q.stat] ?? 0;
      if (effectiveStat + 1e-9 >= req) {
        claimedOnceIds.add(q.id);
        tokens += reward;
        totalEarnedTokens += reward;
      }
    }
  };

  // Credit any immediately claimable unlocked one-time custom quests at t=0
  processOneTimeCustomQuests(stat);

  const getQuestInfoAtStat = (sVal: number) => {
    if (!questConfig) {
      return {
        dailyBase: 0,
        weeklyBase: 0,
        customHoursPerSecBase: 0,
        dailyDown: 0,
        weeklyDown: 0,
        uptimeFrac: 1
      };
    }
    const mergedStats: Partial<Record<SptsStatType, number>> | undefined =
      questConfig.autoGateByStats && questConfig.trainedStat
        ? { ...(questConfig.currentStats ?? {}), [questConfig.trainedStat]: sVal }
        : questConfig.currentStats;
    const { dailyBase, weeklyBase, customHoursPerSecBase } = computeEligibleQuestTotals({
      ...questConfig,
      gameConfig: activeGameConfig,
      currentStats: mergedStats
    });
    const dailyDown =
      dailyBase > 0 ? Math.min(86000, Math.max(0, questConfig.dailyQuestTimeSeconds ?? 0)) : 0;
    const weeklyDown =
      weeklyBase > 0
        ? Math.min(7 * 86400 - 100, Math.max(0, questConfig.weeklyQuestTimeSeconds ?? 0))
        : 0;
    const uptimeFrac = computeQuestUptimeFraction(dailyBase, weeklyBase, dailyDown, weeklyDown);
    return { dailyBase, weeklyBase, customHoursPerSecBase, dailyDown, weeklyDown, uptimeFrac };
  };

  // Next quest stat threshold on trainedStat when autoGateByStats is active OR one-time custom quests exist
  const trainedStatThresholds: number[] = [];
  if (questConfig?.trainedStat || customQuests.length > 0) {
    const ts = questConfig?.trainedStat ?? 'FS';
    if (questConfig?.autoGateByStats && questConfig.trainedStat) {
      const dailySource = activeGameConfig?.dailyQuests ?? SPTS_DAILY_QUESTS;
      const weeklySource = activeGameConfig?.weeklyQuests ?? SPTS_WEEKLY_QUESTS;
      const pool = [
        ...(questConfig.dailyQuests ? dailySource : []),
        ...(questConfig.weeklyQuests ? weeklySource : [])
      ];
      for (const q of pool) {
        if (q.stat === ts && !trainedStatThresholds.includes(q.target)) {
          trainedStatThresholds.push(q.target);
        }
      }
      for (const cq of customQuests) {
        if (
          cq.enabled &&
          cq.repeatType !== 'once' &&
          cq.stat === ts &&
          !trainedStatThresholds.includes(cq.targetStat)
        ) {
          trainedStatThresholds.push(cq.targetStat);
        }
      }
    }
    for (const cq of customQuests) {
      if (
        cq.enabled &&
        !cq.completed &&
        cq.repeatType === 'once' &&
        cq.stat === ts &&
        !trainedStatThresholds.includes(cq.targetStat)
      ) {
        trainedStatThresholds.push(cq.targetStat);
      }
    }
    trainedStatThresholds.sort((a, b) => a - b);
  }

  const getRateAtTime = (
    t: number,
    dailyBase: number,
    weeklyBase: number,
    customHoursPerSecBase: number
  ) => {
    const hasVipAtT = vipEnabled && t < vipLimitSec;
    if (questMode === 'discrete') return passiveRate;
    if (!questConfig) return tokenPerSecond > 0 ? tokenPerSecond : passiveRate;
    const mult = hasVipAtT ? 2 : 1;
    return (
      passiveRate +
      (dailyBase * mult) / 86400 +
      (weeklyBase * mult) / (7 * 86400) +
      customHoursPerSecBase * mult
    );
  };

  let nextDailyAt = 86400;
  let nextWeeklyAt = 7 * 86400;
  let offZoneRemaining = 0;

  // Baseline without token multiplier upgrades (respects auto-zone climbing, equipment bonus, and quest downtime)
  const computeBaselineNoUpgrades = () => {
    if (!Number.isFinite(goalStat) || goalStat <= currentStat) return maxTime;
    const initQi = getQuestInfoAtStat(currentStat);
    const uptime = questMode === 'averaged' ? initQi.uptimeFrac : 1;

    let baseRawTime = 0;
    if (!sortedZones) {
      const rate = gainPerSec * uptime;
      baseRawTime = rate > 0 ? (goalStat - currentStat) / rate : Infinity;
    } else {
      let s = currentStat;
      let zi = zoneIdx;
      while (s < goalStat) {
        const z = sortedZones[zi];
        const nextZ = sortedZones[zi + 1];
        const rate = z.baseGainPerSecond * initialMulti * equipBonusFactor * uptime;
        if (rate <= 0) return Infinity;
        const targetS = nextZ && nextZ.minStat < goalStat ? nextZ.minStat : goalStat;
        baseRawTime += Math.max(0, targetS - s) / rate;
        s = targetS;
        if (nextZ && s >= nextZ.minStat) zi++;
        else break;
      }
    }
    if (questMode === 'discrete' && Number.isFinite(baseRawTime) && (initQi.dailyDown > 0 || initQi.weeklyDown > 0)) {
      const nDaily = Math.floor(baseRawTime / 86400);
      const nWeekly = Math.floor(baseRawTime / (7 * 86400));
      baseRawTime += nDaily * initQi.dailyDown + nWeekly * initQi.weeklyDown;
    }
    return baseRawTime;
  };

  const timeWithoutUpgrades = computeBaselineNoUpgrades();

  let safetyIterations = 0;
  while (stat < goalStat && time < maxTime && safetyIterations < 80000) {
    safetyIterations++;

    // Advance auto-zones if we crossed threshold(s)
    if (sortedZones) {
      while (zoneIdx + 1 < sortedZones.length && stat + 1e-9 >= sortedZones[zoneIdx + 1].minStat) {
        zoneIdx++;
        const nextZone = sortedZones[zoneIdx];
        activeBaseGainPerSec = nextZone.baseGainPerSecond;
        activeZoneId = nextZone.zoneId;
        gainPerSec = activeBaseGainPerSec * multi * equipBonusFactor;
        zoneTransitions.push({
          zoneId: nextZone.zoneId,
          multiplier: nextZone.multiplier,
          atTimeSeconds: time,
          statThreshold: nextZone.minStat,
          isDeathTraining: nextZone.isDeathTraining
        });
      }
    }

    processOneTimeCustomQuests(stat);

    const qInfo = getQuestInfoAtStat(stat);
    const currentRate = simulateUpgrades
      ? getRateAtTime(time, qInfo.dailyBase, qInfo.weeklyBase, qInfo.customHoursPerSecBase)
      : 0;
    const effectiveGainPerSec =
      questMode === 'discrete' && offZoneRemaining > 0
        ? 0
        : questMode === 'averaged'
          ? gainPerSec * qInfo.uptimeFrac
          : gainPerSec;

    const next = simulateUpgrades ? orderedMultis[idx + 1] : undefined;
    const nextZone = sortedZones ? sortedZones[zoneIdx + 1] : undefined;
    const nextQuestThreshold = trainedStatThresholds.find((th) => th > stat + 1e-9);

    const timeToNextZone =
      nextZone && nextZone.minStat > stat && effectiveGainPerSec > 0
        ? (nextZone.minStat - stat) / effectiveGainPerSec
        : Infinity;

    const timeToNextQuestUnlock =
      nextQuestThreshold !== undefined && effectiveGainPerSec > 0
        ? (nextQuestThreshold - stat) / effectiveGainPerSec
        : Infinity;

    const nextCustomHoursDelay =
      questMode === 'discrete' && simulateUpgrades && customHoursSchedule.length > 0
        ? customHoursSchedule.reduce(
            (minDt, item) => Math.min(minDt, Math.max(0.0001, item.nextAt - time)),
            Infinity
          )
        : Infinity;

    const handleDiscreteCycles = (dt: number) => {
      if (questMode !== 'discrete') return;
      if (offZoneRemaining > 0) {
        offZoneRemaining = Math.max(0, offZoneRemaining - dt);
      }
      while (time + 1e-6 >= nextDailyAt) {
        const qiAt = getQuestInfoAtStat(stat);
        if (qiAt.dailyBase > 0) {
          const mult = vipEnabled && nextDailyAt <= vipLimitSec ? 2 : 1;
          const payout = qiAt.dailyBase * mult;
          tokens += payout;
          totalEarnedTokens += payout;
          offZoneRemaining += qiAt.dailyDown;
        }
        nextDailyAt += 86400;
      }
      while (time + 1e-6 >= nextWeeklyAt) {
        const qiAt = getQuestInfoAtStat(stat);
        if (qiAt.weeklyBase > 0) {
          const mult = vipEnabled && nextWeeklyAt <= vipLimitSec ? 2 : 1;
          const payout = qiAt.weeklyBase * mult;
          tokens += payout;
          totalEarnedTokens += payout;
          offZoneRemaining += qiAt.weeklyDown;
        }
        nextWeeklyAt += 7 * 86400;
      }
      for (const item of customHoursSchedule) {
        while (time + 1e-6 >= item.nextAt) {
          const req = Math.max(0, Number(item.quest.targetStat) || 0);
          const curStat =
            item.quest.stat === (questConfig?.trainedStat ?? 'FS')
              ? stat
              : questConfig?.currentStats?.[item.quest.stat] ?? 0;
          const allowed = !questConfig?.autoGateByStats || curStat >= req;
          if (allowed) {
            const mult = vipEnabled && item.nextAt <= vipLimitSec ? 2 : 1;
            const payout = item.quest.tokensReward * mult;
            tokens += payout;
            totalEarnedTokens += payout;
          }
          item.nextAt += item.periodSec;
        }
      }
    };

    if (!next) {
      const remainingToGoal =
        goalStat < Infinity && effectiveGainPerSec > 0
          ? (goalStat - stat) / effectiveGainPerSec
          : Infinity;
      const timeToDaily =
        questMode === 'discrete' && (simulateUpgrades || qInfo.dailyDown > 0)
          ? Math.max(0.0001, nextDailyAt - time)
          : Infinity;
      const timeToWeekly =
        questMode === 'discrete' && (simulateUpgrades || qInfo.weeklyDown > 0)
          ? Math.max(0.0001, nextWeeklyAt - time)
          : Infinity;
      const timeToFinishDetour = offZoneRemaining > 0 ? offZoneRemaining : Infinity;
      const step = Math.min(
        remainingToGoal,
        timeToNextZone,
        timeToNextQuestUnlock,
        timeToDaily,
        timeToWeekly,
        nextCustomHoursDelay,
        timeToFinishDetour,
        maxTime - time
      );
      if (step <= 0 || !Number.isFinite(step)) break;
      const earned = currentRate * step;
      stat += effectiveGainPerSec * step;
      tokens += earned;
      totalEarnedTokens += earned;
      time += step;
      handleDiscreteCycles(step);
      processOneTimeCustomQuests(stat);
      if (stat >= goalStat || time >= maxTime) break;
      continue;
    }

    const nextCost = next.price;
    const canUpgrade = tokens >= nextCost && time + 1 <= maxTime;

    if (canUpgrade) {
      const smallStep = 1;
      const earned = currentRate * smallStep;
      stat += effectiveGainPerSec * smallStep;
      tokens += earned;
      totalEarnedTokens += earned;
      time += smallStep;
      handleDiscreteCycles(smallStep);
      processOneTimeCustomQuests(stat);

      if (stat >= goalStat || time >= maxTime) break;

      tokens -= nextCost;
      spentTokens += nextCost;
      idx++;
      multi = next.value;
      gainPerSec = activeBaseGainPerSec * multi * equipBonusFactor;
      upgrades.push(next.key);
      upgradeSteps.push({
        multiKey: next.key,
        multiValue: next.value,
        price: nextCost,
        atTimeSeconds: time,
        statAtUpgrade: stat,
        cumulativeSpentTokens: spentTokens
      });
    } else {
      const needTokens = Math.max(0, nextCost - tokens);
      const timeToTokens = currentRate > 0 ? needTokens / currentRate : Infinity;
      const timeToGoal =
        goalStat < Infinity && effectiveGainPerSec > 0
          ? (goalStat - stat) / effectiveGainPerSec
          : Infinity;
      const timeToDaily =
        questMode === 'discrete'
          ? Math.max(0.0001, nextDailyAt - time)
          : Infinity;
      const timeToWeekly =
        questMode === 'discrete'
          ? Math.max(0.0001, nextWeeklyAt - time)
          : Infinity;
      const timeToFinishDetour = offZoneRemaining > 0 ? offZoneRemaining : Infinity;
      const timeToVipExpiry =
        questMode === 'averaged' && vipEnabled && Number.isFinite(vipLimitSec) && time < vipLimitSec
          ? Math.max(0.0001, vipLimitSec - time)
          : Infinity;

      const step = Math.min(
        timeToTokens,
        timeToGoal,
        timeToNextZone,
        timeToNextQuestUnlock,
        timeToDaily,
        timeToWeekly,
        nextCustomHoursDelay,
        timeToFinishDetour,
        timeToVipExpiry,
        maxTime - time
      );
      if (step <= 0 || !Number.isFinite(step)) break;

      const earned = currentRate * step;
      stat += effectiveGainPerSec * step;
      tokens += earned;
      totalEarnedTokens += earned;
      time += step;
      handleDiscreteCycles(step);
      processOneTimeCustomQuests(stat);
    }
  }

  const finalTime = Math.min(time, maxTime);
  const timeSavedSeconds =
    Number.isFinite(timeWithoutUpgrades) && goalStat < Infinity
      ? Math.max(0, timeWithoutUpgrades - finalTime)
      : 0;

  return {
    totalTime: finalTime,
    finalStat: stat,
    spentTokens,
    totalEarnedTokens,
    remainingTokens: tokens,
    upgrades,
    upgradeSteps,
    zoneTransitions,
    timeWithoutUpgrades,
    timeSavedSeconds,
    finalMultiKey: orderedMultis[idx]?.key || currentMultiKey,
    finalZoneId: activeZoneId
  };
}

export function calculateRobuxPackBreakdown(
  desiredTokens: number,
  packGroup: 'classic' | 'high',
  firstPurchaseX2: boolean
): RobuxPackBreakdownRow[] {
  const desired = Math.max(0, desiredTokens);
  if (desired <= 0) return [];

  return SPTS_TOKEN_PACKS.filter((p) => p.tierGroup === packGroup)
    .map((pack) => {
      let count = 0;
      let totalDeliveredTokens = 0;

      if (firstPurchaseX2) {
        if (desired <= pack.firstTimeTokens) {
          count = 1;
          totalDeliveredTokens = pack.firstTimeTokens;
        } else {
          const remaining = desired - pack.firstTimeTokens;
          const additional = Math.ceil(remaining / pack.tokens);
          count = 1 + additional;
          totalDeliveredTokens = pack.firstTimeTokens + additional * pack.tokens;
        }
      } else {
        count = Math.ceil(desired / pack.tokens);
        totalDeliveredTokens = count * pack.tokens;
      }

      const totalRobux = count * pack.robux;
      return {
        pack,
        count,
        firstPurchaseApplied: firstPurchaseX2,
        firstPackTokens: firstPurchaseX2 ? pack.firstTimeTokens : pack.tokens,
        repeatPackTokens: pack.tokens,
        totalDeliveredTokens,
        totalRobux,
        effectiveTokensPerRobux: totalDeliveredTokens / totalRobux
      };
    })
    .sort((a, b) => a.totalRobux - b.totalRobux);
}

export function cumulativeCostToReach(
  value: string | number,
  pricesMap: Record<number, number> = SPTS_PRICES
): number {
  const val = typeof value === 'string' && value.startsWith('x') ? Number(value.slice(1)) : Number(value);
  if (!Number.isFinite(val) || val <= 1) return 0;
  const tiers = Object.keys(pricesMap).map(Number).sort((a, b) => a - b);
  let sum = 0;
  for (const t of tiers) {
    if (t > 1 && t <= val) sum += pricesMap[t] || 0;
    if (t > val) break;
  }
  return sum;
}

export function estimatePlaytimeRange({
  currentMultis = {},
  currentTokens = 0,
  assumptions = {},
  gameConfig
}: {
  currentMultis?: Partial<Record<SptsStatType, string>>;
  currentTokens?: number;
  assumptions?: {
    tpm?: number;
    dailyBase?: number;
    weeklyBase?: number;
    customHoursPerSec?: number;
  };
  gameConfig?: SptsGameConfig;
} = {}): PlaytimeRangeResult {
  const pricesMap = gameConfig?.prices ?? SPTS_PRICES;
  const defaultDailySum = (gameConfig?.dailyQuests ?? SPTS_DAILY_QUESTS).reduce(
    (s, q) => s + q.tokens,
    0
  );
  const defaultWeeklySum = (gameConfig?.weeklyQuests ?? SPTS_WEEKLY_QUESTS).reduce(
    (s, q) => s + q.tokens,
    0
  );

  const tpm = assumptions.tpm ?? gameConfig?.passiveTokensPerMinute ?? 5;
  const dailyBase = assumptions.dailyBase ?? defaultDailySum;
  const weeklyBase = assumptions.weeklyBase ?? defaultWeeklySum;
  const customHoursPerSec = Math.max(0, assumptions.customHoursPerSec ?? 0);

  let totalSpentOnMultis = 0;
  const stats: SptsStatType[] = ['FS', 'BT', 'MS', 'JF', 'PP'];
  for (const stat of stats) {
    const key = currentMultis[stat] ?? 'x1';
    const numeric = key.startsWith('x') ? Number(key.slice(1)) : Number(key);
    const val = Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
    totalSpentOnMultis += cumulativeCostToReach(val, pricesMap);
  }

  const totalEarnedTokens = totalSpentOnMultis + (Number(currentTokens) || 0);
  const tps_min = tpm / 60;
  const tps_mid = tpm / 60 + dailyBase / 86400 + weeklyBase / (7 * 86400) + customHoursPerSec;
  const tps_max =
    tpm / 60 + (dailyBase * 2) / 86400 + (weeklyBase * 2) / (7 * 86400) + customHoursPerSec * 2;

  const slowest_noQuests = tps_min > 0 ? totalEarnedTokens / tps_min : Infinity;
  const mid_allQuests_noVIP = tps_mid > 0 ? totalEarnedTokens / tps_mid : Infinity;
  const fastest_allQuests_VIP = tps_max > 0 ? totalEarnedTokens / tps_max : Infinity;
  const med = (fastest_allQuests_VIP + mid_allQuests_noVIP + slowest_noQuests) / 3;

  return {
    totalSpentOnMultis,
    totalEarnedTokens,
    tps: { min: tps_min, mid: tps_mid, max: tps_max },
    seconds: {
      slowest_noQuests,
      mid_allQuests_noVIP,
      fastest_allQuests_VIP,
      med
    }
  };
}

export function computeMaxHp(bt: number): number {
  return SPTS_PVP_CONFIG.BASE_HP + SPTS_PVP_CONFIG.HP_PER_BT * Math.max(0, bt);
}

interface PhysicalAnalysis {
  fsInstantKill: boolean;
  reflectFrac: number;
  takenFrac: number;
}

function analyzePhysicalMatchup(self: PvpFighter, target: PvpFighter): PhysicalAnalysis {
  const selfFs = Math.max(0, self.fs);
  const targetBt = Math.max(0, target.bt);
  const fsInstantKill = selfFs > 0 && (targetBt <= 0 ? selfFs >= 1000 : selfFs >= targetBt * 10);
  if (fsInstantKill) {
    return { fsInstantKill: true, reflectFrac: 0, takenFrac: 1 };
  }
  const hasReflectUnlock = targetBt >= SPTS_PVP_CONFIG.REFLECT_MIN_BT;
  const ratio = selfFs > 0 ? targetBt / selfFs : Infinity;
  if (hasReflectUnlock && ratio >= 10) {
    return { fsInstantKill: false, reflectFrac: 1, takenFrac: 0 };
  }
  if (hasReflectUnlock && targetBt > selfFs) {
    return { fsInstantKill: false, reflectFrac: 0.1, takenFrac: 0.9 };
  }
  return { fsInstantKill: false, reflectFrac: 0, takenFrac: 1 };
}

interface PsychicAnalysis {
  hasSoulUnlock: boolean;
  exact10xBlocked: boolean;
  canSoulDamage: boolean;
  soulInstantKill: boolean;
  soulBackfires: boolean;
  soulBackfireInstant: boolean;
  soulHpFrac: number;
  hasKillingIntentUnlock: boolean;
  killingIntentInstant: boolean;
  killingIntentStuns: boolean;
  canHellfireBurn: boolean;
  hasSoulReapUnlock: boolean;
  canSoulReapKill: boolean;
}

function analyzePsychicMatchup(self: PvpFighter, target: PvpFighter): PsychicAnalysis {
  const selfPp = Math.max(0, self.pp);
  const targetPp = Math.max(0, target.pp);

  const hasSoulUnlock = selfPp >= SPTS_PVP_CONFIG.SKILLS.psychic.minPp;
  const ppRatio = targetPp > 0 ? selfPp / targetPp : selfPp > 0 ? 1000 : 1;
  const exact10xBlocked = hasSoulUnlock && targetPp > 0 && selfPp > 0 && ppRatio === 10;
  const canSoulDamage = hasSoulUnlock && (targetPp === 0 ? selfPp > 0 : selfPp > targetPp * 10);
  const soulInstantKill = hasSoulUnlock && (targetPp === 0 ? selfPp >= 100 : selfPp >= targetPp * 100);
  const soulHpFrac = canSoulDamage
    ? soulInstantKill
      ? 1
      : Math.min(1, Math.max(0.1, ppRatio / 100))
    : 0;

  // Backfire happens when target PP >= 10x caster PP (inclusive!)
  const soulBackfires = hasSoulUnlock && selfPp > 0 && targetPp >= selfPp * 10;
  const soulBackfireInstant = soulBackfires && targetPp >= selfPp * 100;

  const hasKillingIntentUnlock = selfPp >= SPTS_PVP_CONFIG.SKILLS.killing_intent.minPp;
  const killingIntentInstant =
    hasKillingIntentUnlock && (targetPp === 0 ? selfPp >= SPTS_PVP_CONFIG.SKILLS.killing_intent.minPp : selfPp >= targetPp * 1000);
  const killingIntentStuns =
    hasKillingIntentUnlock && targetPp > 0 && selfPp >= targetPp * 100 && !killingIntentInstant;

  const canHellfireBurn = targetPp === 0 ? selfPp >= 100 : selfPp >= targetPp * 100;

  const hasSoulReapUnlock =
    self.fs >= SPTS_PVP_CONFIG.SKILLS.soul_reap.minStat &&
    self.bt >= SPTS_PVP_CONFIG.SKILLS.soul_reap.minStat &&
    selfPp >= SPTS_PVP_CONFIG.SKILLS.soul_reap.minStat;
  const canSoulReapKill =
    targetPp === 0 ? selfPp >= 1000 : selfPp >= targetPp * 1000;

  return {
    hasSoulUnlock,
    exact10xBlocked,
    canSoulDamage,
    soulInstantKill,
    soulBackfires,
    soulBackfireInstant,
    soulHpFrac,
    hasKillingIntentUnlock,
    killingIntentInstant,
    killingIntentStuns,
    canHellfireBurn,
    hasSoulReapUnlock,
    canSoulReapKill
  };
}

function estimateRawComboDps(self: PvpFighter): number {
  const cdDiv = self.halfCooldown ? 2 : 1;
  let dps = (self.fs * SPTS_PVP_CONFIG.SKILLS.fist.mult) / (SPTS_PVP_CONFIG.SKILLS.fist.cdMs / 1000);
  if (self.fs >= SPTS_PVP_CONFIG.SKILLS.energy_sphere.minFs) {
    dps +=
      (self.fs * SPTS_PVP_CONFIG.SKILLS.energy_sphere.mult) /
      (SPTS_PVP_CONFIG.SKILLS.energy_sphere.cdMs / cdDiv / 1000);
  }
  if (self.fs >= SPTS_PVP_CONFIG.SKILLS.bullet_punch.minFs) {
    dps +=
      (self.fs * SPTS_PVP_CONFIG.SKILLS.bullet_punch.mult) /
      (SPTS_PVP_CONFIG.SKILLS.bullet_punch.cdMs / cdDiv / 1000);
  }
  return dps;
}

function resolveAutoSkill(self: PvpFighter, target: PvpFighter): PvpResolvedSkill {
  const phys = analyzePhysicalMatchup(self, target);
  const psy = analyzePsychicMatchup(self, target);
  const targetInvisConceals = Boolean(target.invisibility) && target.pp > self.pp;
  const selfMaxHp = computeMaxHp(self.bt);
  const targetMaxHp = computeMaxHp(target.bt);
  const cdDiv = self.halfCooldown ? 2 : 1;

  // 1. Instant-kill opportunities first
  if (psy.killingIntentInstant) return 'killing_intent';
  if (psy.hasSoulReapUnlock && psy.canSoulReapKill && !targetInvisConceals) return 'soul_reap';
  if (phys.fsInstantKill && !targetInvisConceals) return 'combo';
  if (psy.soulInstantKill && !psy.soulBackfires && !targetInvisConceals) return 'psychic';

  // 2. Compare safe PP vs Physical
  const highestSingleRawPhys =
    self.fs >= SPTS_PVP_CONFIG.SKILLS.energy_sphere.minFs
      ? self.fs * SPTS_PVP_CONFIG.SKILLS.energy_sphere.mult
      : self.fs * SPTS_PVP_CONFIG.SKILLS.fist.mult;
  const worstSingleReflectDmg = highestSingleRawPhys * phys.reflectFrac;
  const physKillsSelfQuickly =
    phys.reflectFrac >= 1 ||
    (phys.reflectFrac > 0 && worstSingleReflectDmg >= selfMaxHp);

  const canSafeSoul = psy.canSoulDamage && !psy.soulBackfires && !targetInvisConceals;
  const canAutoHellfire = Boolean(self.hasHellfire) && psy.canHellfireBurn;
  const canAutoStun = psy.killingIntentStuns;

  const soulDps = canSafeSoul
    ? (targetMaxHp * psy.soulHpFrac) / (SPTS_PVP_CONFIG.SKILLS.psychic.cdMs / cdDiv / 1000)
    : 0;
  const physDps = !targetInvisConceals && phys.reflectFrac < 1 ? estimateRawComboDps(self) * phys.takenFrac : 0;
  const hellfireDps = canAutoHellfire ? targetMaxHp * SPTS_PVP_CONFIG.SKILLS.hellfire.burnFracPerSec : 0;

  if (physKillsSelfQuickly || phys.reflectFrac >= 1 || targetInvisConceals) {
    if (canSafeSoul && soulDps >= hellfireDps) return 'psychic';
    if (canAutoHellfire) return 'hellfire';
    if (canAutoStun) return 'killing_intent';
    if (canSafeSoul) return 'psychic';
    return 'none';
  }

  // If 10% reflect threatens self out-dps OR PP skill deals higher net DPS without reflect
  if (canSafeSoul && (soulDps >= physDps || phys.reflectFrac > 0)) {
    if (soulDps >= hellfireDps) return 'psychic';
  }
  if (canAutoHellfire && ((target.dodgeChance ?? 0) >= 0.5 || hellfireDps > physDps)) {
    return 'hellfire';
  }
  if (phys.reflectFrac > 0) {
    // Check if reflect DPS exceeds attacker's own regen + outraces defender HP drop
    const rawPhysDps = estimateRawComboDps(self);
    const selfReflectDps = rawPhysDps * phys.reflectFrac;
    const selfRegen = selfMaxHp * SPTS_PVP_CONFIG.REGEN_PER_SEC;
    const netSelfLossFrac = (selfReflectDps - selfRegen) / selfMaxHp;
    const netTargetLossFrac = (physDps - targetMaxHp * SPTS_PVP_CONFIG.REGEN_PER_SEC) / targetMaxHp;
    if (netSelfLossFrac > Math.max(0, netTargetLossFrac) && selfReflectDps > selfRegen) {
      if (canSafeSoul) return 'psychic';
      if (canAutoHellfire) return 'hellfire';
      if (canAutoStun) return 'killing_intent';
      return 'none';
    }
  }

  return self.fs > 0 ? 'combo' : canSafeSoul ? 'psychic' : canAutoHellfire ? 'hellfire' : 'none';
}

interface ActiveSubSkill {
  skill: Exclude<PvpAtomicSkill, 'none'>;
  cdMs: number;
  nextMs: number;
}

const PVP_SKILL_EXECUTION_ORDER: Record<PvpActiveSkill, number> = {
  killing_intent: 0,
  soul_reap: 1,
  psychic: 2,
  hellfire: 3,
  energy_sphere: 4,
  bullet_punch: 5,
  fist: 6
};

function buildActiveSubSkills(
  self: PvpFighter,
  resolved: PvpResolvedSkill,
  explicitSkills?: PvpActiveSkill[]
): ActiveSubSkill[] {
  const cdDiv = self.halfCooldown ? 2 : 1;
  const toSub = (skill: PvpActiveSkill): ActiveSubSkill => {
    switch (skill) {
      case 'fist':
        return { skill: 'fist', cdMs: SPTS_PVP_CONFIG.SKILLS.fist.cdMs, nextMs: 0 };
      case 'energy_sphere':
        return {
          skill: 'energy_sphere',
          cdMs: Math.round(SPTS_PVP_CONFIG.SKILLS.energy_sphere.cdMs / cdDiv),
          nextMs: 0
        };
      case 'bullet_punch':
        return {
          skill: 'bullet_punch',
          cdMs: Math.round(SPTS_PVP_CONFIG.SKILLS.bullet_punch.cdMs / cdDiv),
          nextMs: 0
        };
      case 'psychic':
        return {
          skill: 'psychic',
          cdMs: Math.round(SPTS_PVP_CONFIG.SKILLS.psychic.cdMs / cdDiv),
          nextMs: 0
        };
      case 'killing_intent':
        return {
          skill: 'killing_intent',
          cdMs: Math.round(SPTS_PVP_CONFIG.SKILLS.killing_intent.cdMs / cdDiv),
          nextMs: 0
        };
      case 'hellfire':
        return {
          skill: 'hellfire',
          cdMs: SPTS_PVP_CONFIG.SKILLS.hellfire.pulseMs,
          nextMs: 0
        };
      case 'soul_reap':
        return {
          skill: 'soul_reap',
          cdMs: Math.round(SPTS_PVP_CONFIG.SKILLS.soul_reap.cdMs / cdDiv),
          nextMs: 0
        };
    }
  };

  if (explicitSkills !== undefined) {
    const unique = Array.from(new Set(explicitSkills)).sort(
      (a, b) => PVP_SKILL_EXECUTION_ORDER[a] - PVP_SKILL_EXECUTION_ORDER[b]
    );
    return unique.map(toSub);
  }

  if (resolved === 'none') return [];
  if (resolved === 'combo') {
    const list: ActiveSubSkill[] = [toSub('fist')];
    if (self.fs >= SPTS_PVP_CONFIG.SKILLS.energy_sphere.minFs) {
      list.push(toSub('energy_sphere'));
    }
    if (self.fs >= SPTS_PVP_CONFIG.SKILLS.bullet_punch.minFs) {
      list.push(toSub('bullet_punch'));
    }
    return list;
  }
  return [toSub(resolved)];
}

interface TickSimInternalResult {
  winner: 'attacker' | 'defender' | 'draw';
  durationSec: number;
  chosenAttackerSkill: PvpResolvedSkill;
  chosenDefenderSkill: PvpResolvedSkill;
  chosenAttackerSkills: PvpActiveSkill[];
  chosenDefenderSkills: PvpActiveSkill[];
  attackerMaxHp: number;
  defenderMaxHp: number;
  attackerDamageDealt: number;
  defenderDamageDealt: number;
  attackerHits: number;
  defenderHits: number;
  attackerReflectHits: number;
  defenderReflectHits: number;
  attackerReflectPercent: number;
  defenderReflectPercent: number;
  attackerReflectDmgSum: number;
  attackerDiedFromReflect: boolean;
  attackerReflectDeathSeconds: number;
  attackerReflectDeathHits: number;
  attackerReflectDeathPercent: number;
  defenderDiedFromReflect: boolean;
  attackerBackfired: boolean;
  attackerDiedFromBackfire: boolean;
  attackerInstantKill: boolean;
  invisEvadedOnAttacker: boolean;
  killingIntentStunnedDefender: boolean;
  soulReapExecuted: boolean;
  hellfireBurned: boolean;
  log: PvpCombatLogEntry[];
}

const LOG_LIMIT = 120;

function runPvpTickSimulation(
  attacker: PvpFighter,
  defender: PvpFighter,
  mode: PvpAttackMode,
  options?: {
    collectLog?: boolean;
    soloAttackerOnly?: boolean;
    soloDefenderOnly?: boolean;
    attackerSkills?: PvpActiveSkill[];
    defenderSkills?: PvpActiveSkill[];
  }
): TickSimInternalResult {
  const collectLog = options?.collectLog ?? true;
  const soloAttackerOnly = options?.soloAttackerOnly ?? false;
  const soloDefenderOnly = options?.soloDefenderOnly ?? false;
  const hasCustomAttacker = Array.isArray(options?.attackerSkills);
  const hasCustomDefender = Array.isArray(options?.defenderSkills);

  const isPhysMode = mode === 'fist' || mode === 'bullet_punch' || mode === 'energy_sphere';

  const summarizeSkillList = (skills: PvpActiveSkill[]): PvpResolvedSkill => {
    if (skills.length === 0) return 'none';
    if (skills.length === 1) return skills[0];
    return 'combo';
  };

  const chosenAttackerSkill: PvpResolvedSkill = soloDefenderOnly
    ? 'none'
    : hasCustomAttacker
      ? summarizeSkillList(options!.attackerSkills!)
      : mode === 'auto'
        ? resolveAutoSkill(attacker, defender)
        : mode;

  const chosenDefenderSkill: PvpResolvedSkill = soloAttackerOnly
    ? 'none'
    : hasCustomDefender
      ? summarizeSkillList(options!.defenderSkills!)
      : isPhysMode
        ? mode
        : resolveAutoSkill(defender, attacker);

  const aSkills = soloDefenderOnly
    ? []
    : buildActiveSubSkills(
        attacker,
        chosenAttackerSkill,
        hasCustomAttacker ? options!.attackerSkills! : undefined
      );
  const dSkills = soloAttackerOnly
    ? []
    : buildActiveSubSkills(
        defender,
        chosenDefenderSkill,
        hasCustomDefender ? options!.defenderSkills! : undefined
      );

  const chosenAttackerSkills = aSkills.map((s) => s.skill);
  const chosenDefenderSkills = dSkills.map((s) => s.skill);

  const attackerMaxHp = computeMaxHp(attacker.bt);
  const defenderMaxHp = computeMaxHp(defender.bt);

  let aHp = attackerMaxHp;
  let dHp = defenderMaxHp;
  let aStunnedUntilMs = -1;
  let dStunnedUntilMs = -1;
  let aDodgeAcc = 0; // accumulated dodge by attacker against defender's attacks
  let dDodgeAcc = 0; // accumulated dodge by defender against attacker's attacks

  const aPhys = analyzePhysicalMatchup(attacker, defender);
  const dPhys = analyzePhysicalMatchup(defender, attacker);
  const aPsy = analyzePsychicMatchup(attacker, defender);
  const dPsy = analyzePsychicMatchup(defender, attacker);

  let aDamageDealt = 0;
  let dDamageDealt = 0;
  let aHits = 0;
  let dHits = 0;
  let aReflectDmgSum = 0;
  let aDiedFromReflect = false;
  let aReflectDeathSeconds = Infinity;
  let aReflectDeathHits = 0;
  let aReflectDeathPct = 0;
  let dDiedFromReflect = false;
  let aBackfired = false;
  let aDiedFromBackfire = false;
  let aInstantKill = false;
  let invisEvadedOnAttacker =
    !soloDefenderOnly &&
    aSkills.length === 0 &&
    Boolean(defender.invisibility) &&
    defender.pp > attacker.pp &&
    (attacker.fs > 0 || attacker.pp >= SPTS_PVP_CONFIG.SKILLS.psychic.minPp);
  let killingIntentStunnedDefender = false;
  let soulReapExecuted = false;
  let hellfireBurned = false;

  const log: PvpCombatLogEntry[] = [];
  const pushLog = (entry: PvpCombatLogEntry) => {
    if (!collectLog) return;
    if (log.length < LOG_LIMIT - 1 || entry.kind === 'ko') {
      log.push(entry);
    }
  };

  const maxTicks = Math.round((SPTS_PVP_CONFIG.MAX_SIM_SECONDS * 1000) / SPTS_PVP_CONFIG.TICK_MS);
  const aRegenPerTick = attackerMaxHp * SPTS_PVP_CONFIG.REGEN_PER_SEC * (SPTS_PVP_CONFIG.TICK_MS / 1000);
  const dRegenPerTick = defenderMaxHp * SPTS_PVP_CONFIG.REGEN_PER_SEC * (SPTS_PVP_CONFIG.TICK_MS / 1000);

  let winner: 'attacker' | 'defender' | 'draw' = 'draw';
  let finishTimeSec = Infinity;
  let finished = false;

  // Quick early exit for pure stalemates with no possible actions
  if (aSkills.length === 0 && dSkills.length === 0) {
    return {
      winner: 'draw',
      durationSec: Infinity,
      chosenAttackerSkill,
      chosenDefenderSkill,
      chosenAttackerSkills,
      chosenDefenderSkills,
      attackerMaxHp,
      defenderMaxHp,
      attackerDamageDealt: 0,
      defenderDamageDealt: 0,
      attackerHits: 0,
      defenderHits: 0,
      attackerReflectHits: 0,
      defenderReflectHits: 0,
      attackerReflectPercent: Math.round(aPhys.reflectFrac * 100),
      defenderReflectPercent: Math.round(dPhys.reflectFrac * 100),
      attackerReflectDmgSum: 0,
      attackerDiedFromReflect: false,
      attackerReflectDeathSeconds: Infinity,
      attackerReflectDeathHits: 0,
      attackerReflectDeathPercent: 0,
      defenderDiedFromReflect: false,
      attackerBackfired: false,
      attackerDiedFromBackfire: false,
      attackerInstantKill: false,
      invisEvadedOnAttacker,
      killingIntentStunnedDefender: false,
      soulReapExecuted: false,
      hellfireBurned: false,
      log
    };
  }

  for (let tick = 0; tick <= maxTicks; tick++) {
    const tMs = tick * SPTS_PVP_CONFIG.TICK_MS;
    const tSec = tMs / 1000;

    if (tick > 0) {
      aHp = Math.min(attackerMaxHp, aHp + aRegenPerTick);
      dHp = Math.min(defenderMaxHp, dHp + dRegenPerTick);
    }

    const aStunnedNow = tMs < aStunnedUntilMs;
    const dStunnedNow = tMs < dStunnedUntilMs;

    let koReasonA: PvpCombatLogEntry['koReason'] = 'hp_zero';
    let koReasonD: PvpCombatLogEntry['koReason'] = 'hp_zero';

    // Attacker actions
    if (!aStunnedNow && aSkills.length > 0) {
      for (const s of aSkills) {
        if (aHp <= 0 || dHp <= 0) break;
        if (s.nextMs > tMs) continue;
        s.nextMs = tMs + s.cdMs;

        const dodgeable =
          s.skill === 'fist' ||
          s.skill === 'bullet_punch' ||
          s.skill === 'energy_sphere' ||
          s.skill === 'psychic' ||
          s.skill === 'soul_reap';

        if (dodgeable) {
          if (defender.invisibility && defender.pp > attacker.pp) {
            invisEvadedOnAttacker = true;
            pushLog({
              timeSec: tSec,
              actor: 'attacker',
              target: 'defender',
              kind: 'miss_invis',
              skill: s.skill
            });
            continue;
          }
          const dChance = Math.min(SPTS_PVP_CONFIG.MAX_DODGE, Math.max(0, defender.dodgeChance ?? 0));
          if (dChance > 0) {
            dDodgeAcc += dChance;
            if (dDodgeAcc >= 1 - 1e-9) {
              dDodgeAcc -= 1;
              pushLog({
                timeSec: tSec,
                actor: 'attacker',
                target: 'defender',
                kind: 'miss_dodge',
                skill: s.skill
              });
              continue;
            }
          }
        }

        aHits++;
        if (s.skill === 'fist' || s.skill === 'bullet_punch' || s.skill === 'energy_sphere') {
          const mult = SPTS_PVP_CONFIG.SKILLS[s.skill].mult;
          const rawDmg = attacker.fs * mult;
          const dmgToD = aPhys.fsInstantKill ? dHp : rawDmg * aPhys.takenFrac;
          const reflectToA = rawDmg * aPhys.reflectFrac;

          if (aPhys.fsInstantKill) {
            aInstantKill = true;
            koReasonD = 'fs_instakill';
          }
          dHp = Math.max(0, dHp - dmgToD);
          aDamageDealt += dmgToD;

          pushLog({
            timeSec: tSec,
            actor: 'attacker',
            target: 'defender',
            kind: 'attack',
            skill: s.skill,
            damage: dmgToD,
            targetHpAfter: dHp,
            targetMaxHp: defenderMaxHp
          });

          if (reflectToA > 0) {
            const reflectInsta = attacker.bt > 0 && reflectToA >= attacker.bt * 10;
            aHp = reflectInsta ? 0 : Math.max(0, aHp - reflectToA);
            aReflectDmgSum += reflectToA;
            pushLog({
              timeSec: tSec,
              actor: 'defender',
              target: 'attacker',
              kind: 'reflect',
              skill: s.skill,
              damage: reflectToA,
              targetHpAfter: aHp,
              targetMaxHp: attackerMaxHp,
              reflectPercent: Math.round(aPhys.reflectFrac * 100)
            });
            if (aHp <= 0) {
              aDiedFromReflect = true;
              aReflectDeathSeconds = tSec;
              aReflectDeathHits = aHits;
              aReflectDeathPct = Math.round(aPhys.reflectFrac * 100);
              koReasonA = 'reflect';
            }
          }
        } else if (s.skill === 'psychic') {
          if (!aPsy.hasSoulUnlock) {
            pushLog({
              timeSec: tSec,
              actor: 'attacker',
              target: 'defender',
              kind: 'attack',
              skill: 'psychic',
              damage: 0,
              targetHpAfter: dHp,
              targetMaxHp: defenderMaxHp
            });
          } else if (aPsy.soulBackfires) {
            aBackfired = true;
            const bfFrac = aPsy.soulBackfireInstant
              ? 1
              : Math.min(1, Math.max(0.1, defender.pp / Math.max(1, attacker.pp) / 100));
            const bfDmg = aPsy.soulBackfireInstant ? aHp : attackerMaxHp * bfFrac;
            aHp = Math.max(0, aHp - bfDmg);
            aReflectDmgSum += bfDmg;
            pushLog({
              timeSec: tSec,
              actor: 'defender',
              target: 'attacker',
              kind: 'backfire',
              skill: 'psychic',
              damage: bfDmg,
              targetHpAfter: aHp,
              targetMaxHp: attackerMaxHp,
              reflectPercent: 100
            });
            if (aHp <= 0) {
              aDiedFromBackfire = true;
              koReasonA = 'backfire';
            }
          } else if (aPsy.canSoulDamage) {
            const dmg = aPsy.soulInstantKill ? dHp : defenderMaxHp * aPsy.soulHpFrac;
            if (aPsy.soulInstantKill) {
              aInstantKill = true;
              koReasonD = 'psychic_instakill';
            }
            dHp = Math.max(0, dHp - dmg);
            aDamageDealt += dmg;
            pushLog({
              timeSec: tSec,
              actor: 'attacker',
              target: 'defender',
              kind: 'attack',
              skill: 'psychic',
              damage: dmg,
              targetHpAfter: dHp,
              targetMaxHp: defenderMaxHp
            });
          } else {
            pushLog({
              timeSec: tSec,
              actor: 'attacker',
              target: 'defender',
              kind: 'attack',
              skill: 'psychic',
              damage: 0,
              targetHpAfter: dHp,
              targetMaxHp: defenderMaxHp
            });
          }
        } else if (s.skill === 'killing_intent') {
          if (aPsy.killingIntentInstant) {
            aInstantKill = true;
            const dmg = dHp;
            dHp = 0;
            aDamageDealt += dmg;
            koReasonD = 'killing_intent';
            pushLog({
              timeSec: tSec,
              actor: 'attacker',
              target: 'defender',
              kind: 'attack',
              skill: 'killing_intent',
              damage: dmg,
              targetHpAfter: 0,
              targetMaxHp: defenderMaxHp
            });
          } else if (aPsy.killingIntentStuns) {
            killingIntentStunnedDefender = true;
            const dmg = defenderMaxHp * 0.2;
            dHp = Math.max(0, dHp - dmg);
            aDamageDealt += dmg;
            dStunnedUntilMs = Math.max(
              dStunnedUntilMs,
              tMs + SPTS_PVP_CONFIG.STUN_DURATION_SEC * 1000
            );
            pushLog({
              timeSec: tSec,
              actor: 'attacker',
              target: 'defender',
              kind: 'stun',
              skill: 'killing_intent',
              damage: dmg,
              targetHpAfter: dHp,
              targetMaxHp: defenderMaxHp
            });
          } else {
            pushLog({
              timeSec: tSec,
              actor: 'attacker',
              target: 'defender',
              kind: 'attack',
              skill: 'killing_intent',
              damage: 0,
              targetHpAfter: dHp,
              targetMaxHp: defenderMaxHp
            });
          }
        } else if (s.skill === 'hellfire') {
          if (aPsy.canHellfireBurn) {
            hellfireBurned = true;
            const dmg =
              defenderMaxHp *
              SPTS_PVP_CONFIG.SKILLS.hellfire.burnFracPerSec *
              (SPTS_PVP_CONFIG.SKILLS.hellfire.pulseMs / 1000);
            dHp = Math.max(0, dHp - dmg);
            aDamageDealt += dmg;
            pushLog({
              timeSec: tSec,
              actor: 'attacker',
              target: 'defender',
              kind: 'burn',
              skill: 'hellfire',
              damage: dmg,
              targetHpAfter: dHp,
              targetMaxHp: defenderMaxHp
            });
          }
        } else if (s.skill === 'soul_reap') {
          if (aPsy.canSoulReapKill) {
            soulReapExecuted = true;
            aInstantKill = true;
            const dmg = dHp;
            dHp = 0;
            aDamageDealt += dmg;
            koReasonD = 'soul_reap';
            pushLog({
              timeSec: tSec,
              actor: 'attacker',
              target: 'defender',
              kind: 'attack',
              skill: 'soul_reap',
              damage: dmg,
              targetHpAfter: 0,
              targetMaxHp: defenderMaxHp
            });
          } else {
            pushLog({
              timeSec: tSec,
              actor: 'attacker',
              target: 'defender',
              kind: 'attack',
              skill: 'soul_reap',
              damage: 0,
              targetHpAfter: dHp,
              targetMaxHp: defenderMaxHp
            });
          }
        }
      }
    }

    // Defender actions (evaluated simultaneously against tick-start state)
    if (!dStunnedNow && dSkills.length > 0) {
      let dKilledAttacker = false;
      for (const s of dSkills) {
        if (dKilledAttacker || (dHp <= 0 && (koReasonD === 'reflect' || koReasonD === 'backfire'))) {
          break;
        }
        if (s.nextMs > tMs) continue;
        s.nextMs = tMs + s.cdMs;

        const dodgeable =
          s.skill === 'fist' ||
          s.skill === 'bullet_punch' ||
          s.skill === 'energy_sphere' ||
          s.skill === 'psychic' ||
          s.skill === 'soul_reap';

        if (dodgeable) {
          if (attacker.invisibility && attacker.pp > defender.pp) {
            pushLog({
              timeSec: tSec,
              actor: 'defender',
              target: 'attacker',
              kind: 'miss_invis',
              skill: s.skill
            });
            continue;
          }
          const aChance = Math.min(SPTS_PVP_CONFIG.MAX_DODGE, Math.max(0, attacker.dodgeChance ?? 0));
          if (aChance > 0) {
            aDodgeAcc += aChance;
            if (aDodgeAcc >= 1 - 1e-9) {
              aDodgeAcc -= 1;
              pushLog({
                timeSec: tSec,
                actor: 'defender',
                target: 'attacker',
                kind: 'miss_dodge',
                skill: s.skill
              });
              continue;
            }
          }
        }

        dHits++;
        if (s.skill === 'fist' || s.skill === 'bullet_punch' || s.skill === 'energy_sphere') {
          const mult = SPTS_PVP_CONFIG.SKILLS[s.skill].mult;
          const rawDmg = defender.fs * mult;
          const dmgToA = dPhys.fsInstantKill ? aHp : rawDmg * dPhys.takenFrac;
          const reflectToD = rawDmg * dPhys.reflectFrac;

          if (dPhys.fsInstantKill) koReasonA = 'fs_instakill';
          aHp = Math.max(0, aHp - dmgToA);
          dDamageDealt += dmgToA;

          pushLog({
            timeSec: tSec,
            actor: 'defender',
            target: 'attacker',
            kind: 'attack',
            skill: s.skill,
            damage: dmgToA,
            targetHpAfter: aHp,
            targetMaxHp: attackerMaxHp
          });

          if (reflectToD > 0) {
            const reflectInsta = defender.bt > 0 && reflectToD >= defender.bt * 10;
            dHp = reflectInsta ? 0 : Math.max(0, dHp - reflectToD);
            pushLog({
              timeSec: tSec,
              actor: 'attacker',
              target: 'defender',
              kind: 'reflect',
              skill: s.skill,
              damage: reflectToD,
              targetHpAfter: dHp,
              targetMaxHp: defenderMaxHp,
              reflectPercent: Math.round(dPhys.reflectFrac * 100)
            });
            if (dHp <= 0) {
              dDiedFromReflect = true;
              koReasonD = 'reflect';
            }
          }
        } else if (s.skill === 'psychic') {
          if (dPsy.soulBackfires) {
            const bfFrac = dPsy.soulBackfireInstant
              ? 1
              : Math.min(1, Math.max(0.1, attacker.pp / Math.max(1, defender.pp) / 100));
            const bfDmg = dPsy.soulBackfireInstant ? dHp : defenderMaxHp * bfFrac;
            dHp = Math.max(0, dHp - bfDmg);
            pushLog({
              timeSec: tSec,
              actor: 'attacker',
              target: 'defender',
              kind: 'backfire',
              skill: 'psychic',
              damage: bfDmg,
              targetHpAfter: dHp,
              targetMaxHp: defenderMaxHp,
              reflectPercent: 100
            });
            if (dHp <= 0) koReasonD = 'backfire';
          } else if (dPsy.canSoulDamage) {
            const dmg = dPsy.soulInstantKill ? aHp : attackerMaxHp * dPsy.soulHpFrac;
            if (dPsy.soulInstantKill) koReasonA = 'psychic_instakill';
            aHp = Math.max(0, aHp - dmg);
            dDamageDealt += dmg;
            pushLog({
              timeSec: tSec,
              actor: 'defender',
              target: 'attacker',
              kind: 'attack',
              skill: 'psychic',
              damage: dmg,
              targetHpAfter: aHp,
              targetMaxHp: attackerMaxHp
            });
          }
        } else if (s.skill === 'killing_intent') {
          if (dPsy.killingIntentInstant) {
            const dmg = aHp;
            aHp = 0;
            dDamageDealt += dmg;
            koReasonA = 'killing_intent';
            pushLog({
              timeSec: tSec,
              actor: 'defender',
              target: 'attacker',
              kind: 'attack',
              skill: 'killing_intent',
              damage: dmg,
              targetHpAfter: 0,
              targetMaxHp: attackerMaxHp
            });
          } else if (dPsy.killingIntentStuns) {
            const dmg = attackerMaxHp * 0.2;
            aHp = Math.max(0, aHp - dmg);
            dDamageDealt += dmg;
            aStunnedUntilMs = Math.max(
              aStunnedUntilMs,
              tMs + SPTS_PVP_CONFIG.STUN_DURATION_SEC * 1000
            );
            pushLog({
              timeSec: tSec,
              actor: 'defender',
              target: 'attacker',
              kind: 'stun',
              skill: 'killing_intent',
              damage: dmg,
              targetHpAfter: aHp,
              targetMaxHp: attackerMaxHp
            });
          }
        } else if (s.skill === 'hellfire') {
          if (dPsy.canHellfireBurn) {
            const dmg =
              attackerMaxHp *
              SPTS_PVP_CONFIG.SKILLS.hellfire.burnFracPerSec *
              (SPTS_PVP_CONFIG.SKILLS.hellfire.pulseMs / 1000);
            aHp = Math.max(0, aHp - dmg);
            dDamageDealt += dmg;
            pushLog({
              timeSec: tSec,
              actor: 'defender',
              target: 'attacker',
              kind: 'burn',
              skill: 'hellfire',
              damage: dmg,
              targetHpAfter: aHp,
              targetMaxHp: attackerMaxHp
            });
          }
        } else if (s.skill === 'soul_reap') {
          if (dPsy.canSoulReapKill) {
            const dmg = aHp;
            aHp = 0;
            dDamageDealt += dmg;
            koReasonA = 'soul_reap';
            pushLog({
              timeSec: tSec,
              actor: 'defender',
              target: 'attacker',
              kind: 'attack',
              skill: 'soul_reap',
              damage: dmg,
              targetHpAfter: 0,
              targetMaxHp: attackerMaxHp
            });
          }
        }
        if (aHp <= 0) dKilledAttacker = true;
        if (dKilledAttacker || (dHp <= 0 && (koReasonD === 'reflect' || koReasonD === 'backfire'))) {
          break;
        }
      }
    }

    const aDead = aHp <= 0;
    const dDead = dHp <= 0;
    if (aDead && dDead) {
      winner = 'draw';
      finishTimeSec = tSec;
      finished = true;
      pushLog({ timeSec: tSec, actor: 'attacker', target: 'defender', kind: 'ko', koReason: koReasonD });
      break;
    }
    if (dDead) {
      winner = 'attacker';
      finishTimeSec = tSec;
      finished = true;
      pushLog({ timeSec: tSec, actor: 'attacker', target: 'defender', kind: 'ko', koReason: koReasonD });
      break;
    }
    if (aDead) {
      winner = 'defender';
      finishTimeSec = tSec;
      finished = true;
      pushLog({ timeSec: tSec, actor: 'defender', target: 'attacker', kind: 'ko', koReason: koReasonA });
      break;
    }
  }

  // Extrapolate ultra-long battles (> MAX_SIM_SECONDS) based on sustained net DPS vs regen
  if (!finished) {
    const dur = SPTS_PVP_CONFIG.MAX_SIM_SECONDS;
    const aNetDps = aDamageDealt / dur - defenderMaxHp * SPTS_PVP_CONFIG.REGEN_PER_SEC;
    const dNetDps = dDamageDealt / dur - attackerMaxHp * SPTS_PVP_CONFIG.REGEN_PER_SEC;
    const aTtk = aNetDps > 0 ? defenderMaxHp / aNetDps : Infinity;
    const dTtk = dNetDps > 0 ? attackerMaxHp / dNetDps : Infinity;
    if (aTtk < dTtk) {
      winner = 'attacker';
      finishTimeSec = aTtk;
      aHits = Math.max(aHits, Math.ceil((aHits / dur) * aTtk));
    } else if (dTtk < aTtk) {
      winner = 'defender';
      finishTimeSec = dTtk;
      dHits = Math.max(dHits, Math.ceil((dHits / dur) * dTtk));
    } else {
      winner = 'draw';
      finishTimeSec = Infinity;
    }
  }

  const hasAnyPhysSkill = chosenAttackerSkills.some(
    (s) => s === 'fist' || s === 'bullet_punch' || s === 'energy_sphere'
  );
  const resolvedReflectPct = !hasAnyPhysSkill
    ? aBackfired
      ? 100
      : 0
    : Math.round(aPhys.reflectFrac * 100);

  const hasDefPhysSkill = chosenDefenderSkills.some(
    (s) => s === 'fist' || s === 'bullet_punch' || s === 'energy_sphere'
  );
  const resolvedDefReflectPct = !hasDefPhysSkill ? 0 : Math.round(dPhys.reflectFrac * 100);

  return {
    winner,
    durationSec: finishTimeSec,
    chosenAttackerSkill,
    chosenDefenderSkill,
    chosenAttackerSkills,
    chosenDefenderSkills,
    attackerMaxHp,
    defenderMaxHp,
    attackerDamageDealt: aDamageDealt,
    defenderDamageDealt: dDamageDealt,
    attackerHits: aHits,
    defenderHits: dHits,
    attackerReflectHits: aDiedFromReflect ? aReflectDeathHits : 0,
    defenderReflectHits: 0,
    attackerReflectPercent: resolvedReflectPct,
    defenderReflectPercent: resolvedDefReflectPct,
    attackerReflectDmgSum: aReflectDmgSum,
    attackerDiedFromReflect: aDiedFromReflect,
    attackerReflectDeathSeconds: aReflectDeathSeconds,
    attackerReflectDeathHits: aReflectDeathHits,
    attackerReflectDeathPercent: aReflectDeathPct,
    defenderDiedFromReflect: dDiedFromReflect,
    attackerBackfired: aBackfired,
    attackerDiedFromBackfire: aDiedFromBackfire,
    attackerInstantKill: aInstantKill,
    invisEvadedOnAttacker,
    killingIntentStunnedDefender,
    soulReapExecuted,
    hellfireBurned,
    log
  };
}

function solveMinFsByTickSim(
  attacker: PvpFighter,
  defender: PvpFighter,
  mode: PvpAttackMode,
  attackerSkills?: PvpActiveSkill[],
  defenderSkills?: PvpActiveSkill[]
): number | null {
  const maxBound = Math.max(attacker.fs * 100, defender.bt * 100, 1e6);
  const candidates = new Set<number>([attacker.fs]);

  // Grid across all critical breakpoints (0.1x BT reflect boundary, 1x BT zero-reflect boundary, 10x BT instakill)
  if (defender.bt > 0) {
    for (let i = 1; i <= 10; i++) {
      candidates.add((defender.bt * i) / 10);
    }
    candidates.add(defender.bt * 1.0001);
    candidates.add(defender.bt * 10);
  }
  let v = Math.max(1, attacker.fs);
  while (v <= maxBound) {
    candidates.add(v);
    v *= 2;
  }
  candidates.add(maxBound);

  const sorted = Array.from(candidates)
    .filter((x) => x >= attacker.fs && Number.isFinite(x))
    .sort((a, b) => a - b);

  let prevLoss = attacker.fs;
  for (const val of sorted) {
    const res = runPvpTickSimulation({ ...attacker, fs: val }, defender, mode, {
      collectLog: false,
      attackerSkills,
      defenderSkills
    });
    if (res.winner === 'attacker') {
      let lo = prevLoss;
      let hi = val;
      for (let i = 0; i < 34; i++) {
        const mid = (lo + hi) * 0.5;
        const probe = runPvpTickSimulation({ ...attacker, fs: mid }, defender, mode, {
          collectLog: false,
          attackerSkills,
          defenderSkills
        });
        if (probe.winner === 'attacker') hi = mid;
        else lo = mid;
      }
      return hi;
    }
    prevLoss = val;
  }

  return null;
}

function solveMinPpByTickSim(
  attacker: PvpFighter,
  defender: PvpFighter,
  mode: PvpAttackMode,
  attackerSkills?: PvpActiveSkill[],
  defenderSkills?: PvpActiveSkill[]
): number | null {
  const minPp = Math.max(100_000, attacker.pp);
  const maxBound = Math.max(minPp * 100, defender.pp * 2000, 1e12);
  const candidates = new Set<number>([minPp]);

  if (defender.pp > 0) {
    for (const mult of [1.01, 10.001, 12, 15, 20, 30, 50, 75, 100, 250, 1000, 1001]) {
      candidates.add(defender.pp * mult);
    }
  }
  let v = minPp;
  while (v <= maxBound) {
    candidates.add(v);
    v *= 3;
  }
  candidates.add(maxBound);

  const sorted = Array.from(candidates)
    .filter((x) => x >= attacker.pp && Number.isFinite(x))
    .sort((a, b) => a - b);

  let prevLoss = attacker.pp;
  for (const val of sorted) {
    const res = runPvpTickSimulation({ ...attacker, pp: val }, defender, mode, {
      collectLog: false,
      attackerSkills,
      defenderSkills
    });
    if (res.winner === 'attacker') {
      let lo = prevLoss;
      let hi = val;
      for (let i = 0; i < 34; i++) {
        const mid = (lo + hi) * 0.5;
        const probe = runPvpTickSimulation({ ...attacker, pp: mid }, defender, mode, {
          collectLog: false,
          attackerSkills,
          defenderSkills
        });
        if (probe.winner === 'attacker') hi = mid;
        else lo = mid;
      }
      return hi;
    }
    prevLoss = val;
  }

  return null;
}

function solveMinBtByTickSim(
  attacker: PvpFighter,
  defender: PvpFighter,
  mode: PvpAttackMode,
  attackerSkills?: PvpActiveSkill[],
  defenderSkills?: PvpActiveSkill[]
): number | null {
  const startBt = Math.max(1, attacker.bt);
  const maxBound = Math.max(startBt * 100, defender.fs * 20, defender.bt * 20, 1e24);
  const candidates = new Set<number>([startBt]);

  if (defender.fs > 0) {
    for (const mult of [0.11, 0.5, 1, 1.01, 2, 5, 10, 10.01]) {
      candidates.add(defender.fs * mult);
    }
  }
  let v = startBt;
  while (v <= maxBound) {
    candidates.add(v);
    v *= 4;
  }
  candidates.add(maxBound);

  const sorted = Array.from(candidates)
    .filter((x) => x >= attacker.bt && Number.isFinite(x))
    .sort((a, b) => a - b);

  let prevLoss = attacker.bt;
  for (const val of sorted) {
    const res = runPvpTickSimulation({ ...attacker, bt: val }, defender, mode, {
      collectLog: false,
      attackerSkills,
      defenderSkills
    });
    if (res.winner === 'attacker') {
      let lo = prevLoss;
      let hi = val;
      for (let i = 0; i < 30; i++) {
        const mid = (lo + hi) * 0.5;
        const probe = runPvpTickSimulation({ ...attacker, bt: mid }, defender, mode, {
          collectLog: false,
          attackerSkills,
          defenderSkills
        });
        if (probe.winner === 'attacker') hi = mid;
        else lo = mid;
      }
      return hi;
    }
    prevLoss = val;
  }

  return null;
}

export function simulatePvp(
  attacker: PvpFighter,
  defender: PvpFighter,
  modeOrOptions: PvpAttackMode | PvpActiveSkill[] | PvpSimulateOptions = 'auto'
): PvpSimulationResult {
  const opts: PvpSimulateOptions =
    typeof modeOrOptions === 'string'
      ? { mode: modeOrOptions }
      : Array.isArray(modeOrOptions)
        ? { mode: 'auto', attackerSkills: modeOrOptions }
        : modeOrOptions;

  const mode: PvpAttackMode = opts.mode ?? 'auto';
  const customAttackerSkills = opts.attackerSkills;
  const customDefenderSkills = opts.defenderSkills;

  const duel = runPvpTickSimulation(attacker, defender, mode, {
    collectLog: true,
    attackerSkills: customAttackerSkills,
    defenderSkills: customDefenderSkills
  });
  const aPhys = analyzePhysicalMatchup(attacker, defender);
  const dPhys = analyzePhysicalMatchup(defender, attacker);
  const aPsy = analyzePsychicMatchup(attacker, defender);
  const dPsy = analyzePsychicMatchup(defender, attacker);

  // Measure solo TTK for whichever side didn't finish killing the other in the live duel
  let ttkAttackerWinsSeconds = duel.winner === 'attacker' ? duel.durationSec : Infinity;
  let attackerHitsNeeded = duel.winner === 'attacker' ? duel.attackerHits : Infinity;
  let attackerDps =
    duel.winner === 'attacker' && Number.isFinite(duel.durationSec)
      ? duel.attackerDamageDealt / Math.max(0.05, duel.durationSec)
      : duel.attackerDamageDealt / Math.max(0.05, Number.isFinite(duel.durationSec) ? duel.durationSec : SPTS_PVP_CONFIG.MAX_SIM_SECONDS);
  let attackerDamagePerHit =
    duel.attackerHits > 0 ? duel.attackerDamageDealt / duel.attackerHits : 0;

  if (duel.winner !== 'attacker' && !duel.attackerDiedFromReflect && !duel.attackerDiedFromBackfire) {
    const soloA = runPvpTickSimulation(attacker, defender, mode, {
      collectLog: false,
      soloAttackerOnly: true,
      attackerSkills: customAttackerSkills,
      defenderSkills: customDefenderSkills
    });
    if (soloA.winner === 'attacker' && !soloA.attackerDiedFromReflect) {
      ttkAttackerWinsSeconds = soloA.durationSec;
      attackerHitsNeeded = soloA.attackerHits;
      attackerDps =
        soloA.attackerDamageDealt /
        Math.max(0.05, Number.isFinite(soloA.durationSec) ? soloA.durationSec : 1);
      attackerDamagePerHit =
        soloA.attackerHits > 0 ? soloA.attackerDamageDealt / soloA.attackerHits : 0;
    }
  } else if (duel.winner === 'attacker') {
    attackerDps =
      duel.durationSec === 0
        ? duel.defenderMaxHp
        : duel.attackerDamageDealt / Math.max(0.05, duel.durationSec);
  }

  let ttkDefenderWinsSeconds = duel.winner === 'defender' ? duel.durationSec : Infinity;
  let defenderHitsNeeded = duel.winner === 'defender' ? duel.defenderHits : Infinity;
  let defenderDps =
    duel.defenderDamageDealt /
    Math.max(0.05, Number.isFinite(duel.durationSec) ? duel.durationSec : SPTS_PVP_CONFIG.MAX_SIM_SECONDS);
  let defenderDamagePerHit =
    duel.defenderHits > 0 ? duel.defenderDamageDealt / duel.defenderHits : 0;

  if (duel.winner === 'attacker' && !duel.defenderDiedFromReflect) {
    const soloD = runPvpTickSimulation(attacker, defender, mode, {
      collectLog: false,
      soloDefenderOnly: true,
      attackerSkills: customAttackerSkills,
      defenderSkills: customDefenderSkills
    });
    if (soloD.winner === 'defender' && !soloD.defenderDiedFromReflect) {
      ttkDefenderWinsSeconds = soloD.durationSec;
      defenderHitsNeeded = soloD.defenderHits;
      defenderDps =
        soloD.defenderDamageDealt /
        Math.max(0.05, Number.isFinite(soloD.durationSec) ? soloD.durationSec : 1);
      defenderDamagePerHit =
        soloD.defenderHits > 0 ? soloD.defenderDamageDealt / soloD.defenderHits : 0;
    }
  } else if (duel.winner === 'defender' && duel.attackerDiedFromReflect) {
    ttkDefenderWinsSeconds = duel.attackerReflectDeathSeconds;
    defenderHitsNeeded = 0;
  }

  // Explain why this outcome occurred
  const reasons: PvpReasonItem[] = [];
  if (duel.attackerDiedFromReflect) {
    reasons.push({
      code: 'attacker_died_from_reflect',
      params: {
        sec: duel.attackerReflectDeathSeconds.toFixed(2),
        hits: duel.attackerReflectDeathHits,
        pct: duel.attackerReflectDeathPercent
      }
    });
  }
  if (duel.defenderDiedFromReflect) {
    reasons.push({ code: 'defender_died_from_reflect' });
  }
  if (duel.attackerBackfired) reasons.push({ code: 'psychic_backfire' });
  if (duel.attackerInstantKill && !duel.soulReapExecuted && duel.chosenAttackerSkill === 'psychic') {
    reasons.push({ code: 'psychic_instakill' });
  }
  if (duel.soulReapExecuted) reasons.push({ code: 'soul_reap_exec' });
  if (duel.killingIntentStunnedDefender) reasons.push({ code: 'killing_intent_stun' });
  if (duel.hellfireBurned) reasons.push({ code: 'hellfire_burn' });
  if (duel.invisEvadedOnAttacker) reasons.push({ code: 'target_invis_evaded' });
  if (aPhys.reflectFrac >= 1) reasons.push({ code: 'target_reflects_100' });
  if (dPhys.reflectFrac >= 1) reasons.push({ code: 'self_reflects_100' });
  if (aPsy.exact10xBlocked) reasons.push({ code: 'psychic_exact_10x_blocked' });

  const hasCustomAttacker = Array.isArray(customAttackerSkills);
  const pickedPhys = duel.chosenAttackerSkills.some(
    (s) => s === 'fist' || s === 'bullet_punch' || s === 'energy_sphere'
  );
  const pickedPsy = duel.chosenAttackerSkills.includes('psychic');

  if (!hasCustomAttacker && mode === 'auto') {
    if (duel.chosenAttackerSkill === 'psychic') reasons.push({ code: 'auto_picked_psychic' });
    else if (duel.chosenAttackerSkill === 'combo') {
      reasons.push({ code: 'auto_picked_physical_combo' });
    }
  } else if (
    pickedPhys &&
    !pickedPsy &&
    aPhys.reflectFrac >= 1 &&
    aPsy.canSoulDamage &&
    !aPsy.soulBackfires
  ) {
    reasons.push({ code: 'switch_to_psychic_hint' });
  }

  if (aPsy.canSoulDamage) reasons.push({ code: 'attacker_has_psychic_advantage' });
  if (dPsy.canSoulDamage) reasons.push({ code: 'defender_has_psychic_advantage' });

  // Solve winning stat requirements using real tick simulation binary search
  let requiredStatType: 'FS' | 'PP' | 'BT' = 'FS';
  let requiredStatToWin = 0;
  let farmGap = 0;
  let cannotWinWithFsOnly = false;
  const winOptions: PvpWinOption[] = [];

  if (duel.winner !== 'attacker') {
    const usesPhys = hasCustomAttacker
      ? customAttackerSkills!.some((s) => s === 'fist' || s === 'bullet_punch' || s === 'energy_sphere')
      : mode === 'auto' || mode === 'fist' || mode === 'bullet_punch' || mode === 'energy_sphere';
    const usesPp = hasCustomAttacker
      ? customAttackerSkills!.some(
          (s) => s === 'psychic' || s === 'killing_intent' || s === 'hellfire' || s === 'soul_reap'
        )
      : mode === 'auto' ||
        mode === 'psychic' ||
        mode === 'killing_intent' ||
        mode === 'hellfire' ||
        mode === 'soul_reap';

    const fsSol = usesPhys
      ? solveMinFsByTickSim(attacker, defender, mode, customAttackerSkills, customDefenderSkills)
      : null;
    const ppSol = usesPp
      ? solveMinPpByTickSim(attacker, defender, mode, customAttackerSkills, customDefenderSkills)
      : null;

    if (usesPhys && fsSol === null) {
      cannotWinWithFsOnly = true;
    }

    if (fsSol !== null) {
      winOptions.push({
        statType: 'FS',
        targetValue: fsSol,
        farmGap: Math.max(0, fsSol - attacker.fs)
      });
    }
    if (ppSol !== null) {
      winOptions.push({
        statType: 'PP',
        targetValue: ppSol,
        farmGap: Math.max(0, ppSol - attacker.pp)
      });
    }

    // Fallback: if manual skill selection failed on PP or FS (or left winOptions empty), check Smart Auto skills
    if (ppSol === null) {
      const ppAutoSol = solveMinPpByTickSim(attacker, defender, 'auto', undefined, customDefenderSkills);
      if (ppAutoSol !== null && !winOptions.some((o) => o.statType === 'PP')) {
        winOptions.push({
          statType: 'PP',
          targetValue: ppAutoSol,
          farmGap: Math.max(0, ppAutoSol - attacker.pp)
        });
      }
    }
    if (winOptions.length === 0) {
      if (fsSol === null) {
        const fsAutoSol = solveMinFsByTickSim(attacker, defender, 'auto', undefined, customDefenderSkills);
        if (fsAutoSol !== null) {
          winOptions.push({
            statType: 'FS',
            targetValue: fsAutoSol,
            farmGap: Math.max(0, fsAutoSol - attacker.fs)
          });
        }
      }
      const btSol = solveMinBtByTickSim(
        attacker,
        defender,
        mode,
        customAttackerSkills,
        customDefenderSkills
      );
      if (btSol !== null) {
        winOptions.push({
          statType: 'BT',
          targetValue: btSol,
          farmGap: Math.max(0, btSol - attacker.bt)
        });
      }
    }

    if (cannotWinWithFsOnly && !hasCustomAttacker && mode !== 'psychic' && mode !== 'killing_intent' && mode !== 'hellfire' && mode !== 'soul_reap') {
      reasons.push({ code: 'cannot_win_fs_only' });
    } else if (usesPhys && !usesPp && cannotWinWithFsOnly) {
      reasons.push({ code: 'cannot_win_fs_only' });
    }

    // Sort win options by smallest relative growth ratio needed from current stat
    const getRelRatio = (opt: PvpWinOption) => {
      const base =
        opt.statType === 'FS'
          ? Math.max(1, attacker.fs)
          : opt.statType === 'PP'
            ? Math.max(1, attacker.pp)
            : Math.max(1, attacker.bt);
      return opt.targetValue / base;
    };

    winOptions.sort((a, b) => getRelRatio(a) - getRelRatio(b));

    if (winOptions.length > 0) {
      requiredStatType = winOptions[0].statType;
      requiredStatToWin = winOptions[0].targetValue;
      farmGap = winOptions[0].farmGap;
    }
  }

  if (duel.winner === 'draw' && duel.chosenAttackerSkill === 'none' && duel.chosenDefenderSkill === 'none') {
    reasons.push({ code: 'mutual_stalemate' });
  } else if (reasons.length === 0) {
    reasons.push({ code: 'higher_dps_wins' });
  }

  return {
    mode,
    chosenAttackerSkill: duel.chosenAttackerSkill,
    chosenDefenderSkill: duel.chosenDefenderSkill,
    chosenAttackerSkills: duel.chosenAttackerSkills,
    chosenDefenderSkills: duel.chosenDefenderSkills,
    attackerDps,
    defenderDps,
    attackerDamagePerHit,
    defenderDamagePerHit,
    attackerHitsNeeded,
    defenderHitsNeeded,
    defenderEffectiveHp: duel.defenderMaxHp,
    attackerEffectiveHp: duel.attackerMaxHp,
    reflectPercent: duel.attackerReflectPercent,
    defenderReflectPercent: duel.defenderReflectPercent,
    reflectDamagePerHit: duel.attackerHits > 0 ? duel.attackerReflectDmgSum / duel.attackerHits : 0,
    psychicBackfire: duel.attackerBackfired,
    psychicInstantKill: duel.attackerInstantKill,
    attackerDiedFromReflect: duel.attackerDiedFromReflect,
    attackerReflectDeathSeconds: duel.attackerReflectDeathSeconds,
    attackerReflectDeathHits: duel.attackerReflectDeathHits,
    attackerReflectDeathPercent: duel.attackerReflectDeathPercent,
    defenderDiedFromReflect: duel.defenderDiedFromReflect,
    cannotWinWithFsOnly,
    ttkAttackerWinsSeconds,
    ttkDefenderWinsSeconds,
    winner: duel.winner,
    requiredStatToWin,
    requiredStatType,
    farmGap,
    winOptions,
    reasons,
    combatLog: duel.log
  };
}

export function computeBackgroundGrindDelta(
  lastActiveAtMs: number,
  nowMs: number,
  gainPerSecond: number
): { awaySeconds: number; gainedAmount: number } {
  if (!Number.isFinite(lastActiveAtMs) || !Number.isFinite(nowMs) || gainPerSecond <= 0) {
    return { awaySeconds: 0, gainedAmount: 0 };
  }
  const awaySeconds = Math.max(0, (nowMs - lastActiveAtMs) / 1000);
  return {
    awaySeconds,
    gainedAmount: awaySeconds * gainPerSecond
  };
}

export type RobloxOgStatusKind =
  | 'confirmed_badge'
  | 'possible_account_age'
  | 'not_og_new_account'
  | 'unknown';

export interface RobloxOgEvaluationResult {
  status: RobloxOgStatusKind;
  suggestedIsOg: boolean;
  accountCreatedDate: string | null;
  accountCreatedYear: number | null;
  earliestBadgeDate: string | null;
  earliestBadgeYear: number | null;
  suggestedStartYear: number | null;
}

export function evaluateRobloxOgStatus({
  accountCreatedAt,
  badgeAwardedDates = [],
  launchDateIso = SPTS_NEW_LAUNCH_ISO
}: {
  accountCreatedAt?: string | null;
  badgeAwardedDates?: Array<string | null | undefined>;
  launchDateIso?: string;
}): RobloxOgEvaluationResult {
  const launchMs = Date.parse(launchDateIso);
  const effectiveLaunchMs = Number.isFinite(launchMs) ? launchMs : Date.parse(SPTS_NEW_LAUNCH_ISO);

  let accountCreatedDate: string | null = null;
  let accountCreatedMs: number | null = null;
  let accountCreatedYear: number | null = null;

  if (accountCreatedAt) {
    const parsed = Date.parse(accountCreatedAt);
    if (Number.isFinite(parsed)) {
      accountCreatedDate = new Date(parsed).toISOString();
      accountCreatedMs = parsed;
      accountCreatedYear = new Date(parsed).getUTCFullYear();
    }
  }

  let earliestBadgeDate: string | null = null;
  let earliestBadgeMs: number | null = null;
  let earliestBadgeYear: number | null = null;

  for (const raw of badgeAwardedDates) {
    if (!raw) continue;
    const parsed = Date.parse(raw);
    if (!Number.isFinite(parsed)) continue;
    if (earliestBadgeMs === null || parsed < earliestBadgeMs) {
      earliestBadgeMs = parsed;
      earliestBadgeDate = new Date(parsed).toISOString();
      earliestBadgeYear = new Date(parsed).getUTCFullYear();
    }
  }

  if (accountCreatedMs !== null && accountCreatedMs >= effectiveLaunchMs) {
    return {
      status: 'not_og_new_account',
      suggestedIsOg: false,
      accountCreatedDate,
      accountCreatedYear,
      earliestBadgeDate,
      earliestBadgeYear,
      suggestedStartYear: accountCreatedYear
    };
  }

  if (earliestBadgeMs !== null && earliestBadgeMs < effectiveLaunchMs) {
    return {
      status: 'confirmed_badge',
      suggestedIsOg: true,
      accountCreatedDate,
      accountCreatedYear,
      earliestBadgeDate,
      earliestBadgeYear,
      suggestedStartYear: earliestBadgeYear
    };
  }

  if (accountCreatedMs !== null && accountCreatedMs < effectiveLaunchMs) {
    return {
      status: 'possible_account_age',
      suggestedIsOg: false,
      accountCreatedDate,
      accountCreatedYear,
      earliestBadgeDate,
      earliestBadgeYear,
      suggestedStartYear: earliestBadgeYear ?? accountCreatedYear
    };
  }

  return {
    status: 'unknown',
    suggestedIsOg: false,
    accountCreatedDate,
    accountCreatedYear,
    earliestBadgeDate,
    earliestBadgeYear,
    suggestedStartYear: null
  };
}

export function computeTotalMultiTokensSpent(
  multis: Partial<Record<SptsStatType, string>> = {}
): { totalSpent: number; perStat: Record<SptsStatType, number> } {
  const stats: SptsStatType[] = ['FS', 'BT', 'MS', 'JF', 'PP'];
  const perStat: Record<SptsStatType, number> = { FS: 0, BT: 0, MS: 0, JF: 0, PP: 0 };
  let totalSpent = 0;
  for (const stat of stats) {
    const key = multis[stat] ?? 'x1';
    const numeric = key.startsWith('x') ? Number(key.slice(1)) : Number(key);
    const val = Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
    const cost = cumulativeCostToReach(val);
    perStat[stat] = cost;
    totalSpent += cost;
  }
  return { totalSpent, perStat };
}

export interface TrophyStatUpgradeSummary {
  stat: SptsStatType;
  fromMultiKey: string;
  toMultiKey: string;
  upgradesCount: number;
  tokensCost: number;
}

export function suggestCheapestTrophyUpgrades(
  multis: Partial<Record<SptsStatType, string>> = {},
  targetTokensSpent: number
): {
  neededGap: number;
  actualAddedCost: number;
  resultingTotalSpent: number;
  upgrades: TrophyStatUpgradeSummary[];
} {
  const { totalSpent } = computeTotalMultiTokensSpent(multis);
  const neededGap = Math.max(0, targetTokensSpent - totalSpent);
  if (neededGap <= 0) {
    return {
      neededGap: 0,
      actualAddedCost: 0,
      resultingTotalSpent: totalSpent,
      upgrades: []
    };
  }

  const orderedTiers = Object.keys(SPTS_PRICES)
    .map(Number)
    .filter((v) => Number.isFinite(v) && v >= 1)
    .sort((a, b) => a - b);

  const stats: SptsStatType[] = ['FS', 'BT', 'MS', 'JF', 'PP'];
  const state = stats.map((stat) => {
    const raw = multis[stat] ?? 'x1';
    const num = raw.startsWith('x') ? Number(raw.slice(1)) : Number(raw);
    const currentVal = Number.isFinite(num) && num >= 1 ? num : 1;
    let idx = orderedTiers.findIndex((t) => t >= currentVal);
    if (idx < 0) idx = orderedTiers.length - 1;
    return {
      stat,
      startIdx: idx,
      idx,
      upgradesCount: 0,
      tokensCost: 0
    };
  });

  let addedCost = 0;
  while (addedCost < neededGap) {
    let bestIdx = -1;
    let bestPrice = Infinity;
    for (let i = 0; i < state.length; i++) {
      const s = state[i];
      if (s.idx + 1 >= orderedTiers.length) continue;
      const nextVal = orderedTiers[s.idx + 1];
      const nextPrice = SPTS_PRICES[nextVal] ?? Infinity;
      if (nextPrice < bestPrice) {
        bestPrice = nextPrice;
        bestIdx = i;
      }
    }
    if (bestIdx < 0 || !Number.isFinite(bestPrice)) break;
    const chosen = state[bestIdx];
    chosen.idx += 1;
    chosen.upgradesCount += 1;
    chosen.tokensCost += bestPrice;
    addedCost += bestPrice;
  }

  const upgrades: TrophyStatUpgradeSummary[] = state
    .filter((s) => s.upgradesCount > 0)
    .map((s) => ({
      stat: s.stat,
      fromMultiKey: `x${orderedTiers[s.startIdx]}`,
      toMultiKey: `x${orderedTiers[s.idx]}`,
      upgradesCount: s.upgradesCount,
      tokensCost: s.tokensCost
    }));

  return {
    neededGap,
    actualAddedCost: addedCost,
    resultingTotalSpent: totalSpent + addedCost,
    upgrades
  };
}

export interface BloxyTrophyResult {
  totalSpentOnMultis: number;
  spentPerStat: Record<SptsStatType, number>;
  naturalRank: BloxyTrophyRankId;
  effectiveRank: BloxyTrophyRankId;
  isOg: boolean;
  tier: BloxyTrophyTier;
  nextTier: BloxyTrophyTier | null;
  tokensToNextTier: number;
  timeToNextTierSeconds: number | null;
  progressPercent: number;
  cheapestPathToNext: ReturnType<typeof suggestCheapestTrophyUpgrades>;
}

export function getBloxyTrophyTier(rankId: BloxyTrophyRankId): BloxyTrophyTier {
  return BLOXY_TROPHY_TIERS.find((t) => t.id === rankId) ?? BLOXY_TROPHY_TIERS[0];
}

export function calculateBloxyTrophy({
  currentMultis = {},
  isOg = false,
  tokenPerSecond = 0
}: {
  currentMultis?: Partial<Record<SptsStatType, string>>;
  isOg?: boolean;
  tokenPerSecond?: number;
} = {}): BloxyTrophyResult {
  const { totalSpent, perStat } = computeTotalMultiTokensSpent(currentMultis);

  let naturalTier = BLOXY_TROPHY_TIERS[0];
  for (const tier of BLOXY_TROPHY_TIERS) {
    if (totalSpent >= tier.minTokensSpent) {
      naturalTier = tier;
    }
  }

  const effectiveTier =
    isOg && naturalTier.tierOrder === 0 ? getBloxyTrophyTier('veteran') : naturalTier;

  const currentIdx = BLOXY_TROPHY_TIERS.findIndex((t) => t.id === effectiveTier.id);
  const nextTier =
    currentIdx >= 0 && currentIdx + 1 < BLOXY_TROPHY_TIERS.length
      ? BLOXY_TROPHY_TIERS[currentIdx + 1]
      : null;

  const tokensToNextTier = nextTier ? Math.max(0, nextTier.minTokensSpent - totalSpent) : 0;
  const timeToNextTierSeconds =
    nextTier && tokensToNextTier > 0 && tokenPerSecond > 0
      ? tokensToNextTier / tokenPerSecond
      : null;

  let progressPercent = 100;
  if (nextTier) {
    const floor = effectiveTier.id === 'veteran' && isOg && totalSpent < effectiveTier.minTokensSpent
      ? 0
      : effectiveTier.minTokensSpent;
    const span = Math.max(1, nextTier.minTokensSpent - floor);
    progressPercent = Math.max(0, Math.min(100, ((totalSpent - floor) / span) * 100));
  }

  const cheapestPathToNext = nextTier
    ? suggestCheapestTrophyUpgrades(currentMultis, nextTier.minTokensSpent)
    : { neededGap: 0, actualAddedCost: 0, resultingTotalSpent: totalSpent, upgrades: [] };

  return {
    totalSpentOnMultis: totalSpent,
    spentPerStat: perStat,
    naturalRank: naturalTier.id,
    effectiveRank: effectiveTier.id,
    isOg,
    tier: effectiveTier,
    nextTier,
    tokensToNextTier,
    timeToNextTierSeconds,
    progressPercent,
    cheapestPathToNext
  };
}

export type BloxyTrophyInteractionOutcome =
  | 'no_trophy'
  | 'blocked_in_combat'
  | 'bounced_back'
  | 'failed_power_gap'
  | 'blocked_rank'
  | 'no_reaction_veteran'
  | 'reacts';

export interface BloxyTrophyInteractionResult {
  outcome: BloxyTrophyInteractionOutcome;
  studs: number;
  cooldownSec: number;
  powerRatio: number;
}

export function evaluateBloxyTrophyInteraction({
  selfRank,
  selfTotalPower,
  targetRank,
  targetTotalPower,
  targetInCombat = false
}: {
  selfRank: BloxyTrophyRankId;
  selfTotalPower: number;
  targetRank: BloxyTrophyRankId;
  targetTotalPower: number;
  targetInCombat?: boolean;
}): BloxyTrophyInteractionResult {
  const selfTier = getBloxyTrophyTier(selfRank);
  const targetTier = getBloxyTrophyTier(targetRank);
  const safeSelfPower = Math.max(0, Number(selfTotalPower) || 0);
  const safeTargetPower = Math.max(0, Number(targetTotalPower) || 0);
  const powerRatio = safeSelfPower > 0 ? safeTargetPower / safeSelfPower : safeTargetPower > 0 ? Infinity : 1;

  if (selfTier.tierOrder === 0) {
    return { outcome: 'no_trophy', studs: 0, cooldownSec: 8, powerRatio };
  }
  if (targetInCombat) {
    return { outcome: 'blocked_in_combat', studs: selfTier.studs, cooldownSec: 8, powerRatio };
  }
  if (safeSelfPower > 0 && safeTargetPower > safeSelfPower * 1000) {
    if (targetTier.tierOrder > selfTier.tierOrder) {
      return { outcome: 'bounced_back', studs: selfTier.studs, cooldownSec: 8, powerRatio };
    }
    return { outcome: 'failed_power_gap', studs: selfTier.studs, cooldownSec: 8, powerRatio };
  }
  if (targetTier.tierOrder >= selfTier.tierOrder) {
    return { outcome: 'blocked_rank', studs: selfTier.studs, cooldownSec: 8, powerRatio };
  }
  if (selfTier.id === 'veteran') {
    return { outcome: 'no_reaction_veteran', studs: 0, cooldownSec: 8, powerRatio };
  }
  return { outcome: 'reacts', studs: selfTier.studs, cooldownSec: 8, powerRatio };
}
