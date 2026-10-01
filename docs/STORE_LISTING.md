# Chrome Web Store Listing — CopyPasta

This document contains the copy, asset specifications, and compliance justifications for the Chrome Web Store listing.

---

## Store Listing Copy

**Extension Name** [REQUIRED]  
CopyPasta

**Short Description** [REQUIRED]  
Restores copy, cut, and paste on sites that block it. Opt-in, per-site. No telemetry. No tracking. Open source.  
*(116 / 132 characters)*

**Detailed Description** [REQUIRED]  
CopyPasta restores normal copy, cut, and paste functionality on websites that block, intercept, or disable clipboard actions.

Many banking portals, password forms, and corporate web applications intentionally disable clipboard paste, making it frustrating to use secure password managers and enter long numbers. CopyPasta puts you back in control of your browser.

Key Features:
- Opt-In Protection: The extension stays completely idle and inactive until you specifically enable it for a website.
- One-Click Toggle: Click the extension icon in your browser toolbar to instantly enable or pause protection for the current site.
- Subdomain Matching: Choose whether to protect a single site or all of its subdomains with a simple switch.
- Account Sync: Optionally synchronize your enabled site list across your devices using your logged-in Google account.
- Private and Local: Runs entirely in your browser with zero remote servers, no telemetry, and no tracking.
- Zero Dependencies: Auditable, lightweight open-source code.

How to Use CopyPasta:
1. Navigate to any website that blocks paste or right-click copy.
2. Click the CopyPasta icon in your toolbar.
3. Toggle the switch to ON. Paste is restored immediately.
4. Manage rules or subdomain settings anytime in the popup drawer.

Privacy & Security:
CopyPasta never reads, saves, or transmits the contents of your clipboard. It does not monitor your browsing history, run analytics, or connect to external servers. Your settings remain entirely on your local machine unless you explicitly turn on Chrome account sync.

Support & Source:
CopyPasta is open source under the MIT License. For bug reports or feature requests, visit https://github.com/DeanNorman/CopyPasta/issues.

**Category** [REQUIRED]  
Productivity

**Single Purpose** [REQUIRED]  
Restores normal browser copy, cut, and paste functionality on websites that disable or block clipboard events.

**Primary Language** [REQUIRED]  
English

---

## Graphics & Asset Checklist

| Asset | Dimensions | Status | Location |
|---|---|---|---|
| Store Icon [REQUIRED] | 128×128 PNG | Ready | `icons/active-128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 | Ready | `dist/store/screenshot-1-active.png` — popup active on an enabled site |
| Screenshot 2 [RECOMMENDED] | 1280×800 | Ready | `dist/store/screenshot-2-sites.png` — "Configured sites" drawer open |
| Screenshot 3 [RECOMMENDED] | 1280×800 | Ready | `dist/store/screenshot-3-private.png` — inactive on a site nobody enabled, with the privacy facts |
| Small Promo Tile [OPTIONAL] | 440×280 | Optional | Promo tile with clipboard icon and tagline |
| Marquee Promo Tile [OPTIONAL] | 1400×560 | Optional | Featured banner |

Screenshots are generated, not hand-made: `npm run store-shots` renders every frame in
`scripts/store-shot/shot.html` into `dist/store/` with a local headless Chrome. The harness copies `popup.html`, `popup.css`,
`popup.js` and `site-policy.js` from the repository root and stubs only the `chrome.*` API, so the
screenshots always show the UI that ships. Upload them on the dashboard's **Store listing** tab.

---

## Permissions Justification

See [PERMISSIONS.md](PERMISSIONS.md) for full technical justifications to submit during review.

---

## Privacy Certification

- **Data Collection:** No user data is collected, transmitted, or sold.
- **Privacy Policy URL:** `https://github.com/DeanNorman/CopyPasta/blob/main/SECURITY.md`
