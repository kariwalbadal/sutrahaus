/* Sutra Haus — localizes the "plans start at ..." figure per market.
   The visitor's country comes from IP (geojs.io) with timezone/browser-language
   fallback. Some markets have explicit per-country floors (COUNTRY table);
   everywhere else the currency floor (BASE) applies. Quotes happen over email.
   Edit BASE / COUNTRY to change floors. */
(function () {
  var BASE = {
    hotels:   { INR: 3500,  USD: 150, EUR: 140, GBP: 120, THB: 4900, AED: 550,  SGD: 200, JPY: 22000, AUD: 230, CAD: 200, CHF: 150, PLN: 590 },
    commerce: { INR: 10000, USD: 300, EUR: 280, GBP: 240, THB: 9900, AED: 1100, SGD: 400, JPY: 44000, AUD: 450, CAD: 400, CHF: 290, PLN: 1190 }
  };
  // explicit per-country floors (currency + amounts), tuned to local agency markets
  var COUNTRY = {
    IN: { c: 'INR', hotels: 3500, commerce: 10000 },
    TH: { c: 'THB', hotels: 4900, commerce: 9900 },
    PT: { c: 'EUR', hotels: 110,  commerce: 220 },
    GR: { c: 'EUR', hotels: 105,  commerce: 210 },
    ES: { c: 'EUR', hotels: 125,  commerce: 250 },
    IT: { c: 'EUR', hotels: 130,  commerce: 260 },
    PL: { c: 'PLN', hotels: 490,  commerce: 980 },
    CZ: { c: 'EUR', hotels: 115,  commerce: 230 },
    SK: { c: 'EUR', hotels: 115,  commerce: 230 },
    HU: { c: 'EUR', hotels: 110,  commerce: 220 },
    RO: { c: 'EUR', hotels: 105,  commerce: 210 },
    HR: { c: 'EUR', hotels: 110,  commerce: 220 },
    BG: { c: 'EUR', hotels: 99,   commerce: 199 },
    LT: { c: 'EUR', hotels: 110,  commerce: 220 },
    LV: { c: 'EUR', hotels: 110,  commerce: 220 },
    EE: { c: 'EUR', hotels: 110,  commerce: 220 }
  };
  var REGION_MAP = {
    IN: 'INR', TH: 'THB', GB: 'GBP', AE: 'AED', SG: 'SGD', JP: 'JPY', AU: 'AUD',
    CA: 'CAD', CH: 'CHF', US: 'USD', PL: 'PLN',
    AT: 'EUR', BE: 'EUR', CY: 'EUR', DE: 'EUR', EE: 'EUR', ES: 'EUR', FI: 'EUR',
    FR: 'EUR', GR: 'EUR', HR: 'EUR', IE: 'EUR', IT: 'EUR', LT: 'EUR', LU: 'EUR',
    LV: 'EUR', MT: 'EUR', NL: 'EUR', PT: 'EUR', SI: 'EUR', SK: 'EUR',
    SE: 'EUR', NO: 'EUR', DK: 'EUR', CZ: 'EUR', RO: 'EUR', HU: 'EUR',
    BG: 'EUR', IS: 'EUR', LI: 'EUR', MC: 'EUR', AD: 'EUR', SM: 'EUR'
  };
  var TZ_CC = {
    'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Bangkok': 'TH',
    'Asia/Dubai': 'AE', 'Asia/Singapore': 'SG', 'Asia/Tokyo': 'JP',
    'Europe/London': 'GB', 'Europe/Zurich': 'CH', 'Europe/Warsaw': 'PL',
    'Europe/Lisbon': 'PT', 'Europe/Madrid': 'ES', 'Europe/Rome': 'IT',
    'Europe/Athens': 'GR', 'Europe/Prague': 'CZ', 'Europe/Budapest': 'HU',
    'Europe/Bucharest': 'RO', 'Europe/Sofia': 'BG', 'Europe/Zagreb': 'HR',
    'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA',
    'America/Winnipeg': 'CA', 'America/Halifax': 'CA', 'America/St_Johns': 'CA'
  };

  var els = document.querySelectorAll('[data-startprice]');
  if (!els.length) return;

  function fallbackCountry() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (TZ_CC[tz]) return TZ_CC[tz];
      if (tz.indexOf('Australia/') === 0) return 'AU';
      if (tz.indexOf('Europe/') === 0) return 'DE'; // generic eurozone floor
      if (tz.indexOf('America/') === 0) return 'US';
    } catch (e) {}
    try {
      var m = (navigator.language || '').match(/-([A-Z]{2})/);
      if (m) return m[1];
    } catch (e) {}
    return 'US';
  }

  function render(cc) {
    var o = COUNTRY[cc];
    var cur = o ? o.c : (REGION_MAP[cc] || 'USD');
    els.forEach(function (el) {
      var vertical = el.getAttribute('data-startprice') === 'commerce' ? 'commerce' : 'hotels';
      var amount = o ? o[vertical] : (BASE[vertical][cur] != null ? BASE[vertical][cur] : BASE[vertical].USD);
      if (BASE[vertical][cur] == null && !o) cur = 'USD';
      try {
        el.textContent = new Intl.NumberFormat(document.documentElement.lang || 'en', {
          style: 'currency', currency: cur, maximumFractionDigits: 0
        }).format(amount);
      } catch (e) {
        el.textContent = cur + ' ' + amount;
      }
    });
  }

  render(fallbackCountry());

  var cached = null;
  try { cached = sessionStorage.getItem('sh-geo'); } catch (e) {}
  if (cached) { render(cached); return; }
  fetch('https://get.geojs.io/v1/ip/country.json')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var cc = d && d.country;
      if (!cc) return;
      try { sessionStorage.setItem('sh-geo', cc); } catch (e) {}
      render(cc);
    })
    .catch(function () {});
})();
