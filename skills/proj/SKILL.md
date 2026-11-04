---
name: proj
description: Keep my proj dev hub (drafts, ideas, notes) in step with the work, through the proj MCP tools. Use when asked to "add a draft", "add to the board", "put this on the backlog", "save as an idea", "what's on my drafts/backlog", "note this for project X", or "write this up as a doc"; when starting work in a repo that is a proj project; and when opening or merging a PR for a task captured as a draft. Also use for follow-ups you'd otherwise leave as TODO comments.
---

# proj

proj (https://proj.blasingame.dev) is my personal dev hub: projects (each linked to one GitHub repo under `timblazing`), local drafts on each project's Drafts tab, an Ideas inbox, notes and docs, and a read-only mirror of GitHub issues, PRs and notifications. Agents reach it through the MCP server named `proj` (`https://proj.blasingame.dev/api/mcp`).

**It's tailnet only.** In cloud sandboxes, CI or anywhere the `proj` tools aren't loaded, skip everything here silently: don't mention it, don't try curl, don't ask me to set it up.

## Tools

| Tool | Use |
| --- | --- |
| `projects_list` | Map a repo to its project (`repo: "<repo name>"`) |
| `drafts_list` | Local drafts for a project (`"all"` for every project, `"none"` for unassigned drafts); excludes archived and converted drafts |
| `draft_add` | Capture a new local draft; never creates a GitHub issue |
| `draft_update` | Edit title, description, checklist, tags or priority; tags and checklist replace their existing lists |
| `draft_archive` | Archive a completed or dismissed local draft |
| `idea_add` | Loose idea into the Notes Ideas inbox |
| `notes_search`, `note_get`, `note_add` | Find, read and write notes (`note`) and docs (`doc`) |
| `issues_list`, `pulls_list`, `notifications_list` | Read the GitHub mirror and the bell |

Anywhere a tool takes a project, the repo name works too. Legacy `board_add`, `board_list` and `board_update` remain compatibility aliases for one release; prefer the draft names. Drafts have no workflow columns, so do not use `board_move` to track work or PR status.

## At the start of a task in a repo

1. `projects_list` with `repo` set to the repo's name (from `git remote get-url origin`, or the folder name). No project: stop here for proj.
2. `drafts_list` for that project. If a draft matches the task, keep its id for the rest of the session. Leave it as a draft while work proceeds.
3. Don't create a draft just because work started. Add one only when I ask, or when the task is clearly bigger than this session.

## While working

- **Follow-ups become drafts.** Anything you'd write as a `TODO`/`FIXME` comment, or a "worth doing later" note in the reply, becomes a local draft (`draft_add`, a short imperative title, a description with file paths and context, a tag like `bug` or `feature`). Mention in one line which drafts you added.
- **Ideas** that aren't committed work go to `idea_add`.
- **"Note this for project X"** → `note_add` with that project (`kind: "doc"` for longer reference material). Search first with `notes_search` if it might extend an existing note.

## PRs

- PR opened for a task captured as a draft: add the PR link to its description with `draft_update`, preserving the existing context. Leave the draft active for review; the user merges.
- PR merged and the captured task is complete: update the draft's checklist, then archive it with `draft_archive`. Never archive merely because a PR was opened.
- Pass the whole checklist to `draft_update` when checking items, preserving existing item ids and unchecked work.

## Rules

- Drafts are personal and local. Do not create GitHub issues from them; the user presses **Convert to issue** in the UI to create and link an issue once. Converted drafts disappear from Drafts and appear only as GitHub issues on the Issues tab.
- Never tag `@claude` or `@codex` anywhere, in drafts, notes, comments or PRs.
- Don't delete drafts. Archive only when the task is complete or the user asks to dismiss it.
- Keep tool calls few: one lookup at task start, then writes only when something changes.
