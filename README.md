# CopyPasta

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-node%20--test-success.svg)](tests/)
[![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](package.json)
[![Manifest V3](https://img.shields.io/badge/manifest-v3-orange.svg)](manifest.json)

> **Paste freely. Your data stays yours.**

A modern Chromium browser extension that restores `copy`, `cut`, and `paste` on websites that deliberately disable or intercept clipboard events — banking portals, HR systems, healthcare forms, password fields, and more.

**Zero telemetry. Zero network requests. Zero build dependencies. Opt-in, per-site.**

---

## Why does this exist?

Many websites block the browser's native paste events in an effort to force manual re-entry of credentials and numbers. This practice is:

- **Hostile to password managers** (1Password, Bitwarden, KeePass, Dashlane, etc.)
- **Counter-productive** — forcing manual re-typing significantly increases errors and typos
- **Security theater** — it does not stop automated attacks or scraping
- **Accessibility impediment** — users relying on assistive technology or physical input devices depend on clipboard functionality

CopyPasta fixes this cleanly and safely with a minimal, auditable footprint.

---

## How it works

When you enable CopyPasta for a website, it registers a lightweight content script that executes in the page's execution world at **`document_start`** (before any page scripts run).

The script attaches event listeners for `copy`, `cut`, and `paste` in the **capture phase** and invokes `stopImmediatePropagation()`:

```js
function forceBrowserDefault(e) {
  e.stopImmediatePropagation();
  return true;
}

['copy', 'cut', 'paste'].forEach((eventName) => {
  document.addEventListener(eventName, forceBrowserDefault, true); // capture phase
});
```

Because it captures the event before the host page's scripts can receive it, the page's `preventDefault()` blocking logic never executes. The browser's default clipboard action proceeds unimpeded.

**Privacy Guarantee:** CopyPasta is completely inert on any website you have not explicitly enabled. No content scripts run globally.

---

## Quick Start (Load from Source)

CopyPasta has **zero build steps** and **zero dependencies**. You can clone and load it directly into your browser in seconds:

### Prerequisites

- Any Chromium browser: Chrome, Brave, Edge, Arc, Vivaldi, Opera
- (Optional, to run automated tests) [Node.js](https://nodejs.org/) v18+

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DeanNorman/CopyPasta.git
   cd CopyPasta
   ```

2. **Load into your browser:**
   - Open **`chrome://extensions`** in your browser
   - Toggle **Developer mode** (top-right switch)
   - Click **Load unpacked**
   - Select the cloned **`CopyPasta`** folder

3. **Enable on any site:**
   - Navigate to a site that blocks pasting
   - Click the CopyPasta icon in your toolbar
   - Switch the toggle to **ON**
   - Paste away! (If already on the page, reload once)

---

## Running Tests

Automated unit tests use Node.js's built-in native test runner (`node:test` and `node:assert/strict`) — zero installation needed:

```bash
npm test
```

To re-render all PNG icons from scratch:

```bash
npm run generate-icons
```

---

## Architecture & Design

- **Zero-Build Native ES Modules**: Chromium loads files directly from the repository root. No Webpack, Vite, or Babel.
- **Deep `SitePolicy` Seam**: All URL parsing, wildcard subdomain matching, sync storage fallback, and dynamic Chrome scripting registration live in [`site-policy.js`](site-policy.js) behind a narrow 3-method interface.
- **Resilient Storage**: Rules are stored in `chrome.storage.sync` with automatic, silent fallback to `chrome.storage.local`.
- **Pure Native CSS**: Dark-mode ready styles ([`popup.css`](popup.css)) designed to comply strictly with Chrome Content Security Policy.

Read more in [Architecture Documentation](docs/ARCHITECTURE.md).

---

## Documentation

- [Architecture & Domain Model](docs/ARCHITECTURE.md)
- [Permissions Justification](docs/PERMISSIONS.md)
- [Publishing to Chrome Web Store](docs/PUBLISHING.md)
- [Web Store Listing & Assets](docs/STORE_LISTING.md)
- [Changelog](CHANGELOG.md)
- [Security Policy](SECURITY.md)
- [Contributing Guidelines](CONTRIBUTING.md)

---

## License

[MIT](LICENSE) © 2026 Dean Norman
