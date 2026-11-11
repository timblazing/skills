# Global agent instructions (shared by Claude Code and Codex)

## Repos
- This file and the skills live in the home repo, timblazing/skills (`~/DEV/github/skills` on the Mac). `~/.agents/repos.md` lists my other repos, where each is checked out and how to verify it: read it when a task touches a repo other than the current one.
- Changes across several repos: one branch and one PR per repo, each in its own worktree of that repo, never in another repo's main checkout.

## Browser
- All browser work goes through `agent-browser`, headless by default. Pick the skill by job:
  - `ui-check` — look at a design: screenshots of pages/elements, desktop 1440×900 and phone iPhone 16 393×852.
  - `ui-qa` — functional testing, flows, console/network errors, bug hunts; Helium mode when real logins/extensions are needed.
  - `ui-evidence` — before/after screenshots committed to the PR branch and linked in the PR.
- Never use computer-use, Claude in Chrome, the ChatGPT Chrome extension, Playwright, Chrome DevTools MCP, or an in-app browser for web pages.

## iOS Simulator / Android Emulator
- Never boot, open or install to a simulator or emulator without the owner's approval in the current conversation. That covers T3 `device_open`, `xcrun simctl boot`, `npx expo run:ios|android`, and `xcodebuild` builds aimed at a simulator. They use too much CPU and memory. This overrides project docs, skills (including `full-send`) and harness guidance that suggest checking work on a simulator.
- Without approval, verify with typecheck, lint and tests, and say what still needs checking on a device. The owner tests on their phone.
- Once approved, in T3 Code use the Device panel (`device_list` → `device_open` with `hostId` and `deviceId`, the returned `agent-device` command for launch/input/capture, `device_screenshot` to look), not `simctl`/`idb`/`adb` for interaction. If a device tool fails twice, report the blocker and stop. Shut the device down (`device_close` with `shutdown: true`) as soon as the check is done.

## Git and PRs
- Product repos (websites, apps, software): load `build` at the start of any task that changes code; it calls the other workflow skills itself. Never commit or push to the default branch. When the change is done and proven, branch, commit, push, and open the PR without asking — this is standing authorization to commit, push, and open PRs, and it overrides any default to commit only when asked. Pushing straight to main needs a direct instruction in the current request.
- Non-product repos (skills, dotfiles, notes, config): push to the default branch directly unless the repo says otherwise.
- My backlog is GitHub issues, mirrored read-only in proj: load the `proj` skill when starting work in a repo that's a proj project, or when asked to add to the backlog, save an idea or note something (those become GitHub issues; MCP server `proj`, tailnet only; skip the MCP silently when its tools are absent).
- "full stop" → `full-stop` (PR ready, user merges). "full send" → `full-send` (agent merges, personal repos only). Second opinions → `cross-review` at medium effort; Greptile only on big or risky PRs.

## Factory loop
- Work starts from a GitHub issue (`github` skill). `agent-ready` means go. On one labelled `triage`, run `triage` first; it asks me only for decisions it can't make.
- Open the PR with `file-pr`: the agent header line and the `Risk: low | medium | high` line, then what changed, Verification, Before/after and Preview.
- Prove the change with the repo's `verify` skill when it has one, otherwise its AGENTS.md commands.
- Run `babysit-pr` until CI is green and the review bots have no open findings, then hand the PR to me. Never merge unless I said "full send".
- Note anything that slowed you down (missing docs, flaky checks, a skill that misled you) under a "Factory notes" heading in the PR body, for the weekly `retro`.

## Local machine
- Never start Docker, Colima, Podman, OrbStack, Lima, or any other local VM or container runtime on this Mac. They use too many resources.
- When asked to run something "isolated" or "not on my machine", use a remote sandbox (for example a Cloudflare Sandbox) or a throwaway scratch directory with its own npm cache. If neither fits, ask before choosing.
- Stop any server or background process you started once the user is done with it.
- Clean up when work is merged or abandoned: delete merged branches (remote and local), remove worktrees you or subagents created, close browser sessions, and delete scratch files. Details: `build` "Cleaning up".

## External apps
- Executor is the gateway to external apps (email, calendar, Slack, docs and the rest) in interactive sessions with me. It is self-hosted at https://executor.blasingame.dev (tailnet only) and connected to Claude Code and Codex as the `executor` MCP server: `search` for a tool, `describe` it, then `call` it; use `execute` for multi-step scripts. If the app or account isn't connected, tell me to add it on proj's MCP page instead of working around it. Unattended runs (GitHub Actions on anton, scheduled tasks, threads started from an issue) never use it.
- Use `gh` for git/GitHub work on the current repo (PRs, issues, checks).
- When an issue, issue comment or PR comment should include images (chat attachments, screenshots, reference designs), load `github-issue-images`: `gh` can't upload attachments, so it commits them to a hidden ref in the repo (not a branch, not `main`) and embeds the links.
- Confirm before any write to an external service (sending, posting, deleting, inviting).

When interacting with Cloudflare, use the cf CLI unless the project has a Wrangler configuration file.
