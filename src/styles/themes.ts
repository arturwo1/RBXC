export type BuiltInThemeId =
  | 'rbxc-crimson'
  | 'spts-gold-dark'
  | 'spts-light'
  | 'sptl-void'
  | 'amoled-minimal'
  | 'cyber-neon';

export type ThemePresetId = BuiltInThemeId | string;
export type CalculatorPageKey = 'hub' | 'spts' | 'sptl' | 'calc';

export interface ThemePreset {
  id: string;
  name: string;
  isDark: boolean;
  isCustom?: boolean;
  canvas: string;
  surface: string;
  elevated: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentFg: string;
  gradient: string;
}

export const DEFAULT_PAGE_THEMES: Record<CalculatorPageKey, BuiltInThemeId> = {
  hub: 'rbxc-crimson',
  spts: 'spts-gold-dark',
  sptl: 'sptl-void',
  calc: 'amoled-minimal'
};

export function resolvePageKey(pathname: string): CalculatorPageKey {
  const clean = pathname.toLowerCase();
  if (clean.startsWith('/sptsc')) return 'spts';
  if (clean.startsWith('/sptlc')) return 'sptl';
  if (clean.startsWith('/calculator') || clean.startsWith('/help')) return 'calc';
  return 'hub';
}

export const THEME_PRESETS: Record<BuiltInThemeId, ThemePreset> = {
  'rbxc-crimson': {
    id: 'rbxc-crimson',
    name: 'RBXC Crimson',
    isDark: true,
    canvas: '#0b090a',
    surface: '#141012',
    elevated: '#1d1619',
    border: 'rgba(220, 38, 38, 0.22)',
    textPrimary: '#f6f2f3',
    textSecondary: '#b8a9ad',
    accent: '#dc2626',
    accentFg: '#ffffff',
    gradient: 'linear-gradient(145deg, #0b090a 0%, #1a0b0e 55%, #0b090a 100%)'
  },
  'spts-gold-dark': {
    id: 'spts-gold-dark',
    name: 'SPTS Gold Dark',
    isDark: true,
    canvas: '#12110f',
    surface: '#1b1814',
    elevated: '#26211a',
    border: 'rgba(245, 158, 11, 0.26)',
    textPrimary: '#f7f4ec',
    textSecondary: '#c4b89f',
    accent: '#f59e0b',
    accentFg: '#14110b',
    gradient: 'linear-gradient(145deg, #12110f 0%, #221b12 55%, #12110f 100%)'
  },
  'spts-light': {
    id: 'spts-light',
    name: 'SPTS Light',
    isDark: false,
    canvas: '#f8f6f2',
    surface: '#ffffff',
    elevated: '#f1ede5',
    border: 'rgba(180, 110, 12, 0.22)',
    textPrimary: '#1c1917',
    textSecondary: '#57534e',
    accent: '#d97706',
    accentFg: '#ffffff',
    gradient: 'linear-gradient(145deg, #f8f6f2 0%, #efe6d7 100%)'
  },
  'sptl-void': {
    id: 'sptl-void',
    name: 'SPTL Void',
    isDark: true,
    canvas: '#08070f',
    surface: '#100e1c',
    elevated: '#19152d',
    border: 'rgba(139, 92, 246, 0.28)',
    textPrimary: '#f3f1ff',
    textSecondary: '#b2aad4',
    accent: '#8b5cf6',
    accentFg: '#ffffff',
    gradient: 'linear-gradient(145deg, #08070f 0%, #151030 55%, #08070f 100%)'
  },
  'amoled-minimal': {
    id: 'amoled-minimal',
    name: 'AMOLED Minimal',
    isDark: true,
    canvas: '#000000',
    surface: '#0a0a0c',
    elevated: '#131317',
    border: 'rgba(255, 255, 255, 0.14)',
    textPrimary: '#fafafa',
    textSecondary: '#a1a1aa',
    accent: '#3b82f6',
    accentFg: '#ffffff',
    gradient: 'linear-gradient(180deg, #000000 0%, #09090b 100%)'
  },
  'cyber-neon': {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    isDark: true,
    canvas: '#060c12',
    surface: '#0c1620',
    elevated: '#132230',
    border: 'rgba(6, 182, 212, 0.28)',
    textPrimary: '#ecfeff',
    textSecondary: '#94b8c7',
    accent: '#06b6d4',
    accentFg: '#041318',
    gradient: 'linear-gradient(145deg, #060c12 0%, #0c1f2b 55%, #060c12 100%)'
  }
};

export function findThemePreset(id: string, customThemes: ThemePreset[] = []): ThemePreset {
  if (id in THEME_PRESETS) {
    return THEME_PRESETS[id as BuiltInThemeId];
  }
  const custom = customThemes.find((c) => c.id === id);
  return custom ?? THEME_PRESETS['rbxc-crimson'];
}
