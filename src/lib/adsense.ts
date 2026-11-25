export const ADSENSE_CLIENT = 'ca-pub-5853668593158059';
export const ADSENSE_DEFAULT_SLOT = '8140874157';
export const GA_MEASUREMENT_ID = 'G-G39QVHHJ3D';

/**
 * Per-placement AdSense Slot IDs from Google AdSense dashboard:
 * - leaderboard: RBXC Leaderboard (3057145739)
 * - rectangle: RBXC Rectangle (9582512287)
 * - skyscraper: RBXC Skyscraper (3520180166)
 * - infeed: adaptive fallback unit (8140874157)
 */
export const ADSENSE_SLOTS = {
  leaderboard: '3057145739',
  rectangle: '9582512287',
  skyscraper: '3520180166',
  infeed: ADSENSE_DEFAULT_SLOT
} as const;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let adsScriptPromise: Promise<void> | null = null;
let gaLoaded = false;

export function ensureGoogleAnalytics(consentGranted: boolean) {
  if (!consentGranted || gaLoaded || typeof window === 'undefined' || !navigator.onLine) return;
  gaLoaded = true;

  const gaScript = document.createElement('script');
  gaScript.async = true;
  gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(gaScript);

  gaScript.onload = () => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
  };
}

export function ensureAdSenseScript(consentGranted: boolean): Promise<void> {
  if (!consentGranted || typeof window === 'undefined' || !navigator.onLine) {
    return Promise.resolve();
  }
  if (adsScriptPromise) return adsScriptPromise;

  const existing = document.querySelector(
    'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
  );
  if (existing) {
    adsScriptPromise = Promise.resolve();
    return adsScriptPromise;
  }

  adsScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`;
    s.crossOrigin = 'anonymous';
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });

  return adsScriptPromise;
}

export function isLocalPreviewHost(): boolean {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.run.app');
}
