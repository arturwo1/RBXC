import { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n';
import {
  ADSENSE_CLIENT,
  ADSENSE_SLOTS,
  ensureAdSenseScript,
  isLocalPreviewHost
} from '../lib/adsense';
import { useAppStore } from '../store/useAppStore';

export type AdVariant = 'leaderboard' | 'rectangle' | 'skyscraper' | 'infeed';

interface AdSlotProps {
  variant: AdVariant;
  slotId?: string;
  className?: string;
}

const VARIANT_META: Record<
  AdVariant,
  { containerClass: string; sizeLabel: string; format: string; minW: number; minH: number }
> = {
  leaderboard: {
    containerClass: 'w-full min-h-[100px] sm:min-h-[90px] max-w-[728px] mx-auto',
    sizeLabel: '320×100 / 728×90',
    format: 'horizontal',
    minW: 250,
    minH: 50
  },
  rectangle: {
    containerClass: 'w-full max-w-[336px] mx-auto min-h-[250px]',
    sizeLabel: '300×250',
    format: 'rectangle',
    minW: 250,
    minH: 200
  },
  skyscraper: {
    containerClass: 'w-[160px] min-h-[600px]',
    sizeLabel: '160×600',
    format: 'vertical',
    minW: 120,
    minH: 500
  },
  infeed: {
    containerClass: 'w-full min-h-[90px] sm:min-h-[90px]',
    sizeLabel: 'Fluid Responsive',
    format: 'auto',
    minW: 250,
    minH: 70
  }
};

export function AdSlot({ variant, slotId, className = '' }: AdSlotProps) {
  const t = useT();
  const allowCookies = useAppStore((s) => s.settings.allowCookies);
  const adPreviewMode = useAppStore((s) => s.settings.adPreviewMode);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pushed, setPushed] = useState(false);
  const [adCollapsed, setAdCollapsed] = useState(false);

  const isLocal = isLocalPreviewHost();
  const meta = VARIANT_META[variant];
  const resolvedSlot = slotId ?? ADSENSE_SLOTS[variant];
  const canLoadLiveAds = !isLocal && allowCookies === true;
  const showDevBounds = isLocal && adPreviewMode;

  useEffect(() => {
    if (!canLoadLiveAds || adCollapsed) return;
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let verifyTimeout: number | undefined;
    let statusObserver: MutationObserver | null = null;

    const inspectStatus = () => {
      const ins = el.querySelector('ins.adsbygoogle') as HTMLElement | null;
      if (!ins) return;
      const status = ins.getAttribute('data-ad-status');
      if (status === 'unfilled') {
        setAdCollapsed(true);
      }
    };

    const tryPush = async () => {
      if (cancelled || pushed || adCollapsed) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < meta.minW || rect.height < meta.minH) return;

      try {
        await ensureAdSenseScript(true);
        if (cancelled) return;
        const ins = el.querySelector('ins.adsbygoogle') as HTMLElement | null;
        if (!ins) {
          setAdCollapsed(true);
          return;
        }
        statusObserver = new MutationObserver(inspectStatus);
        statusObserver.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });

        if (!ins.getAttribute('data-ad-status')) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setPushed(true);

          // If AdSense crashed, was blocked, or returned empty height in production -> hide completely
          verifyTimeout = window.setTimeout(() => {
            if (cancelled) return;
            const status = ins.getAttribute('data-ad-status');
            if (status === 'unfilled' || (!status && ins.offsetHeight < 10)) {
              setAdCollapsed(true);
            }
          }, 4500);
        }
      } catch {
        setAdCollapsed(true);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void tryPush();
        }
      },
      { rootMargin: '120px', threshold: 0.05 }
    );

    const ro = new ResizeObserver(() => {
      void tryPush();
    });

    io.observe(el);
    ro.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
      ro.disconnect();
      statusObserver?.disconnect();
      if (verifyTimeout) window.clearTimeout(verifyTimeout);
    };
  }, [adCollapsed, canLoadLiveAds, meta.minH, meta.minW, pushed]);

  // Production: never render empty placeholder boxes if consent isn't granted or AdSense crashed/blocked/unfilled
  // Localhost: render layout bounds ONLY when explicitly toggled on in Local Developer Tools
  if ((!canLoadLiveAds && !showDevBounds) || adCollapsed) {
    return null;
  }

  return (
    <aside
      aria-label={t.common.advertisement}
      className={`my-4 max-w-full min-w-0 select-none ${meta.containerClass} ${className}`}
    >
      <div className="mb-1 flex items-center justify-between px-1 text-[10px] tracking-wide text-[var(--text-secondary)]/55">
        <span>{t.common.advertisement}</span>
        {showDevBounds && <span className="font-mono">{meta.sizeLabel}</span>}
      </div>

      <div
        ref={containerRef}
        className={`relative flex w-full items-center justify-center overflow-hidden rounded-[var(--radius-control)] border transition-colors ${
          showDevBounds
            ? 'border-dashed border-[var(--accent)]/45 bg-[var(--bg-surface)]/75'
            : 'border-transparent bg-transparent'
        }`}
        style={{ minHeight: variant === 'skyscraper' ? '600px' : variant === 'rectangle' ? '250px' : '90px' }}
      >
        {canLoadLiveAds ? (
          <ins
            className="adsbygoogle block w-full"
            style={{ display: 'block', minHeight: 'inherit' }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={resolvedSlot}
            data-ad-format={meta.format}
            data-full-width-responsive="true"
          />
        ) : (
          <div className="flex flex-col items-center justify-center px-3 text-center text-[11px] text-[var(--text-secondary)]/75">
            <span className="font-medium">
              AdSense ({variant} · #{resolvedSlot})
            </span>
            <span className="font-mono text-[10px]">{meta.sizeLabel}</span>
          </div>
        )}
      </div>
    </aside>
  );
}
