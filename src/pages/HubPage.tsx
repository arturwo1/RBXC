import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Calculator, Shield, Sparkles, User, Zap } from 'lucide-react';
import { AdSlot } from '../components/AdSlot';
import { parseNumber } from '../core/numbers';
import { useT } from '../i18n';
import { useFormatters } from '../lib/formatters';
import { usePageSeo } from '../lib/seo';
import { useActiveProfile, useAppStore } from '../store/useAppStore';

export function HubPage() {
  usePageSeo({
    title: 'RBX Calculators — Fast Calculations, Tokens & Training Tools',
    description:
      'RBX Calculators (RBXC) — fast, accurate Roblox progress tools for SPTS Classic, Super Power Training League, PVP damage, and time planning.',
    canonicalPath: '/'
  });

  const t = useT();
  const activeProfile = useActiveProfile();
  const isIncognito = useAppStore((s) => s.isIncognito);
  const { fmtNum } = useFormatters();

  const renderStat = (raw: string) => (raw.trim() ? fmtNum(parseNumber(raw)) : '—');

  const tools = [
    {
      to: '/sptsc/',
      title: t.hub.toolSptsTitle,
      meta: t.hub.toolSptsMeta,
      desc: t.hub.toolSptsDesc,
      icon: Zap
    },
    {
      to: '/sptlc/',
      title: t.hub.toolSptlTitle,
      meta: t.hub.toolSptlMeta,
      desc: t.hub.toolSptlDesc,
      icon: Sparkles
    },
    {
      to: '/calculator/',
      title: t.hub.toolCalcTitle,
      meta: t.hub.toolCalcMeta,
      desc: t.hub.toolCalcDesc,
      icon: Calculator
    },
    {
      to: '/help/',
      title: t.hub.toolHelpTitle,
      meta: t.hub.toolHelpMeta,
      desc: t.hub.toolHelpDesc,
      icon: BookOpen
    }
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-[var(--density-pad)]">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-medium text-[var(--text-secondary)]">
              {t.nav.brand} · {isIncognito ? t.nav.incognito : `${t.common.activeProfile}: ${activeProfile.name}`}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t.hub.heroTitle}</h1>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{t.hub.heroDesc}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[440px] lg:grid-cols-2">
            <div className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 p-3">
              <div className="text-[11px] text-[var(--text-secondary)]">{t.hub.statFist}</div>
              <div className="font-mono text-base font-bold tabular-nums">{renderStat(activeProfile.spts.stats.FS)}</div>
            </div>
            <div className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 p-3">
              <div className="text-[11px] text-[var(--text-secondary)]">{t.hub.statBody}</div>
              <div className="font-mono text-base font-bold tabular-nums">{renderStat(activeProfile.spts.stats.BT)}</div>
            </div>
            <div className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 p-3">
              <div className="text-[11px] text-[var(--text-secondary)]">{t.hub.statPsychic}</div>
              <div className="font-mono text-base font-bold tabular-nums">{renderStat(activeProfile.spts.stats.PP)}</div>
            </div>
            <div className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 p-3">
              <div className="text-[11px] text-[var(--text-secondary)]">{t.hub.statTokens}</div>
              <div className="font-mono text-base font-bold tabular-nums">{renderStat(activeProfile.spts.tokens)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.to}
              to={tool.to}
              className="group flex flex-col justify-between rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-[var(--density-pad)] transition-transform duration-150 hover:-translate-y-0.5 hover:border-[var(--accent)]/60"
            >
              <div>
                <div className="mb-1 text-xs font-medium text-[var(--text-secondary)]">{tool.meta}</div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold tracking-tight group-hover:text-[var(--accent)]">{tool.title}</h2>
                  <Icon className="h-5 w-5 shrink-0 text-[var(--accent)]" />
                </div>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{tool.desc}</p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)]">
                <span>{t.common.openTool}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </section>

      <AdSlot variant="leaderboard" />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-[var(--density-pad)] lg:col-span-2">
          <h2 className="mb-2 text-base font-bold">{t.hub.aboutTitle}</h2>
          <p className="mb-3 text-sm leading-relaxed text-[var(--text-secondary)]">{t.hub.aboutDesc}</p>
          <div className="flex flex-wrap gap-4 text-xs font-semibold">
            <Link to="/privacy/" className="inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline">
              <Shield className="h-3.5 w-3.5" />
              {t.hub.privacyAndLicense}
            </Link>
            <Link to="/arturwol/" className="inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline">
              <User className="h-3.5 w-3.5" />
              @arturwol
            </Link>
          </div>
        </div>

        <AdSlot variant="rectangle" className="my-0" />
      </section>
    </div>
  );
}
