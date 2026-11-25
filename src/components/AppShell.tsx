import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Calculator as CalcIcon,
  EyeOff,
  Flame,
  Home,
  RotateCcw,
  Settings,
  Sparkles,
  User,
  Zap
} from 'lucide-react';
import { LOCALE_REGISTRY, useT } from '../i18n';
import { ensureGoogleAnalytics } from '../lib/adsense';
import { useUrlStateSync } from '../lib/urlSync';
import { useActiveProfile, useAppStore } from '../store/useAppStore';
import { AdSlot } from './AdSlot';
import { ThemeSync } from './ThemeSync';

const ProfileControlsModal = lazy(() =>
  import('./ProfileControlsModal').then((m) => ({ default: m.ProfileControlsModal }))
);
const ThemeStudioModal = lazy(() =>
  import('./ThemeStudioModal').then((m) => ({ default: m.ThemeStudioModal }))
);

interface AppShellProps {
  children: ReactNode;
  hideAds?: boolean;
}

export function AppShell({ children, hideAds = false }: AppShellProps) {
  useUrlStateSync();

  const t = useT();
  const location = useLocation();
  const isIncognito = useAppStore((s) => s.isIncognito);
  const toggleIncognito = useAppStore((s) => s.toggleIncognito);
  const resetIncognitoToZero = useAppStore((s) => s.resetIncognitoToZero);
  const activeProfile = useActiveProfile();
  const allowCookies = useAppStore((s) => s.settings.allowCookies);
  const language = useAppStore((s) => s.settings.language);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const navItems = [
    { to: '/', label: t.nav.hub, shortLabel: t.nav.hub, icon: Home },
    { to: '/sptsc/', label: t.nav.sptsClassic, shortLabel: t.nav.sptsShort, icon: Zap },
    { to: '/spts/', label: t.nav.newSpts, shortLabel: t.nav.newSptsShort, icon: Flame },
    { to: '/sptlc/', label: t.nav.sptl, shortLabel: t.nav.sptl, icon: Sparkles },
    { to: '/calculator/', label: t.nav.calculator, shortLabel: t.nav.calcShort, icon: CalcIcon },
    { to: '/help/', label: t.nav.help, shortLabel: t.nav.help, icon: BookOpen }
  ];

  useEffect(() => {
    if (allowCookies === true) {
      ensureGoogleAnalytics(true);
    }
  }, [allowCookies]);

  const isRouteActive = (target: string) => {
    const cleanCurrent = location.pathname.replace(/\/+$/, '') || '/';
    const cleanTarget = target.replace(/\/+$/, '') || '/';
    return cleanCurrent === cleanTarget;
  };

  const cycleLanguage = () => {
    const idx = LOCALE_REGISTRY.findIndex((l) => l.code === language);
    const next = LOCALE_REGISTRY[(idx + 1) % LOCALE_REGISTRY.length];
    updateSettings({ language: next.code, languageAuto: false });
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full max-w-full flex-col overflow-x-clip text-[var(--text-primary)]">
      <ThemeSync />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 h-[54px] w-full border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/92 backdrop-blur-md">
        <div className="mx-auto flex h-full w-full max-w-[1600px] items-center justify-between gap-2 px-2.5 sm:gap-4 sm:px-6 lg:gap-8">
          <Link
            to="/"
            className="font-display flex min-w-0 shrink items-center truncate text-base font-extrabold tracking-tight whitespace-nowrap text-[var(--text-primary)] sm:text-lg"
          >
            <span className="sm:hidden">{t.nav.brandShort}</span>
            <span className="hidden sm:inline">{t.nav.brand}</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => {
              const active = isRouteActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`shrink-0 whitespace-nowrap border-b-2 py-1 text-sm font-medium transition-colors ${
                    active
                      ? 'border-[var(--accent)] text-[var(--text-primary)]'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="flex min-h-[38px] max-w-[92px] min-[390px]:max-w-[130px] sm:max-w-[180px] items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 sm:px-2.5 text-xs font-semibold whitespace-nowrap transition-colors hover:border-[var(--accent)]/60"
            >
              {activeProfile.avatarUrl && !isIncognito ? (
                <img
                  src={activeProfile.avatarUrl}
                  alt={activeProfile.name}
                  referrerPolicy="no-referrer"
                  className="h-4 w-4 shrink-0 rounded-full object-cover"
                />
              ) : (
                <User className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
              )}
              <span className="truncate">{isIncognito ? t.nav.incognito : activeProfile.name}</span>
            </button>

            <button
              type="button"
              onClick={toggleIncognito}
              title={t.nav.incognito}
              aria-label={t.nav.incognito}
              className={`flex min-h-[38px] min-w-[38px] items-center justify-center gap-1 rounded-[var(--radius-control)] border px-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                isIncognito
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <EyeOff className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden lg:inline">{t.nav.incognito}</span>
            </button>

            {isIncognito && (
              <button
                type="button"
                onClick={resetIncognitoToZero}
                title={t.nav.resetSandbox}
                aria-label={t.nav.resetSandbox}
                className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={cycleLanguage}
              title={t.settingsModal.language}
              aria-label={t.settingsModal.language}
              className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 font-mono text-[11px] font-bold uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              {language}
            </button>

            <button
              type="button"
              onClick={() => setSettingsModalOpen(true)}
              aria-label={t.nav.settings}
              className="flex min-h-[38px] min-w-[38px] items-center justify-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 sm:px-2.5 text-xs font-semibold whitespace-nowrap text-[var(--text-secondary)] hover:border-[var(--accent)]/60 hover:text-[var(--text-primary)]"
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{t.nav.settings}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main 3-Zone Responsive Shell */}
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 items-start justify-center gap-6 px-3 py-4 pb-24 sm:px-6 sm:py-5 md:pb-10">
        {!hideAds && (
          <div className="sticky top-[74px] hidden shrink-0 min-[1360px]:block">
            <AdSlot variant="skyscraper" />
          </div>
        )}

        <main className="w-full min-w-0 max-w-6xl flex-1">{children}</main>

        {!hideAds && (
          <div className="sticky top-[74px] hidden shrink-0 min-[1360px]:block">
            <AdSlot variant="skyscraper" />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 pb-20 md:pb-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-[var(--text-secondary)] sm:flex-row">
          <div>
            <span>{t.nav.madeBy} </span>
            <Link to="/arturwol/" className="font-semibold text-[var(--text-primary)] hover:underline">
              @arturwol
            </Link>
            <span aria-hidden="true"> · </span>
            <span>{t.nav.allRights}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/help/" className="hover:text-[var(--text-primary)] hover:underline">
              {t.nav.help}
            </Link>
            <Link to="/privacy/" className="hover:text-[var(--text-primary)] hover:underline">
              {t.common.privacyLink}
            </Link>
            <Link to="/arturwol/" className="hover:text-[var(--text-primary)] hover:underline">
              @arturwol
            </Link>
            <a
              href="https://github.com/arturwo1/RBXC"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--text-primary)] hover:underline"
            >
              GitHub
            </a>
            <a
              href="https://discord.gg/MXupeAApza"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--text-primary)] hover:underline"
            >
              Discord
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Thumb-Zone Navigation (< 768px) — strict min-w-0 per cell so labels never overflow */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-30 grid h-[56px] w-full max-w-full grid-cols-6 overflow-hidden border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md md:hidden"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isRouteActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex min-h-[44px] min-w-0 w-full flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-semibold transition-colors ${
                active ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="max-w-full truncate">{item.shortLabel ?? item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Non-blocking Cookie Consent Strip */}
      {allowCookies === null && (
        <div
          role="dialog"
          aria-label="Cookie preferences"
          className="fixed bottom-16 right-3 left-3 z-40 mx-auto max-w-lg rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-xl md:bottom-4 md:left-auto md:right-4"
        >
          <p className="mb-3 text-xs leading-relaxed text-[var(--text-secondary)]">
            {t.common.cookieNotice}{' '}
            <Link to="/privacy/" className="text-[var(--text-primary)] underline">
              {t.common.privacyLink}
            </Link>
            .
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => updateSettings({ allowCookies: false })}
              className="min-h-[40px] rounded-[var(--radius-control)] border border-[var(--border-subtle)] px-3.5 text-xs font-semibold text-[var(--text-secondary)]"
            >
              {t.common.decline}
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ allowCookies: true })}
              className="min-h-[40px] rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent-fg)]"
            >
              {t.common.accept}
            </button>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        {profileModalOpen && (
          <ProfileControlsModal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
        )}
        {settingsModalOpen && (
          <ThemeStudioModal open={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
        )}
      </Suspense>
    </div>
  );
}
