import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NumberNotation } from '../core/numbers';
import {
  NEW_SPTS_DAILY_QUESTS,
  NEW_SPTS_PASSIVE_TOKENS_PER_MIN,
  NEW_SPTS_WEEKLY_QUESTS
} from '../core/newSptsData';
import type { CustomQuestEntry, SptsGainCalcMode } from '../core/newSptsTypes';
import type { PvpActiveSkill, PvpAttackMode, QuestMode } from '../core/spts';
import { SPTS_DAILY_QUESTS, SPTS_WEEKLY_QUESTS, type SptsStatType } from '../core/sptsData';
import type { SptlBoostMode, SptlStatType } from '../core/sptl';
import type { TimeDisplayStyle } from '../core/time';
import { detectBrowserLocale, type LocaleCode } from '../i18n/locales';
import {
  DEFAULT_PAGE_THEMES,
  type CalculatorPageKey,
  type ThemePreset,
  type ThemePresetId
} from '../styles/themes';

export type SptsTab = 'stats' | 'tokens' | 'playtime' | 'trophy' | 'pvp' | 'wiki';
export type NewSptsTab = 'stats' | 'tokens' | 'playtime' | 'inventory' | 'wiki';
export type GoalMode = 'amountToTime' | 'timeToAmount';
export type WikiSection = 'skills' | 'quests' | 'reputation';
export type WikiCat = 'All' | 'Skill' | 'Passive' | 'Mechanic';

export const DEFAULT_DAILY_QUEST_IDS = SPTS_DAILY_QUESTS.map((q) => q.id);
export const DEFAULT_WEEKLY_QUEST_IDS = SPTS_WEEKLY_QUESTS.map((q) => q.id);
export const DEFAULT_NEW_DAILY_QUEST_IDS = NEW_SPTS_DAILY_QUESTS.map((q) => q.id);
export const DEFAULT_NEW_WEEKLY_QUEST_IDS = NEW_SPTS_WEEKLY_QUESTS.map((q) => q.id);

export interface GrindSessionState {
  running: boolean;
  statType: SptsStatType;
  startedAtMs: number;
  lastCheckpointAtMs: number;
  accumulatedSeconds: number;
  // Base stat snapshot before live accumulation so high precision is never lost on 10T+ values
  sessionAddedAmount: number;
  // Last away delta added automatically when user returned from background
  pendingAwayBanner: {
    awaySeconds: number;
    addedAmount: number;
    statType: SptsStatType;
  } | null;
}

export interface RobloxClassicBadgeInfo {
  badgeId: number;
  key: 'hellfire' | 'soulReap' | 'allSath';
  awardedDate: string | null;
}

