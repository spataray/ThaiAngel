# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ThaiAngel is a suite of static web apps for **T.A. Station**, a Thai beverage establishment. There is no build system, bundler, package manager, or test framework — all files are vanilla HTML/CSS/JS served directly.

## Development

Serve locally with any static file server from the repo root:
```
python3 -m http.server 8000
# or
npx serve .
```

Firebase SDK is loaded via CDN ESM imports (v9.15.0 modular), not npm. No install step required.

## Architecture

### Three independent apps sharing a flat file structure:

1. **Age Verifier** (`index.html`) — Self-contained single-page app with all CSS and JS inline (~1,448 lines). Bilingual EN/TH age verification with date-of-birth input, dynamic approval/denial responses, and a background image carousel. Uses the screensaver module for auto-activate on inactivity. `index2.html` is an alternate version.

2. **Ordering System** (`ta-ordering.html` + `app.js`) — Firebase-backed staff tool for managing product inventory and order requests. Auth uses username-only login, internally mapped to `{username}@ta-station.local` email + deterministic password via `getCredentialsFromUsername()`. Admin role checked against `admins/{uid}` in Firebase Realtime Database. `ta-ordering3.html` + `app3.js` is an older version without admin role support.

3. **Gallery** (`gallery.html`) — Simple image gallery of venue photos with screensaver integration.

### Shared modules:
- **`screensaver.js` + `screensaver.css`** — Reusable IIFE module exposing `window.TAScreensaver`. Provides 5 transition effects (fade, slide, zoom, panZoom, crossFade), configurable clock, photo info overlay, and settings persistence via `localStorage` key `tastation-screensaver-settings`. Used by both `index.html` and `gallery.html`.
- **`style.css`** — Shared styles for the ordering system pages. Defines CSS custom properties for the dark theme with neon accent colors (red `#e74c3c`, gold `#f1c40f`, green `#28a745`).
- **`images/`** — 22 venue photos (`TAStation-1.JPG` through `TAStation-22.JPG`).

### File versions and backups:
The repo contains multiple versions of files (`app.js`/`app2.js`/`app3.js`, `index.html`/`index2.html`, `ta-ordering.html`/`ta-ordering3.html`) plus `.backup1` files. The current active versions are:
- `index.html` — age verifier (latest, with screensaver integration)
- `ta-ordering.html` + `app.js` — ordering system (latest, with admin roles)
- `app3.js` — older ordering logic used by `ta-ordering3.html` (no admin roles)

### Firebase structure:
- **Project:** `ta-station-ordering`
- **Database paths:** `products/`, `requests/`, `admins/{uid}`
- **Auth:** Firebase email/password (usernames mapped to synthetic emails)
- `Firebase_Initialization_Status.html` — standalone diagnostic page for testing Firebase connectivity

## Key Patterns

- `index.html` is entirely self-contained — all styles and JS (including ~300 personalized age-denial responses) are inline. Do not extract them to separate files without explicit instruction.
- The screensaver module uses an IIFE pattern attaching to `window.TAScreensaver`, not ES modules. It is loaded via `<script src="screensaver.js">` tags.
- The ordering app JS files (`app.js`, `app3.js`) use ES module imports (`type="module"` scripts) for Firebase SDK.
- There is no minification, transpilation, or linting configured.
