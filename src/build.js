#!/usr/bin/env node
/* Sutra Haus static site builder.
   Usage: node src/build.js
   Reads src/templates + src/locales, writes localized pages to the repo root. */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOCALES = ['en', 'fr', 'de', 'es', 'it', 'pt', 'pl'];
const LOCALE_LABELS = { en: 'EN', fr: 'FR', de: 'DE', es: 'ES', it: 'IT', pt: 'PT', pl: 'PL' };
const BANNER_TEXT = {
  fr: 'Voir cette page en français',
  de: 'Diese Seite auf Deutsch ansehen',
  es: 'Ver esta página en español',
  it: 'Vedere questa pagina in italiano',
  pt: 'Ver esta página em português',
  pl: 'Zobacz tę stronę po polsku',
};
// Until sutrahaus.com DNS is cut over from the old Shopify store,
// canonicals/og/sitemap must point at the URL that actually serves this site.
const SITE = 'https://kariwalbadal.github.io/sutrahaus';

const PAGES = [
  { id: 'home', template: 'home.html', dir: '' },
  { id: 'hotels', template: 'vertical.html', dir: 'hotels/', vertical: 'hotels' },
  { id: 'commerce', template: 'vertical.html', dir: 'commerce/', vertical: 'commerce' },
];

const VERTICAL_CFG = {
  hotels: {
    img_primary: 'assets/img/shots/glimpse-hotel-web.jpg',
    img_pair1: 'assets/img/shots/glimpse-hotel-web-2.jpg',
    img_pair2: 'assets/img/shots/chinmaye-inn-website-mobile.jpg',
    band_media: '<video autoplay muted loop playsinline poster="{{root}}assets/video/hero-hotel-poster.jpg"><source src="{{root}}assets/video/hero-hotel.mp4" type="video/mp4"></video>',
    case_link: (t) => `mailto:badal@sutrahaus.com?subject=${t('common.folio_subject')}`,
    case_link_attrs: '',
    case_link_arr: '→',
  },
  commerce: {
    img_primary: 'assets/img/shots/glimpse-ecom-web.jpg',
    img_pair1: 'assets/img/shots/glimpse-ecom-cards.jpg',
    img_pair2: 'assets/img/shots/ephoria-store-mobile.jpg',
    band_media: '<img src="{{root}}assets/img/ephoria/ephoria-lifestyle-photography-kitchen.jpg" alt="" width="1300" height="972">',
    case_link: () => 'https://ephoria.store',
    case_link_attrs: ' target="_blank" rel="noopener"',
    case_link_arr: '↗',
  },
};

const REELS = [
  { f: 'hotel-pool', v: 'hotel' },
  { f: 'brand-ephoria-1', v: 'brand', audio: true },
  { f: 'hotel-suite', v: 'hotel' },
  { f: 'brand-perfume', v: 'brand' },
  { f: 'hotel-view', v: 'hotel' },
  { f: 'brand-ephoria-2', v: 'brand', audio: true },
  { f: 'hotel-spa', v: 'hotel' },
  { f: 'brand-editorial', v: 'brand' },
  { f: 'hotel-dining', v: 'hotel' },
  { f: 'brand-coffee', v: 'brand' },
  { f: 'hotel-room', v: 'hotel' },
  { f: 'brand-serum', v: 'brand' },
  { f: 'brand-lipstick', v: 'brand' },
];
const STILLS_HOTEL = [
  'chinmaye/hotel-instagram-creative-scoreboard', 'stock/stock-dining-candle',
  'grand/banquet-launch-creative-naam', 'chinmaye/hotel-instagram-creative-calendar',
  'stock/stock-cafe-niche', 'chinmaye/hotel-instagram-creative-akhbaar',
  'grand/banquet-launch-creative-saat-phere', 'stock/stock-dining-chef',
  'chinmaye/hotel-instagram-creative-mithai', 'chinmaye/hotel-instagram-creative-doli',
  'stock/stock-cafe-cactus', 'grand/banquet-launch-creative-sehra',
  'chinmaye/hotel-instagram-creative-rangoli', 'stock/stock-dining-bar',
  'chinmaye/hotel-instagram-creative-kundli', 'grand/banquet-launch-creative-keyhole',
  'chinmaye/hotel-instagram-creative-paan', 'chinmaye/hotel-instagram-creative-jhoola',
];
const STILLS_BRAND = [
  'ephoria/ephoria-product-photography-bundle', 'stock/stock-fashion-studio',
  'ephoria/ephoria-lifestyle-photography-kitchen', 'stock/stock-jewelry-silk',
  'ephoria/ephoria-ingredient-flatlay', 'stock/stock-beauty-palette',
  'ephoria/ephoria-product-photography-afterhours', 'stock/stock-fashion-mono',
  'ephoria/ephoria-lifestyle-photography-dusk', 'stock/stock-street-orange',
  'ephoria/ephoria-product-photography-reset', 'stock/stock-jewelry-hand',
  'ephoria/ephoria-lifestyle-photography-sofa', 'stock/stock-beauty-lipstick',
  'ephoria/ephoria-packaging-hero', 'stock/stock-fashion-portrait',
  'ephoria/ephoria-lifestyle-photography-stretch', 'stock/stock-street-dark',
];
const STILLS_HOME_2 = [
  'ephoria/ephoria-product-photography-bundle', 'stock/stock-fashion-studio',
  'chinmaye/hotel-instagram-creative-doodh', 'stock/stock-jewelry-silk',
  'ephoria/ephoria-lifestyle-photography-kitchen', 'stock/stock-beauty-palette',
  'grand/banquet-launch-creative-flapboard', 'stock/stock-street-orange',
  'ephoria/ephoria-ingredient-flatlay', 'stock/stock-fashion-mono',
  'chinmaye/hotel-instagram-creative-istri', 'stock/stock-jewelry-hand',
  'ephoria/ephoria-product-photography-afterhours', 'stock/stock-beauty-lipstick',
  'grand/banquet-launch-creative-kadam', 'stock/stock-fashion-portrait',
  'ephoria/ephoria-lifestyle-photography-sofa', 'stock/stock-street-dark',
];

