import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { AdSlot } from '../components/AdSlot';
import { NUMBER_UNITS, SUFFIXES } from '../core/numbers';
import { SPTS_LOCATIONS, SPTS_MULTIS, SPTS_PRICES } from '../core/sptsData';
import { TIME_ABBREVIATIONS, TIME_UNITS } from '../core/time';
import { useT } from '../i18n';
import { useFormatters } from '../lib/formatters';
import { usePageSeo } from '../lib/seo';

export function HelpPage() {
  usePageSeo({
    title: 'RBX Calculators & Abbreviations Help',
    description:
      'Complete reference for number suffixes, time units, global stat multipliers, token prices, and SPTS Classic training locations.',
    canonicalPath: '/help/'
  });

  const t = useT();
  const { fmtNum, fmtMult } = useFormatters();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const filteredNumbers = useMemo(
    () =>
      NUMBER_UNITS.map((u, idx) => ({ unit: u, idx, local: t.numberUnits[idx] || u }))
        .filter((item) => item.unit !== '')
        .filter(
          (item) =>
            !q ||
            item.unit.toLowerCase().includes(q) ||
            item.local.toLowerCase().includes(q) ||
            String(SUFFIXES[item.unit.toLowerCase()]).includes(q)
        ),
    [q, t.numberUnits]
  );

  const filteredTime = useMemo(
    () =>
      Object.entries(TIME_ABBREVIATIONS).filter(([abbr, full]) => {
        const localAbbr = t.timeUnits[abbr] ?? abbr;
        const localFull = t.help.timeUnitNames[abbr] ?? full;
        return (
          !q ||
          abbr.toLowerCase().includes(q) ||
          localAbbr.toLowerCase().includes(q) ||
          localFull.toLowerCase().includes(q)
        );
      }),
    [q, t.help.timeUnitNames, t.timeUnits]
  );

  const filteredMultis = useMemo(
    () =>
      Object.entries(SPTS_MULTIS).filter(([label, val]) => {
        const formatted = fmtMult(val);
        return (
          !q ||
          label.toLowerCase().includes(q) ||
          formatted.toLowerCase().includes(q) ||
          String(SPTS_PRICES[val] ?? '').includes(q)
        );
      }),
    [fmtMult, q]
  );

  const filteredLocations = useMemo(
    () =>
      SPTS_LOCATIONS.filter((loc) => {
        if (loc.multiplier <= 1) return false;
        const locName = t.spts.locations[loc.id] ?? loc.name;
        return (
          !q ||
          locName.toLowerCase().includes(q) ||
          loc.stat.toLowerCase().includes(q) ||
          fmtMult(loc.multiplier).toLowerCase().includes(q)
        );
      }),
    [fmtMult, q, t.spts.locations]
  );

  return (
    <div className="space-y-6">
      <header className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-[var(--density-pad)]">
        <h1 className="mb-2 text-2xl font-extrabold tracking-tight">{t.help.title}</h1>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">{t.help.subtitle}</p>

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.help.searchPlaceholder}
            className="min-h-[44px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] pr-3 pl-9 text-sm"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section
          id="number-units"
          className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-[var(--density-pad)]"
        >
          <h2 className="mb-1 text-lg font-bold">{t.help.numUnitsTitle}</h2>
          <p className="mb-3 text-xs text-[var(--text-secondary)]">{t.help.numUnitsDesc}</p>
          <div className="max-h-[340px] divide-y divide-[var(--border-subtle)]/50 overflow-y-auto pr-1 text-xs">
            {filteredNumbers.map(({ unit, local }) => {
              const val = SUFFIXES[unit.toLowerCase()];
              const hasLocalDiff = local && local !== unit;
              return (
                <div
                  key={unit}
                  id={`number-${unit.toLowerCase()}`}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[var(--text-primary)]">{local}</span>
                    {hasLocalDiff && (
                      <span className="font-mono text-[11px] text-[var(--text-secondary)]">({unit})</span>
                    )}
                  </div>
                  <span className="font-mono tabular-nums text-[var(--text-secondary)]">
                    {val.toExponential(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section
          id="time-units"
          className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-[var(--density-pad)]"
        >
          <h2 className="mb-1 text-lg font-bold">{t.help.timeUnitsTitle}</h2>
          <p className="mb-3 text-xs text-[var(--text-secondary)]">{t.help.timeUnitsDesc}</p>
          <div className="max-h-[340px] divide-y divide-[var(--border-subtle)]/50 overflow-y-auto pr-1 text-xs">
            {filteredTime.map(([abbr, fullName]) => {
              const localAbbr = t.timeUnits[abbr] ?? abbr;
              const localFull = t.help.timeUnitNames[abbr] ?? fullName;
              return (
                <div
                  key={abbr}
                  id={`time-${abbr.toLowerCase()}`}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <div>
                    <span className="font-mono font-bold text-[var(--text-primary)]">{localAbbr}</span>
                    {localAbbr !== abbr && (
                      <span className="font-mono text-[11px] text-[var(--text-secondary)]"> ({abbr})</span>
                    )}
                    <span className="text-[var(--text-secondary)]"> · {localFull}</span>
                  </div>
                  <span className="font-mono tabular-nums text-[var(--text-secondary)]">
                    {TIME_UNITS[abbr]}{t.timeUnits.s}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <AdSlot variant="leaderboard" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section
          id="global-multis"
          className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-[var(--density-pad)]"
        >
          <h2 className="mb-1 text-lg font-bold">{t.help.globalMultisTitle}</h2>
          <p className="mb-3 text-xs text-[var(--text-secondary)]">{t.help.globalMultisDesc}</p>
          <div className="max-h-[360px] divide-y divide-[var(--border-subtle)]/50 overflow-y-auto pr-1 text-xs">
            {filteredMultis.map(([label, val]) => {
              const price = SPTS_PRICES[val] ?? 0;
              return (
                <div
                  key={label}
                  id={`multi-${label.toLowerCase()}`}
                  className="flex items-center justify-between py-2"
                >
                  <span className="font-mono font-bold">{fmtMult(val)}</span>
                  <span className="font-mono tabular-nums text-[var(--text-secondary)]">
                    {fmtNum(price)} {t.common.tokens}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section
          id="spts-classic-multis"
          className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-[var(--density-pad)]"
        >
          <h2 className="mb-1 text-lg font-bold">{t.help.locationsTitle}</h2>
          <p className="mb-3 text-xs text-[var(--text-secondary)]">{t.help.locationsDesc}</p>
          <div className="max-h-[360px] divide-y divide-[var(--border-subtle)]/50 overflow-y-auto pr-1 text-xs">
            {filteredLocations.map((loc) => (
              <div key={loc.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-[var(--text-primary)]">
                    {t.spts.locations[loc.id] ?? loc.name}
                  </div>
                  <div className="text-[var(--text-secondary)]">
                    {loc.stat} · {t.spts.wikiReqPrefix}{' '}
                    {loc.requiresFly && loc.requirement === 0
                      ? t.spts.quests.q9.unlocks
                      : `${fmtNum(loc.requirement)} ${loc.stat}`}
                  </div>
                </div>
                <span className="font-mono font-bold text-[var(--accent)]">{fmtMult(loc.multiplier)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <AdSlot variant="infeed" />
    </div>
  );
}