export interface PlayerProfile {
  id: string;
  name: string;
  robloxUsername?: string;
  robloxUserId?: number;
  avatarUrl?: string | null;
  robloxCreatedAt?: string | null;
  robloxClassicEarliestBadgeAt?: string | null;
  robloxClassicBadges?: RobloxClassicBadgeInfo[];
  spts: {
    stats: Record<SptsStatType, string>;
    multis: Record<SptsStatType, string>;
    // 'auto' picks optimal zone/weight automatically from player stats
    locations: {
      FS: string;
      BT: string;
      PP: string;
    };
    weights: {
      MS: string;
      JF: string;
    };
    customTickSeconds: Record<SptsStatType, string>;
    customPerTick: string;
    gainCalcMode: SptsGainCalcMode;
    equipmentBonusPercent: number;
    safeAfkOnly: boolean;
    tokens: string;
    reputation: number;
    vip: boolean;
    vipDuration: string; // e.g. '7d', '1mo', '3mo', '' = unlimited
    halfCooldownPass: boolean;
    dailyQuests: boolean;
    weeklyQuests: boolean;
    selectedDailyQuests: string[];
    selectedWeeklyQuests: string[];
    passiveTokensPerMin: number;
    dailyQuestValue: number;
    weeklyQuestValue: number;
    questMode: QuestMode;
    autoGateQuestsByStats: boolean;
    dailyQuestDuration: string;
    weeklyQuestDuration: string;
    btDeathReturnDuration: string;
    customQuests: CustomQuestEntry[];
    isOgPlayer: boolean;
    classicStartYear: string;
  };
  sptsUi: {
    tab: SptsTab;
    statType: SptsStatType;
    goalMode: GoalMode;
    goalValueRaw: string;
    statGoals: Record<SptsStatType, string>;
    statGoalModes: Record<SptsStatType, GoalMode>;
    simulateUpgrades: boolean;
    tokenGoalMode: GoalMode;
    tokenGoalRaw: string;
    robuxTargetTokens: string;
    packGroup: 'classic' | 'high';
    firstPurchaseX2: boolean;
    pvpMode: PvpAttackMode;
    pvpUseAutoSkills: boolean;
    pvpSelectedSkills: PvpActiveSkill[];
    pvpOpponentUseAutoSkills: boolean;
    pvpOpponentSelectedSkills: PvpActiveSkill[];
    opponentSourceId: string;
    manualOpponent: {
      name: string;
      fs: string;
      bt: string;
      pp: string;
      halfCooldown: boolean;
    };
    pvpConditions: {
      leftInvis: boolean;
      rightInvis: boolean;
      leftDodge: number;
      rightDodge: number;
      leftHellfire: boolean;
      rightHellfire: boolean;
    };
    wikiSection: WikiSection;
    wikiSearch: string;
    wikiCat: WikiCat;
  };
  grindSession: GrindSessionState;
  newSpts: {
    stats: Record<SptsStatType, string>;
    multis: Record<SptsStatType, string>;
    locations: {
      FS: string;
      BT: string;
      PP: string;
    };
    weights: {
      MS: string;
      JF: string;
    };
    gainCalcMode: SptsGainCalcMode;
    customTickSeconds: Record<SptsStatType, string>;
    customPerTick: string;
    equipmentBonusPercent: number;
    safeAfkOnly: boolean;
    tokens: string;
    vip: boolean;
    vipDuration: string;
    dailyQuests: boolean;
    weeklyQuests: boolean;
    selectedDailyQuests: string[];
    selectedWeeklyQuests: string[];
    passiveTokensPerMin: number;
    questMode: QuestMode;
    autoGateQuestsByStats: boolean;
    dailyQuestDuration: string;
    weeklyQuestDuration: string;
    btDeathReturnDuration: string;
    customQuests: CustomQuestEntry[];
    equippedIds: string[];
    multiTrainStats: SptsStatType[];
  };
  newSptsUi: {
    tab: NewSptsTab;
    statType: SptsStatType;
    goalMode: GoalMode;
    goalValueRaw: string;
    statGoals: Record<SptsStatType, string>;
    statGoalModes: Record<SptsStatType, GoalMode>;
    simulateUpgrades: boolean;
    tokenGoalMode: GoalMode;
    tokenGoalRaw: string;
    wikiSearch: string;
  };
  newSptsGrindSession: GrindSessionState;
  sptl: {
    statType: SptlStatType;
    fasterTrain: boolean;
    boostMode: SptlBoostMode;
    boostValue: number;
    perTick: string;
    currentStat: string;
    tokenInterval: number;
    tokensPerTick: string;
    currentTokens: string;
    tab: 'stats' | 'tokens' | 'formulas';
    statGoalMode: GoalMode;
    statGoalRaw: string;
    tokenGoalMode: GoalMode;
    tokenGoalRaw: string;
    liveRunning: boolean;
    liveStartedAtMs: number;
    liveAccumulatedSec: number;
  };
  calcUi: {
    mode: 'arithmetic' | 'time';
    exprInput: string;
    xValue: string;
    timeInput: string;
    targetUnit: string;
  };
}

export interface AppSettings {
  language: LocaleCode;
  languageAuto: boolean;
  themeMode: 'per-page' | 'global';
  themePreset: ThemePresetId;
  pageThemes: Record<CalculatorPageKey, ThemePresetId>;
  customThemes: ThemePreset[];
  customAccent: string | null;
  bgMode: 'preset' | 'solid' | 'gradient' | 'image';
  customBgColor: string;
  customBgGradient: string;
  customBgImageUrl: string;
  bgBlur: number;
  bgOpacity: number;
  radiusScale: 'sharp' | 'balanced' | 'soft';
  density: 'compact' | 'comfortable';
  numberNotation: NumberNotation;
  numberDecimals: number;
  showYearsAndMonths: boolean;
  timeStyle: TimeDisplayStyle;
  showEtaDate: boolean;
  allowCookies: boolean | null;
  adPreviewMode: boolean;
}

