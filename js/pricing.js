/* Sutra Haus — region-aware "starting from" pricing.
   Currency is detected from the visitor's IP (geojs.io), falling back to
   timezone and browser language; a manual switcher always wins.
   Edit the PRICING table to change floors. Figures are floors per market
   and property class; every proposal is scoped individually. */
(function () {
  var PRICING = {
    hotels: {
      rebuild:     { INR: 5000,  USD: 150, EUR: 140, GBP: 120, THB: 4900, AED: 550,  SGD: 200, JPY: 22000, AUD: 230, CAD: 200, CHF: 150 },
      hosting:     { INR: 1500,  USD: 25,  EUR: 24,  GBP: 20,  THB: 790,  AED: 90,   SGD: 35,  JPY: 3800,  AUD: 40,  CAD: 35,  CHF: 25 },
      programme:   { INR: 5000,  USD: 50,  EUR: 45,  GBP: 40,  THB: 1690, AED: 180,  SGD: 70,  JPY: 7500,  AUD: 75,  CAD: 70,  CHF: 50 },
      partnership: { INR: 10000, USD: 150, EUR: 140, GBP: 120, THB: 4900, AED: 550,  SGD: 200, JPY: 22000, AUD: 220, CAD: 200, CHF: 150 }
    },
    commerce: {
      rebuild:     { INR: 10000, USD: 300, EUR: 280, GBP: 240, THB: 9900, AED: 1100, SGD: 400, JPY: 44000, AUD: 450, CAD: 400, CHF: 290 },
      hosting:     { INR: 2000,  USD: 50,  EUR: 45,  GBP: 40,  THB: 1590, AED: 180,  SGD: 70,  JPY: 7500,  AUD: 75,  CAD: 70,  CHF: 48 },
      programme:   { INR: 5000,  USD: 50,  EUR: 45,  GBP: 40,  THB: 1690, AED: 180,  SGD: 70,  JPY: 7500,  AUD: 75,  CAD: 70,  CHF: 50 },
      partnership: { INR: 10000, USD: 150, EUR: 140, GBP: 120, THB: 4900, AED: 550,  SGD: 200, JPY: 22000, AUD: 220, CAD: 200, CHF: 150 }
    }
  };
  var CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'THB', 'AED', 'SGD', 'JPY', 'AUD', 'CAD', 'CHF'];

  var REGION_MAP = {
    IN: 'INR', TH: 'THB', GB: 'GBP', AE: 'AED', SG: 'SGD', JP: 'JPY', AU: 'AUD',
    CA: 'CAD', CH: 'CHF', US: 'USD',
    AT: 'EUR', BE: 'EUR', CY: 'EUR', DE: 'EUR', EE: 'EUR', ES: 'EUR', FI: 'EUR',
    FR: 'EUR', GR: 'EUR', HR: 'EUR', IE: 'EUR', IT: 'EUR', LT: 'EUR', LU: 'EUR',
    LV: 'EUR', MT: 'EUR', NL: 'EUR', PT: 'EUR', SI: 'EUR', SK: 'EUR',
    SE: 'EUR', NO: 'EUR', DK: 'EUR', PL: 'EUR', CZ: 'EUR', RO: 'EUR', HU: 'EUR',
    BG: 'EUR', IS: 'EUR', LI: 'EUR', MC: 'EUR', AD: 'EUR', SM: 'EUR'
  };
  var TZ_EXACT = {
    'Asia/Kolkata': 'INR', 'Asia/Calcutta': 'INR', 'Asia/Bangkok': 'THB',
    'Asia/Dubai': 'AED', 'Asia/Singapore': 'SGD', 'Asia/Tokyo': 'JPY',
    'Europe/London': 'GBP', 'Europe/Zurich': 'CHF',
    'America/Toronto': 'CAD', 'America/Vancouver': 'CAD', 'America/Edmonton': 'CAD',
    'America/Winnipeg': 'CAD', 'America/Halifax': 'CAD', 'America/St_Johns': 'CAD',
    'America/Regina': 'CAD', 'America/Moncton': 'CAD'
  };

  function fallbackDetect() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (TZ_EXACT[tz]) return TZ_EXACT[tz];
      if (tz.indexOf('Europe/') === 0) return 'EUR';
      if (tz.indexOf('Australia/') === 0) return 'AUD';
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
  var table = PRICING[grid.getAttribute('data-vertical')];
  if (!table) return;

  var current = null;

  function render(currency) {
    current = currency;
    grid.querySelectorAll('[data-price]').forEach(function (el) {
      var row = table[el.getAttribute('data-price')];
      if (row && row[currency] != null) el.textContent = fmt(row[currency], currency);
    });
    if (select && select.value !== currency) select.value = currency;
  }

  var select = document.getElementById('curr-select');
  if (select) {
    CURRENCIES.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c; o.textContent = c;
      select.appendChild(o);
    });
    select.addEventListener('change', function () {
      try { localStorage.setItem('sh-currency', select.value); } catch (e) {}
      render(select.value);
    });
  }

  // 1) manual choice wins
  var stored = null;
  try { stored = localStorage.getItem('sh-currency'); } catch (e) {}
  if (stored && CURRENCIES.indexOf(stored) !== -1) { render(stored); return; }

  // 2) render a fallback immediately, then refine with IP geolocation
  render(fallbackDetect());
  var cachedGeo = null;
  try { cachedGeo = sessionStorage.getItem('sh-geo'); } catch (e) {}
  if (cachedGeo) {
    if (REGION_MAP[cachedGeo]) render(REGION_MAP[cachedGeo]);
    return;
  }
  fetch('https://get.geojs.io/v1/ip/country.json')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var cc = d && d.country;
      if (!cc) return;
      try { sessionStorage.setItem('sh-geo', cc); } catch (e) {}
      var cur = REGION_MAP[cc] || 'USD';
      var manual = null;
      try { manual = localStorage.getItem('sh-currency'); } catch (e) {}
      if (!manual) render(cur);
    })
    .catch(function () { /* fallback already rendered */ });
})();
