# Permissions Justification — CopyPasta

This document explains every permission requested by CopyPasta and the technical reasons why each is necessary.

---

## 1. `storage`

**Browser Prompt:** *"Store and retrieve data on your local device"*

**Technical Purpose:**
Saves the user's configured site rules (the list of enabled origins and subdomain matching preferences).
- Stored using `chrome.storage.sync` so rules follow the user's Chrome account across workstations.
- Automatically falls back to `chrome.storage.local` if sync storage is disabled or unavailable.
- No rule data or preferences are ever sent to any third party or remote server.

---

## 2. `scripting`

**Browser Prompt:** *"Read and change all your data on websites you visit"*

**Technical Purpose:**
Enables dynamic content script management via `chrome.scripting.registerContentScripts` and immediate injection via `chrome.scripting.executeScript`.
- **Dynamic Registration:** The extension uses dynamic script registration exclusively on origins the user explicitly activates. Without this permission, the extension would have to declare content scripts statically in `manifest.json`, meaning scripts would run everywhere. Dynamic registration ensures that CopyPasta executes **only** on domains the user specifically chooses.
- **Main World Execution:** Registered scripts run in the `MAIN` execution world at `document_start` so that event listeners can intercept clipboard events in the capture phase before host-page scripts intercept or cancel them.

---

## 3. `tabs`

**Browser Prompt:** *"Read your browsing history"*

**Technical Purpose:**
Enables reading the active tab's URL (via `chrome.tabs.query`) to determine whether the current site is enabled for CopyPasta.
- Powers the active/inactive toolbar icon badge state.
- Powers the popup UI to display the active domain and toggle switch.
- Tab URLs are never logged, stored persistently, or transmitted off the device.

---

## 4. `optional_host_permissions: *://*/*` (requested one site at a time)

**At install:** no site access is requested, so Chrome shows no "all your data on all websites" prompt.

**At runtime:** when the user switches CopyPasta on for a site, the popup calls `chrome.permissions.request` for
that site's match pattern only (for example `*://bank.example.com/*`, or `*://*.example.com/*` when the user
chooses to cover subdomains). Chrome shows its own prompt, and the user can refuse.
- Content scripts are registered only for rules the user has enabled **and** granted access to.
- Removing a site calls `chrome.permissions.remove` for its patterns, giving the access back.
- If the user revokes access in Chrome's settings, the background worker re-syncs and the popup shows "Needs access".
- A rule synced from another browser does nothing on this one until the user grants access here.

---

## Privacy Summary: What CopyPasta Does NOT Do

- **Does not read clipboard content:** CopyPasta intercepts `copy`, `cut`, and `paste` events solely to stop websites from calling `preventDefault()`. It never inspects, reads, or records what you copy or paste.
- **Does not make network requests:** Zero fetch, XHR, WebSocket, or WebRTC calls.
- **Does not collect telemetry or analytics:** Zero tracking, zero metrics, zero fingerprinting.
- **Does not load remote code:** All code is packaged locally within the extension.
