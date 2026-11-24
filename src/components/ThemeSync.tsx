import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { DEFAULT_PAGE_THEMES, findThemePreset, resolvePageKey } from '../styles/themes';

export function ThemeSync() {
  const settings = useAppStore((s) => s.settings);
  const { pathname } = useLocation();
  const pageKey = resolvePageKey(pathname);

  const activeThemeId =
    settings.themeMode === 'per-page'
      ? (settings.pageThemes?.[pageKey] ?? DEFAULT_PAGE_THEMES[pageKey])
      : settings.themePreset;

  const preset = findThemePreset(activeThemeId, settings.customThemes);

  useEffect(() => {
    const root = document.documentElement;

    if (preset.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const accent = settings.customAccent || preset.accent;
    root.style.setProperty('--bg-canvas', settings.bgMode === 'solid' ? settings.customBgColor : preset.canvas);
    root.style.setProperty('--bg-surface', preset.surface);
    root.style.setProperty('--bg-elevated', preset.elevated);
    root.style.setProperty('--border-subtle', preset.border);
    root.style.setProperty('--text-primary', preset.textPrimary);
    root.style.setProperty('--text-secondary', preset.textSecondary);
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-fg', preset.accentFg);

    const radiusMap = {
      sharp: { card: '6px', control: '4px' },
      balanced: { card: '14px', control: '10px' },
      soft: { card: '22px', control: '14px' }
    }[settings.radiusScale];

    root.style.setProperty('--radius-card', radiusMap.card);
    root.style.setProperty('--radius-control', radiusMap.control);

    const densityMap = {
      compact: { pad: '0.875rem', gap: '0.625rem' },
      comfortable: { pad: '1.25rem', gap: '1rem' }
    }[settings.density];

    root.style.setProperty('--density-pad', densityMap.pad);
    root.style.setProperty('--density-gap', densityMap.gap);

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', preset.canvas);
  }, [preset, settings]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        background:
          settings.bgMode === 'solid'
            ? settings.customBgColor
            : settings.bgMode === 'gradient'
              ? settings.customBgGradient
              : preset.gradient
      }}
    >
      {settings.bgMode === 'image' && settings.customBgImageUrl.trim() !== '' && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-200"
          style={{
            backgroundImage: `url(${settings.customBgImageUrl})`,
            filter: `blur(${settings.bgBlur}px)`,
            opacity: settings.bgOpacity,
            transform: 'scale(1.06)'
          }}
        />
      )}
    </div>
  );
}
