# Sutra Haus — sutrahaus.com

Independent design & media studio (Sutrahaus LLP, Bengaluru). Two practices:
hotels (`/hotels/`) and consumer brands / e-commerce (`/commerce/`).
Localized: EN (root) + FR/DE/ES/IT (`/fr/`, `/de/`, `/es/`, `/it/`).

## Editing

- Copy lives in `src/locales/*.json`; page structure in `src/templates/`.
- Rebuild all 15 pages + sitemap: `node src/build.js` (no dependencies).
- "Starting from" pricing floors per currency: edit the PRICING table at the
  top of `js/pricing.js`. Currency auto-detects from the visitor's timezone /
  language (EUR for Europe, GBP, INR, THB, AED, SGD, JPY, AUD, CAD, CHF; USD
  elsewhere) with a manual switcher; plan names stay constant worldwide.
- Client work policy: excerpts only, no full-site screenshots, no client links.

Deploy: GitHub Pages (push to `main`). To connect sutrahaus.com: add a `CNAME`
file and point DNS.
