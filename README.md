# Block People & Keywords
Block distracting names, people, phrases, and keywords across the web.

[Chrome Web Store](https://chromewebstore.google.com/detail/knemgllmlmnmphabebibhmhgnjidmjde) | [Version 1.0.1](Chrome/manifest.json) | [MIT Licence](LICENSE)

## What it does
Block People & Keywords helps you clean up pages without changing the sites you use. Add a name, phrase, or keyword once, then choose whether matching text is redacted inline or matching posts and page elements are hidden.

Everything runs in the browser. There are no accounts, analytics, tracking scripts, remote code, or servers.

## Features
- Block by name with inline redaction.
- Block by keyword with element hiding.
- Per-site container rules for feeds, search results, video lists, and comments where supported.
- Local browser storage only; no extension server.
- Works on any website the extension can access.
- Handles dynamic pages with a content script and `MutationObserver`.

## Install
From Chrome Web Store:

Open the [Chrome Web Store listing](https://chromewebstore.google.com/detail/knemgllmlmnmphabebibhmhgnjidmjde) and install the extension.

From source:

```sh
git clone https://github.com/victorhumenhuk/Block-People.git
cd Block-People
npm install
npm run build
```

Then open `chrome://extensions`, enable Developer mode, choose "Load unpacked", and select `dist/chrome`.

## Use cases
- Avoid spoilers while browsing news, forums, or social feeds.
- Mute a public figure you do not want to keep seeing.
- Reduce doomscrolling by hiding keywords that pull you back in.
- Focus during work by removing recurring distractions from pages.
- Hide a name from search results or comment threads.

## Privacy
Everything runs locally in your browser. No data leaves the browser, and the extension does not use analytics, tracking, ads, remote scripts, or remote code. The project is open source so the behaviour can be inspected.

## Permissions
- `storage`: saves your block list and preferences in browser extension storage.
- `<all_urls>`: lets the content script find and hide your own blocked terms on the websites you visit.

## Tech
- Manifest V3.
- Vanilla JavaScript, HTML, and CSS.
- Content script with `TreeWalker` and `MutationObserver`.
- `chrome.storage.sync` with local fallback for settings.

## Browser support
- Chrome
- Edge
- Brave
- Opera
- Safari via `xcrun safari-web-extension-converter`

## Roadmap
- Import and export block lists.
- Per-site enable and disable controls.
- Optional temporary blocks.
- More site-specific container rules.
- Better diagnostics for large block lists.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md). Issues and pull requests are welcome.

## Support
Open a GitHub Issue for bugs. For other contact, reach Victor on X: [@victorhumenhuk](https://x.com/victorhumenhuk).

## Author
Victor Humenhuk, building at [thesmios.com](https://thesmios.com). X: [@victorhumenhuk](https://x.com/victorhumenhuk).

## Licence
MIT. See [LICENSE](LICENSE).
