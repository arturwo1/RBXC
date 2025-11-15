const gtagcode = 'G-G39QVHHJ3D';

const tabConfigs = {
  stats: {
    elementId: "stats-tab",
    title: "Stats Calculator",
    key: "Stats",
    showCalc: true
  },
  tokens: {
    elementId: "tokens-tab",
    title: "Tokens Calculator",
    key: "Tokens",
    showCalc: true
  },
  calculator: {
    elementId: "calculator-tab",
    title: "Calculator",
    key: "Calculator",
    showCalc: true
  },
  calculators: {
    elementId: "calculators-tab",
    title: "All Calculators",
    key: "Calculators",
    showCalc: false
  },
  about: {
    elementId: "about-tab",
    title: "About",
    key: "About",
    showCalc: false
  },
  settings: {
    elementId: "settings-tab",
    title: "Settings",
    key: "Settings",
    showCalc: false
  }
};

export const numberUNITS = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg', 'Uvg', 'Dvg', 'Tvg', 'Qavg', 'Qivg', 'Sxvg', 'Spvg', 'Ocvg', 'Novg', 'Tg', 'Ce']

export const timeUNITS = {
  qs: 1e-30,         // quectosecond
  rs: 1e-27,         // rontosecond
  ys: 1e-24,         // yoctosecond
  zs: 1e-21,         // zeptosecond
  as: 1e-18,         // attosecond
  fs: 1e-15,         // femtosecond
  ps: 1e-12,         // picosecond
  ns: 1e-9,          // nanosecond
  us: 1e-6,          // microsecond
  ms: 1e-3,          // millisecond
  s: 1,             // second
  m: 60,            // minute
  h: 3600,          // hour
  d: 86400,         // day
  w: 604800,        // week
  mo: 2629746,       // month ~ 30.44 days
  y: 31557600,       // year ~ 365.25 days
  dec: 315576000,    // decade (10 years)
  c: 3155760000,     // century (100 years)
  ky: 3.15576e10,       // kilo-year (1K years)
  My: 3.15576e13,       // mega-year (1M years)
  Gy: 3.15576e16,       // giga-year (1B years)
  Ty: 3.15576e19,       // tera-year (1T years)
  Py: 3.15576e22,       // peta-year (1Qa years)
  Ey: 3.15576e25,       // exa-year (1Qi years)
  Zy: 3.15576e28,       // zetta-year (1Sx years)
  Yy: 3.15576e31,       // yotta-year (1Sp years)
  Ry: 3.15576e34,       // ronna-year (1Oc years)
  Qy: 3.15576e37        // quetta-year (1No years)
};

export const timeAbbreviations = {
  qs: 'quectosecond',
  rs: 'rontosecond',
  ys: 'yoctosecond',
  zs: 'zeptosecond',
  as: 'attosecond',
  fs: 'femtosecond',
  ps: 'picosecond',
  ns: 'nanosecond',
  us: 'microsecond',
  ms: 'millisecond',
  s: 'second',
  m: 'minute',
  h: 'hour',
  d: 'day',
  w: 'week',
  mo: 'month',
  y: 'year',
  dec: 'decade',
  c: 'century',
  ky: 'kilo-year',
  My: 'mega-year',
  Gy: 'giga-year',
  Ty: 'tera-year',
  Py: 'peta-year',
  Ey: 'exa-year',
  Zy: 'zetta-year',
  Yy: 'yotta-year',
  Ry: 'ronna-year',
  Qy: 'quetta-year'
};

export const suffixes = Object.fromEntries(
  numberUNITS.map((s, i) => [s.toLowerCase(), 10 ** (i * 3)])
);

export const multis = {
  "x1": 1,
  "x2": 2,
  "x4": 4,
  "x8": 8,
  "x16": 16,
  "x32": 32,
  "x64": 64,
  "x128": 128,
  "x256": 256,
  "x512": 512,
  "x1024": 1024,
  "x2048": 2048,
  "x4096": 4096,
  "x8192": 8192,
  "x16384": 16384,
  "x32768": 32768,
  "x65536": 65536,
  "x131072": 131072,
  "x262144": 262144,
  "x524288": 524288,
  "x1048576": 1048576,
  "x2097152": 2097152,
  "x4194304": 4194304,
  "x8388608": 8388608,
  "x16777216": 16777216,
  "x33554432": 33554432,
  "x67108864": 67108864,
  "x134217728": 134217728,
  "x268435456": 268435456,
  "x536870912": 536870912,
  "x1073741824": 1073741824,
  "x2147483648": 2147483648,
  "x4294967296": 4294967296,
  "x8589934592": 8589934592,
  "x17179869184": 17179869184,
  "x34359738368": 34359738368,
  "x68719476736": 68719476736,
  "x137438953472": 137438953472,
  "x274877906944": 274877906944,
  "x549755813888": 549755813888,
  "x1099511627776": 1099511627776
};

