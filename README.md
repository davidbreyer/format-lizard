# Format Lizard

A small JavaScript formatter app for JSON, XML, and YAML.

Open `index.html` in a browser, paste compact or messy data into the left editor, or use `Open` to load a local `.json`, `.xml`, `.config`, `.yaml`, or `.yml` file.
Then format or minify it into the right editor.
Use `Save` to download the formatted output as a `.json`, `.xml`, or `.yaml` file.

For logo, color, versioning, and publishing details, see [BRAND_AND_DEPLOYMENT.md](BRAND_AND_DEPLOYMENT.md).

## Supported Formats

- JSON
- XML
- YAML

JSON tools:

- Auto-detect JSON/XML/YAML from pasted content.
- View formatted JSON as an expandable tree.
- Sort object keys before formatting or minifying JSON.
- Unescape JSON strings, such as `"{\"name\":\"Ada\"}"`, into editable JSON.
- Convert JSON to XML.

YAML support covers common configuration-file shapes: mappings, lists, nested values, strings, booleans, nulls, and numbers.

Good next candidates:

- CSV, for table-shaped data.
- HTML, for markup snippets.
- CSS, for stylesheets.
- SQL, for database queries.
- Markdown, for prose cleanup.

## GitHub Pages

The site publishes from the remote `gh-pages` branch:

```text
https://davidbreyer.github.io/format-lizard/
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
