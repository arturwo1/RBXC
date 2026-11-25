import { describe, expect, it } from 'vitest';
import {
  getQuestsGroupedByTier,
  NEW_SPTS_CONFIG,
  NEW_SPTS_DAILY_MAX_TOTAL,
  NEW_SPTS_DAILY_QUESTS,
  NEW_SPTS_PASSIVE_TOKENS_PER_MIN,
  NEW_SPTS_WEEKLY_MAX_TOTAL,
  NEW_SPTS_WEEKLY_QUESTS
} from '../newSptsData';
import {
  calculateTokenRate,
  estimatePlaytimeRange,
  evaluateRobloxOgStatus,
  simulateStatProgress
} from '../spts';
import { SPTS_NEW_LAUNCH_ISO } from '../sptsData';

describe('The New SPTS (2026) core mechanics & formulas', () => {
  it('enforces the verified Nov 25, 2026 launch cutoff for OG evaluation', () => {
    expect(SPTS_NEW_LAUNCH_ISO).toBe('2026-11-25T10:41:00Z');

    const beforeLaunch = evaluateRobloxOgStatus({
      accountCreatedAt: '2020-05-01T00:00:00Z',
      badgeAwardedDates: ['2026-11-25T10:40:00Z']
    });
    expect(beforeLaunch.suggestedIsOg).toBe(true);

    const postLaunch = evaluateRobloxOgStatus({
      accountCreatedAt: '2026-11-26T00:00:00Z',
      badgeAwardedDates: ['2026-11-26T12:00:00Z']
    });
    expect(postLaunch.suggestedIsOg).toBe(false);
  });

  it('defines exact Daily (18 = 45,100) and Weekly (17 = 434,300) quest totals & tier groups', () => {
    expect(NEW_SPTS_DAILY_QUESTS).toHaveLength(18);
    expect(NEW_SPTS_DAILY_MAX_TOTAL).toBe(45_100);

    expect(NEW_SPTS_WEEKLY_QUESTS).toHaveLength(17);
    expect(NEW_SPTS_WEEKLY_MAX_TOTAL).toBe(434_300);

    const dailyTiers = getQuestsGroupedByTier(NEW_SPTS_DAILY_QUESTS);
    expect(dailyTiers.map((g) => g.tokens)).toEqual([20, 500, 2_500, 10_000]);
    expect(dailyTiers[0].quests).toHaveLength(5);
    expect(dailyTiers[3].quests).toHaveLength(3);

    const weeklyTiers = getQuestsGroupedByTier(NEW_SPTS_WEEKLY_QUESTS);
    expect(weeklyTiers.map((g) => g.tokens)).toEqual([100, 500, 2_500, 25_000, 100_000]);
  });

  it('computes +500/min passive tokens and VIP 2x quest payouts accurately', () => {
    const rate = calculateTokenRate({
      dailyQuests: true,
      weeklyQuests: true,
      vip: true,
      gameConfig: NEW_SPTS_CONFIG,
      passiveTokensPerMinute: NEW_SPTS_PASSIVE_TOKENS_PER_MIN,
      dailyQuestValue: NEW_SPTS_DAILY_MAX_TOTAL,
      weeklyQuestValue: NEW_SPTS_WEEKLY_MAX_TOTAL
    });

    expect(rate.passivePerSecond).toBeCloseTo(500 / 60, 8);
    expect(rate.dailyPayout).toBe(45_100 * 2);
    expect(rate.weeklyPayout).toBe(434_300 * 2);
    expect(rate.totalPerSecond).toBeCloseTo(
      500 / 60 + (45_100 * 2) / 86_400 + (434_300 * 2) / (7 * 86_400),
      8
    );
  });

  it('applies equipment bonus % (3.7x for +270%) cleanly to stat training simulation', () => {
    const baseSim = simulateStatProgress({
      currentStat: 0,
      goalStat: 37_000,
      baseGainPerSecond: 100,
      currentMultiKey: 'x1',
      tokenPerSecond: 0,
      simulateUpgrades: false,
      gameConfig: NEW_SPTS_CONFIG,
      equipmentBonusPercent: 0
    });

    const wingedSim = simulateStatProgress({
      currentStat: 0,
      goalStat: 37_000,
      baseGainPerSecond: 100,
      currentMultiKey: 'x1',
      tokenPerSecond: 0,
      simulateUpgrades: false,
      gameConfig: NEW_SPTS_CONFIG,
      equipmentBonusPercent: 270
    });

    expect(baseSim.totalTime).toBeCloseTo(370, 6);
    expect(wingedSim.totalTime).toBeCloseTo(100, 6);
  });

  it('handles one-time story quests (no VIP 2x) and recurring custom_hours quests (with VIP 2x)', () => {
    // Story quest unlocks 1,000 tokens at 1,000 FS -> immediately pays for next upgrade or counts toward remaining tokens
    const simOnce = simulateStatProgress({
      currentStat: 0,
      goalStat: 10_000,
      baseGainPerSecond: 100,
      currentMultiKey: 'x1',
      tokenPerSecond: 0,
      simulateUpgrades: true,
      gameConfig: NEW_SPTS_CONFIG,
      questMode: 'discrete',
      questConfig: {
        dailyQuests: false,
        weeklyQuests: false,
        vip: true, // VIP should NOT double once story quests
        passiveTokensPerMinute: 0,
        trainedStat: 'FS',
        customQuests: [
          {
            id: 'story-1',
            title: 'Sath #1',
            repeatType: 'once',
            stat: 'FS',
            targetStat: 1_000,
            tokensReward: 500,
            enabled: true,
            completed: false
          }
        ]
      }
    });

    // Should upgrade to x2 (100) and x4 (200) right after unlocking 500 at t = 10s, leaving 200 tokens
    expect(simOnce.upgrades).toContain('x2');
    expect(simOnce.upgrades).toContain('x4');
    expect(simOnce.totalEarnedTokens).toBe(500);
    expect(simOnce.remainingTokens).toBe(200);
    expect(simOnce.totalTime).toBeLessThan(100);

    // Recurring custom_hours quest (every 6h, 1,200 tokens, VIP active = 2,400 payout)
    const rate = calculateTokenRate({
      dailyQuests: false,
      weeklyQuests: false,
      vip: true,
      passiveTokensPerMinute: 0,
      gameConfig: NEW_SPTS_CONFIG,
      customQuests: [
        {
          id: 'chest-6h',
          title: 'Secret Chest',
          repeatType: 'custom_hours',
          resetHours: 6,
          stat: 'FS',
          targetStat: 0,
          tokensReward: 1_200,
          enabled: true
        }
      ]
    });

    expect(rate.customHoursPerSecond).toBeCloseTo((1_200 * 2) / (6 * 3600), 8);
    expect(rate.totalPerSecond).toBeCloseTo(rate.customHoursPerSecond, 8);
  });

  it('estimates PlayTime range using NEW_SPTS_CONFIG passive and quest rates', () => {
    const pt = estimatePlaytimeRange({
      currentMultis: { FS: 'x128', BT: 'x1', MS: 'x1', JF: 'x1', PP: 'x1' },
      currentTokens: 5_000,
      gameConfig: NEW_SPTS_CONFIG
    });

    expect(pt.tps.min).toBeCloseTo(500 / 60, 8);
    expect(pt.totalSpentOnMultis).toBe(100 + 200 + 500 + 1000 + 2000 + 5000 + 10000);
    expect(pt.totalEarnedTokens).toBe(pt.totalSpentOnMultis + 5_000);
    expect(pt.seconds.fastest_allQuests_VIP).toBeLessThan(pt.seconds.mid_allQuests_noVIP);
    expect(pt.seconds.mid_allQuests_noVIP).toBeLessThan(pt.seconds.slowest_noQuests);
  });
});
