# Sutra Haus — sutrahaus.com

Premium website & creative studio for hotels and brands in India.
Static site (no build step): hand-written HTML + one CSS file + vanilla JS.

- `index.html` — home (work, services, packages, FAQ, contact)
- `work/chinmaye/` — hotel rebuild case study
- `work/ephoria/` — brand build case study
- `assets/img/` — optimized portfolio images
- `llms.txt`, `sitemap.xml`, `robots.txt` — SEO / AI-search

Deploy: GitHub Pages (push to `main` = deploy). To connect the custom domain,
add a `CNAME` file containing `sutrahaus.com` and point DNS (A records to GitHub
Pages IPs, or CNAME `www` → `kariwalbadal.github.io`).
