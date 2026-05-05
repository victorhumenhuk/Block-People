(function initStorage(global) {
  "use strict";

  const extensionApi = global.browser || global.chrome;
  const localArea = extensionApi?.storage?.local;
  const DEFAULTS = Object.freeze({
    enabled: true,
    blockedTerms: [],
    mode: "hide",
    redactMatches: false,
    hideElements: true,
    wholeWord: true,
  });
  const STORAGE_KEYS = ["enabled", "blockedTerms", "mode", "redactMatches", "hideElements", "wholeWord"];

  function lastError() {
    return global.chrome?.runtime?.lastError || null;
  }

  function callStorage(method, ...args) {
    if (!localArea) return Promise.reject(new Error("Local extension storage is unavailable."));
    return new Promise((resolve, reject) => {
      let settled = false;
      function finish(value) {
        if (settled) return;
        settled = true;
        const error = lastError();
        if (error) reject(new Error(error.message || String(error)));
        else resolve(value);
      }
      try {
        const result = localArea[method](...args, finish);
        if (result && typeof result.then === "function") result.then(finish, reject);
      } catch {
        try {
          const result = localArea[method](...args);
          if (result && typeof result.then === "function") result.then(finish, reject);
          else finish(result);
        } catch (error) {
          reject(error);
        }
      }
    });
  }

  function normalizeTerms(terms) {
    const values = Array.isArray(terms) ? terms : [];
    const normalized = [];
    const seen = new Set();
    for (const value of values) {
      const term = String(value).normalize("NFC").trim();
      if (!term) continue;
      const key = term.toLocaleLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      normalized.push(term);
    }
    return normalized;
  }

  function normalizeMode(raw = {}) {
    if (raw.mode === "redact" || raw.mode === "hide") return raw.mode;
    if (raw.hideElements === false && raw.redactMatches === true) return "redact";
    return "hide";
  }

  function normalizeSettings(raw = {}) {
    const mode = normalizeMode(raw);
    return {
      enabled: typeof raw.enabled === "boolean" ? raw.enabled : DEFAULTS.enabled,
      blockedTerms: normalizeTerms(raw.blockedTerms),
      mode,
      redactMatches: mode === "redact",
      hideElements: mode === "hide",
      wholeWord: true,
    };
  }

  async function loadSettings() {
    return normalizeSettings(await callStorage("get", STORAGE_KEYS));
  }

  async function saveSettings(nextSettings) {
    const normalized = normalizeSettings(nextSettings);
    await callStorage("set", {
      enabled: normalized.enabled,
      blockedTerms: normalized.blockedTerms,
      mode: normalized.mode,
      redactMatches: normalized.redactMatches,
      hideElements: normalized.hideElements,
      wholeWord: true,
    });
    return normalized;
  }

  function onSettingsChanged(listener) {
    const changed = extensionApi?.storage?.onChanged;
    if (!changed?.addListener) return () => {};
    const handler = (changes, areaName) => {
      if (areaName !== "local") return;
      if (!STORAGE_KEYS.some((key) => Object.prototype.hasOwnProperty.call(changes, key))) return;
      loadSettings().then(listener).catch(() => listener(DEFAULTS));
    };
    changed.addListener(handler);
    return () => {
      if (changed.removeListener) changed.removeListener(handler);
    };
  }

  global.BPK = {
    api: extensionApi,
    DEFAULTS,
    STORAGE_KEYS,
    normalizeTerms,
    normalizeSettings,
    loadSettings,
    saveSettings,
    onSettingsChanged,
  };
})(globalThis);
