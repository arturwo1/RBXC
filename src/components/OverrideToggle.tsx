import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useT } from '../i18n';

interface FieldHeaderWithOverrideProps {
  label: string;
  open: boolean;
  onToggle: () => void;
  hasCustomOverride?: boolean;
  children?: ReactNode;
}

export function FieldHeaderWithOverride({
  label,
  open,
  onToggle,
  hasCustomOverride = false,
  children
}: FieldHeaderWithOverrideProps) {
  const t = useT();

  return (
    <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
      <span className="truncate text-xs font-semibold text-[var(--text-secondary)]">{label}</span>
      <div className="flex shrink-0 items-center gap-1.5">
        {children}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className={`inline-flex min-h-[26px] items-center gap-1 rounded px-1.5 text-[11px] font-medium transition-colors ${
            open || hasCustomOverride
              ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>{hasCustomOverride ? t.common.customLabel : t.common.overrideBtn}</span>
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}
