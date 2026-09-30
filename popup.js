import { SitePolicy } from './site-policy.js';

let currentTab = null;
let currentStatus = null;
let isDrawerOpen = false;

// DOM Elements
const viewNoWeb = document.getElementById('view-no-web');
const viewSite = document.getElementById('view-site');
const siteHostname = document.getElementById('site-hostname');
const siteOrigin = document.getElementById('site-origin');
const siteToggle = document.getElementById('site-toggle');
const statusBadge = document.getElementById('status-badge');
const statusDesc = document.getElementById('status-desc');
const reloadHint = document.getElementById('reload-hint');

const drawerToggle = document.getElementById('drawer-toggle');
const drawerCount = document.getElementById('drawer-count');
const drawerPanel = document.getElementById('drawer-panel');
const drawerList = document.getElementById('drawer-list');
const drawerEmpty = document.getElementById('drawer-empty');

async function getActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab) return tab;
    const [windowTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return windowTab ?? null;
  } catch {
    return null;
  }
}

async function init() {
  currentTab = await getActiveTab();
  const url = currentTab?.url;
  const status = await SitePolicy.getStatus(url);
  currentStatus = status;

  if (!status.isWeb) {
    viewNoWeb.classList.remove('view-hidden');
    viewSite.classList.add('view-hidden');
  } else {
    viewNoWeb.classList.add('view-hidden');
    viewSite.classList.remove('view-hidden');
    siteHostname.textContent = status.hostname;
    siteOrigin.textContent = status.origin;
    renderCurrentState(status);
  }

  await renderDrawerList();
}

function renderCurrentState(status) {
  siteToggle.setAttribute('aria-checked', status.isProtected ? 'true' : 'false');

  if (status.isProtected) {
    statusBadge.className = 'badge badge-success';
    statusBadge.innerHTML = '<span class="badge-dot"></span>Active';
    statusDesc.textContent = 'Clipboard events restored';
  } else if (status.needsAccess) {
    statusBadge.className = 'badge badge-subtle';
    statusBadge.textContent = 'Needs access';
    statusDesc.textContent = 'Click to allow CopyPasta on this site';
  } else if (status.rule) {
    statusBadge.className = 'badge badge-subtle';
    statusBadge.textContent = 'Paused';
    statusDesc.textContent = 'Protection paused for this site';
  } else {
    statusBadge.className = 'badge badge-subtle';
    statusBadge.textContent = 'Inactive';
    statusDesc.textContent = 'Click to restore paste on this site';
  }
}

async function handleSiteToggle() {
  if (!currentTab?.url || !currentStatus) return;
  const status = currentStatus;

  // Switching on asks Chrome for access to this one site. The request has to happen first,
  // inside the click, or Chrome will not show the prompt.
  const pattern = status.isProtected ? null : SitePolicy.accessPattern(currentTab.url, status.rule);
  const access = pattern ? SitePolicy.requestAccess(pattern) : Promise.resolve(true);
  siteToggle.disabled = true;

  try {
    if (!(await access)) return;

    if (status.needsAccess) {
      // Rule already on (for example synced from another browser): access was the only thing missing
      await SitePolicy.syncRegistrations();
    } else {
      await SitePolicy.toggle(currentTab.url);
    }

    if (!status.isProtected && currentTab.id) {
      await SitePolicy.inject(currentTab.id);
      reloadHint.classList.remove('view-hidden');
    }

    currentStatus = await SitePolicy.getStatus(currentTab.url);
    renderCurrentState(currentStatus);
    await renderDrawerList();
  } catch (err) {
    console.error('[CopyPasta] Error toggling site:', err);
  } finally {
    siteToggle.disabled = false;
  }
}

async function refreshCurrent() {
  if (currentTab?.url) {
    currentStatus = await SitePolicy.getStatus(currentTab.url);
    renderCurrentState(currentStatus);
  }
}

async function renderDrawerList() {
  const rules = await SitePolicy.list();
  const enabledCount = rules.filter((r) => r.enabled).length;
  drawerCount.textContent = `Configured sites (${enabledCount} active)`;

  drawerList.innerHTML = '';
  if (rules.length === 0) {
    drawerEmpty.classList.remove('view-hidden');
    return;
  }

  drawerEmpty.classList.add('view-hidden');

  for (const rule of rules) {
    const host = (() => {
      try {
        return new URL(rule.origin).hostname;
      } catch {
        return rule.origin;
      }
    })();

    const item = document.createElement('div');
    item.className = 'drawer-item';

    // Title / Domain
    const title = document.createElement('span');
    title.className = 'drawer-item-title';
    title.textContent = host;

    // Subdomain button
    const subBtn = document.createElement('button');
    subBtn.className = `btn-tag ${rule.matchSubdomains ? 'active' : ''}`;
    subBtn.title = rule.matchSubdomains ? 'Matching subdomains enabled' : 'Match subdomains (*.domain)';
    subBtn.textContent = rule.matchSubdomains ? '*.sub' : 'exact';
    subBtn.addEventListener('click', async () => {
      // Covering subdomains needs access to them too; ask inside the click
      if (!rule.matchSubdomains) {
        const granted = await SitePolicy.requestAccess(SitePolicy.accessPattern(rule.origin, { ...rule, matchSubdomains: true }));
        if (!granted) return;
      }
      await SitePolicy.toggleSubdomains(rule.origin);
      await refreshCurrent();
      await renderDrawerList();
    });

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-icon';
    delBtn.title = 'Remove site';
    delBtn.innerHTML = `
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    `;
    delBtn.addEventListener('click', async () => {
      await SitePolicy.remove(rule.origin);
      await refreshCurrent();
      await renderDrawerList();
    });

    item.appendChild(title);
    item.appendChild(subBtn);
    item.appendChild(delBtn);
    drawerList.appendChild(item);
  }
}

drawerToggle.addEventListener('click', () => {
  isDrawerOpen = !isDrawerOpen;
  drawerToggle.setAttribute('aria-expanded', isDrawerOpen ? 'true' : 'false');
  drawerPanel.classList.toggle('open', isDrawerOpen);
});

siteToggle.addEventListener('click', handleSiteToggle);

init();
