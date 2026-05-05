# Privacy

Block People & Keywords runs locally in the browser.

## Stored On Device

- Blocked names, phrases, keywords, and emoji.
- Whether filtering is enabled.
- The selected mode: hide matching content or redact only the word.

These settings are stored in browser local extension storage only.

## Scanned Locally

The content script scans page text and selected local DOM attributes in the browser to find blocked terms. Matching content can be hidden, or matched words can be covered inline.

## What Leaves The Browser

Nothing. The extension does not send blocked terms, page content, browsing history, matches, settings, or identifiers to any server.

## Network And Tracking

The extension does not use analytics, telemetry, ads, remote scripts, remote requests, beacons, WebSockets, EventSource, accounts, or sign-in.

## Permissions

- `storage`: saves the block list and mode locally.
- `<all_urls>`: lets the content script filter the websites the user chooses to visit.

## Store Listing

The published privacy policy and App Store privacy nutrition label should state: no data collected, no network access, local storage only.
