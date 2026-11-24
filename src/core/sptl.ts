export type SptlStatType = 'Power' | 'Health' | 'Defense' | 'Psychics' | 'Magic' | 'Mobility';
export type SptlBoostMode = 'levels' | 'percent';

export const SPTL_STAT_TICKS: Record<SptlStatType, number> = {
  Power: 1.0,
  Defense: 1.0,
  Magic: 1.0,
  Health: 1.2,
  Psychics: 1.2,
  Mobility: 1.4
};

export interface SptlCalculationInput {
  statType: SptlStatType;
  hasFastTrain: boolean;
  boostValue: number;
  boostMode: SptlBoostMode;
  perTick: number;
  currentStat: number;
}

export interface SptlRateResult {
  baseTickSeconds: number;
  tickSeconds: number;
  gainPerSecond: number;
}

export function calculateSptlTickSeconds(
  statType: SptlStatType,
  hasFastTrain: boolean,
  boostValue: number,
  boostMode: SptlBoostMode
): number {
  const statTickSeconds = SPTL_STAT_TICKS[statType] ?? 1.0;
  const clampedBoost = Math.max(0, Number.isFinite(boostValue) ? boostValue : 0);
  const statRealBoost = boostMode === 'levels' ? clampedBoost / 20 : clampedBoost / 100;
  const denominator = (hasFastTrain ? 1.25 : 1) + statRealBoost;
  return Math.max(0.01, Math.floor((statTickSeconds / denominator) * 100) / 100);
}

export function calculateSptlRate(input: SptlCalculationInput): SptlRateResult {
  const baseTickSeconds = SPTL_STAT_TICKS[input.statType] ?? 1.0;
  const tickSeconds = calculateSptlTickSeconds(
    input.statType,
    input.hasFastTrain,
    input.boostValue,
    input.boostMode
  );
  const gainPerSecond = tickSeconds > 0 ? input.perTick / tickSeconds : 0;

  return {
    baseTickSeconds,
    tickSeconds,
    gainPerSecond
  };
}

export function calculateSptlTimeToGoal(
  currentStat: number,
  goalStat: number,
  gainPerSecond: number
): number {
  const left = goalStat - currentStat;
  if (left <= 0) return 0;
  if (gainPerSecond <= 0) return Infinity;
  return left / gainPerSecond;
}

export function calculateSptlAmountInTime(
  seconds: number,
  gainPerSecond: number
): number {
  if (seconds <= 0 || gainPerSecond <= 0) return 0;
  return gainPerSecond * seconds;
}

export function calculateSptlTokenTimeToGoal(
  currentTokens: number,
  goalTokens: number,
  tokensPerInterval: number,
  intervalSeconds: number
): number {
  const left = goalTokens - currentTokens;
  if (left <= 0) return 0;
  if (tokensPerInterval <= 0 || intervalSeconds <= 0) return Infinity;
  return (left / tokensPerInterval) * intervalSeconds;
}

export function calculateSptlTokensInTime(
  seconds: number,
  tokensPerInterval: number,
  intervalSeconds: number
): number {
  if (seconds <= 0 || tokensPerInterval <= 0 || intervalSeconds <= 0) return 0;
  return (seconds / intervalSeconds) * tokensPerInterval;
}
