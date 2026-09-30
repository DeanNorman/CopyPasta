import { SitePolicy } from './site-policy.js';

// Synchronize content script registrations on installation and browser startup
chrome.runtime.onInstalled.addListener(async () => {
  await SitePolicy.syncRegistrations();
  await updateActiveTabIcons();
});

chrome.runtime.onStartup.addListener(async () => {
  await SitePolicy.syncRegistrations();
  await updateActiveTabIcons();
});

// React to external or synced storage changes
chrome.storage.onChanged.addListener(async (changes) => {
  if (changes.copypasta_rules || changes.copypasta_data) {
    await SitePolicy.syncRegistrations();
    await updateActiveTabIcons();
  }
});

// Re-sync when the user grants or revokes site access (including from Chrome's extension settings)
chrome.permissions.onAdded.addListener(async () => {
  await SitePolicy.syncRegistrations();
  await updateActiveTabIcons();
});

chrome.permissions.onRemoved.addListener(async () => {
  await SitePolicy.syncRegistrations();
  await updateActiveTabIcons();
});

// Update icon when switching active tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab?.url) {
      await updateTabIcon(activeInfo.tabId, tab.url);
    }
  } catch {
    // Tab may be closed or restricted
  }
});

// Update icon when tab URL navigates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const url = changeInfo.url || tab?.url;
  if (url) {
    await updateTabIcon(tabId, url);
  }
});

async function updateActiveTabIcons() {
  try {
    const tabs = await chrome.tabs.query({ active: true });
    for (const tab of tabs) {
      if (tab.id && tab.url) {
        await updateTabIcon(tab.id, tab.url);
      }
    }
  } catch {
    // Ignore query errors
  }
}

async function updateTabIcon(tabId, url) {
  const status = await SitePolicy.getStatus(url);

  try {
    if (!status.isWeb) {
      await setIcon(tabId, 'inactive', 'CopyPasta: not active on this page');
      return;
    }

    if (status.isProtected) {
      await setIcon(tabId, 'active', `CopyPasta: active on ${status.hostname}`);
    } else {
      await setIcon(tabId, 'inactive', 'CopyPasta: not active on this site');
    }
  } catch {
    // Restricted internal chrome tabs throw on setIcon - safe to ignore
  }
}

async function setIcon(tabId, state, title) {
  const path = {
    '16': `icons/${state}-16.png`,
    '32': `icons/${state}-32.png`,
    '48': `icons/${state}-48.png`,
    '128': `icons/${state}-128.png`,
  };
  await chrome.action.setIcon({ tabId, path });
  await chrome.action.setTitle({ tabId, title });
}
