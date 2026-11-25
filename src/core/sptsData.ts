export type SptsStatType = 'FS' | 'BT' | 'MS' | 'JF' | 'PP';

export interface SptsLocation {
  id: string;
  name: string;
  stat: 'FS' | 'BT' | 'PP';
  multiplier: number;
  multiplierLabel: string;
  requirement: number;
  requirementLabel: string;
  afkSafeRequirement?: number;
  afkSafeLabel?: string;
  requiresFly?: boolean;
  notes: string;
}

export interface SptsWeightTier {
  id: string;
  name: string;
  color: string;
  multiplier: number;
  msRequirement: number;
  msReqLabel: string;
  jfRequirement: number;
  jfReqLabel: string;
}

export interface SptsTokenPack {
  id: string;
  tierGroup: 'classic' | 'high';
  name: string;
  tokens: number;
  firstTimeTokens: number;
  robux: number;
}

export interface SptsVipPlan {
  id: string;
  name: string;
  durationStr: string;
  seconds: number;
  robux: number;
}

export interface SptsReputationTier {
  heroRep: number;
  heroTitle: string;
  villainRep: number;
  villainTitle: string;
}

export interface SptsQuestEntry {
  id: string;
  group: 'Main' | 'Daily' | 'Weekly' | 'Special';
  titleKey: string;
  requirementsKey: string;
  rewardKey: string;
  unlocksKey?: string;
}

export interface SptsRepeatableQuest {
  id: string;
  period: 'daily' | 'weekly';
  stat: SptsStatType;
  target: number;
  tokens: number;
}

export interface SptsWikiEntry {
  id: string;
  category: 'Skill' | 'Passive' | 'Mechanic';
  nameKey: string;
  unlockKey: string;
  effectKey: string;
}

export const SPTS_MULTIS: Record<string, number> = {
  x1: 1,
  x2: 2,
  x4: 4,
  x8: 8,
  x16: 16,
  x32: 32,
  x64: 64,
  x128: 128,
  x256: 256,
  x512: 512,
  x1024: 1024,
  x2048: 2048,
  x4096: 4096,
  x8192: 8192,
  x16384: 16384,
  x32768: 32768,
  x65536: 65536,
  x131072: 131072,
  x262144: 262144,
  x524288: 524288,
  x1048576: 1048576,
  x2097152: 2097152,
  x4194304: 4194304,
  x8388608: 8388608,
  x16777216: 16777216,
  x33554432: 33554432,
  x67108864: 67108864,
  x134217728: 134217728,
  x268435456: 268435456,
  x536870912: 536870912,
  x1073741824: 1073741824,
  x2147483648: 2147483648,
  x4294967296: 4294967296,
  x8589934592: 8589934592,
  x17179869184: 17179869184,
  x34359738368: 34359738368,
  x68719476736: 68719476736,
  x137438953472: 137438953472,
  x274877906944: 274877906944,
  x549755813888: 549755813888,
  x1099511627776: 1099511627776
};

export const SPTS_PRICES: Record<number, number> = {
  1: 0,
  2: 100,
  4: 200,
  8: 500,
  16: 1000,
  32: 2000,
  64: 5000,
  128: 10000,
  256: 15000,
  512: 20000,
  1024: 50000,
  2048: 100000,
  4096: 200000,
  8192: 500000,
  16384: 1000000,
  32768: 2000000,
  65536: 5000000,
  131072: 10000000,
  262144: 20000000,
  524288: 50000000,
  1048576: 100000000,
  2097152: 200000000,
  4194304: 500000000,
  8388608: 1000000000,
  16777216: 2000000000,
  33554432: 5000000000,
  67108864: 10000000000,
  134217728: 20000000000,
  268435456: 50000000000,
  536870912: 100000000000,
  1073741824: 200000000000,
  2147483648: 500000000000,
  4294967296: 1000000000000,
  8589934592: 2000000000000,
  17179869184: 5000000000000,
  34359738368: 10000000000000,
  68719476736: 20000000000000,
  137438953472: 50000000000000,
  274877906944: 100000000000000,
  549755813888: 200000000000000,
  1099511627776: 500000000000000
};

export const SPTSC_FS_MULTIS: Record<string, string> = {
  'The Rock': 'x10',
  'The Crystal': 'x100',
  'Blue God Star': 'x2000',
  'Green God Star': 'x40000',
  'Red God Star': 'x800000'
};

