import { useState } from 'react';
import { Palette, Plus, RotateCcw, Settings2, Trash2, X } from 'lucide-react';
import { LOCALE_REGISTRY, useT, type LocaleCode } from '../i18n';
import { isLocalPreviewHost } from '../lib/adsense';
import { useAppStore } from '../store/useAppStore';
import {
  DEFAULT_PAGE_THEMES,
  findThemePreset,
  THEME_PRESETS,
  type CalculatorPageKey,
  type ThemePreset
} from '../styles/themes';

interface ThemeStudioModalProps {
  open: boolean;
  onClose: () => void;
}

export function ThemeStudioModal({ open, onClose }: ThemeStudioModalProps) {
  const t = useT();
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const saveCustomTheme = useAppStore((s) => s.saveCustomTheme);
  const deleteCustomTheme = useAppStore((s) => s.deleteCustomTheme);
  const resetThemeSettings = useAppStore((s) => s.resetThemeSettings);

  const [activeTab, setActiveTab] = useState<'general' | 'themes'>('general');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [draftTheme, setDraftTheme] = useState<ThemePreset>({
    id: '',
    name: '',
    isDark: true,
    isCustom: true,
    canvas: '#0d0b14',
    surface: '#161321',
    elevated: '#211c30',
    border: 'rgba(139, 92, 246, 0.28)',
    textPrimary: '#f5f3ff',
    textSecondary: '#b7b0d1',
    accent: '#8b5cf6',
    accentFg: '#ffffff',
    gradient: 'linear-gradient(145deg, #0d0b14 0%, #1c1530 100%)'
  });

  if (!open) return null;

  const isLocal = isLocalPreviewHost();
  const builtInList = Object.values(THEME_PRESETS);
  const customList = settings.customThemes ?? [];
  const allThemes: ThemePreset[] = [...builtInList, ...customList];

  const handleSaveCustomTheme = () => {
    const id = draftTheme.id || `custom-${Date.now().toString(36)}`;
    const name = draftTheme.name.trim() || t.settingsModal.customThemeNamePlaceholder;
    const saved: ThemePreset = {
      ...draftTheme,
      id,
      name,
      isCustom: true,
      border: draftTheme.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.16)',
      textSecondary: draftTheme.isDark ? '#a1a1aa' : '#52525b',
      accentFg: '#ffffff',
      gradient: `linear-gradient(145deg, ${draftTheme.canvas} 0%, ${draftTheme.elevated} 100%)`
    };
    saveCustomTheme(saved);
    if (settings.themeMode === 'global') {
      updateSettings({ themePreset: id, customAccent: null });
    }
    setBuilderOpen(false);
  };

  const pageLabels: Record<CalculatorPageKey, string> = {
    hub: t.settingsModal.pageHub,
    spts: t.settingsModal.pageSpts,
    sptl: t.settingsModal.pageSptl,
    calc: t.settingsModal.pageCalc
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto overflow-x-hidden rounded-t-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-[var(--text-primary)] shadow-2xl sm:rounded-[var(--radius-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold">{t.settingsModal.title}</h2>
            <p className="text-xs text-[var(--text-secondary)]">{t.settingsModal.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Clean 2-tab switcher inside Settings */}
        <div className="mb-5 flex rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-1">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-control)] text-xs font-semibold transition-colors ${
              activeTab === 'general'
                ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>{t.settingsModal.tabGeneral}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('themes')}
            className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-control)] text-xs font-semibold transition-colors ${
              activeTab === 'themes'
                ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            <span>{t.settingsModal.tabThemes}</span>
          </button>
        </div>

        {activeTab === 'general' ? (
          <div className="space-y-6">
            {/* Language Switcher */}
            <section>
              <div className="mb-1 text-sm font-semibold">{t.settingsModal.language}</div>
              <p className="mb-2.5 text-xs text-[var(--text-secondary)]">{t.settingsModal.languageAutoNotice}</p>
              <div className="flex flex-wrap gap-2">
                {LOCALE_REGISTRY.map((loc) => {
                  const active = settings.language === loc.code;
                  return (
                    <button
                      key={loc.code}
                      type="button"
                      onClick={() =>
                        updateSettings({ language: loc.code as LocaleCode, languageAuto: false })
                      }
                      className={`flex min-h-[42px] items-center gap-2 rounded-[var(--radius-control)] border px-3.5 text-xs font-semibold transition-colors ${
                        active
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)]/40 hover:bg-[var(--bg-elevated)]/60'
                      }`}
                    >
                      <span className="font-mono uppercase">{loc.label}</span>
                      <span>{loc.nativeName}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Formatting & Display */}
            <section className="space-y-3 border-t border-[var(--border-subtle)] pt-4">
              <h3 className="text-sm font-semibold">{t.settingsModal.formattingTitle}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="block text-xs">
                  <span className="mb-1 block text-[var(--text-secondary)]">{t.settingsModal.numberNotation}</span>
                  <select
                    value={settings.numberNotation}
                    onChange={(e) =>
                      updateSettings({
                        numberNotation: e.target.value as 'standard' | 'american' | 'scientific'
                      })
                    }
                    className="min-h-[44px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 text-xs"
                  >
                    <option value="standard">{t.settingsModal.notationStandard}</option>
                    <option value="american">{t.settingsModal.notationAmerican}</option>
                    <option value="scientific">{t.settingsModal.notationScientific}</option>
                  </select>
                </label>

                <label className="block text-xs">
                  <span className="mb-1 block text-[var(--text-secondary)]">{t.settingsModal.decimals}</span>
                  <select
                    value={settings.numberDecimals}
                    onChange={(e) => updateSettings({ numberDecimals: Number(e.target.value) })}
                    className="min-h-[44px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 text-xs"
                  >
                    {[0, 1, 2, 3, 4].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs">
                  <span className="mb-1 block text-[var(--text-secondary)]">{t.settingsModal.timeFormat}</span>
                  <select
                    value={settings.timeStyle}
                    onChange={(e) => updateSettings({ timeStyle: e.target.value as 'units' | 'hours' })}
                    className="min-h-[44px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 text-xs"
                  >
                    <option value="units">{t.settingsModal.timeUnitsAuto}</option>
                    <option value="hours">{t.settingsModal.timeHoursTotal}</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] px-3 text-xs">
                  <input
                    type="checkbox"
                    checked={settings.showYearsAndMonths}
                    onChange={(e) => updateSettings({ showYearsAndMonths: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>{t.settingsModal.showYearsMonths}</span>
                </label>

                <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] px-3 text-xs">
                  <input
                    type="checkbox"
                    checked={settings.showEtaDate}
                    onChange={(e) => updateSettings({ showEtaDate: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>{t.settingsModal.showEta}</span>
                </label>

                <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] px-3 text-xs sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={settings.allowCookies === true}
                    onChange={(e) => updateSettings({ allowCookies: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>{t.settingsModal.allowCookies}</span>
                </label>
              </div>
            </section>

            {/* Ad Placement Bounds ONLY rendered when running on localhost / preview environment */}
            {isLocal && (
              <section className="space-y-2 border-t border-[var(--border-subtle)] pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  {t.settingsModal.devSectionTitle}
                </h3>
                <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-[var(--radius-control)] border border-dashed border-[var(--accent)]/40 px-3 text-xs">
                  <input
                    type="checkbox"
                    checked={settings.adPreviewMode}
                    onChange={(e) => updateSettings({ adPreviewMode: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>{t.settingsModal.showAdBounds}</span>
                </label>
              </section>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Theme Mode: Per-Calculator (Default) vs Global */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t.settingsModal.themeModeTitle}</h3>
                <button
                  type="button"
                  onClick={resetThemeSettings}
                  className="flex min-h-[36px] items-center gap-1 rounded-[var(--radius-control)] px-2.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t.settingsModal.resetAppearance}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => updateSettings({ themeMode: 'per-page' })}
                  className={`min-h-[44px] rounded-[var(--radius-control)] border px-3 py-2 text-left text-xs font-semibold ${
                    settings.themeMode === 'per-page'
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)]/40 text-[var(--text-secondary)]'
                  }`}
                >
                  {t.settingsModal.themeModePerPage}
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ themeMode: 'global' })}
                  className={`min-h-[44px] rounded-[var(--radius-control)] border px-3 py-2 text-left text-xs font-semibold ${
                    settings.themeMode === 'global'
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)]/40 text-[var(--text-secondary)]'
                  }`}
                >
                  {t.settingsModal.themeModeGlobal}
                </button>
              </div>

              {settings.themeMode === 'per-page' ? (
                <div className="space-y-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/40 p-3">
                  <div className="text-xs font-semibold text-[var(--text-secondary)]">
                    {t.settingsModal.assignPerPageTitle}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(Object.keys(DEFAULT_PAGE_THEMES) as CalculatorPageKey[]).map((pageKey) => {
                      const val = settings.pageThemes?.[pageKey] ?? DEFAULT_PAGE_THEMES[pageKey];
                      return (
                        <label key={pageKey} className="block text-xs">
                          <span className="mb-1 block text-[var(--text-secondary)]">{pageLabels[pageKey]}</span>
                          <select
                            value={val}
                            onChange={(e) =>
                              updateSettings({
                                pageThemes: { ...settings.pageThemes, [pageKey]: e.target.value }
                              })
                            }
                            className="min-h-[40px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-xs"
                          >
                            {allThemes.map((th) => (
                              <option key={th.id} value={th.id}>
                                {th.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">
                    {t.settingsModal.presets}
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {allThemes.map((preset) => {
                      const active = settings.themePreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => updateSettings({ themePreset: preset.id, customAccent: null })}
                          className={`flex min-h-[46px] items-center gap-2 rounded-[var(--radius-control)] border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                            active
                              ? 'border-[var(--accent)] bg-[var(--bg-elevated)]'
                              : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)]/40 hover:bg-[var(--bg-elevated)]/60'
                          }`}
                        >
                          <span
                            className="h-4 w-4 shrink-0 rounded-full border border-white/20"
                            style={{ backgroundColor: preset.accent }}
                          />
                          <span className="truncate">{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Custom Themes Creator */}
            <section className="space-y-3 border-t border-[var(--border-subtle)] pt-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{t.settingsModal.customThemesTitle}</h3>
                <button
                  type="button"
                  onClick={() => {
                    setDraftTheme({
                      id: '',
                      name: '',
                      isDark: true,
                      isCustom: true,
                      canvas: '#0d0b14',
                      surface: '#161321',
                      elevated: '#211c30',
                      border: 'rgba(139, 92, 246, 0.28)',
                      textPrimary: '#f5f3ff',
                      textSecondary: '#b7b0d1',
                      accent: '#8b5cf6',
                      accentFg: '#ffffff',
                      gradient: 'linear-gradient(145deg, #0d0b14 0%, #1c1530 100%)'
                    });
                    setBuilderOpen((v) => !v);
                  }}
                  className="flex min-h-[38px] items-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--accent)] px-3 text-xs font-semibold text-[var(--accent-fg)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t.settingsModal.createCustomTheme}</span>
                </button>
              </div>

              {customList.length > 0 && (
                <div className="space-y-1.5">
                  {customList.map((ct) => (
                    <div
                      key={ct.id}
                      className="flex items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/45 px-3 py-2 text-xs"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-4 w-4 shrink-0 rounded-full border border-white/20"
                          style={{ backgroundColor: ct.accent }}
                        />
                        <span className="truncate font-semibold">{ct.name}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateSettings({
                              themeMode: 'global',
                              themePreset: ct.id,
                              customAccent: null
                            })
                          }
                          className="rounded border border-[var(--border-subtle)] px-2 py-1 text-[11px] hover:border-[var(--accent)]"
                        >
                          {t.common.openTool}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCustomTheme(ct.id)}
                          aria-label={t.common.delete}
                          className="flex h-8 w-8 items-center justify-center rounded text-[var(--text-secondary)] hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {builderOpen && (
                <div className="space-y-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/60 p-3.5 text-xs">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-[var(--text-secondary)]">
                        {t.settingsModal.customThemeName}
                      </span>
                      <input
                        type="text"
                        value={draftTheme.name}
                        onChange={(e) => setDraftTheme((p) => ({ ...p, name: e.target.value }))}
                        placeholder={t.settingsModal.customThemeNamePlaceholder}
                        className="min-h-[40px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs"
                      />
                    </label>
                    <label className="flex min-h-[40px] cursor-pointer items-center gap-2 self-end">
                      <input
                        type="checkbox"
                        checked={draftTheme.isDark}
                        onChange={(e) =>
                          setDraftTheme((p) => ({
                            ...p,
                            isDark: e.target.checked,
                            canvas: e.target.checked ? '#0d0b14' : '#f7f7fb',
                            surface: e.target.checked ? '#161321' : '#ffffff',
                            elevated: e.target.checked ? '#211c30' : '#eeeef5',
                            textPrimary: e.target.checked ? '#f5f3ff' : '#18181b'
                          }))
                        }
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                      <span>{t.settingsModal.darkModeTheme}</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {(
                      [
                        { key: 'canvas', label: t.settingsModal.colorCanvas },
                        { key: 'surface', label: t.settingsModal.colorSurface },
                        { key: 'elevated', label: t.settingsModal.colorElevated },
                        { key: 'accent', label: t.settingsModal.colorAccent },
                        { key: 'textPrimary', label: t.settingsModal.colorTextPrimary }
                      ] as const
                    ).map((field) => (
                      <label key={field.key} className="block">
                        <span className="mb-1 block truncate text-[11px] text-[var(--text-secondary)]">
                          {field.label}
                        </span>
                        <input
                          type="color"
                          value={draftTheme[field.key]}
                          onChange={(e) =>
                            setDraftTheme((p) => ({ ...p, [field.key]: e.target.value }))
                          }
                          className="h-10 w-full cursor-pointer rounded border border-[var(--border-subtle)] bg-transparent p-0.5"
                        />
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setBuilderOpen(false)}
                      className="min-h-[38px] rounded-[var(--radius-control)] border border-[var(--border-subtle)] px-3 text-xs"
                    >
                      {t.common.close}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCustomTheme}
                      className="min-h-[38px] rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent-fg)]"
                    >
                      {t.settingsModal.saveCustomTheme}
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Accent Override, Radius & Backdrop */}
            <section className="grid grid-cols-1 gap-4 border-t border-[var(--border-subtle)] pt-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                  {t.settingsModal.accentColor}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={
                      settings.customAccent ||
                      findThemePreset(settings.themePreset, customList).accent
                    }
                    onChange={(e) => updateSettings({ customAccent: e.target.value })}
                    className="h-11 w-14 cursor-pointer rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-transparent p-1"
                  />
                  <button
                    type="button"
                    onClick={() => updateSettings({ customAccent: null })}
                    className="min-h-[44px] rounded-[var(--radius-control)] border border-[var(--border-subtle)] px-3 text-xs"
                  >
                    {t.settingsModal.usePresetAccent}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                  {t.settingsModal.radiusDensity}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={settings.radiusScale}
                    onChange={(e) =>
                      updateSettings({ radiusScale: e.target.value as 'sharp' | 'balanced' | 'soft' })
                    }
                    className="min-h-[44px] rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 text-xs"
                  >
                    <option value="sharp">{t.settingsModal.radiusSharp}</option>
                    <option value="balanced">{t.settingsModal.radiusBalanced}</option>
                    <option value="soft">{t.settingsModal.radiusSoft}</option>
                  </select>
                  <select
                    value={settings.density}
                    onChange={(e) =>
                      updateSettings({ density: e.target.value as 'compact' | 'comfortable' })
                    }
                    className="min-h-[44px] rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 text-xs"
                  >
                    <option value="compact">{t.settingsModal.densityCompact}</option>
                    <option value="comfortable">{t.settingsModal.densityComfortable}</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-3 border-t border-[var(--border-subtle)] pt-4">
              <h3 className="text-sm font-semibold">{t.settingsModal.backdropMode}</h3>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { id: 'preset', label: t.settingsModal.backdropPreset },
                    { id: 'solid', label: t.settingsModal.backdropSolid },
                    { id: 'gradient', label: t.settingsModal.backdropGradient },
                    { id: 'image', label: t.settingsModal.backdropImage }
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => updateSettings({ bgMode: mode.id })}
                    className={`min-h-[42px] rounded-[var(--radius-control)] border px-2 text-xs font-semibold ${
                      settings.bgMode === mode.id
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)]/40'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {settings.bgMode === 'solid' && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-secondary)]">{t.settingsModal.solidColor}</span>
                  <input
                    type="color"
                    value={settings.customBgColor}
                    onChange={(e) => updateSettings({ customBgColor: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded border border-[var(--border-subtle)] bg-transparent p-1"
                  />
                </div>
              )}

              {settings.bgMode === 'gradient' && (
                <input
                  type="text"
                  value={settings.customBgGradient}
                  onChange={(e) => updateSettings({ customBgGradient: e.target.value })}
                  placeholder="linear-gradient(145deg, #0b090a 0%, #1c1026 100%)"
                  className="min-h-[44px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 font-mono text-xs"
                />
              )}

              {settings.bgMode === 'image' && (
                <div className="space-y-2.5">
                  <input
                    type="url"
                    value={settings.customBgImageUrl}
                    onChange={(e) => updateSettings({ customBgImageUrl: e.target.value })}
                    placeholder="https://... or /images/rbxc_banner.png"
                    className="min-h-[44px] w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <label className="block">
                      <span className="mb-1 block text-[var(--text-secondary)]">
                        {t.settingsModal.blurLabel}: {settings.bgBlur}px
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={24}
                        value={settings.bgBlur}
                        onChange={(e) => updateSettings({ bgBlur: Number(e.target.value) })}
                        className="w-full"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[var(--text-secondary)]">
                        {t.settingsModal.opacityLabel}: {Math.round(settings.bgOpacity * 100)}%
                      </span>
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={settings.bgOpacity}
                        onChange={(e) => updateSettings({ bgOpacity: Number(e.target.value) })}
                        className="w-full"
                      />
                    </label>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
