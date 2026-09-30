import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeOrigin,
  originToPattern,
  originToScriptId,
  matchesUrl,
  SitePolicy,
} from '../site-policy.js';

describe('normalizeOrigin', () => {
  test('normalizes valid https origin', () => {
    assert.equal(normalizeOrigin('https://example.com/some/path'), 'https://example.com');
  });

  test('normalizes valid http origin with port', () => {
    assert.equal(normalizeOrigin('http://localhost:8080/test'), 'http://localhost:8080');
  });

  test('auto-prepends https when protocol omitted', () => {
    assert.equal(normalizeOrigin('sub.domain.org/path'), 'https://sub.domain.org');
  });

  test('rejects non-web schemes and invalid inputs', () => {
    assert.equal(normalizeOrigin('ftp://files.com'), null);
    assert.equal(normalizeOrigin('chrome://extensions'), null);
    assert.equal(normalizeOrigin('javascript:alert(1)'), null);
    assert.equal(normalizeOrigin('not a domain'), null);
    assert.equal(normalizeOrigin(''), null);
    assert.equal(normalizeOrigin(null), null);
  });
});

describe('originToPattern', () => {
  test('generates standard match pattern', () => {
    assert.equal(originToPattern('https://example.com', false), '*://example.com/*');
  });

  test('generates subdomain wildcard match pattern', () => {
    assert.equal(originToPattern('https://example.com', true), '*://*.example.com/*');
    assert.equal(originToPattern('https://www.example.com', true), '*://*.example.com/*');
  });
});

describe('originToScriptId', () => {
  test('derives deterministic, valid alphanumeric script ID', () => {
    assert.equal(originToScriptId('https://example.com'), 'cp_example_com');
    assert.equal(originToScriptId('https://sub-domain.co.uk:3000'), 'cp_sub_domain_co_uk_3000');
  });

  test('never starts with an underscore (MV3 requirement)', () => {
    const id = originToScriptId('https://_test.com');
    assert.match(id, /^cp_/);
  });
});

describe('matchesUrl', () => {
  const baseRule = {
    origin: 'https://example.com',
    enabled: true,
    matchSubdomains: false,
    createdAt: Date.now(),
  };

  test('matches exact host and paths', () => {
    assert.equal(matchesUrl(baseRule, 'https://example.com/checkout'), true);
    assert.equal(matchesUrl(baseRule, 'http://example.com/'), true);
  });

  test('does not match subdomains if flag disabled', () => {
    assert.equal(matchesUrl(baseRule, 'https://sub.example.com/'), false);
  });

  test('matches subdomains when matchSubdomains is true', () => {
    const subRule = { ...baseRule, matchSubdomains: true };
    assert.equal(matchesUrl(subRule, 'https://app.example.com/login'), true);
    assert.equal(matchesUrl(subRule, 'https://deep.nested.example.com/'), true);
  });

  test('ignores disabled rules', () => {
    const disabledRule = { ...baseRule, enabled: false };
    assert.equal(matchesUrl(disabledRule, 'https://example.com/'), false);
  });

  test('returns false for non-web or malformed URLs', () => {
    assert.equal(matchesUrl(baseRule, 'chrome://settings'), false);
    assert.equal(matchesUrl(baseRule, 'about:blank'), false);
    assert.equal(matchesUrl(baseRule, 'invalid-url'), false);
  });
});

