import { useEffect, useRef } from 'react';
import {
  createDefaultProfile,
  DEFAULT_SETTINGS,
  normalizeProfile,
  useAppStore,
  type AppSettings,
  type PlayerProfile
} from '../store/useAppStore';

interface UrlPayload {
  p?: Partial<PlayerProfile>;
  s?: Partial<AppSettings>;
  inc?: boolean;
}

function encodeBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64Url(b64u: string): string {
  const padLen = (4 - (b64u.length % 4)) % 4;
  const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLen);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function diffObject<T extends Record<string, unknown>>(obj: T, base: T): Partial<T> | undefined {
  const out: Record<string, unknown> = {};
  let hasKeys = false;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const baseVal = base[key];
    if (val === baseVal) continue;
    if (
      val &&
      baseVal &&
      typeof val === 'object' &&
      typeof baseVal === 'object' &&
      !Array.isArray(val) &&
      !Array.isArray(baseVal)
    ) {
      const nested = diffObject(val as Record<string, unknown>, baseVal as Record<string, unknown>);
      if (nested !== undefined) {
        out[key] = nested;
        hasKeys = true;
      }
    } else if (Array.isArray(val) && Array.isArray(baseVal) && val.length === 0 && baseVal.length === 0) {
      continue;
    } else if (val !== undefined) {
      out[key] = val;
      hasKeys = true;
    }
  }
  return hasKeys ? (out as Partial<T>) : undefined;
}

export function hydrateStateFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('state');
  let hydrated = false;

  if (encoded) {
    try {
      const raw = decodeBase64Url(encoded);
      const payload = JSON.parse(raw) as UrlPayload;
      const store = useAppStore.getState();

      if (payload.s) {
        store.updateSettings(payload.s);
      }
      if (typeof payload.inc === 'boolean' && payload.inc !== store.isIncognito) {
        store.toggleIncognito();
      }
      if (payload.p) {
        const current = store.getActiveProfile();
        const merged = normalizeProfile(
          {
            ...current,
            ...payload.p,
            spts: { ...current.spts, ...(payload.p.spts ?? {}) },
            sptsUi: { ...current.sptsUi, ...(payload.p.sptsUi ?? {}) },
            grindSession: { ...current.grindSession, ...(payload.p.grindSession ?? {}) },
            sptl: { ...current.sptl, ...(payload.p.sptl ?? {}) },
            calcUi: { ...current.calcUi, ...(payload.p.calcUi ?? {}) }
          },
          current.id,
          payload.p.name ?? current.name
        );
        store.updateActiveProfile(() => merged);
      }
      hydrated = true;
    } catch {
      // Ignore malformed URL payloads gracefully
    }
  }

  // Also allow readable SEO/deep query shortcuts (?tab=pvp&stat=BT&goal=1Qa)
  const qTab = params.get('tab');
  const qStat = params.get('stat');
  const qGoal = params.get('goal');
  if (qTab || qStat || qGoal) {
    const store = useAppStore.getState();
    store.updateActiveProfile((prev) => {
      const nextStat =
        qStat === 'FS' || qStat === 'BT' || qStat === 'PP' || qStat === 'MS' || qStat === 'JF'
          ? qStat
          : prev.sptsUi.statType;
      const nextGoal = qGoal ?? prev.sptsUi.statGoals?.[nextStat] ?? prev.sptsUi.goalValueRaw;
      return {
        ...prev,
        sptsUi: {
          ...prev.sptsUi,
          tab:
            qTab === 'stats' || qTab === 'tokens' || qTab === 'playtime' || qTab === 'pvp' || qTab === 'wiki'
              ? qTab
              : prev.sptsUi.tab,
          statType: nextStat,
          goalValueRaw: nextGoal,
          statGoals: {
            ...prev.sptsUi.statGoals,
            [nextStat]: nextGoal
          }
        }
      };
    });
    hydrated = true;
  }

  return hydrated;
}

export function useUrlStateSync() {
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!hydratedRef.current) {
      hydrateStateFromUrl();
      hydratedRef.current = true;
    }

    const defaultProfile = createDefaultProfile('main', 'Main');
    let timer: number | undefined;

    const writeUrl = () => {
      const state = useAppStore.getState();
      const active = state.getActiveProfile();
      const pDiff = diffObject(
        active as unknown as Record<string, unknown>,
        { ...defaultProfile, id: active.id, name: active.name } as unknown as Record<string, unknown>
      ) as Partial<PlayerProfile> | undefined;

      // Exclude volatile timestamp-only churn unless grind is running
      const sDiff = diffObject(
        state.settings as unknown as Record<string, unknown>,
        DEFAULT_SETTINGS as unknown as Record<string, unknown>
      ) as Partial<AppSettings> | undefined;

      const payload: UrlPayload = {};
      if (pDiff && Object.keys(pDiff).length > 0) payload.p = pDiff;
      if (sDiff && Object.keys(sDiff).length > 0) payload.s = sDiff;
      if (state.isIncognito) payload.inc = true;

      const url = new URL(window.location.href);
      if (Object.keys(payload).length === 0) {
        url.searchParams.delete('state');
      } else {
        const encoded = encodeBase64Url(JSON.stringify(payload));
        if (encoded.length < 3500) {
          url.searchParams.set('state', encoded);
        }
      }

      // Mirror key readable parameters when non-default for human sharing
      if (active.sptsUi.tab !== 'stats') url.searchParams.set('tab', active.sptsUi.tab);
      else url.searchParams.delete('tab');

      if (active.sptsUi.statType !== 'FS') url.searchParams.set('stat', active.sptsUi.statType);
      else url.searchParams.delete('stat');

      const activeGoalRaw = (
        active.sptsUi.statGoals?.[active.sptsUi.statType] ?? active.sptsUi.goalValueRaw
      ).trim();
      if (activeGoalRaw) url.searchParams.set('goal', activeGoalRaw);
      else url.searchParams.delete('goal');

      const nextRelative = `${url.pathname}${url.search}${url.hash}`;
      const currRelative = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextRelative !== currRelative) {
        window.history.replaceState(null, '', nextRelative);
      }
    };

    const scheduleSync = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(writeUrl, 250);
    };

    const unsub = useAppStore.subscribe(scheduleSync);
    return () => {
      unsub();
      if (timer) window.clearTimeout(timer);
    };
  }, []);
}