export const prices = {
  1: 0,
  2: 100,
  4: 200,
  8: 500,
  16: 1000,
  32: 2000,
  64: 5000,
  128: 10000,
  256: 15000,
  512: 20000,
  1024: 50000,
  2048: 100000,
  4096: 200000,
  8192: 500000,
  16384: 1000000,
  32768: 2000000,
  65536: 5000000,
  131072: 10000000,
  262144: 20000000,
  524288: 50000000,
  1048576: 100000000,
  2097152: 200000000,
  4194304: 500000000,
  8388608: 1000000000,
  16777216: 2000000000,
  33554432: 5000000000,
  67108864: 10000000000,
  134217728: 20000000000,
  268435456: 50000000000,
  536870912: 100000000000,
  1073741824: 200000000000,
  2147483648: 500000000000,
  4294967296: 1000000000000,
  8589934592: 2000000000000,
  17179869184: 5000000000000,
  34359738368: 10000000000000,
  68719476736: 20000000000000,
  137438953472: 50000000000000,
  274877906944: 100000000000000,
  549755813888: 200000000000000,
  1099511627776: 500000000000000
};

export const SPTSCPPMultis = {
  "Psychic Island 1 Million": "x1000000",
  "Psychic Island 1 Billion": "x1000000000",
  "Psychic Island 1 Trillion": "x1000000000000",
  "Psychic Island 1 Qa": "x1000000000000000"
};

export const SPTSCBTMultis = {
  "The Ice Pool": "x5",
  "The Fire Pit": "x10",
  "The Iceberg": "x20",
  "The Tornado": "x50",
  "The Volcano": "x100",
  "The Hellfire Pit": "x2000",
  "The Green Acid Pool": "x40000",
  "The Red Acid Pool": "x800000"
};

export const SPTSCFSMultis = {
  "The Rock": "x10",
  "The Crystal": "x100",
  "Blue God Star": "x2000",
  "Green God Star": "x40000",
  "Red God Star": "x800000"
};

function _hasConsent() {
  return localStorage.getItem('allowCookies') === 'true';
}

function _gtagAvailable() {
  return typeof window.gtag === 'function' && navigator.onLine;
}

function getShowYearsAndMonths() {
  const page = (window.location.pathname.split('/').filter(Boolean)[0] || '/').toLowerCase();
  const keys = {
    sptsc: 'SPTSShowYearsAndMonths',
    sptlc: 'SPTLShowYearsAndMonths',
    calculator: 'CShowYearsAndMonths'
  };
  return localStorage.getItem(keys[page]) === 'true';
}

export function sendAnalyticsEvent(category, action, label, value) {
  try {
    if (!_hasConsent()) return;
    if (!_gtagAvailable()) return;

    const payload = {
      event_category: category,
      event_label: label || undefined,
      value: typeof value === 'number' ? Math.round(value) : undefined,
      non_personalized_ads: true,
      anonymize_ip: true
    };

    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
    window.gtag('event', action, payload);
  } catch (e) {
    console.warn('Analytics send failed', e);
  }
}

export function switchTab(tabName) {
  const allTabs = document.querySelectorAll(".tab");

  Object.values(tabConfigs).forEach(cfg => {
    if (cfg.elementId) {
      const el = document.getElementById(cfg.elementId);
      if (el) el.style.display = "none";
    }
  });
  allTabs.forEach(t => t.classList.remove("active"));

  const cfg = tabConfigs[tabName] || tabConfigs.settings;

  const tabEl = document.getElementById(cfg.elementId);
  if (tabEl) tabEl.style.display = "block";

  const tabButton = document.querySelector(`.tab[data-key="${cfg.key}"]`);
  if (tabButton) tabButton.classList.add("active");

  const header = document.querySelector("h1");
  if (header) header.textContent = cfg.title;

  const calcBtn = document.getElementById("Calculate");
  const resultEl = document.getElementById("result");

  if (calcBtn) calcBtn.style.display = cfg.showCalc ? "block" : "none";
  if (resultEl) resultEl.style.display = cfg.showCalc ? "block" : "none";

  sendAnalyticsEvent('navigation', 'switch_tab', cfg.key);
}

