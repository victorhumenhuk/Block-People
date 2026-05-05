# Testing

## Automated Gates

```sh
npm run build
```

## Static Privacy Audit

Run against extension resources:

```sh
rg -n "fetch\\(|XMLHttpRequest|navigator\\.sendBeacon|new WebSocket|new EventSource|storage\\.sync|eval\\(|new Function" Chrome "Safari/Block People & Keywords/Shared (Extension)/Resources"
```

Expected: zero matches.

## Responsive UI

Open `Chrome/popup.html` and `Chrome/options.html` in a browser and verify:

- 320px, 375px, 390px, 428px, 440px, 768px, 1024px, 1366px widths.
- Dynamic Type equivalent from normal through the largest accessibility text size.
- No horizontal scrolling, clipping, or overlapping text.
- Popup list scrolls internally with touch momentum.
- Keyboard tab order and focus rings are visible.
- Light mode, dark mode, and reduced motion.

## Functional Checklist

- Add a term in the popup; current tabs update without reload.
- Hide mode removes the nearest semantic content container.
- Redact mode covers only the matching word inline.
- Removing a term restores hidden/redacted content where the original DOM is still present.
- Dynamic content added after page load is filtered.
- Blocking `art` does not match `start`.
- Cyrillic, Arabic, Hebrew, CJK, and emoji-adjacent terms behave as expected.
