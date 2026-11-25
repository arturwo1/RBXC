import type {
  EquipmentItemEntry,
  EquipmentSlotMeta,
  MobEntry,
  SptsGameConfig,
  SptsQuestTierGroup
} from './newSptsTypes';
import {
  SPTS_DAILY_QUESTS,
  SPTS_LOCATIONS,
  SPTS_MULTIS,
  SPTS_PRICES,
  SPTS_TICK_SECONDS,
  SPTS_WEEKLY_QUESTS,
  SPTS_WEIGHTS,
  type SptsRepeatableQuest
} from './sptsData';

export const NEW_SPTS_DAILY_QUESTS: SptsRepeatableQuest[] = [
  // Tier 1: +20 each (5 quests = 100)
  { id: 'nd-t1-fs', period: 'daily', stat: 'FS', target: 1_000, tokens: 20 },
  { id: 'nd-t1-bt', period: 'daily', stat: 'BT', target: 1_000, tokens: 20 },
  { id: 'nd-t1-ms', period: 'daily', stat: 'MS', target: 100, tokens: 20 },
  { id: 'nd-t1-jf', period: 'daily', stat: 'JF', target: 100, tokens: 20 },
  { id: 'nd-t1-pp', period: 'daily', stat: 'PP', target: 1_000, tokens: 20 },

  // Tier 2: +500 each (5 quests = 2,500)
  { id: 'nd-t2-fs', period: 'daily', stat: 'FS', target: 10_000_000, tokens: 500 },
  { id: 'nd-t2-bt', period: 'daily', stat: 'BT', target: 5_000_000, tokens: 500 },
  { id: 'nd-t2-ms', period: 'daily', stat: 'MS', target: 100_000, tokens: 500 },
  { id: 'nd-t2-jf', period: 'daily', stat: 'JF', target: 100_000, tokens: 500 },
  { id: 'nd-t2-pp', period: 'daily', stat: 'PP', target: 1_000_000, tokens: 500 },

  // Tier 3: +2,500 each (5 quests = 12,500)
  { id: 'nd-t3-fs', period: 'daily', stat: 'FS', target: 10_000_000_000, tokens: 2_500 },
  { id: 'nd-t3-bt', period: 'daily', stat: 'BT', target: 5_000_000_000, tokens: 2_500 },
  { id: 'nd-t3-ms', period: 'daily', stat: 'MS', target: 10_000_000, tokens: 2_500 },
  { id: 'nd-t3-jf', period: 'daily', stat: 'JF', target: 10_000_000, tokens: 2_500 },
  { id: 'nd-t3-pp', period: 'daily', stat: 'PP', target: 1_000_000_000, tokens: 2_500 },

  // Tier 4: +10,000 each (3 quests = 30,000)
  { id: 'nd-t4-fs', period: 'daily', stat: 'FS', target: 10_000_000_000_000_000, tokens: 10_000 },
  { id: 'nd-t4-bt', period: 'daily', stat: 'BT', target: 5_000_000_000_000_000, tokens: 10_000 },
  { id: 'nd-t4-pp', period: 'daily', stat: 'PP', target: 1_000_000_000_000_000, tokens: 10_000 }
];

export const NEW_SPTS_WEEKLY_QUESTS: SptsRepeatableQuest[] = [
  // Tier 1: +100 each (3 quests = 300)
  { id: 'nw-t1-fs', period: 'weekly', stat: 'FS', target: 100_000, tokens: 100 },
  { id: 'nw-t1-bt', period: 'weekly', stat: 'BT', target: 50_000, tokens: 100 },
  { id: 'nw-t1-pp', period: 'weekly', stat: 'PP', target: 10_000, tokens: 100 },

  // Tier 2: +500 each (3 quests = 1,500)
  { id: 'nw-t2-fs', period: 'weekly', stat: 'FS', target: 10_000_000, tokens: 500 },
  { id: 'nw-t2-bt', period: 'weekly', stat: 'BT', target: 5_000_000, tokens: 500 },
  { id: 'nw-t2-pp', period: 'weekly', stat: 'PP', target: 1_000_000, tokens: 500 },

  // Tier 3: +2,500 each (3 quests = 7,500)
  { id: 'nw-t3-fs', period: 'weekly', stat: 'FS', target: 1_000_000_000, tokens: 2_500 },
  { id: 'nw-t3-bt', period: 'weekly', stat: 'BT', target: 500_000_000, tokens: 2_500 },
  { id: 'nw-t3-pp', period: 'weekly', stat: 'PP', target: 100_000_000, tokens: 2_500 },

  // Tier 4: +25,000 each (5 quests = 125,000)
  { id: 'nw-t4-fs', period: 'weekly', stat: 'FS', target: 10_000_000_000_000, tokens: 25_000 },
  { id: 'nw-t4-bt', period: 'weekly', stat: 'BT', target: 5_000_000_000_000, tokens: 25_000 },
  { id: 'nw-t4-pp', period: 'weekly', stat: 'PP', target: 1_000_000_000_000, tokens: 25_000 },
  { id: 'nw-t4-ms', period: 'weekly', stat: 'MS', target: 100_000_000, tokens: 25_000 },
  { id: 'nw-t4-jf', period: 'weekly', stat: 'JF', target: 100_000_000, tokens: 25_000 },

  // Tier 5: +100,000 each (3 quests = 300,000)
  { id: 'nw-t5-fs', period: 'weekly', stat: 'FS', target: 10_000_000_000_000_000_000, tokens: 100_000 },
  { id: 'nw-t5-bt', period: 'weekly', stat: 'BT', target: 5_000_000_000_000_000_000, tokens: 100_000 },
  { id: 'nw-t5-pp', period: 'weekly', stat: 'PP', target: 1_000_000_000_000_000_000, tokens: 100_000 }
];

