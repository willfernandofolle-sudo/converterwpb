# Teleport Convert Tool

Teleport Convert Tool is a web-based ZIP converter for TM172 SIP/SIG Web Page Builder exports.

## What This Tool Does

- Uploads a source ZIP package.
- Removes `404.html` and `404.css` from the output package.
- Rewrites asset references from `public/` to `img/` in paths and text files.
- Cleans HTML files by removing external Google Fonts links.
- Adds `enterkeyhint="done"` to text inputs when missing.
- Injects required HTML code automatically:
  - `../style/common.css` in `<head>` (if not already present)
  - `LLWebServerExtended.js` and `../js/base.js` before `</body>`
  - selected optional module scripts before `</body>`
  - final initialization script block
- Adds always-required modules to the output ZIP:
  - `LLWebServerExtended.js`
  - `scriptcustom.js`
- Adds optional modules selected by the user via UI checkboxes.
- When `alarms.js` is selected, also includes required alarm status images in the output ZIP:
  - `img/active.webp`
  - `img/inactive.webp`
  - `img/resettable.webp`
- Fetches module files with fallback order:
  1. Local path from `/public/modules` via `/modules/...`
  2. GitHub `main` raw URL
  3. GitHub `master` raw URL
- Generates and downloads the final package as `website.zip`.

## Main Files

- `pages/index.js`: UI and ZIP conversion pipeline.
- `config/zip-modules.js`: optional/required module registry and fallback URLs.
- `public/modules/`: local fallback JavaScript modules.
- `public/images/`: UI images.
