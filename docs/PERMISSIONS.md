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

## 4. `host_permissions: <all_urls>`

**Browser Prompt:** *"Read and change all your data on all websites"*

**Technical Purpose:**
Required by Chrome's `chrome.scripting` API to allow registering scripts against user-selected origins.
- Chrome requires extensions to declare candidate host patterns before registering dynamic scripts on them.
- `<all_urls>` allows users to enable clipboard restoration on any domain of their choice (e.g., their bank, company intranet, or password portal).
- **Critical distinction:** Declaring `<all_urls>` in `host_permissions` does **not** inject any code globally. Code is only injected onto specific origins where the user has explicitly clicked "Enable".

---

## Privacy Summary: What CopyPasta Does NOT Do

- **Does not read clipboard content:** CopyPasta intercepts `copy`, `cut`, and `paste` events solely to stop websites from calling `preventDefault()`. It never inspects, reads, or records what you copy or paste.
- **Does not make network requests:** Zero fetch, XHR, WebSocket, or WebRTC calls.
- **Does not collect telemetry or analytics:** Zero tracking, zero metrics, zero fingerprinting.
- **Does not load remote code:** All code is packaged locally within the extension.
