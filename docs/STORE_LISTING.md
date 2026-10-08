# Chrome Web Store Listing — CopyPasta

This document contains the copy, asset specifications, and compliance justifications for the Chrome Web Store listing.

---

## Store Listing Copy

**Extension Name** [REQUIRED]  
CopyPasta

**Short Description** [REQUIRED]  
Restores copy, cut, and paste on sites that block it. Opt-in, per-site. No telemetry.  
*(85 / 132 characters. The dashboard takes this from `manifest.json` "description"; change it there.)*

**Detailed Description** [REQUIRED]  
CopyPasta restores normal copy, cut, and paste on websites that block them.

Some banking portals, password forms and web apps deliberately block paste. That makes password managers harder to use and turns long reference numbers into retyping errors. CopyPasta lets you switch that blocking off, one site at a time.

What it does:
- Opt-in, per site: CopyPasta does nothing until you switch it on for a website.
- One-click toggle: click the toolbar icon to switch it on or pause it for the current site.
- Subdomains: choose whether a rule covers only that site or its subdomains too.
- Your site list: see every site you have enabled, change its subdomain setting, or remove it.
- Follows Chrome sync: if Chrome sync is on, your site list follows you to your other signed-in browsers.

How to use it:
1. Go to a website that blocks paste.
2. Click the CopyPasta icon in your toolbar.
3. Switch it on. If paste does not work straight away, reload the page.
4. Open "Configured sites" in the popup to manage or remove sites.

Privacy:
CopyPasta never reads, saves or sends what you copy or paste. It makes no network requests, runs no analytics and has no server. The only thing it stores is your list of enabled sites, in your browser's own storage. Privacy policy: https://github.com/DeanNorman/CopyPasta/blob/main/PRIVACY.md

Website:
How it works, with screenshots: https://deannorman.github.io/CopyPasta/

Open source:
MIT licensed. Source code, bug reports and feature requests: https://github.com/DeanNorman/CopyPasta

**Category** [REQUIRED]  
Productivity

**Single Purpose** [REQUIRED]  
Restores normal browser copy, cut, and paste functionality on websites that disable or block clipboard events.

**Primary Language** [REQUIRED]  
English

**Homepage URL** [RECOMMENDED]  
https://deannorman.github.io/CopyPasta/

**Support URL** [RECOMMENDED]  
https://github.com/DeanNorman/CopyPasta/issues

> **Not live yet (2026-10-08):** the "Website" paragraph and the Homepage URL are not on the
> published listing. Paste both on the dashboard's **Store listing** tab and submit for review.
> Everything else above matches the live listing.

---

## Graphics & Asset Checklist

| Asset | Dimensions | Status | Location |
|---|---|---|---|
| Store Icon [REQUIRED] | 128×128 PNG | Ready | `icons/active-128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 | Ready | `dist/store/screenshot-1-active.png` — popup active on an enabled site |
| Screenshot 2 [RECOMMENDED] | 1280×800 | Ready | `dist/store/screenshot-2-sites.png` — "Configured sites" drawer open |
| Screenshot 3 [RECOMMENDED] | 1280×800 | Ready | `dist/store/screenshot-3-private.png` — inactive on a site nobody enabled, with the privacy facts |
| Small Promo Tile [OPTIONAL] | 440×280 | Ready | `dist/store/promo-small-440x280.png` — mascot and "Paste freely." |
| Marquee Promo Tile [OPTIONAL] | 1400×560 | Ready | `dist/store/promo-marquee-1400x560.png` — the site's hero as a banner |

Screenshots are generated, not hand-made: `npm run store-shots` renders every frame in
`scripts/store-shot/shot.html` into `dist/store/` with a local headless Chrome. The harness copies `popup.html`, `popup.css`,
`popup.js` and `site-policy.js` from the repository root and stubs only the `chrome.*` API, so the
screenshots always show the UI that ships. The promo tiles come from `npm run site-images`
(frames in `scripts/site-images/promo-*.html`). Upload them on the dashboard's **Store listing** tab.

---

## Permissions Justification

See [PERMISSIONS.md](PERMISSIONS.md) for full technical justifications to submit during review.

---

## Privacy Certification

- **Data Collection:** No user data is collected, transmitted, or sold.
- **Privacy Policy URL:** `https://github.com/DeanNorman/CopyPasta/blob/main/PRIVACY.md`
