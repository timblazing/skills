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
| [composio-cli](skills/composio-cli) | Use the Composio CLI to work with external apps | [ComposioHQ/composio](https://github.com/ComposioHQ/composio) (MIT) |
| [frontend-design](skills/frontend-design) | Distinctive, intentional visual design | [anthropics/skills](https://github.com/anthropics/skills) (Apache-2.0, see LICENSE.txt) |
| [design-taste-frontend](skills/design-taste-frontend) | Research-led art direction and real-browser visual review | mine (installed globally) |
| [design-taste-frontend](skills/design-taste-frontend) | Research-driven art direction, page composition, and browser critique | tasteskill v2 (local install) |
| [open-pencil](skills/open-pencil) | Inspect, edit and export `.fig` files via OpenPencil | [open-pencil/open-pencil](https://github.com/open-pencil/open-pencil) (MIT) |
| [pick-ui-library](skills/pick-ui-library) | Curated library picks for frontend tasks (manual invoke only) | [emilkowalski/skills](https://github.com/emilkowalski/skills) (MIT) |
| [scan-to-threejs](skills/scan-to-threejs) | Rebuild editable Three.js rooms from scans and photo references | [wesbos/3d-model-anything](https://github.com/wesbos/3d-model-anything/tree/main/.agents/skills/scan-to-threejs) |
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
| [pr-workflow](skills/workflow/pr-workflow) | (automatic) | Branch + PR in product repos, tiers, bug-fix procedure, CI template, Greptile rules | mine |
| [cross-review](skills/workflow/cross-review) | "cross review", "sol loop", "council" | Other flagship (Opus ↔ Sol) reviews the change in a short loop | replaces tstack `sol-loop` + `council` |
| [full-send](skills/workflow/full-send) | "full send" | Prove, review, file, babysit, merge (personal repos) | tstack, edited |
| [full-stop](skills/workflow/full-stop) | "full stop" | Same, but stops with the PR ready for you to merge | tstack, edited |
| [file-pr](skills/workflow/file-pr) | "file a PR" | Short PR that leads with the problem | tstack, edited |
| [babysit-pr](skills/workflow/babysit-pr) | "babysit" | Watch CI and review bots, fix real findings | tstack, edited |
| [leaving-pr-comments](skills/workflow/leaving-pr-comments) | (automatic) | Attribution format for agent-posted comments | tstack |
| [modernize](skills/workflow/modernize) | "modernize" | Rebase an old PR and decide if it should still exist | tstack |
| [takeover](skills/workflow/takeover) | "take over" | Finish someone else's PR, branch, or thread | tstack |

The `ui-*` skills run on `agent-browser`. `ui-qa`'s Helium mode (driving your real, logged-in browser) works on macOS only.

## Install

```sh
git clone https://github.com/timblazing/skills.git ~/DEV/github/skills
~/DEV/github/skills/install.sh
```

`install.sh` symlinks each skill in `skills/` (including categorized folders)
into `~/.agents/skills/<name>`, then links `~/.claude/skills/<name>` to that.
It also links the shared instructions in `config/`: `config/AGENTS.md` becomes
`~/.agents/AGENTS.md` (read by Claude Code as `~/.claude/CLAUDE.md` and by Codex
as `~/.codex/AGENTS.md`), and `config/claude/{rules,agents}` are linked into
`~/.claude/`. Edit those files in the repo, then commit and push.
You can re-run it any time. Anything already at one of those paths gets moved
to `~/.agents/backups/` rather than deleted.

To leave a skill off one machine (for example `open-pencil` on a headless server), list it in `~/.config/agent-skills/skip`:

```sh
mkdir -p ~/.config/agent-skills && echo open-pencil >> ~/.config/agent-skills/skip
./install.sh
```

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

Vendored skills don't update themselves. To refresh one, copy the new version over its folder from the upstream repo, check the diff, and commit. `composio-cli` can also be regenerated with `composio login`.
