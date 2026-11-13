#!/usr/bin/env bash
# Headless screenshot helper on top of agent-browser.
# Usage: shot.sh <url> [--phone|--desktop|--both] [--dark] [--el <selector>] [--full]
#                [--hidpi] [--name <base>] [--out <dir>] [--keep-open] [--wait <ms>] [--mac|--local]
# Off macOS it shoots on the owner's Mac over SSH by default (UI_SHOT_MAC, default clayblasingame@mac).
# Prints one saved PNG path per line.
set -euo pipefail

url="${1:?usage: shot.sh <url> [options]}"; shift
mode=desktop dark=0 el="" full=0 hidpi=0 name="" out="" keep=0 wait_ms=800 where=auto
# Options forwarded to the Mac (everything except where to shoot and where to save).
orig=(); skip=0
for a in "$@"; do
  if [[ $skip == 1 ]]; then skip=0; continue; fi
  case "$a" in --out) skip=1 ;; --mac|--local) ;; *) orig+=("$a") ;; esac
done
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
    --local) where=local ;;
    --mac) where=mac ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

# Keep scratch shots out of git without touching the project's .gitignore (worktrees too: .git may be a file).
exclude_shots() {
  local ex; ex="$(git -C "$root" rev-parse --git-common-dir 2>/dev/null)/info/exclude" || return 0
  [[ "$ex" == /* ]] || ex="$root/$ex"
  grep -qx '.ui-shots/' "$ex" 2>/dev/null || { mkdir -p "$(dirname "$ex")" && echo '.ui-shots/' >> "$ex"; }
}

# Off macOS, shoot on the owner's Mac over SSH so pages render in Apple's system font (SF Pro) like the owner sees
# them; copy the PNGs back and print local paths. --local forces this machine; --keep-open (interactive steps) stays
# local. Falls back to local when the Mac doesn't answer.
mac_host="${UI_SHOT_MAC:-clayblasingame@mac}"
if [[ $where != local && $keep == 0 && "$(uname)" != Darwin ]]; then
  if ssh -o BatchMode=yes -o ConnectTimeout=5 "$mac_host" true 2>/dev/null; then
    remote_out="/tmp/ui-shots-remote/$$-$RANDOM"
    fwd=()
    for a in "${orig[@]}"; do fwd+=("$(printf '%q' "$a")"); done
    files="$(ssh -o BatchMode=yes "$mac_host" "zsh -lc $(printf '%q' "\$HOME/.agents/skills/ui-check/scripts/shot.sh $(printf '%q' "$url") ${fwd[*]} --local --out $remote_out")")"
    root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
    if [[ -z "$out" ]]; then
      out="$root/.ui-shots"
      exclude_shots
    fi
    mkdir -p "$out"
    while IFS= read -r f; do
      [[ -n "$f" ]] || continue
      scp -q -o BatchMode=yes "$mac_host:$f" "$out/" && echo "$out/$(basename "$f")"
    done <<< "$files"
    ssh -o BatchMode=yes "$mac_host" "rm -rf $remote_out" || true
    exit 0
  fi
  [[ $where == mac ]] && { echo "Mac ($mac_host) not reachable over SSH" >&2; exit 1; }
  echo "note: Mac not reachable; shooting locally (fonts differ from the owner's)" >&2
fi

root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
if [[ -z "$out" ]]; then
  out="$root/.ui-shots"
  exclude_shots
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
