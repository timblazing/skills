---
name: ui-qa
description: Functionally test a web app in a browser — click through flows, fill forms, check console/network errors, reproduce bugs, exploratory QA, or test something that needs the user's real logged-in browser (Helium). Use for "test this flow", "does the form work", "QA this", "reproduce this bug", "dogfood", "check for console errors", "use my browser/logged-in session". For pure visual checks use ui-check; for PR images use ui-evidence.
---

# UI QA (functional browser testing)

All browser work goes through `agent-browser`. Never use computer-use, Claude in Chrome, Chrome DevTools MCP, Playwright, or an in-app browser. Load the version-matched guide once per task if you need command details: `agent-browser skills get core`.

## Mode 1 — headless (default)

Isolated Chromium, no window, no focus stealing. Use for local dev servers, previews, and anything that doesn't need the user's real accounts.

```bash
export AGENT_BROWSER_SESSION="$(agent-browser session id --scope worktree --prefix qa)"
agent-browser set viewport 1440 900          # phone: set device "iPhone 16"; set viewport 393 852 1
agent-browser open http://localhost:3000
agent-browser snapshot -i                    # interactive elements with @refs
agent-browser fill @e3 "test@example.com"
agent-browser click @e5
agent-browser wait --load networkidle
agent-browser snapshot -i                    # re-snapshot after every page change; refs go stale
agent-browser console; agent-browser errors  # check after each meaningful step
agent-browser network requests --filter /api
agent-browser close
```

Loop: snapshot → act → verify (snapshot text, `get text`, `is visible`, URL, console/errors) → screenshot only when the visual result matters. Assert outcomes; don't just click and move on.

App logins in headless mode: use test credentials from the project (seed data, `.env.example`, README). To persist a login across runs add `--restore` to `open`. Never echo secrets.

## Mode 2 — real browser (Helium)

Only when the test needs the user's real logged-in sessions, cookies, or extensions, or the user asks for "my browser". This is visible and acts on the user's real accounts — confirm before any write action (posting, purchasing, deleting, sending).

```bash
CDP="$(~/.agents/skills/ui-qa/scripts/helium-cdp.sh)"   # prints setup steps if debugging is off
agent-browser --session helium --cdp "$CDP" tab new http://localhost:3000   # own tab; don't hijack the user's tabs
agent-browser --session helium snapshot -i
# ... same commands with --session helium ...
agent-browser --session helium tab close                 # close only tabs you opened
```

Helium may show a permission prompt the first time an agent connects — tell the user to approve it. Don't `close` the session in a way that quits Helium.

Prefer copying auth into headless when possible: `agent-browser --session helium --cdp "$CDP" state save ./.ui-shots/auth.json`, then `agent-browser --state ./.ui-shots/auth.json open <url>` headless. Delete the state file after; never commit it.

## Deeper tools (all agent-browser)

- Exploratory QA / bug hunt with a report: `agent-browser skills get dogfood` and follow it.
- Video repro: `agent-browser record start .ui-shots/repro.webm` … `record stop`.
- Accessibility audit (axe): `agent-browser a11y [--tags wcag2a,wcag2aa] [--selector "#main"]`.
- Performance: `agent-browser vitals [url]` (LCP/CLS/INP…), `trace start|stop`, `profiler start|stop`.
- React internals: `open --enable react-devtools <url>`, then `react tree|inspect|renders`.
- Screenshot diffs: `agent-browser diff screenshot --baseline <png>`.

## Report

State what passed and what failed, with exact steps to reproduce, console/network errors verbatim, and screenshot paths for failures.
