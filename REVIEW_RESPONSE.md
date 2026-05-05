# Resolution Center Reply

## Reviewer concern quoted verbatim

No exact App Review feedback was supplied in the prompt. Replace this section with the reviewer text before pasting into Resolution Center if you have a specific rejection to answer.

## Root cause

No feedback-specific root cause can be identified without the original reviewer message. I completed a general review-readiness pass focused on the most likely Safari extension review risks: responsive UI, local-only storage, no network behavior, permission clarity, dynamic content filtering, accessibility, and packaging.

## What changed

- The popup and options page now scale down to 320px widths, use Safari system fonts, respect larger user font sizes through `rem` units, support dark mode, include reduced-motion handling, and keep the blocked-term list scrollable inside the popup.
- The extension now stores settings only in local extension storage. It does not read account sync storage.
- The popup and options page now expose one clear mode choice: Hide matching content or Redact only the word.
- The content script reacts to storage changes, handles dynamic DOM updates through a batched `MutationObserver`, applies Unicode-aware whole-word matching for space-delimited scripts, and restores hidden/redacted content when settings change where the original DOM is still present.
- Remote links and placeholder App Store/privacy/contact actions were removed from the extension UI and wrapper app.
- The manifest keeps only the `storage` permission and `<all_urls>` host access. `<all_urls>` is required because the product filters user-defined terms on any website the user visits; the extension does not make network requests.
- The extension CSP is explicit and self-only.

## Verification performed

- Ran JavaScript syntax checks for extension scripts.
- Validated the extension manifest JSON.
- Ran `npm run build`, including local-only source audit and package copy to `dist/chrome`.
- Mirrored the fixed extension resources into the active Safari Xcode project.
- Ran a local Playwright CLI harness for the popup/options pages at 320px width with default and simulated large accessibility text.
- Ran a local Playwright CLI content-script harness for hide/redact behavior, dynamic content, Unicode matching, whole-word matching, immediate mode changes, and restore after removing a term.
- Built the iOS target in Release configuration with `xcodebuild` and `CODE_SIGNING_ALLOWED=NO`.
- Built the macOS target in Release configuration with `xcodebuild` and `CODE_SIGNING_ALLOWED=NO`.
- Audited active app and extension icons for missing alpha-channel issues.

## Listing changes required

- App Store privacy label: select no data collected.
- Privacy policy page: publish or update a public page that plainly states no data collected, no network access, local storage only, no tracking, and no accounts.
- Support URL: provide a working support URL in App Store Connect.
- Screenshots: regenerate popup screenshots because the UI and mode controls changed.
- Reviewer demo notes: use the steps in `TEST_PLAN.md`, and mention that all settings are local and changes apply to open tabs automatically.
