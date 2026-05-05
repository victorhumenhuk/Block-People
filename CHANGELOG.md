# Changelog

## 1.0.0 - 2026-05-05

### Part 1 - Responsive UI

- Reworked popup and options resources around fluid widths, `rem` sizing, Safari system fonts, safe-area padding, dark mode, reduced motion, visible focus states, and 44pt tap targets.
- Set the popup to `min-width: 280px`, `max-width: 100vw`, and a scrollable internal blocked-term list.
- Added exclusive Hide/Redact mode controls and removed external footer links from extension UI.

### Part 2 - App Review Response

- No exact reviewer feedback was supplied, so no feedback-specific code path could be quoted or addressed.
- Added `REVIEW_RESPONSE.md` with a ready-to-edit Resolution Center response and listing-change checklist.

### Part 3 - Functionality, Privacy, And Packaging

- Standardized settings on local extension storage only.
- Kept content filtering local, reversible, debounced, idle-scheduled, Unicode-aware, and responsive to storage changes in open tabs.
- Removed wrapper app App Store/privacy/contact actions that depended on placeholder external URLs.
- Regenerated `dist/chrome` and mirrored extension resources into the active Safari Xcode project plus legacy Safari resource folders.
