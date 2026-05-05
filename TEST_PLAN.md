# Test Plan

## Verified In This Pass

- Canonical source: `Chrome/`
- Generated package: `dist/chrome`
- Active Safari resources: `Safari/Block People & Keywords/Shared (Extension)/Resources/`
- Static checks: JavaScript syntax, manifest JSON, local-only source audit, no dynamic code execution patterns, no remote request APIs, no account sync storage usage, no legacy sync-storage references, and no external wrapper-app actions.
- Build tooling: `npm run build` completed successfully.
- Browser harness: local Playwright CLI verified the popup and options page at 320px width with default text and simulated large accessibility text, with no horizontal overflow or collapsed controls.
- Content-script harness: local Playwright CLI verified hide mode, redact mode, dynamic DOM insertions, whole-word behavior for `art` versus `startup`, CJK matching, Arabic matching, emoji-adjacent text, immediate mode changes, and restore after term removal.
- Xcode iOS build: `xcodebuild -project "Block People & Keywords.xcodeproj" -scheme "Block People & Keywords (iOS)" -configuration Release -destination "generic/platform=iOS" -derivedDataPath /tmp/bpk-derived-ios CODE_SIGNING_ALLOWED=NO build` completed successfully.
- Xcode macOS build: `xcodebuild -project "Block People & Keywords.xcodeproj" -scheme "Block People & Keywords (macOS)" -configuration Release -destination "platform=macOS" -derivedDataPath /tmp/bpk-derived-macos CODE_SIGNING_ALLOWED=NO build` completed successfully.
- Icon audit: active app and extension icon assets report no alpha channel. Required app icon sizes declared in the asset catalog are present.

## UI Sizes To Verify Manually On Device

- iPhone SE 1st gen: 320pt portrait and landscape.
- iPhone SE 2nd/3rd gen and iPhone 13 mini: 375pt portrait and landscape.
- iPhone 14/15/16 class: 390pt portrait and landscape.
- iPhone Plus/Pro Max class: 428-440pt portrait and landscape.
- iPad Slide Over and Split View down to 320pt.
- iPad Mini, iPad, iPad Air, iPad Pro 11-inch, and iPad Pro 13-inch.
- macOS Safari toolbar popover at default size and with larger system text.

## Dynamic Type To Verify Manually

- xSmall
- Default
- Large
- Accessibility 3
- Accessibility 5

## Website Functionality To Verify Manually

- Google Search results
- YouTube home/search/video pages
- Reddit feed and comments
- X/Twitter timeline
- A news article and homepage
- A single-page app with dynamically inserted content

## Expected Functional Results

- Adding a term in the popup filters open tabs without a reload.
- Hide mode removes the nearest post, card, article, comment, result, video, or image container.
- Redact mode covers only matched words inline.
- Removing a term restores hidden or redacted content where the original page DOM is still present.
- Blocking `art` does not match `start`.
- Cyrillic, Arabic, Hebrew, CJK, and emoji-adjacent terms are handled.

## Not Verified In Sandbox

- Real iOS Safari extension popover behavior on physical devices.
- Dynamic Type AX5 in iOS Settings.
- App Store Connect metadata, screenshots, privacy policy URL, support URL, and reviewer demo notes.
- Full clean simulator walkthrough of App Review demo notes, because no submission notes were present in the repo.
- In-app Browser Use transport was unavailable in this session, so the browser checks used the local Playwright CLI fallback instead.
