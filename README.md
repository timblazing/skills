# Agent Skills

The agent skills I actually use, kept in one place so every machine I work on (Mac, servers) has the same set. They work with Claude Code and Codex, and with any agent that reads `~/.agents/skills`.

## Skills

| Skill | What it does | Source |
| --- | --- | --- |
| [agent-browser](skills/agent-browser) | Browser automation CLI for agents | [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) (Apache-2.0) |
| [composio-cli](skills/composio-cli) | Use the Composio CLI to work with external apps | [ComposioHQ/composio](https://github.com/ComposioHQ/composio) (MIT) |
| [frontend-design](skills/frontend-design) | Distinctive, intentional visual design | [anthropics/skills](https://github.com/anthropics/skills) (Apache-2.0, see LICENSE.txt) |
| [open-pencil](skills/open-pencil) | Inspect, edit and export `.fig` files via OpenPencil | [open-pencil/open-pencil](https://github.com/open-pencil/open-pencil) (MIT) |
| [pick-ui-library](skills/pick-ui-library) | Curated library picks for frontend tasks (manual invoke only) | [emilkowalski/skills](https://github.com/emilkowalski/skills) (MIT) |
| [ui-check](skills/ui-check) | Headless screenshots to visually check UI | mine |
| [ui-qa](skills/ui-qa) | Functional browser testing: flows, forms, console errors | mine |
| [ui-evidence](skills/ui-evidence) | Before/after screenshots committed to a PR | mine |
| [vercel-react-best-practices](skills/vercel-react-best-practices) | React/Next.js performance rules | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (MIT) |

The `ui-*` skills run on `agent-browser`. `ui-qa`'s Helium mode (driving your real, logged-in browser) works on macOS only.

## Install

```sh
git clone https://github.com/timblazing/skills.git ~/DEV/github/skills
~/DEV/github/skills/install.sh
```

`install.sh` symlinks each skill into `~/.agents/skills/<name>`, then links `~/.claude/skills/<name>` to that. You can re-run it any time. Anything already at one of those paths gets moved to `~/.agents/backups/` rather than deleted.

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