export function createDefaultProfile(id: string, name: string): PlayerProfile {
  return {
    id,
    name,
    spts: {
      stats: { FS: '', BT: '', PP: '', MS: '', JF: '' },
      multis: { FS: 'x1', BT: 'x1', MS: 'x1', JF: 'x1', PP: 'x1' },
      locations: { FS: 'auto', BT: 'auto', PP: 'auto' },
      weights: { MS: 'auto', JF: 'auto' },
      customTickSeconds: { FS: '', BT: '', PP: '', MS: '', JF: '' },
      customPerTick: '',
      gainCalcMode: 'auto',
      equipmentBonusPercent: 0,
      safeAfkOnly: true,
      tokens: '',
      reputation: 0,
      vip: false,
      vipDuration: '',
      halfCooldownPass: false,
      dailyQuests: true,
      weeklyQuests: true,
      selectedDailyQuests: [...DEFAULT_DAILY_QUEST_IDS],
      selectedWeeklyQuests: [...DEFAULT_WEEKLY_QUEST_IDS],
      passiveTokensPerMin: 5,
      dailyQuestValue: 100,
      weeklyQuestValue: 9300,
      questMode: 'discrete',
      autoGateQuestsByStats: false,
      dailyQuestDuration: '',
      weeklyQuestDuration: '',
      btDeathReturnDuration: '',
      customQuests: [],
      isOgPlayer: false,
      classicStartYear: ''
    },
    sptsUi: {
      tab: 'stats',
      statType: 'FS',
      goalMode: 'amountToTime',
      goalValueRaw: '',
      statGoals: { FS: '', BT: '', PP: '', MS: '', JF: '' },
      statGoalModes: {
        FS: 'amountToTime',
        BT: 'amountToTime',
        PP: 'amountToTime',
        MS: 'amountToTime',
        JF: 'amountToTime'
      },
      simulateUpgrades: true,
      tokenGoalMode: 'amountToTime',
      tokenGoalRaw: '',
      robuxTargetTokens: '',
      packGroup: 'classic',
      firstPurchaseX2: false,
      pvpMode: 'auto',
      pvpUseAutoSkills: true,
      pvpSelectedSkills: ['fist', 'energy_sphere', 'bullet_punch', 'psychic'],
      pvpOpponentUseAutoSkills: true,
      pvpOpponentSelectedSkills: ['fist', 'energy_sphere', 'bullet_punch', 'psychic'],
      opponentSourceId: 'manual',
      manualOpponent: { name: '', fs: '', bt: '', pp: '', halfCooldown: false },
      pvpConditions: {
        leftInvis: false,
        rightInvis: false,
        leftDodge: 0,
        rightDodge: 0,
        leftHellfire: false,
        rightHellfire: false
      },
      wikiSection: 'skills',
      wikiSearch: '',
      wikiCat: 'All'
    },
    grindSession: {
      running: false,
      statType: 'FS',
      startedAtMs: 0,
      lastCheckpointAtMs: 0,
      accumulatedSeconds: 0,
      sessionAddedAmount: 0,
      pendingAwayBanner: null
    },
    newSpts: {
      stats: { FS: '', BT: '', PP: '', MS: '', JF: '' },
      multis: { FS: 'x1', BT: 'x1', MS: 'x1', JF: 'x1', PP: 'x1' },
      locations: { FS: 'auto', BT: 'auto', PP: 'auto' },
      weights: { MS: 'auto', JF: 'auto' },
      gainCalcMode: 'auto',
      customTickSeconds: { FS: '', BT: '', PP: '', MS: '', JF: '' },
      customPerTick: '',
      equipmentBonusPercent: 0,
      safeAfkOnly: true,
      tokens: '',
      vip: false,
      vipDuration: '',
      dailyQuests: true,
      weeklyQuests: true,
      selectedDailyQuests: [...DEFAULT_NEW_DAILY_QUEST_IDS],
      selectedWeeklyQuests: [...DEFAULT_NEW_WEEKLY_QUEST_IDS],
      passiveTokensPerMin: NEW_SPTS_PASSIVE_TOKENS_PER_MIN,
      questMode: 'discrete',
      autoGateQuestsByStats: false,
      dailyQuestDuration: '',
      weeklyQuestDuration: '',
      btDeathReturnDuration: '',
      customQuests: [],
      equippedIds: [],
      multiTrainStats: ['FS']
    },
    newSptsUi: {
      tab: 'stats',
      statType: 'FS',
      goalMode: 'amountToTime',
      goalValueRaw: '',
      statGoals: { FS: '', BT: '', PP: '', MS: '', JF: '' },
      statGoalModes: {
        FS: 'amountToTime',
        BT: 'amountToTime',
        PP: 'amountToTime',
        MS: 'amountToTime',
        JF: 'amountToTime'
      },
      simulateUpgrades: true,
      tokenGoalMode: 'amountToTime',
      tokenGoalRaw: '',
      wikiSearch: ''
    },
    newSptsGrindSession: {
      running: false,
      statType: 'FS',
      startedAtMs: 0,
      lastCheckpointAtMs: 0,
      accumulatedSeconds: 0,
      sessionAddedAmount: 0,
      pendingAwayBanner: null
    },
    sptl: {
      statType: 'Power',
      fasterTrain: false,
      boostMode: 'levels',
      boostValue: 0,
      perTick: '',
      currentStat: '',
      tokenInterval: 45,
      tokensPerTick: '',
      currentTokens: '',
      tab: 'stats',
      statGoalMode: 'amountToTime',
      statGoalRaw: '',
      tokenGoalMode: 'amountToTime',
      tokenGoalRaw: '',
      liveRunning: false,
      liveStartedAtMs: 0,
      liveAccumulatedSec: 0
    },
    calcUi: {
      mode: 'arithmetic',
      exprInput: '',
      xValue: '',
      timeInput: '',
      targetUnit: 'h'
    }
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: detectBrowserLocale(),
  languageAuto: true,
  themeMode: 'per-page',
  themePreset: 'rbxc-crimson',
  pageThemes: { ...DEFAULT_PAGE_THEMES },
  customThemes: [],
  customAccent: null,
  bgMode: 'preset',
  customBgColor: '#0b090a',
  customBgGradient: 'linear-gradient(145deg, #0b090a 0%, #1c1026 50%, #0b090a 100%)',
  customBgImageUrl: '',
  bgBlur: 8,
  bgOpacity: 0.35,
  radiusScale: 'balanced',
  density: 'comfortable',
  numberNotation: 'standard',
  numberDecimals: 2,
  showYearsAndMonths: true,
  timeStyle: 'units',
  showEtaDate: true,
  allowCookies: null,
  adPreviewMode: false
};

interface AppState {
  profiles: PlayerProfile[];
  activeProfileId: string;
  isIncognito: boolean;
  incognitoProfile: PlayerProfile;
  settings: AppSettings;

  getActiveProfile: () => PlayerProfile;
  switchProfile: (id: string) => void;
  addProfile: (profile: Omit<PlayerProfile, 'id'> & { id?: string }) => string;
  deleteProfile: (id: string) => void;
  updateActiveProfile: (updater: (profile: PlayerProfile) => PlayerProfile) => void;
  toggleIncognito: () => void;
  resetIncognitoToZero: () => void;
  saveIncognitoAsProfile: (name: string) => string;
  importProfileData: (raw: string) => { ok: boolean; error?: string; profileId?: string };
  exportActiveProfileJson: () => string;
  exportActiveProfileShareCode: () => string;
  updateSettings: (partial: Partial<AppSettings>) => void;
  saveCustomTheme: (theme: ThemePreset) => void;
  deleteCustomTheme: (id: string) => void;
  resetThemeSettings: () => void;
}

export function normalizeProfile(
  raw: Partial<PlayerProfile> | undefined,
  fallbackId: string,
  fallbackName: string
): PlayerProfile {
  const base = createDefaultProfile(fallbackId, fallbackName);
  if (!raw || typeof raw !== 'object') return base;

  const rawStatType = raw.sptsUi?.statType ?? base.sptsUi.statType;
  const statGoals = {
    ...base.sptsUi.statGoals,
    ...(raw.sptsUi?.statGoals ?? {})
  };
  if (raw.sptsUi?.goalValueRaw && !statGoals[rawStatType]) {
    statGoals[rawStatType] = raw.sptsUi.goalValueRaw;
  }

  const statGoalModes = {
    ...base.sptsUi.statGoalModes,
    ...(raw.sptsUi?.statGoalModes ?? {})
  };
  if (raw.sptsUi?.goalMode && !raw.sptsUi?.statGoalModes?.[rawStatType]) {
    statGoalModes[rawStatType] = raw.sptsUi.goalMode;
  }

  const rawWikiCat = (raw.sptsUi?.wikiCat as string | undefined) ?? base.sptsUi.wikiCat;
  const safeWikiCat: WikiCat =
    rawWikiCat === 'Aura'
      ? 'Passive'
      : rawWikiCat === 'All' || rawWikiCat === 'Skill' || rawWikiCat === 'Passive' || rawWikiCat === 'Mechanic'
        ? rawWikiCat
        : 'All';

  const selectedDailyQuests = Array.isArray(raw.spts?.selectedDailyQuests)
    ? raw.spts.selectedDailyQuests
    : raw.spts?.dailyQuests === false
      ? []
      : [...DEFAULT_DAILY_QUEST_IDS];

  const selectedWeeklyQuests = Array.isArray(raw.spts?.selectedWeeklyQuests)
    ? raw.spts.selectedWeeklyQuests
    : raw.spts?.weeklyQuests === false
      ? []
      : [...DEFAULT_WEEKLY_QUEST_IDS];

  const hasExplicitAuto = typeof raw.sptsUi?.pvpUseAutoSkills === 'boolean';
  const rawPvpMode = raw.sptsUi?.pvpMode;
  const pvpUseAutoSkills = hasExplicitAuto
    ? raw.sptsUi!.pvpUseAutoSkills!
    : rawPvpMode && rawPvpMode !== 'auto'
      ? false
      : base.sptsUi.pvpUseAutoSkills;

  const pvpSelectedSkills: PvpActiveSkill[] = Array.isArray(raw.sptsUi?.pvpSelectedSkills)
    ? raw.sptsUi!.pvpSelectedSkills!
    : !pvpUseAutoSkills && rawPvpMode && rawPvpMode !== 'auto'
      ? [rawPvpMode]
      : [...base.sptsUi.pvpSelectedSkills];

  const pvpOpponentUseAutoSkills =
    typeof raw.sptsUi?.pvpOpponentUseAutoSkills === 'boolean'
      ? raw.sptsUi.pvpOpponentUseAutoSkills
      : base.sptsUi.pvpOpponentUseAutoSkills;

  const pvpOpponentSelectedSkills: PvpActiveSkill[] = Array.isArray(
    raw.sptsUi?.pvpOpponentSelectedSkills
  )
    ? raw.sptsUi!.pvpOpponentSelectedSkills!
    : [...base.sptsUi.pvpOpponentSelectedSkills];

  const sanitizeCustomQuests = (list: unknown): CustomQuestEntry[] => {
    if (!Array.isArray(list)) return [];
    const out: CustomQuestEntry[] = [];
    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const obj = item as Partial<CustomQuestEntry>;
      const repeatType =
        obj.repeatType === 'once' ||
        obj.repeatType === 'daily' ||
        obj.repeatType === 'weekly' ||
        obj.repeatType === 'custom_hours'
          ? obj.repeatType
          : 'daily';
      const stat: SptsStatType =
        obj.stat === 'FS' || obj.stat === 'BT' || obj.stat === 'PP' || obj.stat === 'MS' || obj.stat === 'JF'
          ? obj.stat
          : 'FS';
      out.push({
        id: typeof obj.id === 'string' && obj.id ? obj.id : `cq-${out.length + 1}`,
        title: typeof obj.title === 'string' ? obj.title : 'Custom Quest',
        repeatType,
        resetHours:
          repeatType === 'custom_hours' && Number.isFinite(Number(obj.resetHours))
            ? Math.max(0.1, Number(obj.resetHours))
            : undefined,
        stat,
        targetStat: Math.max(0, Number(obj.targetStat) || 0),
        tokensReward: Math.max(0, Number(obj.tokensReward) || 0),
        enabled: typeof obj.enabled === 'boolean' ? obj.enabled : true,
        completed: typeof obj.completed === 'boolean' ? obj.completed : false
      });
    }
    return out;
  };

  const classicGainCalcMode: SptsGainCalcMode =
    raw.spts?.gainCalcMode === 'manual' || raw.spts?.gainCalcMode === 'auto'
      ? raw.spts.gainCalcMode
      : raw.spts?.customPerTick?.trim()
        ? 'manual'
        : 'auto';

  const newDailySelected = Array.isArray(raw.newSpts?.selectedDailyQuests)
    ? raw.newSpts.selectedDailyQuests
    : raw.newSpts?.dailyQuests === false
      ? []
      : [...DEFAULT_NEW_DAILY_QUEST_IDS];

  const newWeeklySelected = Array.isArray(raw.newSpts?.selectedWeeklyQuests)
    ? raw.newSpts.selectedWeeklyQuests
    : raw.newSpts?.weeklyQuests === false
      ? []
      : [...DEFAULT_NEW_WEEKLY_QUEST_IDS];

  const rawNewStatType = raw.newSptsUi?.statType ?? base.newSptsUi.statType;
  const newStatGoals = {
    ...base.newSptsUi.statGoals,
    ...(raw.newSptsUi?.statGoals ?? {})
  };
  if (raw.newSptsUi?.goalValueRaw && !newStatGoals[rawNewStatType]) {
    newStatGoals[rawNewStatType] = raw.newSptsUi.goalValueRaw;
  }

  const newStatGoalModes = {
    ...base.newSptsUi.statGoalModes,
    ...(raw.newSptsUi?.statGoalModes ?? {})
  };
  if (raw.newSptsUi?.goalMode && !raw.newSptsUi?.statGoalModes?.[rawNewStatType]) {
    newStatGoalModes[rawNewStatType] = raw.newSptsUi.goalMode;
  }

  return {
    ...base,
    ...raw,
    id: fallbackId,
    name: raw.name ? String(raw.name) : base.name,
    spts: {
      ...base.spts,
      ...(raw.spts ?? {}),
      stats: { ...base.spts.stats, ...(raw.spts?.stats ?? {}) },
      multis: { ...base.spts.multis, ...(raw.spts?.multis ?? {}) },
      locations: { ...base.spts.locations, ...(raw.spts?.locations ?? {}) },
      weights: { ...base.spts.weights, ...(raw.spts?.weights ?? {}) },
      customTickSeconds: { ...base.spts.customTickSeconds, ...(raw.spts?.customTickSeconds ?? {}) },
      gainCalcMode: classicGainCalcMode,
      equipmentBonusPercent: Math.max(0, Number(raw.spts?.equipmentBonusPercent) || 0),
      selectedDailyQuests,
      selectedWeeklyQuests,
      customQuests: sanitizeCustomQuests(raw.spts?.customQuests),
      isOgPlayer: typeof raw.spts?.isOgPlayer === 'boolean' ? raw.spts.isOgPlayer : base.spts.isOgPlayer,
      classicStartYear:
        typeof raw.spts?.classicStartYear === 'string'
          ? raw.spts.classicStartYear
          : base.spts.classicStartYear
    },
    sptsUi: {
      ...base.sptsUi,
      ...(raw.sptsUi ?? {}),
      pvpUseAutoSkills,
      pvpSelectedSkills,
      pvpOpponentUseAutoSkills,
      pvpOpponentSelectedSkills,
      statGoals,
      statGoalModes,
      wikiCat: safeWikiCat,
      manualOpponent: {
        ...base.sptsUi.manualOpponent,
        ...(raw.sptsUi?.manualOpponent ?? {})
      },
      pvpConditions: {
        ...base.sptsUi.pvpConditions,
        ...(raw.sptsUi?.pvpConditions ?? {})
      }
    },
    grindSession: {
      ...base.grindSession,
      ...(raw.grindSession ?? {})
    },
    newSpts: {
      ...base.newSpts,
      ...(raw.newSpts ?? {}),
      stats: { ...base.newSpts.stats, ...(raw.newSpts?.stats ?? {}) },
      multis: { ...base.newSpts.multis, ...(raw.newSpts?.multis ?? {}) },
      locations: { ...base.newSpts.locations, ...(raw.newSpts?.locations ?? {}) },
      weights: { ...base.newSpts.weights, ...(raw.newSpts?.weights ?? {}) },
      customTickSeconds: {
        ...base.newSpts.customTickSeconds,
        ...(raw.newSpts?.customTickSeconds ?? {})
      },
      gainCalcMode:
        raw.newSpts?.gainCalcMode === 'manual' || raw.newSpts?.gainCalcMode === 'auto'
          ? raw.newSpts.gainCalcMode
          : base.newSpts.gainCalcMode,
      equipmentBonusPercent: Math.max(0, Number(raw.newSpts?.equipmentBonusPercent) || 0),
      selectedDailyQuests: newDailySelected,
      selectedWeeklyQuests: newWeeklySelected,
      customQuests: sanitizeCustomQuests(raw.newSpts?.customQuests),
      equippedIds: Array.isArray(raw.newSpts?.equippedIds) ? raw.newSpts.equippedIds : [],
      multiTrainStats: Array.isArray(raw.newSpts?.multiTrainStats)
        ? raw.newSpts.multiTrainStats
        : [...base.newSpts.multiTrainStats]
    },
    newSptsUi: {
      ...base.newSptsUi,
      ...(raw.newSptsUi ?? {}),
      statGoals: newStatGoals,
      statGoalModes: newStatGoalModes
    },
    newSptsGrindSession: {
      ...base.newSptsGrindSession,
      ...(raw.newSptsGrindSession ?? {})
    },
    sptl: {
      ...base.sptl,
      ...(raw.sptl ?? {})
    },
    calcUi: {
      ...base.calcUi,
      ...(raw.calcUi ?? {})
    }
  };
}