export function parseNumber(value) {
  if (value == null) return 0;
  value = String(value).trim().replace(/\s+/g, '').toLowerCase();
  if (value === '') return 0;
  value = value.replace(/,/g, '.').replace(/qn/g, "qi").replace(/qd/g, "qa");

  const m = value.match(/^([\d.]+)([a-z]*)$/);
  if (!m) return Number(value) || 0;

  const num = parseFloat(m[1]);
  const suf = m[2] || '';
  const mult = suffixes[suf] ?? 1;
  const result = num * mult;

  sendAnalyticsEvent('ui', 'parse_number', result + ' || ' + value);
  return result;
}

export function formatNumber(n) {
  if (!isFinite(n)) return '—';
  const neg = n < 0;
  if (neg) n = -n;

  let i = 0;
  while (n >= 1000 && i < numberUNITS.length - 1) {
    n /= 1000;
    i++;
  }

  const s = n.toFixed(2).replace(/\.00$/, '');
  const result = (neg ? '-' : '') + s + numberUNITS[i];

  sendAnalyticsEvent('ui', 'format_number', result);
  return result;
}

export function parseTime(value) {
  if (!value) return 0;
  value = String(value).toLowerCase().trim();
  value = value.replace(/,/g, '.');

  const unitKeys = Object.keys(timeUNITS).sort((a, b) => b.length - a.length).join('|');
  const re = new RegExp('(\\d+(?:\\.\\d+)?)\\s*(' + unitKeys + ')\\b', 'gi');

  let sec = 0;
  let m;
  while ((m = re.exec(value)) !== null) {
    const num = parseFloat(m[1]);
    const unit = m[2].toLowerCase();
    if (!Number.isFinite(num)) continue;
    const factor = timeUNITS[unit];
    if (factor) sec += num * factor;
  }

  sendAnalyticsEvent('ui', 'parse_time', sec + ' || ' + value);
  return sec;
}

export function formatTime(sec, { maxUnits = 4, decimals = 2 } = {}) {
  sec = Math.max(0, Number(sec) || 0);

  const showYearsAndMonths = getShowYearsAndMonths();
  const order = Object.entries(timeUNITS)
    .sort((a, b) => b[1] - a[1])
    .filter(([name]) => showYearsAndMonths ? true : (name !== 'y' && name !== 'mo'));

  const LARGE_UNIT_THRESHOLD = 1e6

  if (order.length > 0) {
    const [largestName, largestValue] = order[0];
    const amtLargest = sec / largestValue;
    if (amtLargest >= LARGE_UNIT_THRESHOLD) {
      const formatted = formatNumber(amtLargest);
      const result = formatted + ' ' + largestName;
      sendAnalyticsEvent('ui', 'format_time', result);
      return result;
    }
  }

  const parts = [];
  let remaining = sec;

  for (let i = 0; i < order.length; i++) {
    const [name, value] = order[i];
    if (parts.length >= maxUnits) break;

    const slotsLeft = maxUnits - parts.length;
    if (slotsLeft === 1) {
      const amt = remaining / value;
      const rounded = Number(amt.toFixed(decimals));
      parts.push(rounded + name);
      remaining = 0;
    } else {
      const amt = Math.floor(remaining / value);
      if (amt > 0) {
        parts.push(amt + name);
        remaining -= amt * value;
      }
    }
  }

  let result = parts.join(' ');
  if (result === '') result = '0s';
  sendAnalyticsEvent('ui', 'format_time', result);
  return result;
}

export function saveForm() {
  const inputs = document.querySelectorAll('input, select');
  inputs.forEach(input => {
    localStorage.setItem(input.id, input.type === 'checkbox' ? input.checked : input.value);
  });
}

export function loadForm() {
  const inputs = document.querySelectorAll('input, select');
  inputs.forEach(input => {
    const value = localStorage.getItem(input.id);
    if (value !== null) {
      if (input.type === 'checkbox') input.checked = value === 'true';
      else input.value = value;
    }
  });
}

