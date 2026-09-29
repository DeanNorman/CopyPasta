# Contributing to CopyPasta

Thank you for your interest in contributing to CopyPasta! We welcome bug reports, documentation updates, and improvements that align with our core design goals.

## Core Philosophy

CopyPasta is intentionally built with:
1. **Zero build dependencies**: No Webpack, Vite, Rollup, Babel, or complex toolchains. Files at the repository root are loaded directly by Chromium browsers as an unpacked extension.
2. **Zero runtime dependencies**: Pure JavaScript (ES modules) and native CSS.
3. **Zero telemetry / zero network requests**: The extension never makes remote requests. Privacy and trust are paramount.
4. **Deep module architecture**: Complex logic belongs behind cohesive interfaces rather than scattered throughout shallow files.

Any pull request introducing heavy bundlers, external dependencies, or analytics will be respectfully declined.

---

## Getting Started

### Prerequisites

- A Chromium-based browser (Chrome, Brave, Edge, Arc)
- (Optional, for running automated tests) [Node.js](https://nodejs.org/) v18+

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DeanNorman/CopyPasta.git
   cd CopyPasta
   ```

2. **Load into your browser:**
   - Navigate to `chrome://extensions`
   - Enable **Developer mode** (toggle in the top-right corner)
   - Click **Load unpacked**
   - Select the cloned `CopyPasta` directory directly

3. **Make and verify changes:**
   - Since there is no build step, changes made to `.js`, `.html`, or `.css` files take effect immediately when you click the reload icon on the extension card in `chrome://extensions`.

---

## Running Tests

Automated tests run using Node.js's built-in test runner:

```bash
npm test
```

Tests cover URL normalization, origin pattern generation, wildcard subdomain matching, and mocked dynamic script registration operations. If you add or modify logic in `site-policy.js`, please add corresponding unit tests in `tests/site-policy.test.js`.

---

## Pull Request Guidelines

1. **Keep it focused**: Each pull request should address a single bug fix, performance improvement, or documentation update.
2. **Run tests before pushing**: Ensure `npm test` passes cleanly.
3. **Maintain privacy & security invariants**: Review [SECURITY.md](SECURITY.md) before proposing permission or script injection changes.
4. **Follow existing style**: Use standard modern JavaScript (ES2022+ modules) and idiomatic CSS.

Thank you for helping keep the web accessible and user-friendly!
