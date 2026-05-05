# Block People & Keywords

Safari and Chrome Web Extension that hides or redacts user-specified names, words, and phrases across websites.

## Product Intent

- Users add names, keywords, emoji, or multi-word phrases to a local block list.
- Hide mode removes the nearest matching post, comment, search result, video, image, or card.
- Redact mode keeps layout intact and covers matched words inline.
- Filtering updates open tabs through local storage change events.
- Settings are stored only in `browser.storage.local` / `chrome.storage.local`.
- No accounts, remote scripts, analytics, telemetry, or network requests are used.

## Build And Validate

```sh
npm run build
```

`npm run build` validates the manifest, required assets, local-only source audit, copies `Chrome/` to `dist/chrome`, and prints an unzipped size report.

## Safari

The canonical extension resources live in `Chrome/`. The active Safari Xcode project mirrors those files in `Safari/Block People & Keywords/Shared (Extension)/Resources/`.

The active Xcode schemes are:

- `Block People & Keywords (iOS)`
- `Block People & Keywords (macOS)`

## Privacy

No data leaves the browser. Blocked terms and preferences are stored locally on the user's device. Page text is scanned locally by the content script and is never transmitted.
