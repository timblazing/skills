#!/usr/bin/env bash
# Link every skill in ./skills into ~/.agents/skills (Codex and other agents)
# and ~/.claude/skills (Claude Code). Safe to re-run after every `git pull`.
#
# Per-machine opt-outs: list skill names, one per line, in
#   ~/.config/agent-skills/skip
# Skipped skills are unlinked on that machine.
#
# Anything already sitting at a link's path that isn't one of our links is
# moved to ~/.agents/backups/<timestamp>/ instead of being deleted.
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
agents="$HOME/.agents/skills"
claude="$HOME/.claude/skills"
skip_file="${XDG_CONFIG_HOME:-$HOME/.config}/agent-skills/skip"
backup="$HOME/.agents/backups/$(date +%Y%m%d-%H%M%S)"

mkdir -p "$agents" "$claude"

skipped() { [[ -f "$skip_file" ]] && grep -qxF "$1" "$skip_file"; }

stash() {
  mkdir -p "$backup/$2"
  mv "$1" "$backup/$2/"
  echo "  moved $1 -> $backup/$2/"
}

# link <target> <path> <label>
link() {
  local target="$1" path="$2" label="$3"
  if [[ -L "$path" && "$(readlink "$path")" == "$target" ]]; then return; fi
  if [[ -e "$path" || -L "$path" ]]; then stash "$path" "$label"; fi
  ln -s "$target" "$path"
  echo "  linked $path"
}

while IFS= read -r skill_file; do
  dir="$(dirname "$skill_file")"
  name="$(basename "$dir")"
  if skipped "$name"; then
    for p in "$claude/$name" "$agents/$name"; do
      [[ -L "$p" ]] && rm "$p" && echo "  unlinked $p (skipped)"
    done
    continue
  fi
  link "$dir" "$agents/$name" agents
  link "../../.agents/skills/$name" "$claude/$name" claude
done < <(find "$repo/skills" -mindepth 2 -name SKILL.md -print | sort)

# Remove links to skills that were deleted from the repo.
for p in "$agents"/* "$claude"/*; do
  [[ -L "$p" && ! -e "$p" ]] && rm "$p" && echo "  pruned $p"
done

echo "done: $(find "$repo/skills" -mindepth 2 -name SKILL.md | wc -l | tr -d ' ') skills in repo"
