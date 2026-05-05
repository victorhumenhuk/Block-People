# Test Results

Timestamp: 2026-05-05 09:58:26 WEST

## Static Checks

- PASS: `npm run lint`
- PASS: `npm run typecheck --if-present`
- PASS: `npm run build`
- PASS: MV3 manifest validator script
- PASS: all manifest icon paths exist and match declared dimensions
- PASS: `action.default_popup` exists
- PASS: `options_page` exists
- FAIL: `npx web-ext lint --source-dir=dist/chrome`

`web-ext lint` reported Firefox-specific MV3 metadata issues:

- ERROR `ADDON_ID_REQUIRED`: Firefox requires an add-on ID for Manifest Version 3 and above.
- WARNING `MISSING_DATA_COLLECTION_PERMISSIONS`: Firefox expects `browser_specific_settings.gecko.data_collection_permissions`.

The extension package targets Chrome and Safari for this release, so no Firefox-specific manifest keys were added.

Bundle size from `npm run build`:

- Source: 60.7 KB, 14 files
- Package: 60.7 KB, 14 files
- Chrome release zip: 28 KB

## Headless Smoke Tests

Command:

```bash
npx playwright test tests/smoke.spec.ts --reporter=line
```

Result: PASS, 8 passed.

Sites:

- PASS: google.com
- PASS: youtube.com
- PASS: x.com
- PASS: reddit.com
- PASS: news.ycombinator.com
- PASS: bbc.co.uk
- PASS: theguardian.com

Popup screenshots:

- PASS: light 320px
- PASS: light 375px
- PASS: light 768px
- PASS: light 1024px
- PASS: dark 320px
- PASS: dark 375px
- PASS: dark 768px
- PASS: dark 1024px

Screenshot files:

- `tests/screenshots/popup-light-320.png`
- `tests/screenshots/popup-light-375.png`
- `tests/screenshots/popup-light-768.png`
- `tests/screenshots/popup-light-1024.png`
- `tests/screenshots/popup-dark-320.png`
- `tests/screenshots/popup-dark-375.png`
- `tests/screenshots/popup-dark-768.png`
- `tests/screenshots/popup-dark-1024.png`

## Not Automated

- SKIPPED: two-profile sync test.
- SKIPPED: real human visual review.
