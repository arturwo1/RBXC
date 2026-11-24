import { describe, expect, it } from 'vitest';
import {
  calculateSptlAmountInTime,
  calculateSptlRate,
  calculateSptlTickSeconds,
  calculateSptlTimeToGoal,
  calculateSptlTokensInTime,
  calculateSptlTokenTimeToGoal
} from '../sptl';

describe('SPTL core', () => {
  it('computes tick seconds accurately with Faster Train and level/percent boosts', () => {
    expect(calculateSptlTickSeconds('Power', false, 0, 'levels')).toBe(1);
    expect(calculateSptlTickSeconds('Power', true, 3, 'levels')).toBe(0.71);
    expect(calculateSptlTickSeconds('Power', true, 15, 'percent')).toBe(0.71);
    expect(calculateSptlTickSeconds('Mobility', false, 0, 'levels')).toBe(1.4);
  });

  it('fixes V1 dynamic timestamp rate: gainPerSecond = perTick / tick (not perTick * tick)', () => {
    const rate = calculateSptlRate({
      statType: 'Power',
      hasFastTrain: true,
      boostValue: 15,
      boostMode: 'percent',
      perTick: 710,
      currentStat: 0
    });
    expect(rate.tickSeconds).toBe(0.71);
    expect(rate.gainPerSecond).toBeCloseTo(1000, 5);
    expect(calculateSptlTimeToGoal(0, 10_000, rate.gainPerSecond)).toBeCloseTo(10, 5);
    expect(calculateSptlAmountInTime(5, rate.gainPerSecond)).toBeCloseTo(5000, 5);
  });

  it('calculates SPTL token goals', () => {
    expect(calculateSptlTokenTimeToGoal(100, 400, 50, 45)).toBe(270);
    expect(calculateSptlTokensInTime(90, 50, 45)).toBe(100);
  });
});
