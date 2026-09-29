/**
 * SitePolicy - Deep Module for CopyPasta
 * Encapsulates URL normalization, matching logic, storage synchronization,
 * and dynamic Chrome content script registrations behind a minimal interface.
 */

const STORAGE_KEY = 'copypasta_rules';
const LEGACY_STORAGE_KEY = 'copypasta_data';

/**
 * @typedef {Object} SiteRule
 * @property {string} origin - Normalized web origin (e.g. "https://example.com")
 * @property {boolean} enabled - Whether clipboard protection is currently active
 * @property {boolean} matchSubdomains - Whether subdomains (*.example.com) should also match
 * @property {number} createdAt - Unix timestamp of creation
 */

/**
 * Normalizes input string to a valid web origin (http/https only)
 * @param {string} input
 * @returns {string | null}
 */
export function normalizeOrigin(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed || trimmed.includes(' ')) return null;

  try {
    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed);
    const parsed = hasScheme ? new URL(trimmed) : new URL('https://' + trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * Converts an origin and subdomain flag into a Chrome match pattern
 * @param {string} origin
 * @param {boolean} matchSubdomains
 * @returns {string}
 */
export function originToPattern(origin, matchSubdomains) {
  const url = new URL(origin);
  if (matchSubdomains) {
    const baseHost = url.hostname.replace(/^www\./, '');
    return `*://*.${baseHost}/*`;
  }
  return `*://${url.hostname}/*`;
}

/**
 * Derives a deterministic, safe Chrome script ID from an origin
 * @param {string} origin
 * @returns {string}
 */
export function originToScriptId(origin) {
  try {
    const host = new URL(origin).host.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `cp_${host}`;
  } catch {
    return `cp_${Date.now()}`;
  }
}

/**
 * Tests if a rule matches a target URL
 * @param {SiteRule} rule
 * @param {string} url
 * @returns {boolean}
 */
export function matchesUrl(rule, url) {
  if (!rule || !rule.enabled) return false;
  try {
    const target = new URL(url);
    if (target.protocol !== 'http:' && target.protocol !== 'https:') return false;

    const ruleUrl = new URL(rule.origin);
    const targetHost = target.hostname.toLowerCase();
    const ruleHost = ruleUrl.hostname.toLowerCase();

    if (targetHost === ruleHost) return true;
    if (rule.matchSubdomains) {
      if (targetHost.endsWith('.' + ruleHost)) return true;
      if (ruleHost.startsWith('www.')) {
        const baseHost = ruleHost.slice(4);
        if (targetHost === baseHost || targetHost.endsWith('.' + baseHost)) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Loads rules from storage, supporting sync with local fallback and legacy migration
 * @returns {Promise<SiteRule[]>}
 */
async function loadStoredRules() {
  if (typeof chrome === 'undefined' || !chrome.storage) {
    return [];
  }

  let raw = null;
  // Try sync storage first
  if (chrome.storage.sync) {
    try {
      const syncData = await chrome.storage.sync.get([STORAGE_KEY, LEGACY_STORAGE_KEY]);
      raw = syncData[STORAGE_KEY] || syncData[LEGACY_STORAGE_KEY]?.rules;
    } catch {
      // sync may fail if disabled or offline
    }
  }

  // Fallback to local storage if sync didn't produce data
  if (!raw && chrome.storage.local) {
    try {
      const localData = await chrome.storage.local.get([STORAGE_KEY, LEGACY_STORAGE_KEY]);
      raw = localData[STORAGE_KEY] || localData[LEGACY_STORAGE_KEY]?.rules;
    } catch {
      // local read failed
    }
  }

  if (!Array.isArray(raw)) return [];

  // Validate and normalize rules
  return raw.filter((r) => r && typeof r.origin === 'string').map((r) => ({
    origin: r.origin,
    enabled: typeof r.enabled === 'boolean' ? r.enabled : true,
    matchSubdomains: typeof r.matchSubdomains === 'boolean' ? r.matchSubdomains : false,
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : Date.now(),
  }));
}

/**
 * Saves rules to storage, attempting sync first with silent local fallback
 * @param {SiteRule[]} rules
 * @returns {Promise<void>}
 */
async function saveStoredRules(rules) {
  if (typeof chrome === 'undefined' || !chrome.storage) return;

  // Always cache to local
  if (chrome.storage.local) {
    await chrome.storage.local.set({ [STORAGE_KEY]: rules }).catch(() => {});
  }

  // Also push to sync if available
  if (chrome.storage.sync) {
    try {
      await chrome.storage.sync.set({ [STORAGE_KEY]: rules });
    } catch {
      // Sync quota or offline fallback silently handled by local storage
    }
  }
}

/**
 * Deep Module Public Interface
 */
export const SitePolicy = {
  /**
   * Retrieves all saved rules
   * @returns {Promise<SiteRule[]>}
   */
  async list() {
    return await loadStoredRules();
  },

  /**
   * Evaluates the protection status of a given URL
   * @param {string | null | undefined} url
   * @returns {Promise<{ isWeb: boolean, origin: string | null, hostname: string | null, rule: SiteRule | null, isProtected: boolean }>}
   */
  async getStatus(url) {
    if (!url) {
      return { isWeb: false, origin: null, hostname: null, rule: null, isProtected: false };
    }

    try {
      const parsed = new URL(url);
      const isWeb = parsed.protocol === 'http:' || parsed.protocol === 'https:';
      if (!isWeb) {
        return { isWeb: false, origin: null, hostname: null, rule: null, isProtected: false };
      }

      const origin = parsed.origin;
      const hostname = parsed.hostname;
      const rules = await loadStoredRules();
      const rule = rules.find((r) => matchesUrl(r, url)) ?? null;

      return {
        isWeb: true,
        origin,
        hostname,
        rule,
        isProtected: !!rule?.enabled,
      };
    } catch {
      return { isWeb: false, origin: null, hostname: null, rule: null, isProtected: false };
    }
  },

  /**
   * Toggles protection for a target URL (creates rule if missing, flips state if present)
   * @param {string} url
   * @returns {Promise<{ rule: SiteRule, isProtected: boolean }>}
   */
  async toggle(url) {
    const origin = normalizeOrigin(url);
    if (!origin) throw new Error(`Invalid web origin: ${url}`);

    const rules = await loadStoredRules();
    const existingIndex = rules.findIndex((r) => r.origin === origin);

    let targetRule;
    if (existingIndex >= 0) {
      targetRule = {
        ...rules[existingIndex],
        enabled: !rules[existingIndex].enabled,
      };
      rules[existingIndex] = targetRule;
    } else {
      targetRule = {
        origin,
        enabled: true,
        matchSubdomains: false,
        createdAt: Date.now(),
      };
      rules.push(targetRule);
    }

    await saveStoredRules(rules);
    await this.syncRegistrations(rules);

    return {
      rule: targetRule,
      isProtected: targetRule.enabled,
    };
  },

  /**
   * Removes a rule for a given origin and unregisters its script
   * @param {string} origin
   * @returns {Promise<void>}
   */
  async remove(origin) {
    const rules = await loadStoredRules();
    const filtered = rules.filter((r) => r.origin !== origin);
    await saveStoredRules(filtered);
    await this.syncRegistrations(filtered);
  },

  /**
   * Toggles subdomain matching for a specific origin
   * @param {string} origin
   * @returns {Promise<SiteRule | null>}
   */
  async toggleSubdomains(origin) {
    const rules = await loadStoredRules();
    const rule = rules.find((r) => r.origin === origin);
    if (!rule) return null;

    rule.matchSubdomains = !rule.matchSubdomains;
    await saveStoredRules(rules);
    await this.syncRegistrations(rules);
    return rule;
  },

  /**
   * Synchronizes dynamic content script registrations with enabled rules
   * @param {SiteRule[]} [rules]
   * @returns {Promise<void>}
   */
  async syncRegistrations(rules) {
    if (typeof chrome === 'undefined' || !chrome.scripting || !chrome.scripting.registerContentScripts) {
      return;
    }

    const allRules = rules || (await loadStoredRules());
    const enabledRules = allRules.filter((r) => r.enabled);

    try {
      const existing = await chrome.scripting.getRegisteredContentScripts();
      const existingMap = new Map(existing.map((s) => [s.id, s]));
      const desiredMap = new Map(enabledRules.map((r) => [originToScriptId(r.origin), r]));

      // Unregister scripts that are no longer enabled OR whose match pattern changed
      const toRemove = [];
      for (const [id, script] of existingMap.entries()) {
        const rule = desiredMap.get(id);
        if (!rule) {
          toRemove.push(id);
        } else {
          const expectedPattern = originToPattern(rule.origin, rule.matchSubdomains);
          if (!script.matches || script.matches[0] !== expectedPattern) {
            toRemove.push(id);
          }
        }
      }

      if (toRemove.length > 0) {
        await chrome.scripting.unregisterContentScripts({ ids: toRemove });
        for (const id of toRemove) existingMap.delete(id);
      }

      // Register scripts that are enabled and not currently registered
      const toAdd = enabledRules.filter((r) => !existingMap.has(originToScriptId(r.origin)));
      if (toAdd.length > 0) {
        await chrome.scripting.registerContentScripts(
          toAdd.map((rule) => ({
            id: originToScriptId(rule.origin),
            matches: [originToPattern(rule.origin, rule.matchSubdomains)],
            js: ['clipboard-injector.js'],
            runAt: 'document_start',
            allFrames: true,
            world: 'MAIN',
          })),
        );
      }
    } catch (err) {
      console.warn('[CopyPasta] Dynamic script registration sync warning:', err);
    }
  },

  /**
   * Immediately injects clipboard-injector into a specific tab
   * @param {number} tabId
   * @returns {Promise<void>}
   */
  async inject(tabId) {
    if (typeof chrome === 'undefined' || !chrome.scripting || !chrome.scripting.executeScript) {
      return;
    }
    try {
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        files: ['clipboard-injector.js'],
        world: 'MAIN',
      });
    } catch (err) {
      console.warn('[CopyPasta] Immediate script injection warning:', err);
    }
  },
};
