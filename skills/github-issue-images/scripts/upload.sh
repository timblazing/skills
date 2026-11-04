#!/usr/bin/env bash
# Upload images to a repo's hidden asset ref and print markdown to embed them.
#
#   upload.sh [-R owner/repo] [-d folder] [-c caption] FILE...
#
# -R  target repo (default: the current repo, via gh)
# -d  folder in the asset tree (default: YYYY-MM-DD-<random>); use e.g. issue-76 when the number is known
# -c  alt text / caption for every file (default: file name)
#
# Images go to refs/assets/issue-images: a ref outside refs/heads, so it is not
# a branch (no "recent pushes" banner, not in the branch list, never cloned, no
# CI or deploys) but still keeps the commits alive. Prints one <img> tag per
# file, pinned to the commit that added it; it renders for anyone with repo
# access, private repos too. Needs only `gh` (authenticated) and base64.
set -euo pipefail

REF="assets/issue-images"
repo="" dir="" caption=""
while getopts "R:d:c:" o; do
  case "$o" in
    R) repo="$OPTARG" ;;
    d) dir="$OPTARG" ;;
    c) caption="$OPTARG" ;;
    *) sed -n 2,14p "$0"; exit 2 ;;
  esac
done
shift $((OPTIND - 1))
[[ $# -gt 0 ]] || { sed -n 2,14p "$0"; exit 2; }
[[ -n "$repo" ]] || repo="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
[[ -n "$dir" ]] || dir="$(date +%F)-$(LC_ALL=C tr -dc a-z0-9 </dev/urandom | head -c 6)"

parent=$(gh api "repos/$repo/git/ref/$REF" -q .object.sha 2>/dev/null || true)

for f in "$@"; do
  [[ -f "$f" ]] || { echo "not a file: $f" >&2; exit 1; }
  name="$(basename "$f" | tr ' ' '-')"
  path="$dir/$name"

  # Blob (JSON body from a file: large images exceed argv limits).
  body=$(mktemp)
  printf '{"encoding":"base64","content":"' >"$body"
  base64 <"$f" | tr -d '\n' >>"$body"
  printf '"}' >>"$body"
  blob=$(gh api "repos/$repo/git/blobs" --input "$body" -q .sha)
  rm -f "$body"

  # Tree on top of the previous commit's tree, then a commit, then move the ref.
  if [[ -n "$parent" ]]; then
    base=$(gh api "repos/$repo/git/commits/$parent" -q .tree.sha)
    tree=$(gh api "repos/$repo/git/trees" -f base_tree="$base" -f "tree[][path]=$path" \
      -f "tree[][mode]=100644" -f "tree[][type]=blob" -f "tree[][sha]=$blob" -q .sha)
    sha=$(gh api "repos/$repo/git/commits" -f message="Add $path" -f tree="$tree" -f "parents[]=$parent" -q .sha)
    gh api -X PATCH "repos/$repo/git/refs/$REF" -f sha="$sha" --silent
  else
    tree=$(gh api "repos/$repo/git/trees" -f "tree[][path]=$path" \
      -f "tree[][mode]=100644" -f "tree[][type]=blob" -f "tree[][sha]=$blob" -q .sha)
    sha=$(gh api "repos/$repo/git/commits" -f message="Add $path" -f tree="$tree" -q .sha)
    gh api "repos/$repo/git/refs" -f ref="refs/$REF" -f sha="$sha" --silent
  fi
  parent="$sha"

  width=""
  if command -v sips >/dev/null; then width=$(sips -g pixelWidth "$f" 2>/dev/null | awk '/pixelWidth/{print $2}'); fi
  [[ -n "$width" && "$width" -gt 800 ]] && width=800
  alt="${caption:-$name}"
  echo "<img ${width:+width=\"$width\" }alt=\"$alt\" src=\"https://github.com/$repo/blob/$sha/$path?raw=true\" />"
done
