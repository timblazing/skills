---
name: ui-check
description: Visually check frontend work by taking headless screenshots of pages or elements (local dev server, preview, or prod) and looking at the images. Use after UI changes, or when asked to "check the design", "look at the page", "screenshot this", "how does it look on mobile/phone", "check dark mode", or verify layout/styling. Screenshots only — for clicking through flows, forms, or bug hunts use ui-qa; for PR before/after images use ui-evidence.
---

# UI check (screenshots, not browsing)

Goal: see the UI with as few browser steps as possible. Capture images, read them, fix, re-capture. Don't explore the app.

Everything runs headless through `agent-browser` — no window opens, nothing steals focus. Never use computer-use, Claude in Chrome, Chrome DevTools MCP, Playwright, or an in-app browser for this.

## Standards

| Check | Size | Command flag |
|---|---|---|
| Desktop | 1440×900 @1x | `--desktop` (default) |
| Phone | iPhone 16, 393×852 @1x, mobile UA | `--phone` |
| Both | — | `--both` |
| Dark mode | `prefers-color-scheme: dark` | `--dark` |

Use 1x for checks (small images, fast to read). `--hidpi` (2x desktop / 3x phone) is only for images humans will see — see ui-evidence.

## Capture

```bash
SHOT=~/.agents/skills/ui-check/scripts/shot.sh
$SHOT http://localhost:3000/pricing --both            # desktop + phone
$SHOT http://localhost:3000/pricing --phone --dark
$SHOT http://localhost:3000 --el ".hero"               # one element (CSS selector)
$SHOT http://localhost:3000 --full                     # full scroll height (only when needed)
```

The script prints saved paths (default `<repo>/.ui-shots/`, git-excluded automatically). Then **Read each PNG** and judge it against the intent of the change: spacing, alignment, overflow/clipping, wrapping, contrast, broken images, phone layout.

Prefer `--el` close-ups when checking a specific component — far cheaper than full pages. Use `--full` only when the issue is below the fold.

## When the state needs navigation (modal open, tab selected, logged in)

Drive the minimum steps in the same session, then screenshot:

```bash
export AGENT_BROWSER_SESSION="$(agent-browser session id --scope worktree --prefix ui)"
$SHOT http://localhost:3000/settings --phone --keep-open   # sets viewport + loads page, leaves it open
agent-browser snapshot -i                                  # interactive refs only
agent-browser click @e7                                    # e.g. open the dialog
agent-browser screenshot '[role=dialog]' .ui-shots/settings-dialog-phone.png
agent-browser close
```

If a later step needs real logins or extensions, switch to ui-qa's Helium mode.

## Rules

- Find the dev server URL from the project (`package.json` scripts, terminal output, `.env`), and only start a server if none is running — leave servers you didn't start alone.
- Wait for real content: if a shot shows a spinner/skeleton, re-run with `--wait 2000`.
- WebGPU/three.js canvas renders black → re-run in a session opened with `--webgpu` (see `agent-browser skills get core`).
- Touch media queries (`pointer: coarse`, `hover: none`) are not emulated; mention it if a design depends on them.
- Report what you saw with the image paths. Don't paste base64 or describe pixels you didn't look at.
- Unknown command or launch failure → `agent-browser doctor`.
