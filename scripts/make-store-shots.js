#!/usr/bin/env node
/**
 * Renders the 1280x800 Chrome Web Store screenshots into dist/store/.
 *
 * The frames live in scripts/store-shot/shot.html; everything under dist/ is generated.
 * Each shot frames the extension's real popup: the harness copies popup.html, popup.css,
 * popup.js and site-policy.js straight from the repository root and swaps in
 * scripts/store-shot/stub.js for the chrome.* API, so a shot cannot drift from the shipped UI.
 *
 * Needs nothing installed beyond a local Chrome (set CHROME to point at another binary).
 *
 *   npm run store-shots
 */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile, copyFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'scripts/store-shot');
const out = path.join(root, 'dist/store');
const harness = path.join(out, 'harness');

const FRAMES = [
  { hash: 1, file: 'screenshot-1-active.png' },
  { hash: 2, file: 'screenshot-2-sites.png' },
  { hash: 3, file: 'screenshot-3-private.png' },
];

const CHROME_CANDIDATES = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
};

/** Rebuilds dist/store from the tracked frames plus the live popup, stubbing only chrome.*. */
async function buildHarness() {
  await mkdir(harness, { recursive: true });
  await copyFile(path.join(source, 'shot.html'), path.join(out, 'shot.html'));
  await copyFile(path.join(source, 'stub.js'), path.join(harness, 'stub.js'));

  for (const file of ['popup.css', 'popup.js', 'site-policy.js']) {
    await copyFile(path.join(root, file), path.join(harness, file));
  }

  const html = await readFile(path.join(root, 'popup.html'), 'utf8');
  const patched = html.replace(
    '</head>',
    '    <script src="./stub.js"></script>\n'
    + '    <style>*{transition:none !important}</style>\n  </head>',
  );
  if (patched === html) throw new Error('popup.html: no </head> to inject the harness stub into');
  await writeFile(path.join(harness, 'popup.html'), patched);
}

function serve() {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const file = path.join(root, path.normalize(decodeURIComponent(url.pathname)));
    if (!file.startsWith(root) || !existsSync(file)) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function shoot(chrome, url, out, profile) {
  const args = [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--force-device-scale-factor=1', '--window-size=1280,800',
    '--virtual-time-budget=4000', `--user-data-dir=${profile}`,
    `--screenshot=${out}`, url,
  ];
  return new Promise((resolve, reject) => {
    const child = spawn(chrome, args, { stdio: 'ignore' });

    // Headless Chrome writes the PNG and then sometimes lingers, so stop it once the file lands.
    const done = (err) => {
      clearInterval(poll);
      clearTimeout(watchdog);
      child.kill('SIGKILL');
      err ? reject(err) : resolve();
    };
    const poll = setInterval(() => {
      if (!existsSync(out)) return;
      clearInterval(poll);
      setTimeout(() => done(), 300);
    }, 250);
    const watchdog = setTimeout(
      () => done(new Error(`chrome never wrote ${path.basename(out)}`)),
      30_000,
    );

    child.on('error', done);
    child.on('exit', () => {
      if (existsSync(out)) done();
      else done(new Error(`chrome exited without writing ${path.basename(out)}`));
    });
  });
}

const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error('No Chrome found. Install Chrome or set CHROME=/path/to/chrome.');
  process.exit(1);
}

await buildHarness();
const server = await serve();
const { port } = server.address();
const profile = await mkdtemp(path.join(tmpdir(), 'copypasta-shots-'));

try {
  for (const { hash, file } of FRAMES) {
    const png = path.join(out, file);
    await rm(png, { force: true });
    await shoot(chrome, `http://127.0.0.1:${port}/dist/store/shot.html#${hash}`, png, profile);
    console.log(`dist/store/${file}`);
  }
} finally {
  server.close();
  await rm(profile, { recursive: true, force: true });
}