export const SPTSC_BT_MULTIS: Record<string, string> = {
  'The Ice Pool': 'x5',
  'The Fire Pit': 'x10',
  'The Iceberg': 'x20',
  'The Tornado': 'x50',
  'The Volcano': 'x100',
  'The Hellfire Pit': 'x2000',
  'The Green Acid Pool': 'x40000',
  'The Red Acid Pool': 'x800000'
};

export const SPTSC_PP_MULTIS: Record<string, string> = {
  'Flying + Meditating': 'x10',
  'First Lawn': 'x100',
  'Second Lawn': 'x10000',
  Bridge: 'x1000000',
  Waterfall: 'x100000000'
};

export const SPTS_LOCATIONS: SptsLocation[] = [
  { id: 'fs-none', name: 'Open Air (No Zone)', stat: 'FS', multiplier: 1, multiplierLabel: 'x1', requirement: 0, requirementLabel: '0 FS', notes: 'Punch anywhere' },
  { id: 'fs-rock', name: 'The Rock', stat: 'FS', multiplier: 10, multiplierLabel: 'x10', requirement: 0, requirementLabel: '0 FS', notes: 'Next to spawn' },
  { id: 'fs-crystal', name: 'The Crystal', stat: 'FS', multiplier: 100, multiplierLabel: 'x100', requirement: 0, requirementLabel: 'Fly (10K PP)', requiresFly: true, notes: 'Located on a cloud above the Tornado' },
  { id: 'fs-blue-star', name: 'Blue God Star', stat: 'FS', multiplier: 2000, multiplierLabel: 'x2,000', requirement: 1e9, requirementLabel: '1B FS', afkSafeRequirement: 1e9, afkSafeLabel: '1B FS', notes: 'In the sky' },
  { id: 'fs-green-star', name: 'Green God Star', stat: 'FS', multiplier: 40000, multiplierLabel: 'x40,000', requirement: 1e11, requirementLabel: '100B FS', afkSafeRequirement: 1e11, afkSafeLabel: '100B FS', notes: 'In the sky' },
  { id: 'fs-red-star', name: 'Red God Star', stat: 'FS', multiplier: 800000, multiplierLabel: 'x800,000', requirement: 1e13, requirementLabel: '10T FS', afkSafeRequirement: 1e13, afkSafeLabel: '10T FS', notes: 'Highest Fist Star in the sky' },

  { id: 'bt-none', name: 'Pushups (Open Air)', stat: 'BT', multiplier: 1, multiplierLabel: 'x1', requirement: 0, requirementLabel: '0 BT', notes: 'Base Body Toughness pushups' },
  { id: 'bt-ice-pool', name: 'The Ice Pool', stat: 'BT', multiplier: 5, multiplierLabel: 'x5', requirement: 100, requirementLabel: '100 BT', afkSafeRequirement: 400, afkSafeLabel: '400 BT (4× AFK)', notes: 'City Port starter pool' },
  { id: 'bt-fire-pit', name: 'The Fire Pit', stat: 'BT', multiplier: 10, multiplierLabel: 'x10', requirement: 1e4, requirementLabel: '10K BT', afkSafeRequirement: 4e4, afkSafeLabel: '40K BT (4× AFK)', notes: 'City Port fire pit' },
  { id: 'bt-iceberg', name: 'The Iceberg', stat: 'BT', multiplier: 20, multiplierLabel: 'x20', requirement: 1e5, requirementLabel: '100K BT', afkSafeRequirement: 4e5, afkSafeLabel: '400K BT (4× AFK)', notes: 'South-west from spawn' },
  { id: 'bt-tornado', name: 'The Tornado', stat: 'BT', multiplier: 50, multiplierLabel: 'x50', requirement: 1e6, requirementLabel: '1M BT', afkSafeRequirement: 4e6, afkSafeLabel: '4M BT (4× AFK)', notes: 'North from spawn' },
  { id: 'bt-volcano', name: 'The Volcano', stat: 'BT', multiplier: 100, multiplierLabel: 'x100', requirement: 1e7, requirementLabel: '10M BT', afkSafeRequirement: 4e7, afkSafeLabel: '40M BT (4× AFK)', notes: 'North-East from spawn' },
  { id: 'bt-hellfire', name: 'The Hellfire Pit', stat: 'BT', multiplier: 2000, multiplierLabel: 'x2,000', requirement: 1e9, requirementLabel: '1B BT', afkSafeRequirement: 4e9, afkSafeLabel: '4B BT (4× AFK)', notes: 'Lava pit #1' },
  { id: 'bt-green-acid', name: 'The Green Acid Pool', stat: 'BT', multiplier: 40000, multiplierLabel: 'x40,000', requirement: 1e11, requirementLabel: '100B BT', afkSafeRequirement: 4e11, afkSafeLabel: '400B BT (4× AFK)', notes: 'Acid pit #2' },
  { id: 'bt-red-acid', name: 'The Red Acid Pool', stat: 'BT', multiplier: 800000, multiplierLabel: 'x800,000', requirement: 1e13, requirementLabel: '10T BT', afkSafeRequirement: 4e13, afkSafeLabel: '40T BT (4× AFK)', notes: 'Acid pit #3' },

  { id: 'pp-none', name: 'Meditating (Ground)', stat: 'PP', multiplier: 1, multiplierLabel: 'x1', requirement: 0, requirementLabel: '0 PP', notes: 'Basic psychic meditation' },
  { id: 'pp-flying', name: 'Flying + Meditating', stat: 'PP', multiplier: 10, multiplierLabel: 'x10', requirement: 1e4, requirementLabel: '10K PP', requiresFly: true, notes: 'Does not stack on Psychic Island' },
  { id: 'pp-first-lawn', name: 'First Lawn (+1M)', stat: 'PP', multiplier: 100, multiplierLabel: 'x100', requirement: 1e6, requirementLabel: '1M PP', notes: 'Psychic Island #1' },
  { id: 'pp-second-lawn', name: 'Second Lawn (+1B)', stat: 'PP', multiplier: 10000, multiplierLabel: 'x10,000', requirement: 1e9, requirementLabel: '1B PP', notes: 'Psychic Island #2' },
  { id: 'pp-bridge', name: 'Bridge (+1T)', stat: 'PP', multiplier: 1000000, multiplierLabel: 'x1,000,000', requirement: 1e12, requirementLabel: '1T PP', notes: 'Psychic Island #3' },
  { id: 'pp-waterfall', name: 'Waterfall (+1Qa)', stat: 'PP', multiplier: 100000000, multiplierLabel: 'x100,000,000', requirement: 1e15, requirementLabel: '1Qa PP', notes: 'Top PP zone (125× top FS/BT)' }
];

