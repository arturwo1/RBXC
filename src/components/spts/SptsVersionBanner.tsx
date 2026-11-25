import { Link } from 'react-router-dom';
import { Flame, Zap } from 'lucide-react';
import { useT } from '../../i18n';

interface SptsVersionBannerProps {
  mode: 'classic' | 'new';
}

export function SptsVersionBanner({ mode }: SptsVersionBannerProps) {
  const t = useT();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5">
      <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
        <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
        <span>{t.newSpts.bannerLabel}</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Link
          to="/sptsc/"
          className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-[var(--radius-control)] border px-3 text-xs font-semibold transition-colors ${
            mode === 'classic'
              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]'
              : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:border-[var(--accent)]/60 hover:text-[var(--text-primary)]'
          }`}
        >
          <Zap className="h-3.5 w-3.5 shrink-0" />
          <span>{t.newSpts.bannerClassicBtn}</span>
        </Link>

        <Link
          to="/spts/"
          className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-[var(--radius-control)] border px-3 text-xs font-semibold transition-colors ${
            mode === 'new'
              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]'
              : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:border-[var(--accent)]/60 hover:text-[var(--text-primary)]'
          }`}
        >
          <Flame className="h-3.5 w-3.5 shrink-0" />
          <span>{t.newSpts.bannerNewBtn}</span>
        </Link>
      </div>
    </div>
  );
}
