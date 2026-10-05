#!/usr/bin/env node
/**
 * Renders the website's raster images into site/:
 *   - copypasta-chrome-extension-social.png  1200x630 Open Graph card (scripts/site-images/og.html)
 *   - apple-touch-icon.png                    180x180 home-screen icon (scripts/site-images/touch-icon.html)
 *   - copypasta-popup-screenshot-{640,1280}.webp  product shot, from dist/store/screenshot-1-active.png
 * and the Chrome Web Store promo tiles into dist/store/:
 *   - promo-small-440x280.png, promo-marquee-1400x560.png  (scripts/site-images/promo-*.html)
 *
 * Needs a local Chrome (set CHROME to override) and cwebp. Run `npm run store-shots` first
 * so the product shot matches the shipped popup.
 *
 *   npm run site-images
 */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, copyFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, 'site');

const chrome = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean).find(existsSync);
if (!chrome) throw new Error('No Chrome found; set CHROME');

function render(frame, out, width, height) {
  const profile = mkdtempSync(path.join(tmpdir(), 'site-images-'));
  rmSync(out, { force: true });
  const child = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--force-device-scale-factor=1', `--window-size=${width},${height}`,
    '--virtual-time-budget=2000', `--user-data-dir=${profile}`, `--screenshot=${out}`,
    pathToFileURL(path.join(root, 'scripts/site-images', frame)).href,
  ], { stdio: 'ignore' });

  // Headless Chrome writes the PNG and then sometimes lingers, so stop it once the file lands.
  return new Promise((resolve, reject) => {
    const done = (err) => {
      clearInterval(poll);
      clearTimeout(watchdog);
      // Remove the throwaway profile once Chrome has really gone, or it races the delete.
      child.once('exit', () => rmSync(profile, { recursive: true, force: true, maxRetries: 5 }));
      child.kill('SIGKILL');
      if (err) return reject(err);
      console.log(path.relative(root, out));
      resolve();
    };
    const poll = setInterval(() => {
      if (!existsSync(out)) return;
      clearInterval(poll);
      setTimeout(() => done(), 300);
    }, 250);
    const watchdog = setTimeout(() => done(new Error(`chrome never wrote ${path.basename(out)}`)), 30_000);
    child.on('error', done);
  });
}

await render('og.html', path.join(site, 'copypasta-chrome-extension-social.png'), 1200, 630);
await render('touch-icon.html', path.join(site, 'apple-touch-icon.png'), 180, 180);
mkdirSync(path.join(root, 'dist/store'), { recursive: true });
await render('promo-small.html', path.join(root, 'dist/store/promo-small-440x280.png'), 440, 280);
await render('promo-marquee.html', path.join(root, 'dist/store/promo-marquee-1400x560.png'), 1400, 560);
copyFileSync(path.join(root, 'icons/active-32.png'), path.join(site, 'favicon-32.png'));
console.log('site/favicon-32.png');

const shot = path.join(root, 'dist/store/screenshot-1-active.png');
if (!existsSync(shot)) throw new Error('Run `npm run store-shots` first');
for (const w of [640, 1280]) {
  const out = path.join(site, `copypasta-popup-screenshot-${w}.webp`);
  execFileSync('cwebp', ['-quiet', '-q', '82', '-resize', String(w), '0', shot, '-o', out]);
  console.log(path.relative(root, out));
}