export const SPTS_WEIGHTS: SptsWeightTier[] = [
  { id: 'w-none', name: 'None', color: 'Default', multiplier: 1, msRequirement: 0, msReqLabel: '0 MS', jfRequirement: 0, jfReqLabel: '0 JF' },
  { id: 'w-100lb', name: '100 LB', color: 'White', multiplier: 2, msRequirement: 100, msReqLabel: '100 MS', jfRequirement: 8000, jfReqLabel: '8K JF' },
  { id: 'w-1ton', name: '1 TON', color: 'Yellow', multiplier: 5, msRequirement: 4500, msReqLabel: '4.5K MS', jfRequirement: 207500, jfReqLabel: '207.5K JF' },
  { id: 'w-10ton', name: '10 TON', color: 'Cyan', multiplier: 10, msRequirement: 565800, msReqLabel: '565.8K MS', jfRequirement: 2000000, jfReqLabel: '2M JF' },
  { id: 'w-100ton', name: '100 TON', color: 'Red', multiplier: 20, msRequirement: 10000000, msReqLabel: '10M MS', jfRequirement: 10000000, jfReqLabel: '10M JF' }
];

export const SPTS_TICK_SECONDS: Record<SptsStatType, number> = {
  FS: 1,
  BT: 1.25,
  MS: 2,
  JF: 1,
  PP: 1.5
};

