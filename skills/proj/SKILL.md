---
name: proj
description: Read my proj dev hub (projects, synced docs, and a mirror of GitHub issues and PRs) through the read-only proj MCP tools, and turn follow-ups into GitHub issues. Use when starting work in a repo that is a proj project; when asked "what's on my backlog", "what's next", "what needs attention", or to read a project's docs; when asked to "add to the backlog", "save this as an idea", "note this for later" or "file a follow-up"; and for follow-ups you'd otherwise leave as TODO comments.
---

# proj

proj (https://proj.blasingame.dev) is my personal dev hub: projects (each linked to one GitHub repo under `timblazing`), each repo's `docs/` folder synced from GitHub, and a read-only mirror of GitHub issues and PRs. Agents reach it through the MCP server named `proj` (`https://proj.blasingame.dev/api/mcp`).

**GitHub issues are the only backlog.** proj has no drafts, ideas, notes or board of its own, and its MCP server is read-only. Anything that should be remembered becomes a GitHub issue on the project's repo.

**It's tailnet only.** In cloud sandboxes, CI or anywhere the `proj` tools aren't loaded, skip the MCP parts silently: don't mention it, don't try curl, don't ask me to set it up. Filing follow-ups as issues with `gh` still applies.

## Tools

| Tool | Use |
| --- | --- |
| `projects_list` | Map a repo to its project (`repo: "<repo name>"`); also its `autoMerge` mode (off, low, always) |
| `issues_list` | Open (and closed) GitHub issues for a project |
| `pulls_list` | Open PRs for a project |
| `pull_merge_outlook` | Whether proj will auto-merge a PR, or why the user merges it. Call it at PR handover (`babysit-pr`) |
| `docs_list`, `doc_get` | The repo's synced `docs/` and README |

Anywhere a tool takes a project, the repo name works too.

## At the start of a task in a repo

1. `projects_list` with `repo` set to the repo's name (from `git remote get-url origin`, or the folder name). No project: stop here for proj.
2. If the task might match an existing issue, check `issues_list` (or `gh issue list`). Keep its number so the PR can say `Closes #N`.
3. Read `docs_list` / `doc_get` when the task touches something the docs describe.

## Working the backlog

This skill is the entry point for backlog work; call the children yourself:

- An issue labelled `triage` (or unlabelled), or "what needs attention": `triage`.
- An idea too big for one PR: `plan`. It files sub-issues and decides whether they need my approval.
- "Work issue #N" or any code change: `build`.

## Follow-ups become issues

Anything you'd write as a `TODO`/`FIXME` comment, or a "worth doing later" note in the reply, becomes a GitHub issue on the repo you're working in:

```bash
gh issue create --title "<short imperative title>" --body-file <file> [--label triage]
```

- Body: what and why, file paths and context, and a "Done when" line.
- Half-formed ideas get the `triage` label (create it once with `gh label create triage` if the repo lacks it).
- "Note this for project X" or "save this as an idea" → an issue on X's repo, `triage` label.
- Check for duplicates first (`gh issue list --search "<words>"`).
- Mention in one line which issues you opened.
- Never put a bot @-mention (`@claude`, `@codex`, `@greptileai`) in an issue. Bots react even inside backticks; describe them without the @.

Use the `github` skill for gh mechanics and `github-issue-images` for screenshots in issues.

## PRs

- PR for an issue: put `Closes #N` in the description so merging closes it. Nothing to update in proj; it mirrors GitHub.
- Leftover work after a merge: open new issues for it, not TODOs.

## Rules

- The proj MCP server is read-only. Never look for or call draft, idea, note, `board_*` or `notifications_list` tools; they no longer exist.
- Never tag `@claude` or `@codex` anywhere: issues, comments, PRs or commits.
- Keep tool calls few: one lookup at task start, then only what the task needs.
