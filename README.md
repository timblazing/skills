# Agent Skills

The agent skills I actually use, kept in one place so every machine I work on (Mac, servers) has the same set. They work with Claude Code and Codex, and with any agent that reads `~/.agents/skills`.

## Skills

Cloudflare skills are grouped under `skills/cloudflare/` in the repository to
keep the source tree manageable. The installer links each skill by its folder
name into the top level of both `~/.agents/skills` and `~/.claude/skills`, where
the agents discover them.

| Skill | What it does | Source |
| --- | --- | --- |
| [agent-browser](skills/agent-browser) | Browser automation CLI for agents | [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) (Apache-2.0) |
| [frontend-design](skills/frontend-design) | Distinctive, intentional visual design | [anthropics/skills](https://github.com/anthropics/skills) (Apache-2.0, see LICENSE.txt) |
| [design-taste-frontend](skills/design-taste-frontend) | Research-led art direction and real-browser visual review | mine (installed globally) |
| [design-taste-frontend](skills/design-taste-frontend) | Research-driven art direction, page composition, and browser critique | tasteskill v2 (local install) |
| [github-issue-images](skills/github-issue-images) | Screenshots in GitHub issues and comments via a hidden git ref (not a branch) | mine |
| [open-pencil](skills/open-pencil) | Inspect, edit and export `.fig` files via OpenPencil | [open-pencil/open-pencil](https://github.com/open-pencil/open-pencil) (MIT) |
| [openui](skills/openui) | Official OpenUI generative UI, language, components, and agent integration guidance | [thesysdev/skills](https://github.com/thesysdev/skills), revision `bcd93adc9185e333bc9a83b29f7d81d67ab1935f` (complete skill directory) |
| [openui-t3](skills/openui-t3) | In-chat OpenUI interfaces: Codex MCP App with approved agent handoff, plus HTML fallback | mine; official OpenUI React runtime and MCP Apps SDK |
| [proj](skills/proj) | Read proj (read-only MCP, tailnet only) and file follow-ups as GitHub issues | mine |
| [pick-ui-library](skills/pick-ui-library) | Curated library picks for frontend tasks (manual invoke only) | [emilkowalski/skills](https://github.com/emilkowalski/skills) (MIT) |
| [scan-to-threejs](skills/scan-to-threejs) | Rebuild editable Three.js rooms from scans and photo references | [wesbos/3d-model-anything](https://github.com/wesbos/3d-model-anything/tree/main/.agents/skills/scan-to-threejs) |
| [security-audit](skills/security-audit) | Source-first security review and full codebase audits with validated findings | [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill), revision `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8` (MIT, see LICENSE) |
| [ui-check](skills/ui-check) | Headless screenshots to visually check UI | mine |
| [ui-qa](skills/ui-qa) | Functional browser testing: flows, forms, console errors | mine |
| [ui-evidence](skills/ui-evidence) | Before/after screenshots committed to a PR | mine |
| [vercel-react-best-practices](skills/vercel-react-best-practices) | React/Next.js performance rules | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (MIT) |

### Workflow (`skills/workflow/`)

PR and review workflow, adapted from [t3dotgg/tstack](https://github.com/t3dotgg/tstack)
(MIT, see `skills/workflow/LICENSE-tstack`; vendored at `7de017b`) for $20
Claude and Codex plans: one cross-provider reviewer at medium effort, 2-3
rounds, review skipped for small changes, Greptile only on big PRs.

| Skill | Say | What it does | Source |
| --- | --- | --- | --- |
| [build](skills/workflow/build) | (automatic, any code change) | The factory loop: understand → build → prove → review → ship. Calls the child skills below, plus branch policy, tiers, CI template, Greptile rules | mine (was `pr-workflow`) |
| [cross-review](skills/workflow/cross-review) | "cross review", "sol loop", "council" | Other flagship (Opus ↔ Sol) reviews the change in a short loop | replaces tstack `sol-loop` + `council` |
| [full-send](skills/workflow/full-send) | "full send" | Prove, review, file, babysit, merge (personal repos) | tstack, edited |
| [full-stop](skills/workflow/full-stop) | "full stop" | Same, but stops with the PR ready for you to merge | tstack, edited |
| [file-pr](skills/workflow/file-pr) | "file a PR" | Short PR that leads with the problem | tstack, edited |
| [babysit-pr](skills/workflow/babysit-pr) | "babysit" | Watch CI and review bots, fix real findings | tstack, edited |
| [github](skills/workflow/github) | "github", issue or PR number | `gh` mechanics: issues, issue to PR, review, CI, auth; routes to references | [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) `github` skill (MIT, see `LICENSE-hermes`; commit `95fc3e6`), edited |
| [leaving-pr-comments](skills/workflow/leaving-pr-comments) | (automatic) | Attribution format for agent-posted comments | tstack |
| [modernize](skills/workflow/modernize) | "modernize" | Rebase an old PR and decide if it should still exist | tstack |
| [takeover](skills/workflow/takeover) | "take over" | Finish someone else's PR, branch, or thread | tstack |

### Factory children (`skills/workflow/`)

Adapted from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT, see
`skills/workflow/LICENSE-mattpocock`; commit `4ae2317`). Nobody types these:
`build`, `proj` and `retro` call them. Children set `user-invocable: false` and
their descriptions start "Called by …".

| Skill | Called by | What it does | Source |
| --- | --- | --- | --- |
| [clarify](skills/workflow/clarify) | build, triage | Rounds of numbered questions with recommended answers; ADRs for hard-to-reverse decisions. Unattended runs post the questions on the issue and stop | `grilling` + `domain-modeling` |
| [plan](skills/workflow/plan) | build, triage | Splits work into tracer-bullet sub-issues with blockers. Small, low-risk plans go straight to `agent-ready`; bigger ones wait for approval | `to-spec` + `to-tickets` |
| [diagnose](skills/workflow/diagnose) | build | Red loop → reproduce → minimise → hypotheses → fix + regression test | `diagnosing-bugs` |
| [tdd](skills/workflow/tdd) | build | Red-green at agreed seams | `tdd` |
| [triage](skills/workflow/triage) | proj | `triage` → `agent-ready` with an agent brief | `triage`, cut down |
| [retro](skills/workflow/retro) | weekly task | Factory notes → fixes to skills, checks, AGENTS.md | `retro` |
| [research](skills/workflow/research) | clarify, plan, anyone | Background agent, primary sources, cited markdown | `research` |
| [wizard](skills/workflow/wizard) | anyone | Bash script that walks you through manual setup (secrets, dashboards) | `wizard` |
| [writing-for-agents](skills/workflow/writing-for-agents) | retro, skill edits | How to write skills and AGENTS.md | `writing-for-agents` |

The `ui-*` skills run on `agent-browser`. `ui-qa`'s Helium mode (driving your real, logged-in browser) works on macOS only.

## Install

```sh
git clone https://github.com/timblazing/skills.git ~/DEV/github/skills
~/DEV/github/skills/install.sh
```

`install.sh` symlinks each skill in `skills/` (including categorized folders)
into `~/.agents/skills/<name>`, then links `~/.claude/skills/<name>` to that.
It also installs the steering files below. Edit them in the repo, then commit and push.
You can re-run it any time. Anything already at one of those paths gets moved
to `~/.agents/backups/` rather than deleted.

To leave a skill off one machine (for example `open-pencil` on a headless server), list it in `~/.config/agent-skills/skip`:

```sh
mkdir -p ~/.config/agent-skills && echo open-pencil >> ~/.config/agent-skills/skip
./install.sh
```

## Home repo and steering files

This repo is my home repo: everything that steers an agent lives here, and every machine gets it from `install.sh`. Steering files are what an agent loads before it starts work and what shapes how it works.

| File in this repo | Installed as | Read by |
| --- | --- | --- |
| `config/AGENTS.md` | `~/.agents/AGENTS.md`, linked as `~/.claude/CLAUDE.md` | Every Claude Code and Codex session |
| `config/codex/AGENTS.md` | appended to the above to make `~/.codex/AGENTS.md` (a generated file, so re-run `install.sh` after editing) | Codex only: model routing, Sol subagents |
| `config/claude/rules/model-routing.md` | `~/.claude/rules/` | Claude Code only: Opus plans, Sonnet and Haiku subagents do the work |
| `config/claude/agents/*.md` | `~/.claude/agents/` | Claude Code subagents (architect, implementer, quick-worker) |
| `config/codex/agents/*.toml` | `~/.codex/agents/` | Codex subagents (sol_engineer, sol_researcher, sol_reviewer) |
| `config/claude/settings.json` | merged into `~/.claude/settings.json` | Claude Code: env, permissions, plugins, model, output style |
| `config/repos.md` | `~/.agents/repos.md` | Agents working across repos: where each repo is and what it is |
| `skills/**/SKILL.md` | `~/.agents/skills/`, `~/.claude/skills/` | Every agent: the descriptions decide when a skill loads |

Steering files that don't live here:

- **Each repo's `AGENTS.md`**: rules for that repo only. proj keeps its "Unattended agents", "Code Review Rules" and "Docs" sections current through its setup PR, since GitHub Actions runs and `codex review` read only the repo.
- **Machine-local Claude settings**: `install.sh` merges only the keys in `config/claude/settings.json`. Hooks, the status line and auto mode stay in each machine's `~/.claude/settings.json`, because the tools that add them (proj's activity hook, Orca, hark) write machine-specific paths. Nothing is merged in CI.

`retro` edits these files when a week's Factory notes show an agent was misled. Use `writing-for-agents` for any edit.

### Working across repos

Start agents in each repo's own T3 Code project, as usual. For a change that spans repos (a rename across projects, a shared config bump), start in the `skills` project: the shared AGENTS.md points agents at `~/.agents/repos.md`, and each repo still gets its own branch, worktree and PR. Repos are not cloned inside this one, so T3 Code keeps one checkout per repo.

## External apps

Agents reach external apps through [Executor](https://executor.sh), self-hosted at `https://executor.blasingame.dev` (tailnet only), not through a skill. Each machine connects Claude Code and Codex to its MCP endpoint with its own personal access token (Executor → Account → Tokens), so one machine's token can be revoked alone:

```sh
claude mcp add --transport http --scope user executor https://executor.blasingame.dev/org/executor/mcp --header "Authorization: Bearer <token>"
```

```toml
# ~/.codex/config.toml
[mcp_servers.executor]
url = "https://executor.blasingame.dev/org/executor/mcp"
http_headers = { "Authorization" = "Bearer <token>" }
```

Apps and accounts are added on proj's MCP page. `config/AGENTS.md` tells agents how to use it.

## Keeping machines in sync

Because the installed skills are symlinks into this repo, editing a skill on any machine edits the repo directly.

- **Change a skill:** edit it in `skills/`, then commit and push.
- **Add a skill:** drop its folder in `skills/`, run `./install.sh`, then commit and push.
- **Remove a skill:** delete its folder and run `./install.sh`, which prunes the dead links. Then commit and push.
- **Other machines:** `git pull && ./install.sh`. A cron entry handles this:

  ```cron
  0 * * * * cd ~/DEV/github/skills && git pull -q --ff-only && ./install.sh >/dev/null
  ```

## Updating third-party skills

Vendored skills don't update themselves. To refresh one, copy the new version over its folder from the upstream repo, check the diff, and commit.