export const SPTS_TOKEN_PACKS: SptsTokenPack[] = [
  { id: 'classic-200', tierGroup: 'classic', name: '200 Tokens', tokens: 200, firstTimeTokens: 400, robux: 100 },
  { id: 'classic-1100', tierGroup: 'classic', name: '1,100 Tokens', tokens: 1100, firstTimeTokens: 2200, robux: 400 },
  { id: 'classic-2600', tierGroup: 'classic', name: '2,600 Tokens', tokens: 2600, firstTimeTokens: 5200, robux: 800 },
  { id: 'classic-6000', tierGroup: 'classic', name: '6,000 Tokens', tokens: 6000, firstTimeTokens: 12000, robux: 1600 },
  { id: 'classic-14000', tierGroup: 'classic', name: '14,000 Tokens', tokens: 14000, firstTimeTokens: 28000, robux: 3200 },
  { id: 'classic-30000', tierGroup: 'classic', name: '30,000 Tokens', tokens: 30000, firstTimeTokens: 60000, robux: 5000 },

  { id: 'high-24k', tierGroup: 'high', name: '24K Tokens', tokens: 24000, firstTimeTokens: 48000, robux: 100 },
  { id: 'high-132k', tierGroup: 'high', name: '132K Tokens', tokens: 132000, firstTimeTokens: 264000, robux: 400 },
  { id: 'high-312k', tierGroup: 'high', name: '312K Tokens', tokens: 312000, firstTimeTokens: 624000, robux: 800 },
  { id: 'high-720k', tierGroup: 'high', name: '720K Tokens', tokens: 720000, firstTimeTokens: 1440000, robux: 1600 },
  { id: 'high-1.68m', tierGroup: 'high', name: '1.68M Tokens', tokens: 1680000, firstTimeTokens: 3360000, robux: 3200 },
  { id: 'high-3.6m', tierGroup: 'high', name: '3.6M Tokens', tokens: 3600000, firstTimeTokens: 7200000, robux: 5000 }
];

export const SPTS_VIP_PLANS: SptsVipPlan[] = [
  { id: 'vip-1w', name: '+1 Week VIP', durationStr: '7d', seconds: 7 * 86400, robux: 400 },
  { id: 'vip-1m', name: '+1 Month VIP', durationStr: '1mo', seconds: 2629746, robux: 800 },
  { id: 'vip-3m', name: '+3 Months VIP', durationStr: '3mo', seconds: 3 * 2629746, robux: 1500 }
];

export const SPTS_REPUTATION_TIERS: SptsReputationTier[] = [
  { heroRep: 0, heroTitle: 'Innocent', villainRep: 0, villainTitle: 'Innocent' },
  { heroRep: 1, heroTitle: 'Protector', villainRep: -1, villainTitle: 'Lawbreaker' },
  { heroRep: 10, heroTitle: 'Guardian', villainRep: -10, villainTitle: 'Criminal' },
  { heroRep: 40, heroTitle: 'Superhero', villainRep: -40, villainTitle: 'Supervillain' },
  { heroRep: 100, heroTitle: 'Punisher', villainRep: -100, villainTitle: 'Devilish' },
  { heroRep: 200, heroTitle: 'Lightbringer', villainRep: -200, villainTitle: 'Satanic' },
  { heroRep: 300, heroTitle: 'Saint', villainRep: -300, villainTitle: 'Hellish' },
  { heroRep: 400, heroTitle: 'Paragon', villainRep: -400, villainTitle: 'Death' },
  { heroRep: 500, heroTitle: 'Lionheart', villainRep: -500, villainTitle: 'Archdemon' },
  { heroRep: 600, heroTitle: 'Chosen One', villainRep: -600, villainTitle: 'The Devourer' },
  { heroRep: 800, heroTitle: 'Liberator', villainRep: -800, villainTitle: 'Wicked Revengers' },
  { heroRep: 1000, heroTitle: 'One With Glory', villainRep: -1000, villainTitle: 'Soulcounter' },
  { heroRep: 1500, heroTitle: 'Wonderbringer', villainRep: -1500, villainTitle: 'The Dark Sun' },
  { heroRep: 2000, heroTitle: 'Benefactor', villainRep: -2000, villainTitle: 'Infernal Judge' },
  { heroRep: 2500, heroTitle: 'Executioner', villainRep: -2500, villainTitle: 'The Last Nemesis' },
  { heroRep: 3500, heroTitle: 'Morningstar', villainRep: -3500, villainTitle: 'Minister of Chaos' },
  { heroRep: 5000, heroTitle: 'Flames of Fire', villainRep: -5000, villainTitle: 'Great Disaster' },
  { heroRep: 7500, heroTitle: 'Blinding Lights', villainRep: -7500, villainTitle: 'Ruler of All Evil' },
  { heroRep: 10000, heroTitle: 'Peace Dominion', villainRep: -10000, villainTitle: 'Inferno Furies' },
  { heroRep: 20000, heroTitle: 'Constellations', villainRep: -20000, villainTitle: 'Warmaster' },
  { heroRep: 30000, heroTitle: 'Supreme Unknown', villainRep: -30000, villainTitle: 'Lord of Calamity' },
  { heroRep: 50000, heroTitle: 'Eternal Life', villainRep: -50000, villainTitle: 'False God' },
  { heroRep: 100000, heroTitle: 'Savior of Worlds', villainRep: -100000, villainTitle: 'Harbinger of Doom' }
];

