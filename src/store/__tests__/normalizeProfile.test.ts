import { describe, expect, it } from 'vitest';
import { NEW_SPTS_PASSIVE_TOKENS_PER_MIN } from '../../core/newSptsData';
import { normalizeProfile } from '../useAppStore';

describe('Profile normalization & legacy Classic migration', () => {
  it('preserves legacy Classic V2 profile values while hydrating newSpts defaults cleanly', () => {
    const legacy = {
      id: 'legacy-1',
      name: 'Artur',
      spts: {
        stats: { FS: '1.5T', BT: '2T', PP: '500B', MS: '1M', JF: '1M' },
        multis: { FS: 'x1024', BT: 'x8192', PP: 'x4096', MS: 'x512', JF: 'x512' },
        locations: { FS: 'auto', BT: 'auto', PP: 'auto' },
        weights: { MS: 'auto', JF: 'auto' },
        customTickSeconds: { FS: '', BT: '', PP: '', MS: '', JF: '' },
        customPerTick: '250B',
        safeAfkOnly: true,
        tokens: '50K',
        reputation: 0,
        vip: true,
        vipDuration: '7d',
        halfCooldownPass: false,
        dailyQuests: true,
        weeklyQuests: true,
        selectedDailyQuests: ['dFs', 'dBt'],
        selectedWeeklyQuests: ['wFs1'],
        passiveTokensPerMin: 5,
        dailyQuestValue: 40,
        weeklyQuestValue: 100,
        questMode: 'discrete' as const,
        autoGateQuestsByStats: false,
        dailyQuestDuration: '',
        weeklyQuestDuration: '',
        btDeathReturnDuration: '',
        isOgPlayer: true,
        classicStartYear: '2019'
      }
    } as never;

    const normalized = normalizeProfile(legacy, 'fallback', 'Fallback');

    expect(normalized.spts.stats.FS).toBe('1.5T');
    expect(normalized.spts.gainCalcMode).toBe('manual');
    expect(normalized.spts.equipmentBonusPercent).toBe(0);
    expect(normalized.spts.customQuests).toEqual([]);
    expect(normalized.newSpts.passiveTokensPerMin).toBe(NEW_SPTS_PASSIVE_TOKENS_PER_MIN);
    expect(normalized.newSpts.selectedDailyQuests).toHaveLength(18);
    expect(normalized.newSpts.selectedWeeklyQuests).toHaveLength(17);
  });

  it('sanitizes customQuests entries with invalid numbers or repeat types safely', () => {
    const dirty = {
      name: 'Test',
      newSpts: {
        equipmentBonusPercent: -50,
        customQuests: [
          {
            id: 'q1',
            title: 'Story 1',
            repeatType: 'custom_hours',
            resetHours: 0,
            stat: 'FS',
            targetStat: -10,
            tokensReward: 1500,
            enabled: true,
            completed: false
          },
          null,
          'bad-entry'
        ]
      }
    } as never;

    const normalized = normalizeProfile(dirty, 'test-id', 'Test');
    expect(normalized.newSpts.equipmentBonusPercent).toBe(0);
    expect(normalized.newSpts.customQuests).toHaveLength(1);
    expect(normalized.newSpts.customQuests[0]).toMatchObject({
      id: 'q1',
      title: 'Story 1',
      repeatType: 'custom_hours',
      resetHours: 0.1,
      stat: 'FS',
      targetStat: 0,
      tokensReward: 1500
    });
  });
});
