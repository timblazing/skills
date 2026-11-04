#!/usr/bin/env bash
# Upload images to a repo's `issue-assets` branch and print markdown to embed them.
#
#   upload.sh [-R owner/repo] [-d folder] [-c caption] FILE...
#
# -R  target repo (default: the current repo, via gh)
# -d  folder on the branch (default: YYYY-MM-DD-<random>); use e.g. issue-76 when the number is known
# -c  alt text / caption for every file (default: file name)
#
# Prints one <img> tag per file, pinned to the commit that added it, so the
# link keeps working and renders for anyone with repo access (private repos too).
# Needs only `gh` (authenticated) and base64. No local checkout required.
set -euo pipefail

BRANCH="issue-assets"
repo="" dir="" caption=""
while getopts "R:d:c:" o; do
  case "$o" in
    R) repo="$OPTARG" ;;
    d) dir="$OPTARG" ;;
    c) caption="$OPTARG" ;;
    *) sed -n 2,12p "$0"; exit 2 ;;
  esac
done
shift $((OPTIND - 1))
[[ $# -gt 0 ]] || { sed -n 2,12p "$0"; exit 2; }
[[ -n "$repo" ]] || repo="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
[[ -n "$dir" ]] || dir="$(date +%F)-$(LC_ALL=C tr -dc a-z0-9 </dev/urandom | head -c 6)"

# Create the orphan branch on first use (a commit with no parents holding a README).
if ! gh api "repos/$repo/branches/$BRANCH" --silent 2>/dev/null; then
  readme="Images embedded in issues and comments. Uploaded by the github-issue-images skill; not part of the code."
  tree=$(gh api "repos/$repo/git/trees" -f "tree[][path]=README.md" -f "tree[][mode]=100644" \
    -f "tree[][type]=blob" -f "tree[][content]=$readme" -q .sha)
  commit=$(gh api "repos/$repo/git/commits" -f message="Start issue-assets branch" -f tree="$tree" -q .sha)
  gh api "repos/$repo/git/refs" -f ref="refs/heads/$BRANCH" -f sha="$commit" --silent
fi

for f in "$@"; do
  [[ -f "$f" ]] || { echo "not a file: $f" >&2; exit 1; }
  name="$(basename "$f" | tr ' ' '-')"
  path="$dir/$name"
  body=$(mktemp)
  # Large images exceed argv limits, so send the JSON body from a file.
  printf '{"message":"Add %s","branch":"%s","content":"' "$path" "$BRANCH" >"$body"
  base64 <"$f" | tr -d '\n' >>"$body"
  printf '"}' >>"$body"
  sha=$(gh api -X PUT "repos/$repo/contents/$path" --input "$body" -q .commit.sha)
  rm -f "$body"
  # Width from PNG header when possible, capped so big screenshots stay readable.
  width=""
  if command -v sips >/dev/null; then width=$(sips -g pixelWidth "$f" 2>/dev/null | awk '/pixelWidth/{print $2}'); fi
  [[ -n "$width" && "$width" -gt 800 ]] && width=800
  alt="${caption:-$name}"
  echo "<img ${width:+width=\"$width\" }alt=\"$alt\" src=\"https://github.com/$repo/blob/$sha/$path?raw=true\" />"
done