export const SPTS_DAILY_QUESTS: SptsRepeatableQuest[] = [
  { id: 'dFs', period: 'daily', stat: 'FS', target: 1000, tokens: 20 },
  { id: 'dBt', period: 'daily', stat: 'BT', target: 1000, tokens: 20 },
  { id: 'dMs', period: 'daily', stat: 'MS', target: 100, tokens: 20 },
  { id: 'dJf', period: 'daily', stat: 'JF', target: 100, tokens: 20 },
  { id: 'dPp', period: 'daily', stat: 'PP', target: 1000, tokens: 20 }
];

export const SPTS_WEEKLY_QUESTS: SptsRepeatableQuest[] = [
  { id: 'wFs1', period: 'weekly', stat: 'FS', target: 10_000, tokens: 100 },
  { id: 'wFs2', period: 'weekly', stat: 'FS', target: 1_000_000, tokens: 500 },
  { id: 'wFs3', period: 'weekly', stat: 'FS', target: 1_000_000_000, tokens: 2500 },
  { id: 'wBt1', period: 'weekly', stat: 'BT', target: 50_000, tokens: 100 },
  { id: 'wBt2', period: 'weekly', stat: 'BT', target: 5_000_000, tokens: 500 },
  { id: 'wBt3', period: 'weekly', stat: 'BT', target: 500_000_000, tokens: 2500 },
  { id: 'wPp1', period: 'weekly', stat: 'PP', target: 10_000, tokens: 100 },
  { id: 'wPp2', period: 'weekly', stat: 'PP', target: 1_000_000, tokens: 500 },
  { id: 'wPp3', period: 'weekly', stat: 'PP', target: 1_000_000_000, tokens: 2500 }
];

export const SPTS_QUESTS_DATA: SptsQuestEntry[] = [
  { id: 'q1', group: 'Main', titleKey: 'q1', requirementsKey: 'q1', rewardKey: 'q1' },
  { id: 'q2', group: 'Main', titleKey: 'q2', requirementsKey: 'q2', rewardKey: 'q2' },
  { id: 'q3', group: 'Main', titleKey: 'q3', requirementsKey: 'q3', rewardKey: 'q3', unlocksKey: 'q3' },
  { id: 'q4', group: 'Main', titleKey: 'q4', requirementsKey: 'q4', rewardKey: 'q4', unlocksKey: 'q4' },
  { id: 'q5', group: 'Main', titleKey: 'q5', requirementsKey: 'q5', rewardKey: 'q5', unlocksKey: 'q5' },
  { id: 'q6', group: 'Main', titleKey: 'q6', requirementsKey: 'q6', rewardKey: 'q6', unlocksKey: 'q6' },
  { id: 'q7', group: 'Main', titleKey: 'q7', requirementsKey: 'q7', rewardKey: 'q7' },
  { id: 'q8', group: 'Main', titleKey: 'q8', requirementsKey: 'q8', rewardKey: 'q8', unlocksKey: 'q8' },
  { id: 'q9', group: 'Main', titleKey: 'q9', requirementsKey: 'q9', rewardKey: 'q9', unlocksKey: 'q9' },
  { id: 'q10', group: 'Main', titleKey: 'q10', requirementsKey: 'q10', rewardKey: 'q10', unlocksKey: 'q10' },
  { id: 'q11', group: 'Main', titleKey: 'q11', requirementsKey: 'q11', rewardKey: 'q11', unlocksKey: 'q11' },
  { id: 'q12', group: 'Main', titleKey: 'q12', requirementsKey: 'q12', rewardKey: 'q12', unlocksKey: 'q12' },
  { id: 'q13', group: 'Main', titleKey: 'q13', requirementsKey: 'q13', rewardKey: 'q13', unlocksKey: 'q13' },
  { id: 'qReaper', group: 'Special', titleKey: 'qReaper', requirementsKey: 'qReaper', rewardKey: 'qReaper', unlocksKey: 'qReaper' },
  ...SPTS_DAILY_QUESTS.map((dq): SptsQuestEntry => ({
    id: dq.id,
    group: 'Daily',
    titleKey: dq.id,
    requirementsKey: dq.id,
    rewardKey: dq.id
  })),
  ...SPTS_WEEKLY_QUESTS.map((wq): SptsQuestEntry => ({
    id: wq.id,
    group: 'Weekly',
    titleKey: wq.id,
    requirementsKey: wq.id,
    rewardKey: wq.id
  }))
];

