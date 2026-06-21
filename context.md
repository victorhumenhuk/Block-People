# Decision Ledger — Block-People

Durable record of the significant decisions made in this repository and the reasoning behind them.

- **Confirmed** decisions are human-reviewed and binding. This section is maintained by the repository owner; the automated decision-ledger pass never edits it.
- **Inferred** decisions are hypotheses proposed automatically from the code, commit history, and any agent instructions (CLAUDE.md / AGENTS.md). They are **not binding** until the owner moves them into Confirmed.

## Confirmed

_None yet. Merge a proposal from Inferred to confirm it._

## Inferred (proposed — awaiting confirmation)

> Every item below is a hypothesis generated automatically on 2026-06-21. Where the rationale could not be recovered from the available evidence it is marked "rationale unknown — please supply".

### [hypothesis] Manifest V3, vanilla JS/HTML/CSS, no framework or build bundler
- **Decision:** Build the browser extension on Manifest V3 using plain JavaScript, HTML, and CSS, with no front-end framework and no module bundler. The "build" step is a Node script (`scripts/build.mjs`) that copies `Chrome/` to `dist/chrome` and validates rather than compiles.
- **Rationale (hypothesis):** Keeps the package tiny and auditable (the build warns past a 200 KB unzipped target) and avoids remote/compiled code, which aligns with the stated "no remote code, open source so behaviour can be inspected" privacy posture and store-review requirements.
- **Evidence:** `Chrome/manifest.json` (`"manifest_version": 3`); `README.md` "Tech" section ("Manifest V3", "Vanilla JavaScript, HTML, and CSS"); `package.json` (`"build": "node scripts/build.mjs"`, no framework deps); `scripts/build.mjs` (copy + validate, 200 KB warning)
- **First observed:** d86d75e ("Harden Safari extension UI and filtering")

### [hypothesis] Local-only, zero-network, privacy-first architecture
- **Decision:** The extension stores everything locally and makes no network requests — no accounts, analytics, tracking, ads, servers, or remote/eval'd code. This is enforced in the build via an explicit source audit that fails on `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `EventSource`, `unsafe-eval`, and `unsafe-inline`.
- **Rationale (hypothesis):** A privacy-as-product positioning and to satisfy browser store review; the build-time blocklist makes the no-network guarantee mechanically verifiable rather than aspirational.
- **Evidence:** `scripts/build.mjs` `disallowedSourcePatterns`; `README.md` Privacy section; `PRIVACY.md`; `Chrome/manifest.json` strict `content_security_policy` (`script-src 'self'`, `object-src 'none'`, `base-uri 'none'`); `SECURITY.md` ("runs locally ... does not process remote data on a server"); CHANGELOG 1.0.1 ("Confirmed there are no monetisation references")
- **First observed:** d86d75e ("Harden Safari extension UI and filtering")

### [hypothesis] Content-script filtering via TreeWalker + MutationObserver
- **Decision:** Detect and hide/redact blocked terms with a content script that walks the DOM (`TreeWalker`) and reacts to dynamic page changes with a `MutationObserver`, injected at `document_idle` across `<all_urls>`.
- **Rationale (hypothesis):** Needed to handle modern dynamic / infinite-scroll feeds where content loads after initial render; doing it client-side keeps the no-network and local-only guarantees intact.
- **Evidence:** `README.md` "Tech" and Features ("Handles dynamic pages with a content script and `MutationObserver`", "TreeWalker"); `Chrome/manifest.json` `content_scripts` (`run_at: document_idle`, `matches: <all_urls>`); `Chrome/content.js`
- **First observed:** d86d75e ("Harden Safari extension UI and filtering")

### [hypothesis] Minimal permissions: only `storage` plus `<all_urls>` host access
- **Decision:** Request only the `storage` permission and `<all_urls>` host permissions, with written justifications embedded in the manifest (`_permission_justification`).
- **Rationale (hypothesis):** Least-privilege to ease store review and reassure users; `<all_urls>` is required because users filter their own terms on any site, and `storage` is required to persist the block list — no broader permissions are needed since there are no network calls.
- **Evidence:** `Chrome/manifest.json` (`"permissions": ["storage"]`, `"host_permissions": ["<all_urls>"]`, `_permission_justification`); `README.md` Permissions section
- **First observed:** d86d75e ("Harden Safari extension UI and filtering")

