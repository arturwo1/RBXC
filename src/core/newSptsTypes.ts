import type {
  SptsLocation,
  SptsRepeatableQuest,
  SptsStatType,
  SptsWeightTier
} from './sptsData';

export type SptsGameMode = 'classic' | 'new';
export type SptsGainCalcMode = 'auto' | 'manual';
export type CustomQuestRepeatType = 'once' | 'daily' | 'weekly' | 'custom_hours';

export interface CustomQuestEntry {
  id: string;
  title: string;
  repeatType: CustomQuestRepeatType;
  resetHours?: number;
  stat: SptsStatType;
  targetStat: number;
  tokensReward: number;
  enabled: boolean;
  completed?: boolean;
}

export interface SptsQuestTierGroup {
  tokens: number;
  quests: SptsRepeatableQuest[];
}

export interface SptsGameConfig {
  mode: SptsGameMode;
  passiveTokensPerMinute: number;
  verifiedMaxMulti?: number;
  multis: Record<string, number>;
  prices: Record<number, number>;
  dailyQuests: SptsRepeatableQuest[];
  weeklyQuests: SptsRepeatableQuest[];
  locations: SptsLocation[];
  weights: SptsWeightTier[];
  tickSeconds: Record<SptsStatType, number>;
}

export type EquipmentSlotType =
  | 'wing'
  | 'armor'
  | 'presence'
  | 'legWeights'
  | 'dumbbells'
  | 'bodyChains'
  | 'treadmill'
  | 'trampoline';

export interface EquipmentSlotMeta {
  slot: EquipmentSlotType;
  affectedStats: SptsStatType[];
  comingSoon?: boolean;
}

export interface EquipmentItemEntry {
  id: string;
  name: string;
  slot: EquipmentSlotType;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  statBonusPercent?: number;
  dmgBonusPercent?: number;
  hpBonusPercent?: number;
  tickSpeedModifier?: number;
  notes?: string;
  comingSoon?: boolean;
}

export interface MobEntry {
  id: string;
  name: string;
  location: string;
  requiredPower: number;
  gearPieces: number;
  totalPieces: number;
  setBonusType: 'HP' | 'DMG' | 'STAT';
  setBonusPercent: number;
  comingSoon?: boolean;
}

export interface MultiTrainState {
  enabled: boolean;
  activeStats: SptsStatType[];
}
