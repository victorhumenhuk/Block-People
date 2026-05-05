# Testing

Use this checklist before publishing a new version of Block People & Keywords.

## Automated Gates

```bash
npm run lint
npm run typecheck --if-present
npm run build
```

Expected result: all commands pass with no warnings or errors. The build output is written to `dist/chrome/`.

## Static Verification

Run the release scan for monetisation copy, outbound network APIs, dirty Git state, and removable untracked files.

Expected result: the scans, `git status --short`, and `git clean -nd` produce no output.

## Chrome Manual Checklist

- Popup opens within 200ms.
- Add a name, refresh a news site, and confirm the name is redacted or hidden according to the selected mode.
- Add a keyword, scroll X/Twitter, and confirm matching posts disappear in hide mode.
- Toggle the extension off, refresh, and confirm original content returns.
- Resize the popup from 320px to 800px wide and confirm there is no horizontal overflow.
- Enable dark mode and confirm the popup and options page remain readable at WCAG AA contrast.
- Complete add, remove, clear, mode change, save, reload, and toggle flows using only the keyboard.
- Confirm GitHub, X, and Privacy links open in new tabs.
- Confirm `chrome.storage.sync` data survives extension reload.
- Confirm the manifest loads with no warnings in `chrome://extensions`.

## Site Smoke Test

Load the unpacked extension and check the browser console on:

- google.com
- youtube.com
- x.com
- twitter.com
- reddit.com
- facebook.com
- linkedin.com
- news.ycombinator.com
- bbc.co.uk
- theguardian.com

Expected result: no extension-origin console errors.

## Cross-Browser

- Chrome 109+
- Edge 109+
- Brave latest
- Opera latest
- Safari via `xcrun safari-web-extension-converter` or the checked-in Safari Xcode project

Storage sync between two signed-in browser profiles should be tested manually outside this local sandbox.