export const SPTS_WIKI_ENTRIES: SptsWikiEntry[] = [
  { id: 'punch', category: 'Skill', nameKey: 'punch', unlockKey: 'punch', effectKey: 'punch' },
  { id: 'esp', category: 'Skill', nameKey: 'esp', unlockKey: 'esp', effectKey: 'esp' },
  { id: 'bullet', category: 'Skill', nameKey: 'bullet', unlockKey: 'bullet', effectKey: 'bullet' },
  { id: 'soul', category: 'Skill', nameKey: 'soul', unlockKey: 'soul', effectKey: 'soul' },
  { id: 'invis', category: 'Skill', nameKey: 'invis', unlockKey: 'invis', effectKey: 'invis' },
  { id: 'killingIntent', category: 'Skill', nameKey: 'killingIntent', unlockKey: 'killingIntent', effectKey: 'killingIntent' },
  { id: 'soulReap', category: 'Skill', nameKey: 'soulReap', unlockKey: 'soulReap', effectKey: 'soulReap' },
  { id: 'hellfire', category: 'Skill', nameKey: 'hellfire', unlockKey: 'hellfire', effectKey: 'hellfire' },
  { id: 'reflect', category: 'Passive', nameKey: 'reflect', unlockKey: 'reflect', effectKey: 'reflect' },
  { id: 'ticks', category: 'Mechanic', nameKey: 'ticks', unlockKey: 'ticks', effectKey: 'ticks' },
  { id: 'bloxyTrophy', category: 'Mechanic', nameKey: 'bloxyTrophy', unlockKey: 'bloxyTrophy', effectKey: 'bloxyTrophy' }
];

export const SPTS_NEW_LAUNCH_ISO = '2026-11-25T10:41:00Z';
export const SPTS_NEW_PASSIVE_TOKENS_PER_MIN = 500;

export const SPTS_CLASSIC_OG_BADGES = [
  {
    badgeId: 2124441182,
    key: 'hellfire' as const,
    url: 'https://www.roblox.com/badges/2124441182/Obtained-Ghost-Rider-Head-Ghost-Bike-Hellfire'
  },
  {
    badgeId: 2124441172,
    key: 'soulReap' as const,
    url: 'https://www.roblox.com/badges/2124441172/Completed-Reaper-Quest-Obtained-Soul-Reap'
  },
  {
    badgeId: 2124441169,
    key: 'allSath' as const,
    url: 'https://www.roblox.com/badges/2124441169/Completed-All-Saths-Quests-Classic'
  }
] as const;

export type BloxyTrophyRankId = 'none' | 'veteran' | 'elite' | 'finest' | 'apex' | 'strongest';

export interface BloxyTrophyTier {
  id: BloxyTrophyRankId;
  tierOrder: number;
  minTokensSpent: number;
  studs: number;
  cooldownSec: number;
}

export const BLOXY_TROPHY_TIERS: ReadonlyArray<BloxyTrophyTier> = [
  { id: 'none', tierOrder: 0, minTokensSpent: 0, studs: 0, cooldownSec: 8 },
  { id: 'veteran', tierOrder: 1, minTokensSpent: 20_000, studs: 0, cooldownSec: 8 },
  { id: 'elite', tierOrder: 2, minTokensSpent: 200_000, studs: 14, cooldownSec: 8 },
  { id: 'finest', tierOrder: 3, minTokensSpent: 2_000_000, studs: 18, cooldownSec: 8 },
  { id: 'apex', tierOrder: 4, minTokensSpent: 20_000_000, studs: 22, cooldownSec: 8 },
  { id: 'strongest', tierOrder: 5, minTokensSpent: 200_000_000, studs: 30, cooldownSec: 8 }
];
