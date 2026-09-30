# Publishing CopyPasta to the Chrome Web Store

This guide details the procedure for packaging and publishing new versions of CopyPasta to the Chrome Web Store (CWS).

---

## 1. Prerequisites

1. **Chrome Web Store Developer Account**: Enrolled at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
2. **Node.js**: v18 or later (to run test validation).
3. **Zip Utility**: Available standard on macOS/Linux (`zip`).

---

## 2. Release Preparation

1. **Update Version**:
   - Increment `"version"` in `manifest.json`.
   - Increment `"version"` in `package.json`.
   - Add release notes in `CHANGELOG.md`.

2. **Verify Tests**:
   ```bash
   npm test
   ```
   Ensure all automated unit tests pass.

3. **Verify Icons**:
   If icon assets need re-rendering:
   ```bash
   npm run generate-icons
   ```

---

## 3. Package the Extension ZIP

Because CopyPasta uses a zero-build architecture, creating the distribution ZIP file requires only packaging the runtime files:

```bash
# From the repository root:
zip -r copypasta-v2.1.0.zip \
  manifest.json \
  background.js \
  site-policy.js \
  popup.html \
  popup.js \
  popup.css \
  clipboard-injector.js \
  icons/
```

> **Note**: Do not include tests, documentation, scripts, `.git/`, or dev files in the ZIP uploaded to the Chrome Web Store. The archive must contain `manifest.json` directly at its root.

---

## 4. Upload to Developer Dashboard

1. Navigate to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
2. Select your extension item (or click **Add new item**).
3. Under **Package**, upload `copypasta-v2.1.0.zip`.
4. Review the automated validation results.
5. Refer to [STORE_LISTING.md](STORE_LISTING.md) for pre-written store description copy, privacy policy URL, and permissions justifications.

---

## 5. Review & Submission

1. Ensure the Privacy Practices tab matches:
   - Data collection: "No, I do not collect or use user data."
   - Single purpose description and permission justifications match [PERMISSIONS.md](PERMISSIONS.md).
2. Click **Submit for Review**.
3. Once approved, tag the release commit in Git:
   ```bash
   git tag v2.1.0
   git push origin v2.1.0
   ```
