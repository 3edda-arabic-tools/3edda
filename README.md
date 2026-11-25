# عُدّة (3EDDA)

منصة أدوات عربية مجانية تعمل بالكامل داخل المتصفح. لا تسجيل، ولا خوادم، والبيانات في LocalStorage فقط.

## Managing the site
- Tools live in `src/js/t-*.js`. Add one with `EDDA.tool({...})` (see existing tools for the shape).
- Build: `SITE_URL=https://your-domain BASE_PATH= node build.mjs` -> output in `dist/`.
- Deploy `dist/` to any static host (GitHub Pages, Cloudflare Pages).
- Ads: slots are hidden by default; enable in `src/js/config.js`.
- Contact page links to GitHub Issues via `REPO_URL`.