export const NEW_SPTS_PASSIVE_TOKENS_PER_MIN = 500;
export const NEW_SPTS_DAILY_MAX_TOTAL = NEW_SPTS_DAILY_QUESTS.reduce((s, q) => s + q.tokens, 0);
export const NEW_SPTS_WEEKLY_MAX_TOTAL = NEW_SPTS_WEEKLY_QUESTS.reduce((s, q) => s + q.tokens, 0);

export const CLASSIC_CONFIG: SptsGameConfig = {
  mode: 'classic',
  passiveTokensPerMinute: 5,
  multis: SPTS_MULTIS,
  prices: SPTS_PRICES,
  dailyQuests: SPTS_DAILY_QUESTS,
  weeklyQuests: SPTS_WEEKLY_QUESTS,
  locations: SPTS_LOCATIONS,
  weights: SPTS_WEIGHTS,
  tickSeconds: SPTS_TICK_SECONDS
};

export const NEW_SPTS_CONFIG: SptsGameConfig = {
  mode: 'new',
  passiveTokensPerMinute: NEW_SPTS_PASSIVE_TOKENS_PER_MIN,
  verifiedMaxMulti: 128,
  multis: SPTS_MULTIS,
  prices: SPTS_PRICES,
  dailyQuests: NEW_SPTS_DAILY_QUESTS,
  weeklyQuests: NEW_SPTS_WEEKLY_QUESTS,
  locations: SPTS_LOCATIONS,
  weights: SPTS_WEIGHTS,
  tickSeconds: SPTS_TICK_SECONDS
};

export function getQuestsGroupedByTier(quests: SptsRepeatableQuest[]): SptsQuestTierGroup[] {
  const map = new Map<number, SptsRepeatableQuest[]>();
  for (const q of quests) {
    const arr = map.get(q.tokens);
    if (arr) arr.push(q);
    else map.set(q.tokens, [q]);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([tokens, group]) => ({ tokens, quests: group }));
}

export const EQUIPMENT_SLOTS_REGISTRY: EquipmentSlotMeta[] = [
  { slot: 'wing', affectedStats: ['FS', 'BT', 'PP', 'MS', 'JF'], comingSoon: true },
  { slot: 'armor', affectedStats: ['BT'], comingSoon: true },
  { slot: 'presence', affectedStats: ['PP'], comingSoon: true },
  { slot: 'legWeights', affectedStats: ['MS', 'JF'], comingSoon: true },
  { slot: 'dumbbells', affectedStats: ['FS'], comingSoon: true },
  { slot: 'bodyChains', affectedStats: ['BT'], comingSoon: true },
  { slot: 'treadmill', affectedStats: ['MS'], comingSoon: true },
  { slot: 'trampoline', affectedStats: ['JF'], comingSoon: true }
];

export const NEW_SPTS_EQUIPMENT_STUBS: EquipmentItemEntry[] = [
  {
    id: 'wing-seraphic-270',
    name: 'Mystery Wing (+270% DMG)',
    slot: 'wing',
    rarity: 'mythic',
    dmgBonusPercent: 270,
    statBonusPercent: 270,
    notes: 'Sample rolled Wing from Mystery Merchant.',
    comingSoon: true
  },
  {
    id: 'gear-leg-weights-stub',
    name: 'Training Leg Weights',
    slot: 'legWeights',
    rarity: 'rare',
    statBonusPercent: 0,
    comingSoon: true
  },
  {
    id: 'gear-dumbbells-stub',
    name: 'Heavy Dumbbells',
    slot: 'dumbbells',
    rarity: 'rare',
    statBonusPercent: 0,
    comingSoon: true
  },
  {
    id: 'gear-body-chains-stub',
    name: 'Body Chains',
    slot: 'bodyChains',
    rarity: 'rare',
    statBonusPercent: 0,
    comingSoon: true
  },
  {
    id: 'station-treadmill-stub',
    name: 'AFK Treadmill',
    slot: 'treadmill',
    rarity: 'common',
    statBonusPercent: 0,
    comingSoon: true
  },
  {
    id: 'station-trampoline-stub',
    name: 'AFK Trampoline',
    slot: 'trampoline',
    rarity: 'common',
    statBonusPercent: 0,
    comingSoon: true
  }
];

export const HUNT_INDEX_MOBS: MobEntry[] = [
  {
    id: 'mob-bully',
    name: 'Bully',
    location: 'Diamond Motor',
    requiredPower: 1_000,
    gearPieces: 5,
    totalPieces: 5,
    setBonusType: 'HP',
    setBonusPercent: 5,
    comingSoon: false
  },
  {
    id: 'mob-unknown-1',
    name: 'Unknown Hunter Boss',
    location: 'Remastered City (Wiki WIP)',
    requiredPower: 0,
    gearPieces: 0,
    totalPieces: 5,
    setBonusType: 'STAT',
    setBonusPercent: 0,
    comingSoon: true
  }
];
