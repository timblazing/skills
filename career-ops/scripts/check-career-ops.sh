#!/usr/bin/env bash
set -u

REPO="${CAREER_OPS_REPO:-${HOME}/Projects/career-ops}"
export HOME="${CAREER_OPS_HOME:-$HOME}"

printf 'career-ops repo: %s\n' "$REPO"
printf 'career-ops home: %s\n' "$HOME"
if [ ! -d "$REPO/.git" ]; then
  printf 'ERROR: repo is missing or not a git checkout\n' >&2
  exit 2
fi

cd "$REPO" || exit 2

printf 'git head: '
git rev-parse --short HEAD

printf 'node: '
node --version
printf 'npm: '
npm --version

if [ -d node_modules ]; then
  printf 'dependencies: node_modules present\n'
else
  printf 'dependencies: node_modules missing (run: npm install)\n'
fi

printf 'playwright chromium: '
if node -e "const { chromium } = require('playwright'); console.log(chromium.executablePath())" >/tmp/career-ops-playwright-path.$$ 2>/tmp/career-ops-playwright-err.$$; then
  CHROMIUM_PATH="$(cat /tmp/career-ops-playwright-path.$$)"
  if [ -x "$CHROMIUM_PATH" ]; then
    printf 'installed (%s)\n' "$CHROMIUM_PATH"
  else
    printf 'path reported but not executable (%s); run: npx playwright install chromium\n' "$CHROMIUM_PATH"
  fi
else
  printf 'unavailable; run: npm install && npx playwright install chromium\n'
fi
rm -f /tmp/career-ops-playwright-path.$$ /tmp/career-ops-playwright-err.$$

printf '\nuser-layer setup:\n'
for f in cv.md config/profile.yml modes/_profile.md portals.yml data/applications.md; do
  if [ -f "$f" ]; then
    printf '  ok      %s\n' "$f"
  else
    printf '  missing %s\n' "$f"
  fi
done

printf '\nupdate check: '
node update-system.mjs check || true

printf '\ndoctor summary:\n'
npm run doctor || true

printf '\nverify summary:\n'
npm run verify || true
