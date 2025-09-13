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

function _hasConsent() {
  return localStorage.getItem('allowCookies') === 'true';
}

function _gtagAvailable() {
  return typeof window.gtag === 'function' && navigator.onLine;
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
  value = value.replace(/,/g, '.');

  const suffixes = {
    'k': 1e3, 'm': 1e6, 'b': 1e9, 't': 1e12,
    'qa': 1e15, 'qd': 1e15,
    'qi': 1e18, 'qn': 1e18,
    'sx': 1e21, 'sp': 1e24,
    'oc': 1e27, 'no': 1e30
  };

  const m = value.match(/^([\d.]+)([a-z]{0,3})$/);
  if (!m) return Number(value) || 0;
  const num = parseFloat(m[1]);
  const suf = m[2] || '';
  const result = num * (suffixes[suf] || 1);

  sendAnalyticsEvent('ui', 'parse_number', result+' || '+value);
  return result;
}

export function formatNumber(n) {
  if (!isFinite(n)) return '—';
  const neg = n < 0;
  if (neg) n = -n;

  const units = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
  let i = 0;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000; i++;
  }
  const s = n.toFixed(2).replace(/\.00$/, '');

  const result = (neg ? '-' : '') + s + units[i];

  sendAnalyticsEvent('ui', 'format_number', result);
  return result;
}

export function parseTime(value) {
  if (!value) return 0;
  value = String(value).toLowerCase();
  const parts = value.match(/(\d+(?:\.\d+)?)\s*(ns|us|ms|dec|mo|c|y|w|d|h|m|s)/gi);
  if (!parts) return 0;

  let sec = 0;
  for (const p of parts) {
    const mm = p.match(/(\d+(?:\.\d+)?)\s*(ns|us|ms|dec|mo|c|y|w|d|h|m|s)/i);
    if (!mm) continue;
    const num = parseFloat(mm[1]);
    const unit = mm[2];

    switch (unit) {
      case 'ns': sec += num / 1e9; break;
      case 'us': sec += num / 1e6; break;
      case 'ms': sec += num / 1e3; break;
      case 's': sec += num; break;
      case 'm': sec += num * 60; break;
      case 'h': sec += num * 3600; break;
      case 'd': sec += num * 86400; break;
      case 'w': sec += num * 604800; break;
      case 'mo': sec += num * 2629746; break;         // 30.44 days
      case 'y': sec += num * 31557600; break;        // 365.25 days
      case 'dec': sec += num * 315576000; break;
      case 'c': sec += num * 3155760000; break;
    }
  }
  sendAnalyticsEvent('ui', 'parse_time', sec+' || '+value);
  return sec;
}

export function formatTime(sec) {
  sec = Math.max(0, sec);

  const units = [
    ['c', 3155760000],
    ['dec', 315576000],
    ['y', 31557600],
    ['mo', 2629746],
    ['w', 604800],
    ['d', 86400],
    ['h', 3600],
    ['m', 60],
    ['s', 1],
    ['ms', 1e-3],
    ['us', 1e-6],
    ['ns', 1e-9]
  ];

  const parts = [];
  for (const [name, value] of units) {
    if (sec >= value || (name === 'ns' && parts.length === 0)) {
      const amt = Math.floor(sec / value);
      sec -= amt * value;
      parts.push(amt + name);
    }
  }

  const result = parts.join(' ');

  sendAnalyticsEvent('ui', 'parse_time', result);
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