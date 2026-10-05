// "How it works" step 2: the per-site on/off switch demo.
document.querySelectorAll('.switch').forEach((sw) => {
  sw.addEventListener('click', () => {
    sw.setAttribute('aria-pressed', String(sw.getAttribute('aria-pressed') !== 'true'));
  });
});

// Cookie consent. Google Analytics (this website only) loads after the visitor accepts;
// the choice is remembered in localStorage and can be changed from the footer.
const GA_ID = 'G-TDE18KBJ8M';
const CONSENT_KEY = 'copypasta-analytics-consent';
const banner = document.querySelector('.consent');

function readConsent() {
  try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
}

function saveConsent(value) {
  try { localStorage.setItem(CONSENT_KEY, value); } catch { /* private mode: ask again next visit */ }
}

function loadAnalytics() {
  if (window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

if (readConsent() === 'granted') loadAnalytics();
else if (readConsent() !== 'denied') banner.hidden = false;

banner.querySelectorAll('[data-consent]').forEach((button) => {
  button.addEventListener('click', () => {
    const choice = button.dataset.consent;
    saveConsent(choice);
    banner.hidden = true;
    if (choice === 'granted') loadAnalytics();
    else if (window.gtag) {
      // Withdrawing consent: drop GA's cookies and reload so the tag is gone.
      document.cookie.split(';').map((c) => c.split('=')[0].trim())
        .filter((name) => name === '_ga' || name.startsWith('_ga_'))
        .forEach((name) => { document.cookie = `${name}=; max-age=0; path=/`; });
      location.reload();
    }
  });
});

document.querySelector('[data-consent-open]').addEventListener('click', (event) => {
  event.preventDefault();
  banner.hidden = false;
});
