#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$ROOT_DIR/Chrome"
TARGET_DIR="$ROOT_DIR/Safari/Block People & Keywords/Shared (Extension)/Resources"
BEFORE_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$BEFORE_DIR"
}
trap cleanup EXIT

cp -R "$TARGET_DIR" "$BEFORE_DIR/Resources.before"
rsync -a --delete "$SOURCE_DIR/" "$TARGET_DIR/"

echo "Diff between previous Safari resources and refreshed resources:"
diff -ru "$BEFORE_DIR/Resources.before" "$TARGET_DIR" || true

cat <<'EOF'

Open the Safari project with:
open Safari/Block\ People\ \&\ Keywords/Block\ People\ \&\ Keywords.xcodeproj

Manual Xcode steps:
1. Select the iOS or macOS scheme.
2. Product > Archive.
3. Distribute App.
4. Submit through App Store Connect.
EOF
