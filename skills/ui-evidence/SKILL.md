---
name: ui-evidence
description: Document frontend changes with before/after screenshots for a PR or the project's docs. Captures headless screenshots with agent-browser, commits them to the PR branch, and adds a before/after table to the PR description (or wherever the project documents UI changes). Use for "PR screenshots", "before and after", "document this UI change", "add screenshots to the PR", "visual diff for review".
---

# UI evidence (before/after for PRs)

Capture with the same headless tool as ui-check, at high DPI for humans. Images are **committed to the PR branch** and linked by commit SHA. Never upload to public hosts (0x0.st, imgur, gists).

## 1. Decide where it goes

Check the project, in order, and follow the first match:
1. `.github/pull_request_template.md` (or `docs/pull_request_template.md`) with a Screenshots/Visual section → fill that section.
2. Project docs that record UI changes (`CHANGELOG.md` with images, `docs/` design notes, `CONTRIBUTING.md` instructions) → follow them.
3. Default → a "Before / After" section in the PR body.

## 2. Pick the before and after

- **After** = the current working tree, usually the local dev server.
- **Before** = production, a preview deploy of the base branch, or another local port. If the user hasn't said and it isn't obvious from the project (README/deploy config), **ask**: "What URL should I use for the 'before' state?"
- Don't switch branches, stash, or start servers on the user's behalf to produce "before". For a new page with no before, show after only.

## 3. Capture

```bash
SHOT=~/.agents/skills/ui-check/scripts/shot.sh
DIR=".github/pr-assets/$(git branch --show-current | tr '/' '-')"
$SHOT https://prod.example.com/pricing    --both --hidpi --out "$DIR" --name before-pricing
$SHOT http://localhost:3000/pricing       --both --hidpi --out "$DIR" --name after-pricing
# element-level: add --el ".pricing-card"; dark mode: add --dark
```

Defaults: desktop + phone (iPhone 16), viewport only. `--full` only if asked. Read every image before committing to confirm it shows the change (no spinners, no cookie banners covering it, same scroll position before vs after).

For interaction changes, also record a short clip: `agent-browser record start "$DIR/after-flow.webm" <url>` … `record stop`, and link it (videos don't play inline from repo links).

## 4. Commit and link

```bash
git add "$DIR" && git commit -m "docs: add UI screenshots for PR"
git push
SHA=$(git rev-parse HEAD)
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
# image URL: https://github.com/$REPO/blob/$SHA/$DIR/<file>.png?raw=true
```

Commit only the screenshot files. Pinning links to `$SHA` keeps them working after later commits, and they render for anyone with repo access, private repos included.

## 5. Write it up

```markdown
<!-- ui-evidence:start -->
## Before / After

| | Before | After |
|---|---|---|
| Desktop | <img src="…/before-pricing-desktop.png?raw=true" width="480"> | <img src="…/after-pricing-desktop.png?raw=true" width="480"> |
| Phone | <img src="…/before-pricing-phone.png?raw=true" width="240"> | <img src="…/after-pricing-phone.png?raw=true" width="240"> |
<!-- ui-evidence:end -->
```

Update the PR: `gh pr view --json body -q .body > /tmp/body.md`, replace the block between the `ui-evidence` markers (or append it / fill the template section), then `gh pr edit --body-file /tmp/body.md`. Never drop existing PR text. With no PR yet, put the block in the `gh pr create` body or print it for the user.

If GitHub isn't the host, or the user doesn't want images in the repo, output the markdown with local paths and ask where to put the files.
