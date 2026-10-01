// Screenshot harness only: an in-memory stand-in for the chrome.* APIs the popup calls.
// The popup, its CSS and site-policy.js are copied verbatim from the repository root by
// scripts/make-store-shots.js, so a shot always shows the UI that ships.
// ?frame=N picks the state each shot in dist/store/shot.html needs.
const frame = new URLSearchParams(location.search).get('frame') ?? '1';
const now = Date.now();

const configured = [
  { origin: 'https://secure.examplebank.com', enabled: true, matchSubdomains: true, createdAt: now - 3e8 },
  { origin: 'https://hr.example.org', enabled: true, matchSubdomains: false, createdAt: now - 2e8 },
  { origin: 'https://forms.example.net', enabled: false, matchSubdomains: false, createdAt: now - 1e8 },
];

// Frame 3 is the "does nothing everywhere else" shot: no rules, and a tab nobody enabled.
const rules = frame === '3' ? [] : configured;
const tabUrl = frame === '3'
  ? 'https://news.example.com/world'
  : 'https://secure.examplebank.com/login';

const store = { copypasta_rules: rules };
const area = {
  get: async (keys) => Object.fromEntries([].concat(keys).filter((k) => k in store).map((k) => [k, store[k]])),
  set: async (obj) => Object.assign(store, obj),
};

window.chrome = {
  storage: { sync: area, local: area },
  tabs: { query: async () => [{ id: 1, url: tabUrl }] },
  permissions: { contains: async () => true, request: async () => true },
  scripting: {
    registerContentScripts: async () => {}, unregisterContentScripts: async () => {},
    getRegisteredContentScripts: async () => [], executeScript: async () => {},
  },
};

window.addEventListener('load', () => {
  setTimeout(() => {
    if (frame === '2') document.getElementById('drawer-toggle').click();
    setTimeout(() => parent.postMessage({ frame, height: document.body.scrollHeight }, '*'), 400);
  }, 200);
});
