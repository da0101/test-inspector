#!/usr/bin/env bash
# Test Inspector — local install script
#
# Builds the extension, packages it as a .vsix, and installs it into your
# local VS Code so the icon appears in the Activity Bar on the left side.
#
# Usage:  ./scripts/install.sh
#
# Re-run after pulling changes to update the installed version.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

EXT_ID="local.test-inspector"  # <publisher>.<name> from package.json
VERSION="$(node -p "require('./package.json').version")"
VSIX_FILE="test-inspector-${VERSION}.vsix"

step() { printf "\n\033[1;34m▶ %s\033[0m\n" "$1"; }
warn() { printf "\033[1;33m! %s\033[0m\n" "$1"; }
ok()   { printf "\033[1;32m✓ %s\033[0m\n" "$1"; }
die()  { printf "\033[1;31m✗ %s\033[0m\n" "$1" >&2; exit 1; }

# --- preflight ---------------------------------------------------------------

command -v node >/dev/null 2>&1 || die "node is not on PATH — install Node.js 20+ first"
command -v npm  >/dev/null 2>&1 || die "npm is not on PATH"

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  warn "Node $NODE_MAJOR detected — Test Inspector targets Node 20+. Continuing anyway."
fi

# --- install dependencies if needed -----------------------------------------

if [ ! -d node_modules ]; then
  step "Installing npm dependencies"
  npm install
else
  ok "npm dependencies already installed"
fi

# --- compile -----------------------------------------------------------------

step "Compiling TypeScript"
npm run compile

# --- run unit tests so we don't ship a broken build -------------------------

step "Running unit tests"
npm test >/dev/null
ok "tests passed"

# --- package as .vsix --------------------------------------------------------

step "Packaging extension as $VSIX_FILE"
# vsce is invoked via npx so no global install is needed.
rm -f "$VSIX_FILE"
npx --yes @vscode/vsce@latest package \
  --allow-missing-repository \
  --no-yarn \
  --out "$VSIX_FILE"

[ -f "$VSIX_FILE" ] || die "vsce did not produce $VSIX_FILE"
ok "packaged $VSIX_FILE"

# --- install into VS Code ----------------------------------------------------

if command -v code >/dev/null 2>&1; then
  step "Installing into VS Code via the 'code' CLI"
  code --install-extension "$VSIX_FILE" --force
  ok "Installed. Open VS Code (or restart it) and look for the Test Inspector icon (beaker)"
  ok "in the Activity Bar on the left side of the editor."
  echo
  echo "Try it now:"
  echo "  1. File → Open Folder…  → pick one of your real projects"
  echo "  2. Click the Test Inspector icon in the Activity Bar"
  echo "  3. Click 'Open Case File', then 'Refresh' — verdicts appear"
else
  warn "'code' CLI is not on PATH. Either:"
  echo "  (a) Open VS Code → Command Palette (Cmd+Shift+P) → 'Shell Command: Install 'code' command in PATH', then re-run this script."
  echo "  (b) Or install the VSIX manually:"
  echo "        Open VS Code → Command Palette → 'Extensions: Install from VSIX…'"
  echo "        Pick: $REPO_ROOT/$VSIX_FILE"
fi

step "Done"
echo "Installed extension id: $EXT_ID"
echo "To uninstall later:  code --uninstall-extension $EXT_ID"