export function toggleCheckbox(id) {
  const checkbox = document.getElementById(id);
  const box = document.getElementById(id + '-box');
  checkbox.checked = !checkbox.checked;
  box.classList.toggle('checked', checkbox.checked);
  saveForm && saveForm();
  if (id === "SPTSLightTheme") {
    const theme = checkbox.checked ? 'light' : 'dark';
    applyTheme(theme, 'spts');
    localStorage.setItem('SPTSLightTheme', theme);
  } else if (id === "CLightTheme") {
    const theme = checkbox.checked ? 'light' : 'dark';
    applyTheme(theme, 'calculator');
    localStorage.setItem('CLightTheme', theme);
  } else if (id === "allowCookies") {
    localStorage.setItem('allowCookies', checkbox.checked);
    window.location.reload();
  }
  checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  sendAnalyticsEvent('ui', 'toggle_checkbox', id, checkbox.checked ? 1 : 0);
}

export function updateCustomCheckboxes() {
  document.querySelectorAll('input[type=checkbox]').forEach(input => {
    const box = document.getElementById(input.id + '-box');
    if (box) box.classList.toggle('checked', input.checked);
  });
}

export function updateCustomSelects() {
  document.querySelectorAll('.custom-select').forEach(select => {
    const selected = select.querySelector('.selected');
    const hiddenInput = select.nextElementSibling;
    if (selected && hiddenInput) {
      selected.textContent = hiddenInput.value;
    }
  });
}

export function applyTheme(theme, palette) {
  document.body.dataset.palette = theme === 'light' ? `${palette}_light` : `${palette}_dark`;
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  const msTile = document.querySelector('meta[name="msapplication-TileColor"]');

  const computed = getComputedStyle(document.body).getPropertyValue('--bg-start').trim() || (theme === 'dark' ? '#121212' : '#fffbf6');
  if (metaTheme) metaTheme.setAttribute('content', computed);
  if (msTile) msTile.setAttribute('content', computed);

  updateBackgroundClass && updateBackgroundClass();
}

function hasBgImage(bgUrlRaw) {
  if (!bgUrlRaw) return false;
  const bgUrl = String(bgUrlRaw).trim();
  if (!bgUrl || bgUrl.toLowerCase() === 'none') return false;

  const m = bgUrl.match(/^url\((['"]?)(.*)\1\)$/i);
  if (!m) return false;
  return m[2].trim().length > 0;
}

export function updateBackgroundClass() {
  const body = document.body;
  const raw = getComputedStyle(body).getPropertyValue('--bg-url');
  if (hasBgImage(raw)) {
    body.classList.remove('no-bg');
  } else {
    body.classList.add('no-bg');
  }
}

export function initCustomSelects() {
  document.querySelectorAll('.custom-select').forEach(select => {
    const selected = select.querySelector('.selected');
    const options = select.querySelector('.options');
    const hiddenInput = select.querySelector('input[type="hidden"]');

    if (!selected || !options || !hiddenInput) return;

    const match = options.querySelector(`div[data-value="${hiddenInput.value}"]`);
    if (match) selected.textContent = match.textContent;

    selected.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.custom-select .options.open').forEach(o => {
        if (o !== options) o.classList.remove('open');
      });
      options.classList.toggle('open');
    });

    selected.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selected.click();
      } else if (e.key === 'Escape') {
        options.classList.remove('open');
        selected.blur();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const first = options.querySelector('div');
        first && first.focus && first.focus();
      }
    });

    options.querySelectorAll('div').forEach(option => {
      option.setAttribute('tabindex', '0');
      option.addEventListener('click', (ev) => {
        ev.stopPropagation();

        const optionValue = option.getAttribute('data-value') || '';
        hiddenInput.value = optionValue;
        selected.textContent = option.textContent;
        options.classList.remove('open');
        saveForm && saveForm();

        const statHidden = document.getElementById('SPTSStatType');
        const msTickGroup = document.getElementById('SPTSMSTickGroup');
        if (statHidden && msTickGroup) {
          msTickGroup.style.display = statHidden.value === 'MS' ? 'block' : 'none';
        }

        const CTypeEl = document.getElementById('CCalculatorType');
        const CType = CTypeEl?.value;
        const aInputGroup = document.getElementById('CAInputGroup');
        const tInputGroup = document.getElementById('CTInputGroup');
        const tChooseGroup = document.getElementById('CTChooseGroup');

        [aInputGroup, tInputGroup, tChooseGroup].forEach(el => {
          if (el) el.style.display = 'none';
        });

        if (CType === 'A' && aInputGroup) {
          aInputGroup.style.display = 'block';
        } else if (CType === 'T') {
          if (tInputGroup) tInputGroup.style.display = 'block';
          if (tChooseGroup) tChooseGroup.style.display = 'block';
        }

        sendAnalyticsEvent('ui', 'select_option', `${hiddenInput.id}:${hiddenInput.value}`);
      });

      option.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          option.click();
        } else if (ev.key === 'Escape') {
          options.classList.remove('open');
          selected.focus();
        }
      });
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select .options.open').forEach(o => o.classList.remove('open'));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.custom-select .options.open').forEach(o => o.classList.remove('open'));
    }
  });
}

