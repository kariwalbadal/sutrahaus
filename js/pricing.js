/* Sutra Haus — localizes the "plans start at ..." figure.
   Region detected from the visitor's IP (geojs.io), falling back to timezone
   and browser language. Detailed quotes happen over email; only the entry
   floor is shown. Edit START to change floors. */
(function () {
  var START = {
    hotels:   { INR: 5000,  USD: 150, EUR: 140, GBP: 120, THB: 4900, AED: 550,  SGD: 200, JPY: 22000, AUD: 230, CAD: 200, CHF: 150 },
    commerce: { INR: 10000, USD: 300, EUR: 280, GBP: 240, THB: 9900, AED: 1100, SGD: 400, JPY: 44000, AUD: 450, CAD: 400, CHF: 290 }
  };
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
    'America/Winnipeg': 'CAD', 'America/Halifax': 'CAD', 'America/St_Johns': 'CAD'
  };

  var els = document.querySelectorAll('[data-startprice]');
  if (!els.length) return;

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

  function render(currency) {
    els.forEach(function (el) {
      var table = START[el.getAttribute('data-startprice')] || START.hotels;
      if (table[currency] == null) currency = 'USD';
      try {
        el.textContent = new Intl.NumberFormat(document.documentElement.lang || 'en', {
          style: 'currency', currency: currency, maximumFractionDigits: 0
        }).format(table[currency]);
      } catch (e) {
        el.textContent = currency + ' ' + table[currency];
      }
    });
  }

  render(fallbackDetect());

  var cached = null;
  try { cached = sessionStorage.getItem('sh-geo'); } catch (e) {}
  if (cached) {
    if (REGION_MAP[cached]) render(REGION_MAP[cached]);
    return;
  }
  fetch('https://get.geojs.io/v1/ip/country.json')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var cc = d && d.country;
      if (!cc) return;
      try { sessionStorage.setItem('sh-geo', cc); } catch (e) {}
      render(REGION_MAP[cc] || 'USD');
    })
    .catch(function () {});
})();