const FALLBACK_ACTIVE_PROFILE = createDefaultProfile('main', 'Main');

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profiles: [createDefaultProfile('main', 'Main')],
      activeProfileId: 'main',
      isIncognito: false,
      incognitoProfile: createDefaultProfile('incognito', 'Incognito Sandbox'),
      settings: DEFAULT_SETTINGS,

      getActiveProfile: () => {
        const state = get();
        if (state.isIncognito) return state.incognitoProfile;
        return (
          state.profiles.find((p) => p.id === state.activeProfileId) ??
          state.profiles[0] ??
          FALLBACK_ACTIVE_PROFILE
        );
      },

      switchProfile: (id) =>
        set((state) => ({
          activeProfileId: state.profiles.some((p) => p.id === id) ? id : state.activeProfileId,
          isIncognito: false
        })),

      addProfile: (incoming) => {
        const newId = incoming.id || `profile-${Date.now().toString(36)}`;
        const profile = normalizeProfile(incoming, newId, incoming.name || 'Profile');
        set((state) => ({
          profiles: [...state.profiles, profile],
          activeProfileId: newId,
          isIncognito: false
        }));
        return newId;
      },

      deleteProfile: (id) =>
        set((state) => {
          if (state.profiles.length <= 1) return state;
          const remaining = state.profiles.filter((p) => p.id !== id);
          const nextActive = state.activeProfileId === id ? remaining[0].id : state.activeProfileId;
          return {
            profiles: remaining,
            activeProfileId: nextActive
          };
        }),

      updateActiveProfile: (updater) =>
        set((state) => {
          if (state.isIncognito) {
            const curr = normalizeProfile(state.incognitoProfile, 'incognito', 'Incognito Sandbox');
            return { incognitoProfile: updater(curr) };
          }
          return {
            profiles: state.profiles.map((p) =>
              p.id === state.activeProfileId
                ? updater(normalizeProfile(p, p.id, p.name))
                : p
            )
          };
        }),

      toggleIncognito: () =>
        set((state) => ({
          isIncognito: !state.isIncognito
        })),

      resetIncognitoToZero: () =>
        set({
          incognitoProfile: createDefaultProfile('incognito', 'Incognito Sandbox')
        }),

      saveIncognitoAsProfile: (name) => {
        const trimmed = name.trim() || 'Saved Build';
        const newId = `profile-${Date.now().toString(36)}`;
        const snapshot = get().incognitoProfile;
        const cloned = normalizeProfile(structuredClone(snapshot), newId, trimmed);
        set((state) => ({
          profiles: [...state.profiles, cloned],
          activeProfileId: newId,
          isIncognito: false
        }));
        return newId;
      },

      exportActiveProfileJson: () => {
        const active = get().getActiveProfile();
        return JSON.stringify(active, null, 2);
      },

      exportActiveProfileShareCode: () => {
        const active = get().getActiveProfile();
        const json = JSON.stringify(active);
        const bytes = new TextEncoder().encode(json);
        let bin = '';
        bytes.forEach((b) => {
          bin += String.fromCharCode(b);
        });
        return `RBXC2:${btoa(bin)}`;
      },

      importProfileData: (raw) => {
        try {
          let jsonText = raw.trim();
          if (jsonText.startsWith('RBXC2:')) {
            const b64 = jsonText.slice(6);
            const bin = atob(b64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) {
              bytes[i] = bin.charCodeAt(i);
            }
            jsonText = new TextDecoder().decode(bytes);
          }

          const parsed = JSON.parse(jsonText) as Partial<PlayerProfile>;
          if (!parsed || typeof parsed !== 'object' || !parsed.spts || !parsed.sptl) {
            return { ok: false, error: 'Invalid RBXC profile format.' };
          }

          const merged = normalizeProfile(
            parsed,
            `profile-${Date.now().toString(36)}`,
            parsed.name ? `${parsed.name} (Imported)` : 'Imported Profile'
          );

          set((state) => ({
            profiles: [...state.profiles, merged],
            activeProfileId: merged.id,
            isIncognito: false
          }));

          return { ok: true, profileId: merged.id };
        } catch {
          return { ok: false, error: 'Could not parse JSON or share string.' };
        }
      },

      updateSettings: (partial) =>
        set((state) => {
          const next = { ...state.settings, ...partial };
          if (typeof partial.allowCookies === 'boolean') {
            try {
              localStorage.setItem('allowCookies', String(partial.allowCookies));
            } catch {
              // ignore quota errors
            }
          }
          return { settings: next };
        }),

      saveCustomTheme: (theme) =>
        set((state) => {
          const existing = state.settings.customThemes ?? [];
          const idx = existing.findIndex((t) => t.id === theme.id);
          const updatedList =
            idx >= 0
              ? existing.map((t, i) => (i === idx ? theme : t))
              : [...existing, theme];
          return {
            settings: {
              ...state.settings,
              customThemes: updatedList
            }
          };
        }),

      deleteCustomTheme: (id) =>
        set((state) => {
          const remaining = (state.settings.customThemes ?? []).filter((t) => t.id !== id);
          const nextPageThemes = { ...state.settings.pageThemes };
          (Object.keys(nextPageThemes) as CalculatorPageKey[]).forEach((k) => {
            if (nextPageThemes[k] === id) {
              nextPageThemes[k] = DEFAULT_PAGE_THEMES[k];
            }
          });
          return {
            settings: {
              ...state.settings,
              customThemes: remaining,
              themePreset: state.settings.themePreset === id ? 'rbxc-crimson' : state.settings.themePreset,
              pageThemes: nextPageThemes
            }
          };
        }),

      resetThemeSettings: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            themeMode: DEFAULT_SETTINGS.themeMode,
            themePreset: DEFAULT_SETTINGS.themePreset,
            pageThemes: { ...DEFAULT_PAGE_THEMES },
            customAccent: DEFAULT_SETTINGS.customAccent,
            bgMode: DEFAULT_SETTINGS.bgMode,
            customBgColor: DEFAULT_SETTINGS.customBgColor,
            customBgGradient: DEFAULT_SETTINGS.customBgGradient,
            customBgImageUrl: DEFAULT_SETTINGS.customBgImageUrl,
            bgBlur: DEFAULT_SETTINGS.bgBlur,
            bgOpacity: DEFAULT_SETTINGS.bgOpacity,
            radiusScale: DEFAULT_SETTINGS.radiusScale,
            density: DEFAULT_SETTINGS.density
          }
        }))
    }),
    {
      name: 'rbxc-v2-storage-v3',
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        const mergedSettings = {
          ...DEFAULT_SETTINGS,
          ...(p.settings ?? {}),
          pageThemes: { ...DEFAULT_PAGE_THEMES, ...(p.settings?.pageThemes ?? {}) },
          customThemes: Array.isArray(p.settings?.customThemes) ? p.settings.customThemes : []
        };
        if (mergedSettings.languageAuto) {
          mergedSettings.language = detectBrowserLocale();
        }
        return {
          ...current,
          ...p,
          settings: mergedSettings,
          profiles:
            Array.isArray(p.profiles) && p.profiles.length > 0
              ? p.profiles.map((prof) => normalizeProfile(prof, prof.id, prof.name))
              : current.profiles,
          incognitoProfile: normalizeProfile(p.incognitoProfile, 'incognito', 'Incognito Sandbox')
        };
      }
    }
  )
);

export function useActiveProfile(): PlayerProfile {
  const profiles = useAppStore((s) => s.profiles);
  const activeProfileId = useAppStore((s) => s.activeProfileId);
  const isIncognito = useAppStore((s) => s.isIncognito);
  const incognitoProfile = useAppStore((s) => s.incognitoProfile);

  return useMemo(() => {
    if (isIncognito) return incognitoProfile;
    return profiles.find((p) => p.id === activeProfileId) ?? profiles[0] ?? FALLBACK_ACTIVE_PROFILE;
  }, [activeProfileId, incognitoProfile, isIncognito, profiles]);
}
