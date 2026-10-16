#!/usr/bin/env bash
# Headless screenshot helper on top of agent-browser.
# Usage: shot.sh <url> [--phone|--desktop|--both] [--dark] [--el <selector>] [--full]
#                [--hidpi] [--name <base>] [--out <dir>] [--keep-open] [--wait <ms>]
# Prints one saved PNG path per line.
set -euo pipefail

url="${1:?usage: shot.sh <url> [options]}"; shift
mode=desktop dark=0 el="" full=0 hidpi=0 name="" out="" keep=0 wait_ms=800
while [[ $# -gt 0 ]]; do
  case "$1" in
    --phone) mode=phone ;;
    --desktop) mode=desktop ;;
    --both) mode=both ;;
    --dark) dark=1 ;;
    --el) el="$2"; shift ;;
    --full) full=1 ;;
    --hidpi) hidpi=1 ;;
    --name) name="$2"; shift ;;
    --out) out="$2"; shift ;;
    --keep-open) keep=1 ;;
    --wait) wait_ms="$2"; shift ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
if [[ -z "$out" ]]; then
  out="$root/.ui-shots"
  # Keep scratch shots out of git without touching the project's .gitignore.
  if [[ -d "$root/.git" ]] && ! grep -qx '.ui-shots/' "$root/.git/info/exclude" 2>/dev/null; then
    mkdir -p "$root/.git/info" && echo '.ui-shots/' >> "$root/.git/info/exclude"
  fi
fi
mkdir -p "$out"

session="${AGENT_BROWSER_SESSION:-$(agent-browser session id --scope worktree --prefix ui)}"
ab() { agent-browser --session "$session" "$@" >/dev/null; }
scale=1; [[ $hidpi == 1 ]] && scale=2
[[ -z "$name" ]] && name="$(echo "$url" | sed -E 's#^[a-z]+://##; s#[^A-Za-z0-9]+#-#g; s#-+$##' | cut -c1-60)"

capture() {
  local vp="$1" file="$out/$name-$1"
  [[ -n "$el" ]] && file="$file-$(echo "$el" | sed -E 's#[^A-Za-z0-9]+#-#g; s#^-|-$##g' | cut -c1-30)"
  [[ $dark == 1 ]] && file="$file-dark"
  file="$file.png"
  if [[ $vp == phone ]]; then
    ab set device "iPhone 16"                      # mobile UA + touch
    ab set viewport 393 852 $(( hidpi == 1 ? 3 : 1 ))
  else
    ab set viewport 1440 900 "$scale"
  fi
  if [[ $dark == 1 ]]; then ab set media dark; else ab set media light; fi
  ab open "$url"
  agent-browser --session "$session" wait --load networkidle >/dev/null 2>&1 || true
  ab wait "$wait_ms"
  local args=()
  [[ -n "$el" ]] && args+=("$el")
  args+=("$file")
  [[ $full == 1 ]] && args+=(--full)
  ab screenshot "${args[@]}"
  echo "$file"
}

case "$mode" in
  both) capture desktop; capture phone ;;
  *) capture "$mode" ;;
esac
[[ $keep == 1 ]] || agent-browser --session "$session" close >/dev/null 2>&1 || true
