# CopyPasta Architecture

This document records the architectural invariants, core domain concepts, and ubiquitous language for the CopyPasta extension.

---

## Ubiquitous Language

- **`SitePolicy`**: The deep module governing clipboard protection across origins. It encapsulates URL normalization, wildcard subdomain matching rules, persistent storage (sync with local fallback), and dynamic `chrome.scripting` registration. Callers interact with a narrow 3-method interface (`getStatus`, `toggle`, `list`).
- **Site Rule**: A declarative policy record defining an origin, enabled state, and subdomain matching behavior (`{ origin, matchSubdomains, enabled, createdAt }`).
- **`ClipboardInjector`**: The lightweight script injected into the `MAIN` execution world at `document_start` to intercept `copy`, `cut`, and `paste` events and invoke `stopImmediatePropagation()`.
- **Popup**: The single unified extension user interface containing the active site toggle and a collapsible site management drawer.
- **Background Worker**: The ephemeral Manifest V3 service worker responsible for tab activation listeners, icon badge updates, and browser startup synchronization.

---

## Architectural Invariants

### 1. Zero-Build Native Layout
Source files live directly at the repository root:
- `manifest.json`
- `background.js`
- `site-policy.js`
- `popup.html`, `popup.js`, `popup.css`
- `clipboard-injector.js`
- `icons/`

There are no bundlers, transpilers, or polyfills. Any Chromium browser can load the repository directly as an unpacked extension.

### 2. Deep Module Seam
All business logic regarding storage, URL normalization, pattern generation, and Chrome scripting API integration is contained within `site-policy.js`. Neither the popup nor the service worker directly invokes `chrome.scripting.registerContentScripts` or directly manipulates raw storage objects.

### 3. Bidirectional Resilient Storage
`SitePolicy` persists rules to `chrome.storage.sync` with automatic silent fallback to `chrome.storage.local`. If a user is not signed into Chrome or sync quota is exceeded, local storage guarantees settings are preserved without throwing errors.

### 4. Deterministic Script Identification
Script IDs are derived deterministically from the origin host (e.g. `cp_example_com`) rather than generated as random UUIDs. This simplifies registration reconciliation and avoids duplicate registrations.

### 5. Zero External Dependencies
- Runtime: Vanilla JavaScript (ES modules) + Native CSS.
- Testing: Built-in Node.js test runner (`node:test`, `node:assert/strict`).
- Icon Generation: Built-in Node.js utilities (`zlib`, `fs`).
