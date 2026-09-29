# Security Policy — CopyPasta

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.x     | Yes       |
| 1.x     | Deprecated|

## Reporting a Vulnerability

If you discover a security vulnerability in CopyPasta, please report it responsibly.

**Please do not report security vulnerabilities via public GitHub issues.**

### How to report

1. Submit a private report via [GitHub Security Advisories](https://github.com/DeanNorman/CopyPasta/security/advisories/new), or
2. Contact the maintainer privately at the email address listed in the maintainer's GitHub profile.

Please include:
- A description of the vulnerability and attack vector
- Steps to reproduce or a proof of concept
- Potential impact
- Any suggested fixes or mitigations

### Response Timeline

- **Acknowledgement:** Within 48 hours
- **Assessment & Triage:** Within 7 business days
- **Fix & Disclosure:** Coordinated release within 14–30 days depending on severity

## Security Design Invariants

CopyPasta is engineered with a strictly minimal attack surface:

- **Zero Network Requests**: The extension makes zero HTTP/HTTPS requests, telemetry calls, analytics transmissions, or crash reporting pings.
- **Zero Remote Code**: All HTML, JavaScript, and CSS are contained entirely within the local extension package. No CDN scripts, fonts, or external resources are ever loaded.
- **No `eval()` or Dynamic Code Execution**: Strict Chrome Manifest V3 Content Security Policy (`default-src 'self'`) is enforced.
- **Opt-in Only Execution**: Content scripts are registered dynamically via `chrome.scripting.registerContentScripts` and **only** target origins explicitly enabled by the user. On all other websites, CopyPasta is completely inert.
- **Isolated Storage**: Settings are stored in `chrome.storage.sync` with local fallback. Data is strictly schema-validated before being written or read.
- **Auditable & Zero-Build**: Source code is vanilla ES modules that can be inspected directly without deciphering minified bundles or transpiled output.
