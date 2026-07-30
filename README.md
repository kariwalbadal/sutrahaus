# Sutra Haus — sutrahaus.com

Independent design studio for hotels & modern brands.
Static site (no build step): hand-written HTML + one CSS file + vanilla JS.

- `index.html` — single-page site (work excerpts, capabilities, engagements, studio, contact)
- `assets/img/` — optimized work excerpts (client work shown as glimpses only — no full sites)
- `llms.txt`, `sitemap.xml`, `robots.txt` — SEO / AI-search
- `tools/og.html` — source for the social-share card

Deploy: GitHub Pages (push to `main` = deploy). To connect the custom domain,
add a `CNAME` file containing `sutrahaus.com` and point DNS (A records to GitHub
Pages IPs, or CNAME `www` → `kariwalbadal.github.io`).
