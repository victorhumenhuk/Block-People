const browserGlobals = {
  BPK: "readonly",
  Blob: "readonly",
  CSS: "readonly",
  Document: "readonly",
  Element: "readonly",
  Error: "readonly",
  Event: "readonly",
  Map: "readonly",
  MutationObserver: "readonly",
  Node: "readonly",
  Object: "readonly",
  Promise: "readonly",
  RegExp: "readonly",
  Set: "readonly",
  String: "readonly",
  TextEncoder: "readonly",
  URLSearchParams: "readonly",
  WeakMap: "readonly",
  browser: "readonly",
  chrome: "readonly",
  clearTimeout: "readonly",
  console: "readonly",
  document: "readonly",
  globalThis: "readonly",
  location: "readonly",
  setTimeout: "readonly",
  window: "readonly",
};

const nodeGlobals = {
  Buffer: "readonly",
  console: "readonly",
  process: "readonly",
  URL: "readonly",
};

export default [
  {
    ignores: ["dist/**", "Safari/**", "Safari macOS/**", "Safari iOS/**"],
  },
  {
    files: ["Chrome/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: browserGlobals,
    },
    rules: {
      "no-undef": "error",
      "no-redeclare": "error",
      "no-unreachable": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["scripts/**/*.mjs", "eslint.config.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: nodeGlobals,
    },
    rules: {
      "no-undef": "error",
      "no-redeclare": "error",
      "no-unreachable": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];