function reelTile(r, root, t) {
  const chip = r.v === 'hotel' ? `<span class="chip hotel">${t('common.chip_hotel')}</span>` : `<span class="chip brand">${t('common.chip_brand')}</span>`;
  const audio = r.audio ? ' data-audio="1"' : '';
  const snd = r.audio ? '<button class="snd" aria-label="Sound">♪</button>' : '';
  return `      <div class="reel"${audio}>${chip}<video muted loop playsinline preload="metadata" poster="${root}assets/video/reels/${r.f}-poster.jpg"><source src="${root}assets/video/reels/${r.f}.mp4" type="video/mp4"></video>${snd}</div>`;
}
const ALT_PREFIX = {
  chinmaye: 'Original Instagram creative for a Bhagalpur hotel',
  grand: 'Banquet launch creative',
  ephoria: 'Ephoria brand imagery',
  stock: 'Social-first imagery',
};
function altFor(s) {
  const [dir, file] = s.split('/');
  const label = file.replace(/^(hotel-instagram-creative-|banquet-launch-creative-|ephoria-|stock-)/, '').replace(/-/g, ' ');
  return `${ALT_PREFIX[dir] || 'Creative'} — ${label}`;
}
function stillsRow(list, root) {
  const one = list.map((s) => `<figure><img src="${root}assets/img/${s}.jpg" alt="${altFor(s)}" loading="lazy" width="800" height="1000"></figure>`).join('');
  return one + one; // doubled for seamless loop
}

const dicts = {};
for (const l of LOCALES) {
  dicts[l] = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales', `${l}.json`), 'utf8'));
}
const templates = {};
for (const p of PAGES) {
  templates[p.template] = fs.readFileSync(path.join(__dirname, 'templates', p.template), 'utf8');
}

const stripTags = (s) => s.replace(/<[^>]+>/g, '');
const jsonEscape = (s) => JSON.stringify(stripTags(s)).slice(1, -1);

const localePrefix = (l) => (l === 'en' ? '' : `${l}/`);

