#!/usr/bin/env bash
set -euo pipefail

# Review-only cleanup helper for the parent extensions folder.
# Default is dry-run. Set DRY_RUN=0 ./cleanup.sh to remove the listed files.

DRY_RUN="${DRY_RUN:-1}"
PARENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

targets=(
  "$PARENT_DIR/⚡ everything-2x/Promo.zip"
  "$PARENT_DIR/⚡ everything-2x/Everything-2x-Chrome-v2.0.2.zip"
  "$PARENT_DIR/⚡ everything-2x/Chrome_Extension.zip"
  "$PARENT_DIR/⚡ everything-2x/Screenshot Everything 2x.zip"
  "$PARENT_DIR/🔊 volume-booster/dist/volume-booster-v1.1.0.zip"
  "$PARENT_DIR/🔊 volume-booster/promo.zip"
  "$PARENT_DIR/🔊 volume-booster/Chrome_Extension.zip"
  "$PARENT_DIR/🔊 volume-booster/files.zip"
  "$PARENT_DIR/🔊 volume-booster/Chrome.crx"
  "$PARENT_DIR/🔊 volume-booster/build/VolumeBoosterFree.zip"
  "$PARENT_DIR/🔊 volume-booster/Chrome.pem"
  "$PARENT_DIR/🔊 volume-booster/Screenshots Extension.zip"
  "$PARENT_DIR/📺 yt-channel-blocker/Chrome web store.zip"
  "$PARENT_DIR/📺 yt-channel-blocker/Chrome.zip"
  "$PARENT_DIR/📺 yt-channel-blocker/Safari/Archives"
)

for target in "${targets[@]}"; do
  if [[ ! -e "$target" ]]; then
    continue
  fi

  if [[ "$DRY_RUN" == "1" ]]; then
    printf 'Would remove: %s\n' "$target"
  else
    rm -rf -- "$target"
    printf 'Removed: %s\n' "$target"
  fi
done
