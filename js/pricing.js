/* Sutra Haus — market-aware "starting from" pricing.
   Edit the PRICING table below to change floors per market.
   Figures are floors per market/property class; every proposal is scoped individually. */
(function () {
  var PRICING = {
    hotels: {
      rebuild:     { USD: 8900, EUR: 7900, GBP: 6900, INR: 250000, THB: 219000, AED: 29000, SGD: 9800,  JPY: 980000, AUD: 9800, CAD: 8900, CHF: 7900 },
      programme:   { USD: 2400, EUR: 2200, GBP: 1900, INR: 75000,  THB: 59000,  AED: 8500,  SGD: 2900,  JPY: 290000, AUD: 2900, CAD: 2700, CHF: 2400 },
      partnership: { USD: 4900, EUR: 4400, GBP: 3900, INR: 150000, THB: 119000, AED: 17500, SGD: 5900,  JPY: 590000, AUD: 5900, CAD: 5400, CHF: 4900 }
    },
    commerce: {
      rebuild:     { USD: 6900, EUR: 5900, GBP: 5400, INR: 175000, THB: 149000, AED: 22000, SGD: 7400,  JPY: 740000, AUD: 7400, CAD: 6900, CHF: 5900 },
      programme:   { USD: 1900, EUR: 1700, GBP: 1500, INR: 60000,  THB: 45000,  AED: 6500,  SGD: 2200,  JPY: 220000, AUD: 2200, CAD: 2100, CHF: 1900 },
      partnership: { USD: 3900, EUR: 3400, GBP: 2900, INR: 120000, THB: 95000,  AED: 13500, SGD: 4700,  JPY: 470000, AUD: 4700, CAD: 4300, CHF: 3900 }
    }
  };
  var CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'THB', 'AED', 'SGD', 'JPY', 'AUD', 'CAD', 'CHF'];

  // timezone → currency (major economies get their own; others fall back to USD)
  var TZ_EXACT = {
    'Asia/Kolkata': 'INR', 'Asia/Calcutta': 'INR',
    'Asia/Bangkok': 'THB',
    'Asia/Dubai': 'AED',
    'Asia/Singapore': 'SGD',
    'Asia/Tokyo': 'JPY',
    'Europe/London': 'GBP',
    'Europe/Zurich': 'CHF',
    'America/Toronto': 'CAD', 'America/Vancouver': 'CAD', 'America/Edmonton': 'CAD',
    'America/Winnipeg': 'CAD', 'America/Halifax': 'CAD', 'America/St_Johns': 'CAD',
    'America/Regina': 'CAD', 'America/Moncton': 'CAD'
  };
  var REGION_MAP = {
    IN: 'INR', TH: 'THB', GB: 'GBP', AE: 'AED', SG: 'SGD', JP: 'JPY', AU: 'AUD',
    CA: 'CAD', CH: 'CHF', US: 'USD',
    AT: 'EUR', BE: 'EUR', CY: 'EUR', DE: 'EUR', EE: 'EUR', ES: 'EUR', FI: 'EUR',
    FR: 'EUR', GR: 'EUR', HR: 'EUR', IE: 'EUR', IT: 'EUR', LT: 'EUR', LU: 'EUR',
    LV: 'EUR', MT: 'EUR', NL: 'EUR', PT: 'EUR', SI: 'EUR', SK: 'EUR',
    SE: 'EUR', NO: 'EUR', DK: 'EUR', PL: 'EUR', CZ: 'EUR', RO: 'EUR', HU: 'EUR', BG: 'EUR'
  };

  function detect() {
    try {
      var stored = localStorage.getItem('sh-currency');
      if (stored && CURRENCIES.indexOf(stored) !== -1) return stored;
    } catch (e) {}
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (TZ_EXACT[tz]) return TZ_EXACT[tz];
      if (tz.indexOf('Europe/') === 0) return 'EUR';
      if (tz.indexOf('Australia/') === 0) return 'AUD';
      if (tz.indexOf('Asia/') === 0 || tz.indexOf('America/') === 0 || tz.indexOf('Africa/') === 0 || tz.indexOf('Pacific/') === 0) {
        // fall through to language region for a better guess
      }
    } catch (e) {}
    try {
      var m = (navigator.language || '').match(/-([A-Z]{2})/);
      if (m && REGION_MAP[m[1]]) return REGION_MAP[m[1]];
    } catch (e) {}
    return 'USD';
  }

  function fmt(amount, currency) {
    try {
      return new Intl.NumberFormat(document.documentElement.lang || 'en', {
        style: 'currency', currency: currency, maximumFractionDigits: 0
      }).format(amount);
    } catch (e) {
      return currency + ' ' + amount;
    }
  }

  var grid = document.querySelector('.eng-grid[data-vertical]');
  if (!grid) return;
  var vertical = grid.getAttribute('data-vertical');
  var table = PRICING[vertical];
  if (!table) return;

  function render(currency) {
    grid.querySelectorAll('[data-price]').forEach(function (el) {
      var tier = el.getAttribute('data-price');
      var row = table[tier];
      if (row && row[currency] != null) el.textContent = fmt(row[currency], currency);
    });
  }

  var current = detect();
  var select = document.getElementById('curr-select');
  if (select) {
    CURRENCIES.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c; o.textContent = c;
      if (c === current) o.selected = true;
      select.appendChild(o);
    });
    select.addEventListener('change', function () {
      current = select.value;
      try { localStorage.setItem('sh-currency', current); } catch (e) {}
      render(current);
    });
  }
  render(current);
})();
