# Brand and Deployment Notes

This file documents the Format Lizard logo, color palette, release/version stamp, and GitHub Pages publishing flow.

## Logo

The site uses the Yelling Lizard mark without text.

Tracked site assets:

- `assets/yelling-lizard-logo.png` - header logo, transparent PNG, 2000x2000 source.
- `assets/apple-icon.png` - favicon/apple touch icon, currently copied from the same transparent PNG.

Original local source files used to create the tracked assets:

- `C:\Users\User\Downloads\YellingLizard_WithoutText_transparency.png`
- `C:\Users\User\Downloads\YellingLizard_WithoutText.jpg`

Use the transparent PNG for the web UI whenever possible. The logo should appear as an image asset, not as a redrawn SVG or CSS approximation.

Current use in `index.html`:

```html
<link rel="icon" type="image/png" href="assets/apple-icon.png?v=YYYYMMDD-HHMM">
<link rel="apple-touch-icon" href="assets/apple-icon.png?v=YYYYMMDD-HHMM">
<img src="assets/yelling-lizard-logo.png?v=YYYYMMDD-HHMM" alt="" class="brand-logo" width="72" height="72">
```

The `alt` text is intentionally empty because the adjacent text already identifies the app.

## Colors

The standard logo colors were read from:

`C:\Users\User\Downloads\YellingLizard.pdf`

The PDF is vector artwork. The extracted standard palette is:

| Purpose | Hex | Notes |
| --- | --- | --- |
| Logo green | `#80A24D` | Primary Yelling Lizard green. |
| Light green | `#99CC66` | Secondary logo green. |
| Pale gray | `#EFF0EB` | Logo/background neutral from the PDF. |
| Black | `#000000` | Standard logo black. |
| White | `#FFFFFF` | Standard logo white. |

The CSS palette derives from those colors:

```css
--bg: #eff0eb;
--logo-green: #80a24d;
--logo-green-light: #99cc66;
--accent: #5f7a38;
--accent-strong: #35471e;
--accent-soft: #edf5e7;
```

`--accent` is intentionally darker than the exact logo green so white button text and small labels have acceptable contrast. The exact logo greens are still used in tints, gradients, and image assets.

## Version Stamp

The app uses a release stamp in this format:

```text
yyyyMMdd-HHmm
```

Example:

```text
20260603-2050
```

The version appears in three places:

- `script.js`: `const appRelease = "YYYYMMDD-HHMM";`
- `index.html`: visible footer text, `Version: YYYYMMDD-HHMM`
- `index.html`: cache-busting query strings on CSS, JavaScript, favicon, and logo URLs

Example cache-busted asset URLs:

```html
styles.css?v=YYYYMMDD-HHMM
script.js?v=YYYYMMDD-HHMM
assets/yelling-lizard-logo.png?v=YYYYMMDD-HHMM
```

## Git Hook

The repo uses a tracked pre-commit hook:

```text
.githooks/pre-commit
```

Enable it once in a fresh clone:

```powershell
git config core.hooksPath .githooks
```

The hook runs:

```powershell
scripts/update-release.ps1
```

That script updates:

- `const appRelease` in `script.js`
- all `?v=...` cache-busting query strings in `index.html`
- the visible footer version in `index.html`

The hook stages:

```text
index.html
script.js
```

So a normal commit includes the generated release stamp automatically.

## GitHub Pages

This project publishes like Luftblasen.

Repository:

```text
https://github.com/davidbreyer/format-lizard.git
```

Branches:

- `master` - source/history branch.
- `gh-pages` - public GitHub Pages branch.

The live site is served from `gh-pages`:

```text
https://davidbreyer.github.io/format-lizard/
```

Because the user Pages site has a custom domain, GitHub may redirect to:

```text
https://www.davidbreyer.com/format-lizard/
```

Normal deployment flow:

```powershell
git add -- ...
git commit -m "Some change"
git push origin master
git push origin master:gh-pages
```

Do not publish this app by copying it into the `davidbreyer.github.com` personal site repo. That was an earlier mistake. The formatter repo owns its source and deploys its own `gh-pages` branch.
