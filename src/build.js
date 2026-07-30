#!/usr/bin/env node
/* Sutra Haus static site builder.
   Usage: node src/build.js
   Reads src/templates + src/locales, writes localized pages to the repo root. */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOCALES = ['en', 'fr', 'de', 'es', 'it'];
const LOCALE_LABELS = { en: 'EN', fr: 'FR', de: 'DE', es: 'ES', it: 'IT' };
const BANNER_TEXT = {
  fr: 'Voir cette page en français',
  de: 'Diese Seite auf Deutsch ansehen',
  es: 'Ver esta página en español',
  it: 'Vedere questa pagina in italiano',
};
const SITE = 'https://sutrahaus.com';

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
      const attrs = ['fr', 'de', 'es', 'it']
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
