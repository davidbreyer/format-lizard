# Lizard Formatter

A small JavaScript formatter app, starting with JSON.

Open `index.html` in a browser, paste compact or messy JSON into the left editor, then format or minify it into the right editor.

For logo, color, versioning, and publishing details, see [BRAND_AND_DEPLOYMENT.md](BRAND_AND_DEPLOYMENT.md).

## GitHub Pages

The site publishes from the remote `gh-pages` branch:

```text
https://davidbreyer.github.io/lizard-formatter/
```

Normal deployment flow:

```powershell
git add -- ...
git commit -m "Some change"
git push origin master
git push origin master:gh-pages
```

`master` stores the source/history. `gh-pages` is the branch GitHub Pages serves publicly.

## Release Stamp

The footer displays the current version:

```text
Version: YYYYMMDD-HHMM
```

The value lives in `script.js`:

```js
const appRelease = "YYYYMMDD-HHMM";
```

The same value is used for cache-busting query strings in `index.html` for CSS and JavaScript files.

## Git Hooks

The repo includes a pre-commit hook that updates the release stamp automatically before each commit.

Enable it once per local clone:

```powershell
git config core.hooksPath .githooks
```

After that, every `git commit` runs:

```powershell
scripts/update-release.ps1
```

The script updates:

- `const appRelease` in `script.js`
- the visible footer version in `index.html`
- all `?v=...` cache-busting query strings in `index.html`

The hook stages `index.html` and `script.js` so the generated release stamp is included in the commit.
