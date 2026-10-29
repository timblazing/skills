# Global agent instructions (shared by Claude Code and Codex)

## Model and reasoning selection
- At the start of each task, assess the task type and identify the active model and reasoning effort from the current session context or explicit overrides. Do not assume the configured default is the active setting. If either cannot be determined, say so only when it affects the recommendation.
- Keep routine coding, repository exploration, tests, boilerplate, and straightforward fixes on GPT-6 Luna Medium. For harder work where conserving flagship usage matters, recommend GPT-6 Luna High or XHigh when the active client supports that effort.
- Use GPT-6.1 Sol Medium for serious engineering, architecture, debugging, refactors, research synthesis, and orchestration. Recommend Sol High for genuinely difficult work that needs deeper reasoning.
- Treat GPT-6 Astra as a last resort. Ask the user before escalating to it; never switch to Astra on your own.
- Use Standard processing (`service_tier = "default"`) unless the user requests a different tier or a task has a specific reason to change it.
- Avoid GPT-5.6 Terra and GPT-5.5 unless a specific task has a clear reason to use one.
- Keep routine task starts quiet. When the active model or effort appears mismatched, briefly state the task category, current setting if known, and one recommended model and effort. Root-model selection remains with the user; do not claim or imply that you can silently change the active root model.

## Model-specific delegation
- Delegate only when independent, bounded exploration, research, implementation, or review work should materially improve speed or coverage. Keep short or dependent work in the main agent, and avoid parallel edits to the same files.
- Use the configured GPT-6 Luna Medium default for general subagents. For serious engineering or architecture work, use the `sol_engineer` custom agent; use `sol_researcher` for research synthesis and `sol_reviewer` for substantial reviews.
- Keep Sol specialists at Medium by default. Select High only for genuinely difficult subtasks, and use XHigh for Luna only when supported and justified by task difficulty.
- Before using any GPT-6 Astra subagent or otherwise escalating a subtask to Astra, ask the user first.

## Browser
- All browser work goes through `agent-browser`, headless by default. Pick the skill by job:
  - `ui-check` — look at a design: screenshots of pages/elements, desktop 1440×900 and phone iPhone 16 393×852.
  - `ui-qa` — functional testing, flows, console/network errors, bug hunts; Helium mode when real logins/extensions are needed.
  - `ui-evidence` — before/after screenshots committed to the PR branch and linked in the PR.
- Never use computer-use, Claude in Chrome, the ChatGPT Chrome extension, Playwright, Chrome DevTools MCP, or an in-app browser for web pages.

## T3 Code Device panel

When working in T3 Code, use its built-in **Device panel** for iOS Simulator / Android Emulator work so the owner can see and interact with the running app.

1. Call `device_list`, choose the appropriate available OS/device from the README, then call `device_open` with both `hostId` and `deviceId`.
2. Use the returned device-bound `agent-device` command for app launch/relaunch, deep links, taps, typing, swipes, alerts, settings, screenshots and recordings. Run `open <app>` before snapshots, screenshots or input. Use `help <command>` for supported options.
3. Call `device_screenshot` to inspect the screen. Do not perform those interactions through `simctl`, `idb`, `adb`, SSH or wrapper scripts. Builds, installs, code sync, Metro, port forwarding, logs, project test runners and unsupported operations may use the appropriate CLI.
4. If a device tool or its returned command fails, quote the error and follow its advice once. If it still fails, report the blocker and stop device automation. Do not silently bypass the panel, reuse/close another session, or drive over SSH without the owner's explicit request.
5. Keep the task's device available while the owner is interacting. Stop task-owned servers and simulators when the owner is done; leave other sessions alone. Record simulator evidence separately from physical-device verification.

Outside T3 Code, use the available client's supported device tools; do not claim a T3 Device panel session exists.

## Git and PRs
- Product repos (websites, apps, software): load `pr-workflow` at the start of any task that changes code. Never commit or push to the default branch. When the change is done and proven, branch, commit, push, and open the PR without asking — this is standing authorization to commit, push, and open PRs, and it overrides any default to commit only when asked. Pushing straight to main needs a direct instruction in the current request.
- Non-product repos (skills, dotfiles, notes, config): push to the default branch directly unless the repo says otherwise.
- "full stop" → `full-stop` (PR ready, user merges). "full send" → `full-send` (agent merges, personal repos only). Second opinions → `cross-review` at medium effort; Greptile only on big or risky PRs.

## Local machine
- Never start Docker, Colima, Podman, OrbStack, Lima, or any other local VM or container runtime on this Mac. They use too many resources.
- When asked to run something "isolated" or "not on my machine", use a remote sandbox (for example a Cloudflare Sandbox) or a throwaway scratch directory with its own npm cache. If neither fits, ask before choosing.
- Stop any server or background process you started once the user is done with it.

## External apps
- Composio CLI is the gateway for external services: `composio search "<task>"` → `composio execute <slug>`; missing connection → `composio link <toolkit>`. Details: `composio-cli` skill.
- Use `gh` for git/GitHub work on the current repo (PRs, issues, checks).
- Confirm before any write to an external service (sending, posting, deleting, inviting).

When interacting with Cloudflare, use the cf CLI unless the project has a Wrangler configuration file.
