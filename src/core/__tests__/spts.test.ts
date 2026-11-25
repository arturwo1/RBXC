import { describe, expect, it } from 'vitest';
import {
  buildAutoZoneProgression,
  calculateBloxyTrophy,
  calculateRobuxPackBreakdown,
  calculateTokenRate,
  computeBackgroundGrindDelta,
  cumulativeCostToReach,
  estimatePlaytimeRange,
  evaluateBloxyTrophyInteraction,
  evaluateRobloxOgStatus,
  getSptsTickSeconds,
  inferBestWeightForStat,
  inferBestZoneForStat,
  simulatePvp,
  simulateStatProgress,
  suggestCheapestTrophyUpgrades
} from '../spts';
import {
  SPTS_DAILY_QUESTS,
  SPTS_LOCATIONS,
  SPTS_MULTIS,
  SPTS_PRICES,
  SPTS_WEEKLY_QUESTS,
  SPTS_WEIGHTS
} from '../sptsData';

describe('SPTS Classic core', () => {
  it('contains all 41 power-of-two multiplier tiers and authentic daily/weekly quest sums', () => {
    const keys = Object.keys(SPTS_MULTIS);
    expect(keys).toHaveLength(41);
    expect(SPTS_MULTIS.x1).toBe(1);
    expect(SPTS_MULTIS.x1099511627776).toBe(1099511627776);
    expect(SPTS_PRICES[1]).toBe(0);
    expect(SPTS_PRICES[1099511627776]).toBe(500000000000000);

    expect(SPTS_DAILY_QUESTS).toHaveLength(5);
    expect(SPTS_DAILY_QUESTS.reduce((s, q) => s + q.tokens, 0)).toBe(100);
    expect(SPTS_WEEKLY_QUESTS).toHaveLength(9);
    expect(SPTS_WEEKLY_QUESTS.reduce((s, q) => s + q.tokens, 0)).toBe(9300);
  });

  it('infers optimal zones and weights and climbs zones automatically when training from 0', () => {
    const bgs = SPTS_LOCATIONS.find((l) => l.id === 'fs-blue-star');
    const volcano = SPTS_LOCATIONS.find((l) => l.id === 'bt-volcano');

    expect(bgs?.requirement).toBe(1e9);
    expect(volcano?.afkSafeRequirement).toBe(4e7);
    expect(SPTS_WEIGHTS).toHaveLength(5);

    expect(inferBestZoneForStat('FS', 5e11).id).toBe('fs-green-star');
    expect(inferBestZoneForStat('FS', 100, 1e4).id).toBe('fs-crystal');
    expect(inferBestZoneForStat('BT', 2e7, 0, true).id).toBe('bt-tornado');
    expect(inferBestZoneForStat('BT', 2e7, 0, false).id).toBe('bt-volcano');
    expect(inferBestZoneForStat('PP', 1e15).id).toBe('pp-waterfall');
    expect(inferBestWeightForStat('MS', 6e5).id).toBe('w-10ton');

    expect(getSptsTickSeconds('FS')).toBe(1);
    expect(getSptsTickSeconds('BT')).toBe(1.25);
    expect(getSptsTickSeconds('PP')).toBe(1.5);
    expect(getSptsTickSeconds('MS', 2.5)).toBe(2.5);

    // Climbing from 0 PP -> 10Qi PP with auto-zone transitions should NOT take thousands of years
    const ppProgression = buildAutoZoneProgression('PP', 1.5, 0, true);
    const sim = simulateStatProgress({
      currentStat: 0,
      goalStat: 1e19,
      baseGainPerSecond: 1 / 1.5,
      currentMultiKey: 'x1',
      tokenPerSecond: 0,
      questMode: 'discrete',
      questConfig: {
        dailyQuests: true,
        weeklyQuests: true,
        vip: false,
        passiveTokensPerMinute: 5
      },
      zoneProgression: ppProgression
    });
    const simFixedZone = simulateStatProgress({
      currentStat: 0,
      goalStat: 1e19,
      baseGainPerSecond: 1 / 1.5,
      currentMultiKey: 'x1',
      tokenPerSecond: 0,
      questMode: 'discrete',
      questConfig: {
        dailyQuests: true,
        weeklyQuests: true,
        vip: false,
        passiveTokensPerMinute: 5
      }
    });
    expect(sim.zoneTransitions.length).toBeGreaterThanOrEqual(4);
    expect(sim.finalZoneId).toBe('pp-waterfall');
    // Under a year (~252 days) and >100x faster (~317x) than staying on 1x ground zone
    expect(sim.totalTime).toBeLessThan(365 * 86400);
    expect(sim.totalTime).toBeLessThan(simFixedZone.totalTime / 100);
  });

  it('computes token rates and respects finite VIP remaining duration', () => {
    const allNoVip = calculateTokenRate({ dailyQuests: true, weeklyQuests: true, vip: false });
    expect(allNoVip.dailyPayout).toBe(100);
    expect(allNoVip.weeklyPayout).toBe(9300);

    const allVip = calculateTokenRate({ dailyQuests: true, weeklyQuests: true, vip: true });
    expect(allVip.dailyPayout).toBe(200);
    expect(allVip.weeklyPayout).toBe(18600);

    const finiteVipSim = simulateStatProgress({
      currentStat: 0,
      goalStat: 1e18,
      baseGainPerSecond: 1,
      currentMultiKey: 'x1',
      tokenPerSecond: 0,
      maxTime: 14 * 86400,
      questMode: 'discrete',
      questConfig: {
        dailyQuests: true,
        weeklyQuests: false,
        vip: true,
        vipRemainingSeconds: 7 * 86400,
        dailyQuestValue: 100
      }
    });
    const foreverVipSim = simulateStatProgress({
      currentStat: 0,
      goalStat: 1e18,
      baseGainPerSecond: 1,
      currentMultiKey: 'x1',
      tokenPerSecond: 0,
      maxTime: 14 * 86400,
      questMode: 'discrete',
      questConfig: {
        dailyQuests: true,
        weeklyQuests: false,
        vip: true,
        vipRemainingSeconds: Infinity,
        dailyQuestValue: 100
      }
    });
    expect(foreverVipSim.totalEarnedTokens).toBeGreaterThan(finiteVipSim.totalEarnedTokens);
  });

  it('applies x2 First Purchase bonus strictly to the FIRST pack of each tier', () => {
    const rowsNoX2 = calculateRobuxPackBreakdown(120_000, 'classic', false);
    const thirtyKNoX2 = rowsNoX2.find((r) => r.pack.id === 'classic-30000')!;
    expect(thirtyKNoX2.count).toBe(4);
    expect(thirtyKNoX2.totalRobux).toBe(20_000);

    const rowsWithX2 = calculateRobuxPackBreakdown(120_000, 'classic', true);
    const thirtyKWithX2 = rowsWithX2.find((r) => r.pack.id === 'classic-30000')!;
    expect(thirtyKWithX2.count).toBe(3);
    expect(thirtyKWithX2.totalDeliveredTokens).toBe(120_000);
    expect(thirtyKWithX2.totalRobux).toBe(15_000);
  });

  it('enforces SPTS_PVP_CONFIG MaxHP=100+10*BT, 50ms tick sim, instant reflection death, and tick-sim binary search', () => {
    // 1. 1T FS vs 1T BT takes ~11 punches (not 2 hits), while 10T FS vs 1T BT is exact 1-hit instant kill at 0ms
    const equalStats = simulatePvp(
      { name: 'Main', fs: 1e12, bt: 1e12, pp: 0, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 1e10, bt: 1e12, pp: 0, ms: 0, jf: 0 },
      'fist'
    );
    expect(equalStats.attackerHitsNeeded).toBeGreaterThanOrEqual(10);
    expect(equalStats.attackerHitsNeeded).toBeLessThanOrEqual(13);
    expect(equalStats.winner).toBe('attacker');

    const tenXOneShot = simulatePvp(
      { name: 'Main', fs: 10e12, bt: 1e12, pp: 0, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 1e10, bt: 1e12, pp: 0, ms: 0, jf: 0 },
      'fist'
    );
    expect(tenXOneShot.attackerHitsNeeded).toBe(1);
    expect(tenXOneShot.ttkAttackerWinsSeconds).toBe(0);
    expect(tenXOneShot.reflectPercent).toBe(0);
    expect(tenXOneShot.winner).toBe('attacker');

    // 2. Exact user benchmark: 9Qa FS vs 22Qa BT using Energy Sphere takes >= 8 spheres (~11 spheres with 1% regen)
    const sphereBenchmark = simulatePvp(
      { name: 'Main', fs: 9e15, bt: 100e15, pp: 0, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 1e12, bt: 22e15, pp: 0, ms: 0, jf: 0 },
      'energy_sphere'
    );
    expect(sphereBenchmark.attackerHitsNeeded).toBeGreaterThanOrEqual(8);
    expect(sphereBenchmark.attackerHitsNeeded).toBeLessThanOrEqual(13);
    expect(sphereBenchmark.reflectPercent).toBe(10);

    // 3. Instant reflect death: 12T FS, 1T BT punching 160Qa BT dies immediately at 0ms (1 hit, 100% reflect)
    const reflectSuicide = simulatePvp(
      { name: 'Main', fs: 12e12, bt: 1e12, pp: 0, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 10e12, bt: 160e15, pp: 0, ms: 0, jf: 0 },
      'fist'
    );
    expect(reflectSuicide.winner).toBe('defender');
    expect(reflectSuicide.attackerDiedFromReflect).toBe(true);
    expect(reflectSuicide.attackerReflectDeathSeconds).toBe(0);
    expect(reflectSuicide.attackerReflectDeathHits).toBe(1);
    expect(reflectSuicide.attackerReflectDeathPercent).toBe(100);
    expect(reflectSuicide.ttkDefenderWinsSeconds).toBe(0);
    expect(reflectSuicide.cannotWinWithFsOnly).toBe(true);
    expect(reflectSuicide.reasons.some((r) => r.code === 'attacker_died_from_reflect')).toBe(true);
    expect(reflectSuicide.reasons.some((r) => r.code === 'cannot_win_fs_only')).toBe(true);

    // 3b. When opponent doesn't 1-shot on tick 0, solver rejects suicidal 40.71Qa FS (10% reflect kills 1T BT) and finds >=160Qa FS (0% reflect)!
    const reflectSolvable = simulatePvp(
      { name: 'Main', fs: 12e12, bt: 1e12, pp: 0, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 100e9, bt: 160e15, pp: 0, ms: 0, jf: 0 },
      'fist'
    );
    expect(reflectSolvable.winner).toBe('defender');
    expect(reflectSolvable.attackerDiedFromReflect).toBe(true);
    expect(reflectSolvable.requiredStatType).toBe('FS');
    expect(reflectSolvable.requiredStatToWin).toBeGreaterThanOrEqual(160e15);

    // 4. Exact 10x PP (1Qi vs 100Qa) deals 0% damage (needs strictly >10x)
    const exact10x = simulatePvp(
      { name: 'Main', fs: 12e12, bt: 22.78e15, pp: 1e18, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 10e15, bt: 160e15, pp: 100e15, ms: 0, jf: 0 },
      'auto'
    );
    expect(exact10x.attackerDps).toBe(0);
    expect(exact10x.ttkAttackerWinsSeconds).toBe(Infinity);
    expect(exact10x.winner).toBe('defender');
    expect(exact10x.reasons.some((r) => r.code === 'psychic_exact_10x_blocked')).toBe(true);
    expect(exact10x.defenderReflectPercent).toBe(10);
    expect(exact10x.requiredStatType).toBe('PP');
    expect(exact10x.requiredStatToWin).toBeLessThan(1e19);

    // 5. 50x PP (5Qi vs 100Qa): Soul Attack deals 50% HP/cast, 0% reflect, WINS against 10Qa FS!
    const fiftyX = simulatePvp(
      { name: 'Main', fs: 12e12, bt: 22.78e15, pp: 5e18, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 10e15, bt: 160e15, pp: 100e15, ms: 0, jf: 0 },
      'auto'
    );
    expect(fiftyX.chosenAttackerSkill).toBe('psychic');
    expect(fiftyX.attackerHitsNeeded).toBe(3);
    expect(fiftyX.reflectPercent).toBe(0);
    expect(fiftyX.winner).toBe('attacker');
    expect(fiftyX.combatLog.length).toBeGreaterThan(0);

    // 6. Strictly >10x PP (1.1Qi vs 100Qa = 11x) wins when opponent reflects 100%
    const over10x = simulatePvp(
      { name: 'Main', fs: 12e12, bt: 22.78e15, pp: 1.1e18, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 1e15, bt: 160e15, pp: 100e15, ms: 0, jf: 0 },
      'auto'
    );
    expect(over10x.chosenAttackerSkill).toBe('psychic');
    expect(over10x.winner).toBe('attacker');
    expect(over10x.reflectPercent).toBe(0);
    expect(over10x.reasons.some((r) => r.code === 'auto_picked_psychic')).toBe(true);

    // 7. Manual fist mode warns about reflect AND suggests switching to psychic when >10x PP
    const manualFist = simulatePvp(
      { name: 'Main', fs: 1e13, bt: 22e15, pp: 1.1e18, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 10e15, bt: 150e15, pp: 100e15, ms: 0, jf: 0 },
      'fist'
    );
    expect(manualFist.winner).toBe('defender');
    expect(manualFist.reasons.some((r) => r.code === 'target_reflects_100')).toBe(true);
    expect(manualFist.reasons.some((r) => r.code === 'switch_to_psychic_hint')).toBe(true);

    // 8. Mutual 100% reflect stalemate draw
    const mutualFistDraw = simulatePvp(
      { name: 'Main', fs: 1e13, bt: 22e15, pp: 1.1e18, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 1e15, bt: 150e15, pp: 100e15, ms: 0, jf: 0 },
      'fist'
    );
    expect(mutualFistDraw.winner).toBe('draw');
    expect(mutualFistDraw.reflectPercent).toBe(100);
    expect(mutualFistDraw.defenderReflectPercent).toBe(100);
  });

  it('supports Soul Attack >=10x backfire, Killing Intent (Z), HellFire (N), Soul Reap (G), Invisibility (T), and Dodge', () => {
    // Soul Attack backfire triggers at >=10x target PP (inclusive!)
    const backfire10x = simulatePvp(
      { name: 'Main', fs: 0, bt: 1e9, pp: 1e6, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 0, bt: 1e12, pp: 10e6, ms: 0, jf: 0 },
      'psychic'
    );
    expect(backfire10x.psychicBackfire).toBe(true);
    expect(backfire10x.winner).toBe('defender');

    // Auto AI NEVER suicides with Soul Attack into >=10x PP enemy
    const autoNoBackfire = simulatePvp(
      { name: 'Main', fs: 1e12, bt: 1e12, pp: 1e6, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 0, bt: 1e9, pp: 10e6, ms: 0, jf: 0 },
      'auto'
    );
    expect(autoNoBackfire.chosenAttackerSkill).not.toBe('psychic');
    expect(autoNoBackfire.psychicBackfire).toBe(false);

    // Killing Intent (Z): >=100x PP deals 20% + 2.0s stun; >=1000x PP instant-kills
    const kiStun = simulatePvp(
      { name: 'Main', fs: 0, bt: 10e12, pp: 1e11, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 1e12, bt: 1e12, pp: 1e9, ms: 0, jf: 0 },
      'killing_intent'
    );
    expect(kiStun.winner).toBe('attacker');
    expect(kiStun.reasons.some((r) => r.code === 'killing_intent_stun')).toBe(true);
    expect(kiStun.combatLog.some((e) => e.kind === 'stun')).toBe(true);

    const kiExec = simulatePvp(
      { name: 'Main', fs: 0, bt: 1e9, pp: 1e12, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 0, bt: 1e15, pp: 1e9, ms: 0, jf: 0 },
      'killing_intent'
    );
    expect(kiExec.winner).toBe('attacker');
    expect(kiExec.ttkAttackerWinsSeconds).toBe(0);

    // HellFire (N): >=100x PP unavoidable 25% MaxHP/s burn (ignores invisibility + dodge!)
    const hellfireBurn = simulatePvp(
      { name: 'Main', fs: 0, bt: 1e12, pp: 1e11, ms: 0, jf: 0, hasHellfire: true },
      {
        name: 'Opponent',
        fs: 1e10,
        bt: 1e12,
        pp: 1e9,
        ms: 0,
        jf: 0,
        dodgeChance: 0.85
      },
      'hellfire'
    );
    expect(hellfireBurn.winner).toBe('attacker');
    expect(hellfireBurn.combatLog.some((e) => e.kind === 'burn')).toBe(true);

    // Soul Reap (G): >=1000x PP executes at 0ms
    const soulReap = simulatePvp(
      { name: 'Main', fs: 10e12, bt: 10e12, pp: 1e16, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 0, bt: 1e18, pp: 1e12, ms: 0, jf: 0 },
      'soul_reap'
    );
    expect(soulReap.winner).toBe('attacker');
    expect(soulReap.ttkAttackerWinsSeconds).toBe(0);
    expect(soulReap.reasons.some((r) => r.code === 'soul_reap_exec')).toBe(true);

    // Invisibility (T) with higher PP makes target-locked punches miss
    const invisEvade = simulatePvp(
      { name: 'Main', fs: 1e15, bt: 1e12, pp: 1e6, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 0, bt: 1e12, pp: 1e9, ms: 0, jf: 0, invisibility: true },
      'fist'
    );
    expect(invisEvade.winner).toBe('draw');
    expect(invisEvade.reasons.some((r) => r.code === 'target_invis_evaded')).toBe(true);
    expect(invisEvade.combatLog.some((e) => e.kind === 'miss_invis')).toBe(true);

    // Deterministic Dodge increases hits/TTK needed
    const noDodge = simulatePvp(
      { name: 'Main', fs: 1e12, bt: 1e12, pp: 0, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 0, bt: 1e12, pp: 0, ms: 0, jf: 0, dodgeChance: 0 },
      'fist'
    );
    const halfDodge = simulatePvp(
      { name: 'Main', fs: 1e12, bt: 1e12, pp: 0, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 0, bt: 1e12, pp: 0, ms: 0, jf: 0, dodgeChance: 0.5 },
      'fist'
    );
    expect(halfDodge.ttkAttackerWinsSeconds).toBeGreaterThan(noDodge.ttkAttackerWinsSeconds);
    expect(halfDodge.combatLog.some((e) => e.kind === 'miss_dodge')).toBe(true);
  });

  it('computes cumulative cost, playtime range, and background grind delta', () => {
    expect(cumulativeCostToReach('x8')).toBe(800);
    const est = estimatePlaytimeRange({
      currentMultis: { FS: 'x8', BT: 'x1', MS: 'x1', JF: 'x1', PP: 'x1' },
      currentTokens: 200
    });
    expect(est.totalEarnedTokens).toBe(1000);
    expect(est.seconds.slowest_noQuests).toBeGreaterThan(est.seconds.mid_allQuests_noVIP);

    const delta = computeBackgroundGrindDelta(1000, 7201000, 100);
    expect(delta.awaySeconds).toBe(7200);
    expect(delta.gainedAmount).toBe(720000);
  });

  it('auto-gates daily/weekly quests by current stats and unlocks them dynamically during simulation', () => {
    const gatedZero = calculateTokenRate({
      dailyQuests: true,
      weeklyQuests: true,
      vip: false,
      autoGateByStats: true,
      currentStats: { FS: 0, BT: 0, PP: 0, MS: 0, JF: 0 }
    });
    expect(gatedZero.dailyPayout).toBe(0);
    expect(gatedZero.weeklyPayout).toBe(0);
    expect(gatedZero.eligibleDailyCount).toBe(0);
    expect(gatedZero.eligibleWeeklyCount).toBe(0);

    const gated1MFist = calculateTokenRate({
      dailyQuests: true,
      weeklyQuests: true,
      vip: false,
      autoGateByStats: true,
      currentStats: { FS: 1e6, BT: 0, PP: 0, MS: 0, JF: 0 }
    });
    // Only Daily FS (20) + Weekly FS I (100) + Weekly FS II (500) are eligible
    expect(gated1MFist.dailyPayout).toBe(20);
    expect(gated1MFist.weeklyPayout).toBe(600);
    expect(gated1MFist.eligibleDailyCount).toBe(1);
    expect(gated1MFist.eligibleWeeklyCount).toBe(2);

    // Dynamic unlock while farming FS from 0 over 14 days (daily/weekly quests on FS unlock as FS crosses 1K, 10K, 1M)
    const simDynamic = simulateStatProgress({
      currentStat: 0,
      goalStat: Infinity,
      baseGainPerSecond: 100, // reaches 1M in ~2.8h
      currentMultiKey: 'x1',
      tokenPerSecond: 0,
      maxTime: 7 * 86400 + 1,
      questMode: 'discrete',
      questConfig: {
        dailyQuests: true,
        weeklyQuests: true,
        vip: false,
        passiveTokensPerMinute: 0,
        autoGateByStats: true,
        currentStats: { FS: 0, BT: 0, PP: 0, MS: 0, JF: 0 },
        trainedStat: 'FS'
      }
    });
    // 7 daily payouts of 20 (140) + 1 weekly payout of 600 = 740 tokens earned
    expect(simDynamic.totalEarnedTokens).toBeGreaterThanOrEqual(740);
  });

  it('subtracts off-zone quest completion duration in both averaged and discrete modes', () => {
    const avgNoDowntime = simulateStatProgress({
      currentStat: 0,
      goalStat: 86400,
      baseGainPerSecond: 1,
      currentMultiKey: 'x1',
      tokenPerSecond: 0,
      simulateUpgrades: false,
      questMode: 'averaged',
      questConfig: {
        dailyQuests: true,
        weeklyQuests: false,
        vip: false,
        dailyQuestTimeSeconds: 0
      }
    });
    const avgHalfDayDowntime = simulateStatProgress({
      currentStat: 0,
      goalStat: 86400,
      baseGainPerSecond: 1,
      currentMultiKey: 'x1',
      tokenPerSecond: 0,
      simulateUpgrades: false,
      questMode: 'averaged',
      questConfig: {
        dailyQuests: true,
        weeklyQuests: false,
        vip: false,
        dailyQuestTimeSeconds: 43200 // 12h/day => 50% uptime
      }
    });
    expect(avgHalfDayDowntime.totalTime).toBeCloseTo(avgNoDowntime.totalTime * 2, 1);

    const discreteWithDetour = simulateStatProgress({
      currentStat: 0,
      goalStat: 2 * 86400,
      baseGainPerSecond: 1,
      currentMultiKey: 'x1',
      tokenPerSecond: 0,
      simulateUpgrades: false,
      questMode: 'discrete',
      questConfig: {
        dailyQuests: true,
        weeklyQuests: false,
        vip: false,
        dailyQuestTimeSeconds: 1800 // 30m per daily cycle
      }
    });
    // 2 daily cycles crossed => +3600s detour
    expect(discreteWithDetour.totalTime).toBeCloseTo(2 * 86400 + 3600, 1);
  });

  it('accounts for BT death-training walk-back time vs safe AFK zones', () => {
    // Fast walk-back (15s -> 2.5 / 17.5 = 14.3% efficiency): Hellfire Pit (x2000, eff ~285.7x) beats Volcano safe (x100) at 1B BT
    const fastWalkSteps = buildAutoZoneProgression('BT', 1.25, 0, false, 15);
    const stepAt1BFast = fastWalkSteps.filter((s) => s.minStat <= 1e9).pop()!;
    expect(stepAt1BFast.zoneId).toBe('bt-hellfire');
    expect(stepAt1BFast.isDeathTraining).toBe(true);

    // Slow walk-back (60s -> 2.5 / 62.5 = 4% efficiency): Hellfire Pit eff 80x is SLOWER than Volcano safe (x100) until 4B safe threshold!
    const slowWalkSteps = buildAutoZoneProgression('BT', 1.25, 0, false, 60);
    const stepAt1BSlow = slowWalkSteps.filter((s) => s.minStat <= 1e9).pop()!;
    expect(stepAt1BSlow.zoneId).toBe('bt-volcano');
    expect(stepAt1BSlow.isDeathTraining).toBe(false);
    const stepAt4BSlow = slowWalkSteps.filter((s) => s.minStat <= 4e9).pop()!;
    expect(stepAt4BSlow.zoneId).toBe('bt-hellfire');
    expect(stepAt4BSlow.isDeathTraining).toBe(false);
  });

  it('supports multi-select PVP skills, invisibility reasons in Auto mode, and dual FS+PP win options', () => {
    // Multi-skill array loadout executes multiple skills on cooldown (tactical priority order)
    const comboLoadout = simulatePvp(
      { name: 'Main', fs: 1e12, bt: 1e12, pp: 0, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 0, bt: 1e12, pp: 0, ms: 0, jf: 0 },
      ['fist', 'bullet_punch']
    );
    expect(comboLoadout.chosenAttackerSkills).toEqual(['bullet_punch', 'fist']);
    expect(comboLoadout.winner).toBe('attacker');
    const fistOnly = simulatePvp(
      { name: 'Main', fs: 1e12, bt: 1e12, pp: 0, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 0, bt: 1e12, pp: 0, ms: 0, jf: 0 },
      ['fist']
    );
    expect(comboLoadout.ttkAttackerWinsSeconds).toBeLessThan(fistOnly.ttkAttackerWinsSeconds);

    // Auto mode vs higher-PP Invisible + 100% physical reflect enemy resolves to 'none' AND emits target_invis_evaded reason
    const autoVsInvis = simulatePvp(
      { name: 'Main', fs: 1e12, bt: 1e12, pp: 1e6, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 0, bt: 1e15, pp: 1e9, ms: 0, jf: 0, invisibility: true },
      'auto'
    );
    expect(autoVsInvis.chosenAttackerSkill).toBe('none');
    expect(autoVsInvis.reasons.some((r) => r.code === 'target_invis_evaded')).toBe(true);

    // Losing matchup exposes BOTH FS and PP winOptions so user isn't forced to farm PP only
    const dualWinPaths = simulatePvp(
      { name: 'Main', fs: 12e12, bt: 22.78e15, pp: 1e18, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 10e15, bt: 160e15, pp: 100e15, ms: 0, jf: 0 },
      'auto'
    );
    expect(dualWinPaths.winner).toBe('defender');
    expect(dualWinPaths.winOptions.some((o) => o.statType === 'FS')).toBe(true);
    expect(dualWinPaths.winOptions.some((o) => o.statType === 'PP')).toBe(true);

    // Regression: selecting ALL 7 skills vs Invisible + 100% reflect + Killing Intent (Z) enemy STILL produces PP winOption!
    const allSevenRegression = simulatePvp(
      { name: 'Main', fs: 12e12, bt: 22e15, pp: 1e18, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 1e15, bt: 1e20, pp: 1e21, ms: 0, jf: 0, invisibility: true },
      [
        'fist',
        'bullet_punch',
        'energy_sphere',
        'psychic',
        'soul_reap',
        'hellfire',
        'killing_intent'
      ]
    );
    expect(allSevenRegression.winner).toBe('defender');
    expect(allSevenRegression.winOptions.length).toBeGreaterThan(0);
    expect(allSevenRegression.winOptions[0].statType).toBe('PP');
    expect(allSevenRegression.winOptions[0].targetValue).toBeGreaterThan(1e21);

    // Custom defenderSkills array works independently from attacker loadout
    const customDefenderPassive = simulatePvp(
      { name: 'Main', fs: 1e12, bt: 1e12, pp: 0, ms: 0, jf: 0 },
      { name: 'Opponent', fs: 1e15, bt: 1e12, pp: 0, ms: 0, jf: 0 },
      { mode: 'auto', attackerSkills: ['fist'], defenderSkills: [] }
    );
    expect(customDefenderPassive.chosenDefenderSkills).toEqual([]);
    expect(customDefenderPassive.winner).toBe('attacker');
  });

  it('calculates Bloxy Trophy ranks across 5 Classic multipliers and enforces OG Veteran floor', () => {
    const emptyNonOg = calculateBloxyTrophy({
      currentMultis: { FS: 'x1', BT: 'x1', MS: 'x1', JF: 'x1', PP: 'x1' },
      isOg: false
    });
    expect(emptyNonOg.totalSpentOnMultis).toBe(0);
    expect(emptyNonOg.effectiveRank).toBe('none');
    expect(emptyNonOg.nextTier?.id).toBe('veteran');
    expect(emptyNonOg.tokensToNextTier).toBe(20_000);

    // Every OG gets at least Veteran even with < 20,000 spent
    const emptyOg = calculateBloxyTrophy({
      currentMultis: { FS: 'x1', BT: 'x1', MS: 'x1', JF: 'x1', PP: 'x1' },
      isOg: true
    });
    expect(emptyOg.naturalRank).toBe('none');
    expect(emptyOg.effectiveRank).toBe('veteran');
    expect(emptyOg.nextTier?.id).toBe('elite');
    expect(emptyOg.tokensToNextTier).toBe(200_000);

    // x512 on one stat costs 100+200+500+1000+2000+5000+10000+15000+20000 = 53,800 (>= 20,000 Veteran)
    const veteran = calculateBloxyTrophy({
      currentMultis: { FS: 'x512', BT: 'x1', MS: 'x1', JF: 'x1', PP: 'x1' },
      isOg: false
    });
    expect(veteran.totalSpentOnMultis).toBe(53_800);
    expect(veteran.effectiveRank).toBe('veteran');

    // Elite (200k), Finest (2M), Apex (20M), Strongest (200M)
    // x1024=103,800; x2048=203,800 (Elite); x16384=1,903,800; x32768=3,903,800 (Finest)
    expect(
      calculateBloxyTrophy({ currentMultis: { FS: 'x2048' }, isOg: false }).effectiveRank
    ).toBe('elite');
    expect(
      calculateBloxyTrophy({ currentMultis: { FS: 'x32768' }, isOg: false }).effectiveRank
    ).toBe('finest');
    // x131072 = 18,903,800; + FS/BT/PP -> x262144 = 38,903,800 (Apex)
    expect(
      calculateBloxyTrophy({ currentMultis: { FS: 'x262144' }, isOg: false }).effectiveRank
    ).toBe('apex');
    // x2097152 = 388,903,800 (Strongest)
    const strongest = calculateBloxyTrophy({
      currentMultis: { FS: 'x2097152' },
      isOg: true
    });
    expect(strongest.effectiveRank).toBe('strongest');
    expect(strongest.tier.studs).toBe(30);
    expect(strongest.nextTier).toBeNull();
    expect(strongest.tokensToNextTier).toBe(0);
  });

  it('plans cheapest multi upgrades across stats to reach next Bloxy Trophy rank', () => {
    const plan = suggestCheapestTrophyUpgrades(
      { FS: 'x512', BT: 'x1', MS: 'x1', JF: 'x1', PP: 'x1' },
      200_000
    );
    expect(plan.neededGap).toBe(200_000 - 53_800);
    expect(plan.resultingTotalSpent).toBeGreaterThanOrEqual(200_000);
    // 4 stats up to x256 (33,800 each = 135,200) + one x512 step (20,000) = 155,200 added (209,000 total)
    expect(plan.upgrades.some((u) => u.stat === 'MS' || u.stat === 'JF')).toBe(true);
    expect(plan.actualAddedCost).toBe(155_200);
    expect(plan.resultingTotalSpent).toBe(209_000);
  });

  it('evaluates OG eligibility using earliest SPTS Classic badge date or Roblox account age', () => {
    const confirmedByBadge = evaluateRobloxOgStatus({
      accountCreatedAt: '2019-03-15T10:00:00Z',
      badgeAwardedDates: [
        '2025-08-01T12:00:00Z',
        '2022-04-10T08:30:00Z',
        null
      ]
    });
    expect(confirmedByBadge.status).toBe('confirmed_badge');
    expect(confirmedByBadge.suggestedIsOg).toBe(true);
    expect(confirmedByBadge.earliestBadgeYear).toBe(2022);
    expect(confirmedByBadge.suggestedStartYear).toBe(2022);

    const sep2026PreLaunchOg = evaluateRobloxOgStatus({
      accountCreatedAt: '2026-08-01T00:00:00Z',
      badgeAwardedDates: ['2026-09-10T00:00:00Z']
    });
    expect(sep2026PreLaunchOg.status).toBe('confirmed_badge');
    expect(sep2026PreLaunchOg.suggestedIsOg).toBe(true);

    const postLaunchAccount = evaluateRobloxOgStatus({
      accountCreatedAt: '2026-12-01T00:00:00Z',
      badgeAwardedDates: ['2026-12-05T00:00:00Z']
    });
    expect(postLaunchAccount.status).toBe('not_og_new_account');
    expect(postLaunchAccount.suggestedIsOg).toBe(false);

    const oldAccountNoBadge = evaluateRobloxOgStatus({
      accountCreatedAt: '2020-01-10T00:00:00Z',
      badgeAwardedDates: []
    });
    expect(oldAccountNoBadge.status).toBe('possible_account_age');
    expect(oldAccountNoBadge.accountCreatedYear).toBe(2020);
    expect(oldAccountNoBadge.suggestedStartYear).toBe(2020);
  });

  it('evaluates Bloxy Trophy reactions, combat block, >1000x fail, and bounce-back', () => {
    expect(
      evaluateBloxyTrophyInteraction({
        selfRank: 'strongest',
        selfTotalPower: 1e12,
        targetRank: 'apex',
        targetTotalPower: 5e12
      })
    ).toMatchObject({ outcome: 'reacts', studs: 30, cooldownSec: 8 });

    expect(
      evaluateBloxyTrophyInteraction({
        selfRank: 'veteran',
        selfTotalPower: 1e9,
        targetRank: 'none',
        targetTotalPower: 1e6
      }).outcome
    ).toBe('no_reaction_veteran');

    expect(
      evaluateBloxyTrophyInteraction({
        selfRank: 'finest',
        selfTotalPower: 1e12,
        targetRank: 'finest',
        targetTotalPower: 1e12
      }).outcome
    ).toBe('blocked_rank');

    expect(
      evaluateBloxyTrophyInteraction({
        selfRank: 'apex',
        selfTotalPower: 1e12,
        targetRank: 'none',
        targetTotalPower: 1e6,
        targetInCombat: true
      }).outcome
    ).toBe('blocked_in_combat');

    expect(
      evaluateBloxyTrophyInteraction({
        selfRank: 'apex',
        selfTotalPower: 1e9,
        targetRank: 'elite',
        targetTotalPower: 2e12
      }).outcome
    ).toBe('failed_power_gap');

    expect(
      evaluateBloxyTrophyInteraction({
        selfRank: 'apex',
        selfTotalPower: 1e9,
        targetRank: 'strongest',
        targetTotalPower: 2e12
      }).outcome
    ).toBe('bounced_back');
  });
});