describe('SitePolicy Operations with Chrome Mock', () => {
  let mockStorage = {};
  let registeredScripts = [];

  beforeEach(() => {
    mockStorage = {};
    registeredScripts = [];

    // Setup global chrome mock
    globalThis.chrome = {
      storage: {
        sync: {
          get: async (keys) => {
            const result = {};
            const keyList = Array.isArray(keys) ? keys : [keys];
            for (const k of keyList) {
              if (mockStorage[k] !== undefined) result[k] = mockStorage[k];
            }
            return result;
          },
          set: async (items) => {
            Object.assign(mockStorage, items);
          },
        },
        local: {
          get: async (keys) => {
            const result = {};
            const keyList = Array.isArray(keys) ? keys : [keys];
            for (const k of keyList) {
              if (mockStorage[k] !== undefined) result[k] = mockStorage[k];
            }
            return result;
          },
          set: async (items) => {
            Object.assign(mockStorage, items);
          },
        },
      },
      scripting: {
        getRegisteredContentScripts: async () => [...registeredScripts],
        registerContentScripts: async (scripts) => {
          registeredScripts.push(...scripts);
        },
        unregisterContentScripts: async ({ ids }) => {
          registeredScripts = registeredScripts.filter((s) => !ids.includes(s.id));
        },
        executeScript: async () => {},
      },
    };
  });

  test('toggle() creates new enabled rule and registers script', async () => {
    const statusBefore = await SitePolicy.getStatus('https://nytimes.com/article');
    assert.equal(statusBefore.isProtected, false);
    assert.equal(statusBefore.rule, null);

    const result = await SitePolicy.toggle('https://nytimes.com/article');
    assert.equal(result.isProtected, true);
    assert.equal(result.rule.origin, 'https://nytimes.com');
    assert.equal(result.rule.enabled, true);

    const statusAfter = await SitePolicy.getStatus('https://nytimes.com/article');
    assert.equal(statusAfter.isProtected, true);

    // Verify dynamic script registered
    assert.equal(registeredScripts.length, 1);
    assert.equal(registeredScripts[0].id, 'cp_nytimes_com');
  });

  test('toggle() on existing rule flips status and unregisters script', async () => {
    await SitePolicy.toggle('https://nytimes.com');
    assert.equal(registeredScripts.length, 1);

    const toggledOff = await SitePolicy.toggle('https://nytimes.com');
    assert.equal(toggledOff.isProtected, false);
    assert.equal(toggledOff.rule.enabled, false);

    // Verify dynamic script unregistered
    assert.equal(registeredScripts.length, 0);
  });

  test('toggleSubdomains() updates wildcard and re-registers', async () => {
    await SitePolicy.toggle('https://github.com');
    assert.equal(registeredScripts[0].matches[0], '*://github.com/*');

    await SitePolicy.toggleSubdomains('https://github.com');
    assert.equal(registeredScripts[0].matches[0], '*://*.github.com/*');

    const status = await SitePolicy.getStatus('https://gist.github.com/test');
    assert.equal(status.isProtected, true);
  });

  test('remove() deletes rule and clears script', async () => {
    await SitePolicy.toggle('https://example.org');
    assert.equal((await SitePolicy.list()).length, 1);
    assert.equal(registeredScripts.length, 1);

    await SitePolicy.remove('https://example.org');
    assert.equal((await SitePolicy.list()).length, 0);
    assert.equal(registeredScripts.length, 0);
  });

  describe('optional site access', () => {
    let granted;

    beforeEach(() => {
      granted = new Set();
      globalThis.chrome.permissions = {
        contains: async ({ origins }) => origins.every((o) => granted.has(o)),
        request: async ({ origins }) => {
          origins.forEach((o) => granted.add(o));
          return true;
        },
        remove: async ({ origins }) => {
          origins.forEach((o) => granted.delete(o));
          return true;
        },
      };
    });

    test('an enabled rule without access is not registered and reports needsAccess', async () => {
      await SitePolicy.toggle('https://bank.example.com');
      assert.equal(registeredScripts.length, 0);

      const status = await SitePolicy.getStatus('https://bank.example.com/login');
      assert.equal(status.isProtected, false);
      assert.equal(status.needsAccess, true);
    });

    test('granting access registers the script and protects the site', async () => {
      const pattern = SitePolicy.accessPattern('https://bank.example.com/login', null);
      assert.equal(pattern, '*://bank.example.com/*');
      assert.equal(await SitePolicy.requestAccess(pattern), true);

      await SitePolicy.toggle('https://bank.example.com');
      assert.equal(registeredScripts.length, 1);
      const status = await SitePolicy.getStatus('https://bank.example.com/login');
      assert.equal(status.isProtected, true);
      assert.equal(status.needsAccess, false);
    });

    test('remove() gives the site access back', async () => {
      await SitePolicy.requestAccess('*://bank.example.com/*');
      await SitePolicy.toggle('https://bank.example.com');
      await SitePolicy.remove('https://bank.example.com');
      assert.equal(granted.size, 0);
      assert.equal(registeredScripts.length, 0);
    });

    test('a denied request leaves nothing registered', async () => {
      globalThis.chrome.permissions.request = async () => false;
      assert.equal(await SitePolicy.requestAccess('*://bank.example.com/*'), false);
      assert.equal(registeredScripts.length, 0);
    });
  });
});
