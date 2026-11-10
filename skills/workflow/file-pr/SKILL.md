---
name: file-pr
description: File a concise pull request. Use when the user asks to file, open, or create a PR.
---

# File PR

Never file from the default branch. If you are on any other branch (such as
a T3 worktree's `t3/...` branch), file from it as is. Only on the default
branch, create `<type>/<short-slug>` first.

Before filing, check whether a PR for this branch already exists. Review the
diff locally against the base branch (usually `origin/main`) to make sure its
contents match the goal.

PR titles usually become commit messages, so follow the repository's title
conventions. Look at recently merged PRs and Git history for examples. Prefer a
concise, human-readable title that explains why the change matters:

BAD

> ❌ perf(server): negotiate permessage-deflate on the websocket

GOOD

> ✅ perf(server): cut websocket frame size by 70%+ with gzipping

## PR body contract

Every agent PR body uses this format. proj parses the first two lines (for
"Ready for you" and per-project auto-merge), so write them exactly as shown:
plain text, no bold, no backticks, one per line, at the very top.

```markdown
Agent: <harness> | <orchestrator> | <model>
Risk: <low|medium|high>

<what changed>

## Verification

<commands run and their results>

## Before/after

<screenshots, UI changes only>

## Preview

<per-PR preview URL, Cloudflare or Vercel projects only>

## Factory notes

<optional: what slowed you down (missing docs, flaky checks, a misleading skill), for the weekly skills retro>
```

**Line 1, `Agent:`**, three fields separated by ` | `:

- harness: `Claude Code` or `Codex`;
- orchestrator: `T3 Code`, `GitHub Actions` or `Codex Cloud` (`Terminal`
  when run straight from a shell with none of these);
- model: the public model name the harness reports, for example
  `Claude Opus 5.5` or `GPT-6.1 Sol`. Add subagent models that wrote part of
  the change after a comma (`Claude Opus 5.5, Claude Sonnet 5.5`). If the
  model is unknown, write `unknown`; never guess.

**Line 2, `Risk:`**, exactly one of `low`, `medium`, `high`:

- `low`: touches no protected path and is easy to revert;
- `medium`: touches no protected path but is not trivially revertible
  (data shape, behavior users rely on, wide refactor);
- `high`: touches a protected path, or could lose data or break production.

Protected paths: CI and deploy workflows (`.github/workflows/`, deploy
scripts and compose/infra files), auth and permissions code, database
migrations, and anything that holds or reads secrets (`.env*`, secret
config, credential handling). When unsure, pick the higher level.

Parsers match `^Agent: (.+?) \| (.+?) \| (.+)$` and
`^Risk: (low|medium|high)$` on the first two lines. Don't reword them.

The header replaces any default harness footer (such as "Generated with
Claude Code"); do not add both.

**What changed**: open with a simple explanation of the problem based on
the user's original prompt, then briefly explain the solution. Put
`Closes #N` here when the PR finishes an issue. Do not lead with an
implementation inventory:

BAD

> ❌ Removed implicit workspace carry-over from every "new thread" entry point (cmd+n / cmd+shift+o, sidebar v1/v2 buttons, command palette). New threads inherit only the project from context; branch, worktree, and env mode always come from the configured defaults. Deleted buildContextualThreadOptions, startNewThreadInProjectFromContext, and the v1 sidebar's seed-context machinery.

GOOD

> ✅ My "new worktree" default was ignored when starting new threads on existing worktrees. Super unintuitive. Now your preferences always apply.

**Verification**: the commands you ran and what they printed (pass/fail,
counts), plus what still needs checking by hand.

**Before/after** and **Preview**: include only when they apply; drop the
heading otherwise. Screenshots go in with `ui-evidence`.

No bot @-mentions anywhere in the title or body (see the `github` skill).

Before submission, check the title, description, quotes, and attachments for
secrets and private details.

Open a real PR rather than a draft so review bots run. If `gh pr create` fails
because the GraphQL rate limit is used up, open it through REST with
`gh api repos/<owner>/<repo>/pulls -f title=... -f head=... -f base=... -F body=@<file>`
(gh mechanics: the `github` skill). Then hand it over only once CI and any
review bots agree: run `babysit-pr` to that point when the user asked to
babysit, or under `full-stop` / `full-send`.

Do not post a follow-up PR comment unless it serves the user's request. When a
comment is needed, use the `leaving-pr-comments` skill.