export function getPriceByMultiKey(key) {
  const value = multis[key];
  if (!value) return null;
  return prices[value] ?? null;
}

export function getMultiKeyByValue(value) {
  const key = Object.keys(multis).find(k => multis[k] === value);
  return key ?? null;
}

export function getMultiValueByKey(key) {
  return multis[key] ?? null;
}

export function simulateStatProgress({currentStat, goalStat, baseGainPerSecond, currentMultiKey, tokenPerSecond, currentTokens = 0, maxTime = Infinity}) {
  const allMultis = Object.entries(multis)
    .map(([k, v]) => ({ key: k, value: v, price: prices[v] || 0 }))
    .sort((a, b) => a.value - b.value);

  let stat = currentStat;
  let tokens = currentTokens;
  let time = 0;
  let spentTokens = 0;
  let totalEarnedTokens = 0;

  let idx = allMultis.findIndex(m => m.key === currentMultiKey);
  if (idx < 0) idx = 0;

  let multi = allMultis[idx].value;
  let gainPerSec = baseGainPerSecond * multi;
  const upgrades = [];

  while (stat < goalStat && time < maxTime) {
    const next = allMultis[idx + 1];
    if (!next) break;

    const nextCost = next.price;
    const canUpgrade = tokens >= nextCost && time + 1 < maxTime;

    if (canUpgrade) {
      const smallStep = 1;
      const earned = tokenPerSecond * smallStep;
      stat += gainPerSec * smallStep;
      tokens += earned;
      totalEarnedTokens += earned;
      time += smallStep;
      if (time >= maxTime) break;

      tokens -= nextCost;
      spentTokens += nextCost;
      idx++;
      multi = next.value;
      gainPerSec = baseGainPerSecond * multi;
      upgrades.push(next.key);
    } else {
      const needTokens = nextCost - tokens;
      const timeToTokens = needTokens / tokenPerSecond;
      const timeToGoal = (goalStat - stat) / gainPerSec;

      const step = Math.min(timeToTokens, timeToGoal, maxTime - time);
      if (step <= 0) break;

      const earned = tokenPerSecond * step;
      stat += gainPerSec * step;
      tokens += earned;
      totalEarnedTokens += earned;
      time += step;
    }
  }

  return {
    totalTime: Math.min(time, maxTime),
    finalStat: stat,
    spentTokens,
    totalEarnedTokens,
    remainingTokens: tokens,
    upgrades,
    finalMultiKey: allMultis[idx]?.key || currentMultiKey
  };
}

window.addEventListener('DOMContentLoaded', () => {
  updateBackgroundClass();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(() => console.log('SW registered'))
    .catch(e => console.warn('SW reg fail', e));
}

(function () {
  function loadAnalytics() {
    if (!navigator.onLine) return;

    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gtagcode}`;
    document.head.appendChild(gaScript);

    gaScript.onload = () => {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', gtagcode, { anonymize_ip: true });
    };
  }

  const storedValue = localStorage.getItem('allowCookies');

  if (storedValue === 'true') {
    loadAnalytics();
    return;
  }
  if (storedValue === 'false') {
    return;
  }

  const bannerHTML = `
    <div class="cookies-container">
      <div class="cookies-content">
        <p>
          This website uses cookies to track user behavior and improve the user experience.
        </p>
        <div class="cookies-buttons">
          <button data-choice="true" class="btn">Accept</button>
          <button data-choice="false" class="btn">Decline</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', bannerHTML);

  const banner = document.querySelector('.cookies-container');
  banner.addEventListener('click', (e) => {
    if (e.target.matches('[data-choice]')) {
      const choice = e.target.dataset.choice;
      localStorage.setItem('allowCookies', choice);
      if (choice === 'true') loadAnalytics();
      banner.remove();
    }
  });
})();