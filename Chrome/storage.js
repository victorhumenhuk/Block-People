/*
 * Storage schema v2
 *
 * Source of truth: chrome.storage.sync when available, with browser.* support
 * through this small promise/callback shim for Safari Web Extension builds.
 *
 * Keys:
 * - schemaVersion: number
 * - enabled: boolean
 * - blockedTerms: string[]
 * - mode: "hide" | "redact"
 * - redactMatches: boolean
 * - hideElements: boolean
 * - wholeWord: boolean
 *
 * Legacy migration:
 * - v1 local keys are imported into sync storage when sync is available.
 * - migration is idempotent; repeated runs produce the same v2 shape.
 */
(function initStorage(global) {
  "use strict";

  const extensionApi = global.browser || global.chrome;
  const storageApi = extensionApi?.storage;
  const syncArea = storageApi?.sync;
  const localArea = storageApi?.local;
  const storageArea = syncArea || localArea;
  const storageAreaName = syncArea ? "sync" : "local";
  const SCHEMA_VERSION = 2;

  const STORAGE_KEYS = [
    "schemaVersion",
    "enabled",
    "blockedTerms",
    "mode",
    "redactMatches",
    "hideElements",
    "wholeWord",
  ];

  const DEFAULTS = Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    enabled: true,
    blockedTerms: [],
    mode: "hide",
    redactMatches: false,
    hideElements: true,
    wholeWord: true,
  });

  function lastError() {
    return global.chrome?.runtime?.lastError || null;
  }

  function callStorage(area, method, ...args) {
    if (!area) return Promise.reject(new Error("Extension storage is unavailable."));

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
        const result = area[method](...args, finish);
        if (result && typeof result.then === "function") result.then(finish, reject);
      } catch {
        try {
          const result = area[method](...args);
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
      schemaVersion: SCHEMA_VERSION,
      enabled: typeof raw.enabled === "boolean" ? raw.enabled : DEFAULTS.enabled,
      blockedTerms: normalizeTerms(raw.blockedTerms),
      mode,
      redactMatches: mode === "redact",
      hideElements: mode === "hide",
      wholeWord: typeof raw.wholeWord === "boolean" ? raw.wholeWord : DEFAULTS.wholeWord,
    };
  }

  async function readFrom(area) {
    if (!area) return {};
    return callStorage(area, "get", STORAGE_KEYS);
  }

  async function writeTo(area, settings) {
    if (!area) return;
    await callStorage(area, "set", settings);
  }

  async function migrateIfNeeded(raw) {
    if (raw.schemaVersion === SCHEMA_VERSION) return normalizeSettings(raw);

    const legacy = syncArea && localArea ? await readFrom(localArea) : {};
    const normalized = normalizeSettings({ ...legacy, ...raw });
    await writeTo(storageArea, normalized);
    return normalized;
  }

  async function loadSettings() {
    const raw = await readFrom(storageArea);
    return migrateIfNeeded(raw);
  }

  async function saveSettings(nextSettings) {
    const normalized = normalizeSettings(nextSettings);
    await writeTo(storageArea, normalized);
    return normalized;
  }

  function onSettingsChanged(listener) {
    const changed = storageApi?.onChanged;
    if (!changed?.addListener) return () => {};

    const handler = (changes, areaName) => {
      if (areaName !== storageAreaName) return;
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
    storageAreaName,
  };
})(globalThis);
