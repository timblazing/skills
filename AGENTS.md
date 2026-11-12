# Agent instructions

Shared instructions live in [config/AGENTS.md](config/AGENTS.md) and are installed by `install.sh`. For work spanning projects or services, read the [system map](docs/architecture.md).

The Unattended agents section below is refreshed from proj's `lib/server/setup-templates.ts`. This repo is outside proj's project registry, so refresh it explicitly when that template changes. Its branch rule applies to unattended runs; interactive sessions follow the shared non-product repo policy.

## Unattended agents

For Claude (GitHub Actions, `@claude`) running unattended on this repo, on anton's single-use runners.

- Skills come from [timblazing/skills](https://github.com/timblazing/skills). The Claude workflow installs them before each run. Use `build` to land changes (it calls the other workflow skills) and `leaving-pr-comments` for anything you post on GitHub.
- Never push to `main`. Work on a branch and open a pull request.
- Verify with this repo's build and test commands (see the README) before you push.
- Do not update local session logs or work logs (for example `docs/WORKLOG.md`); put remaining work in the PR description.
- End every issue comment you post with a status marker on its own last line, as an HTML comment (GitHub doesn't show it): `<!-- proj-agent: needs-input -->` when you are waiting on an answer from the owner, `<!-- proj-agent: working -->` for an acknowledgement or progress note, `<!-- proj-agent: done -->` once the work is finished. proj reads it to show the issue's status.
- The shared instructions installed with the skills are written for a local Mac. In an unattended run, skip the local-only rules: browser work through `agent-browser` (and the `ui-check`, `ui-qa`, `ui-evidence` skills), iOS simulators and Android emulators, the Docker/VM rules and T3 Code tools. Say in the PR what still needs checking by hand.

## Code Review Rules

For `@codex review` and any other code review of this repo.

- Focus on correctness, security and regressions: bugs, unhandled edge cases, data loss, leaked secrets, missing auth or validation, and behavior that changed without the PR saying so.
- Skip style nits, formatting and naming preferences unless they hide a bug.
- Point at the exact line, say what breaks and when, and suggest a fix. Say so when nothing needs changing.

## Docs

Project documentation is markdown in `docs/`, and proj's Docs tab shows it. Keep it in this layout:

```
docs/
  README.md          index: what the project is, and links to everything below
  architecture.md    how it fits together (an architecture/ folder when it gets large)
  decisions/         ADRs, one per decision: NNNN-short-title.md
  guides/            how-tos: setup, deploy, release
  runbooks/          ops: what to do when X breaks
  reference/         APIs, config, data model
```

- When you change behavior, config, an API or the deploy process, update the doc that describes it in the same PR. Don't leave docs describing the old behavior.
- Record a significant decision as a new ADR in `docs/decisions/` (next number, short title, with Context, Decision and Consequences headings).
- Start every doc with a single `# Title` heading, and use relative links between docs. Keep `docs/README.md` linking to everything else.
- If the existing docs are somewhere else or laid out differently, don't reshuffle them as a side effect of other work; move them in a PR of their own.