for (const locale of LOCALES) {
  const dict = dicts[locale];
  const t = (key) => {
    if (!(key in dict)) throw new Error(`[${locale}] missing key: ${key}`);
    return dict[key];
  };

  for (const page of PAGES) {
    const pagePath = localePrefix(locale) + page.dir; // e.g. "fr/hotels/"
    const depth = pagePath ? pagePath.split('/').filter(Boolean).length : 0;
    const root = '../'.repeat(depth);

    let html = templates[page.template];

    if (page.vertical) {
      html = html.split('PFX.').join(`${page.vertical}.`);
      const cfg = VERTICAL_CFG[page.vertical];
      html = html
        .split('{{band_media}}').join(cfg.band_media)
        .split('{{img_primary}}').join(cfg.img_primary)
        .split('{{img_pair1}}').join(cfg.img_pair1)
        .split('{{img_pair2}}').join(cfg.img_pair2)
        .split('{{case_link}}').join(cfg.case_link(t))
        .split('{{case_link_attrs}}').join(cfg.case_link_attrs)
        .split('{{case_link_arr}}').join(cfg.case_link_arr)
        .split('{{vertical}}').join(page.vertical);
    }

    const canonical = `${SITE}/${pagePath}`;
    const alternates = LOCALES.map((l) =>
      `  <link rel="alternate" hreflang="${l}" href="${SITE}/${localePrefix(l)}${page.dir}">`
    ).join('\n') + `\n  <link rel="alternate" hreflang="x-default" href="${SITE}/${page.dir}">`;

    const langOptions = LOCALES.map((l) => {
      const href = root + localePrefix(l) + page.dir;
      const sel = l === locale ? ' selected' : '';
      return `<option value="${href || './'}"${sel}>${LOCALE_LABELS[l]}</option>`;
    }).join('');

    let banner = '';
    if (locale === 'en') {
      const attrs = ['fr', 'de', 'es', 'it', 'pt', 'pl']
        .map((l) => `data-${l}="${root}${l}/${page.dir}" data-${l}-label="${BANNER_TEXT[l]}"`)
        .join(' ');
      banner = `<div class="lang-banner" ${attrs}><span class="lb-slot"></span><button aria-label="Dismiss" class="lb-close">×</button></div>`;
    }

    html = html
      .split('{{lang}}').join(locale)
      .split('{{root}}').join(root)
      .split('{{home_path}}').join(localePrefix(locale))
      .split('{{hotels_href}}').join(root + localePrefix(locale) + 'hotels/')
      .split('{{commerce_href}}').join(root + localePrefix(locale) + 'commerce/')
      .split('{{canonical}}').join(canonical)
      .split('{{alternates}}').join(alternates)
      .split('{{lang_options}}').join(langOptions)
      .split('{{lang_banner}}').join(banner)
      .split('{{active_hotels}}').join(page.id === 'hotels' ? 'active' : '')
      .split('{{active_commerce}}').join(page.id === 'commerce' ? 'active' : '');

    // media slots
    if (html.includes('{{reel_tiles}}')) {
      const list = page.vertical === 'hotels' ? REELS.filter((r) => r.v === 'hotel')
        : page.vertical === 'commerce' ? REELS.filter((r) => r.v === 'brand')
        : REELS;
      html = html.split('{{reel_tiles}}').join(list.map((r) => reelTile(r, root, t)).join('\n'));
    }
    if (html.includes('{{stills_row1}}')) html = html.split('{{stills_row1}}').join(stillsRow(STILLS_HOTEL, root));
    if (html.includes('{{stills_row2}}')) html = html.split('{{stills_row2}}').join(stillsRow(STILLS_HOME_2, root));
    if (html.includes('{{stills_row}}')) {
      const rows = page.vertical === 'commerce' ? STILLS_BRAND : STILLS_HOTEL;
      html = html.split('{{stills_row}}').join(stillsRow(rows, root));
    }

    // JSON-escaped strings (inside <script type="application/ld+json">)
    html = html.replace(/\{\{tj:([a-zA-Z0-9_.]+)\}\}/g, (_, key) => jsonEscape(t(key)));
    // plain dictionary strings
    html = html.replace(/\{\{t:([a-zA-Z0-9_.]+)\}\}/g, (_, key) => t(key));

    const leftovers = html.match(/\{\{[^}]+\}\}/g);
    if (leftovers) throw new Error(`[${locale}/${page.id}] unresolved: ${leftovers.slice(0, 5).join(', ')}`);

    const outDir = path.join(ROOT, pagePath);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html);
    console.log('built', pagePath || '(root)');
  }
}

// sitemap with hreflang alternates
const urls = [];
for (const page of PAGES) {
  for (const locale of LOCALES) {
    const loc = `${SITE}/${localePrefix(locale)}${page.dir}`;
    const alts = LOCALES.map((l) =>
      `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE}/${localePrefix(l)}${page.dir}"/>`
    ).join('\n');
    urls.push(`  <url>\n    <loc>${loc}</loc>\n${alts}\n    <changefreq>monthly</changefreq>\n  </url>`);
  }
}
fs.writeFileSync(
  path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`
);
console.log('built sitemap.xml —', urls.length, 'urls');