### [hypothesis] Storage schema v2 on `chrome.storage.sync` with local fallback and idempotent v1 migration
- **Decision:** Use a versioned storage schema (`schemaVersion: 2`) keyed on a defined set of fields (`enabled`, `blockedTerms`, `mode`, `redactMatches`, `hideElements`, `wholeWord`), with `chrome.storage.sync` as the source of truth, a local fallback when sync is unavailable, a `browser.*`/`chrome.*` shim for Safari, and an idempotent migration importing legacy v1 local keys into sync.
- **Rationale (hypothesis):** Sync gives cross-device settings; local fallback and the API shim keep it working on Safari Web Extension builds; idempotent migration protects existing users' data when the schema changed from v1 to v2.
- **Evidence:** `Chrome/storage.js` header comment ("Storage schema v2", key list, "Legacy migration ... idempotent"); `README.md` Tech ("`chrome.storage.sync` with local fallback")
- **First observed:** ca5b5e7 ("chore: ship-ready pass") expanded storage.js by ~96 lines (migration/fallback logic); originally introduced d86d75e

### [hypothesis] Multi-browser support via one shared codebase; Safari built through Apple's converter
- **Decision:** Target Chrome, Edge, Brave, and Opera from a single `Chrome/` source tree, and produce the Safari/iOS/macOS apps by converting the same web-extension assets (`xcrun safari-web-extension-converter`), keeping the Safari Xcode project's `Resources/` in sync with `Chrome/`.
- **Rationale (hypothesis):** Avoids maintaining parallel codebases — Chromium browsers share the same extension format, and the Safari converter reuses the same resources so the filtering logic stays identical across platforms.
- **Evidence:** `README.md` Browser support ("Safari via `xcrun safari-web-extension-converter`"); `Safari/.../Shared (Extension)/Resources/` mirrors `Chrome/` (content.js, manifest.json, storage.js, etc.); `refresh-safari.sh`; commit 11bf845 ("Package local-only Safari apps")
- **First observed:** 11bf845 ("Package local-only Safari apps")

### [hypothesis] Keep generated/build artifacts and binaries out of the repo
- **Decision:** Ignore build output and packaging artifacts (`dist/`, `build/`, `*.zip`, `*.crx`, `*.pem`, `node_modules/`, Xcode user/derived data) and remove the previously committed `dist/chrome` from version control.
- **Rationale (hypothesis):** The `dist/` tree was initially committed (d86d75e) then deleted during the ship-ready cleanup; ignoring generated artifacts keeps the repo as source-of-truth only and avoids stale/duplicated build output in history.
- **Evidence:** `.gitignore`; commit ca5b5e7 deletes all `dist/chrome/*` files and removed Safari `xcodeproj/xcuserdata`; `cleanup.sh` (dry-run-by-default helper for removing stray zip/crx artifacts)
- **First observed:** ca5b5e7 ("chore: ship-ready pass - add socials, clean repo, docs")

### [hypothesis] CI on GitHub Actions: install, lint, optional typecheck, build on push/PR to main
- **Decision:** Run a GitHub Actions workflow on push and PR to `main` that installs deps on Node 20, lints (pinned `eslint@9.25.1`), runs an optional typecheck (`--if-present`), and runs the build/validate script.
- **Rationale (hypothesis):** rationale unknown — please supply
- **Evidence:** `.github/workflows/build.yml`; `package.json` `lint` script (pins `eslint@9.25.1`); `eslint.config.mjs`
- **First observed:** ca5b5e7 ("chore: ship-ready pass")

### [hypothesis] Playwright smoke tests load the built extension against real sites
- **Decision:** Use `@playwright/test` to launch Chromium with the unpacked `dist/chrome` extension and smoke-test it across a fixed set of real sites (Google, YouTube, X, Reddit, Hacker News, BBC, The Guardian), capturing screenshots.
- **Rationale (hypothesis):** rationale unknown — please supply
- **Evidence:** `tests/smoke.spec.ts` (`sites` list, loads `dist/chrome`); `package.json` devDependency `@playwright/test`; commit 6c1e219 ("test: add release smoke checks")
- **First observed:** 6c1e219 ("test: add release smoke checks")

### [hypothesis] Privacy policy hosted on GitHub Pages
- **Decision:** Serve the privacy policy from GitHub Pages (`docs/privacy-policy.html`) and point the store/manifest privacy URL there.
- **Rationale (hypothesis):** Provides a stable, free public URL required by store listings without standing up a server, consistent with the no-server architecture.
- **Evidence:** `docs/privacy-policy.html`; commit 51e2c53 ("chore: switch privacy policy URL to GitHub Pages"); `PRIVACY.md`
- **First observed:** 51e2c53 ("chore: switch privacy policy URL to GitHub Pages")

---
*Decision-ledger automated pass. Operation: Bootstrap. Last reflection: commit `09c9a5a` (2026-06-21). Decisions above are AI-inferred hypotheses; nothing is binding until merged into Confirmed.*
