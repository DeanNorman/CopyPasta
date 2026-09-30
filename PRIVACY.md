# Privacy Policy — CopyPasta

_Last updated: 30 September 2026_

CopyPasta is a browser extension that restores copy, cut and paste on websites that block them. It is built to
know as little about you as possible.

## What CopyPasta collects

Nothing. CopyPasta does not collect, record, sell or share any personal data, browsing history, page content
or clipboard content.

## What CopyPasta stores

The only thing CopyPasta stores is **the list of sites you have switched it on for**, along with whether each
rule also covers that site's subdomains and whether it is paused.

- The list is kept in your browser's own extension storage (`chrome.storage.sync`, falling back to
  `chrome.storage.local`).
- If you have Chrome sync turned on, Chrome syncs this list between your own signed-in browsers, as it does for
  any extension setting. That sync is handled by Chrome under Google's privacy policy. CopyPasta has no server
  and never receives the list.
- Removing a site from the popup deletes its rule. Uninstalling the extension removes its stored settings.

## What CopyPasta does not do

- **No network requests.** The extension makes no HTTP requests of any kind: no analytics, telemetry, crash
  reporting or update pings.
- **No clipboard reading.** CopyPasta never reads or stores what you copy or paste. It only stops a website from
  blocking the browser's normal copy, cut and paste.
- **No remote code.** Everything the extension runs is inside the extension package.
- **Inert by default.** It runs only on sites you have switched it on for. On every other site it does nothing.

## Permissions

- `storage`: saves your list of enabled sites.
- `scripting`: switches the paste fix on for the sites you choose, and only those.
- `tabs`: reads the current tab's address so the popup and toolbar icon can show whether CopyPasta is on for that
  site. Addresses are not stored or sent anywhere.
- Access to all sites (`<all_urls>`): lets you choose to switch CopyPasta on for any site. It is not used to
  run on sites you have not chosen.

## Changes

Any change to this policy will be published in this file, with a new "Last updated" date.

## Contact

Questions or concerns: open an issue at https://github.com/DeanNorman/CopyPasta/issues.
