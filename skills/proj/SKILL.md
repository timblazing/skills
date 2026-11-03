---
name: proj
description: Keep my proj dev hub (board, ideas, notes) in step with the work, through the proj MCP tools. Use when asked to "add to the board", "put this on the backlog", "save as an idea", "what's on my board/backlog", "note this for project X", or "write this up as a doc"; when starting work in a repo that is a proj project; and when opening or merging a PR for a task that has a board card. Also use for follow-ups you'd otherwise leave as TODO comments.
---

# proj

proj (https://proj.blasingame.dev) is my personal dev hub: projects (each linked to one GitHub repo under `timblazing`), a personal kanban board, an Ideas inbox, notes and docs, and a read-only mirror of GitHub issues, PRs and notifications. Agents reach it through the MCP server named `proj` (`https://proj.blasingame.dev/api/mcp`).

**It's tailnet only.** In cloud sandboxes, CI or anywhere the `proj` tools aren't loaded, skip everything here silently: don't mention it, don't try curl, don't ask me to set it up.

## Tools

| Tool | Use |
| --- | --- |
| `projects_list` | Map a repo to its project (`repo: "<repo name>"`); card counts per column |
| `board_list` | Cards for a project (`"all"` for every project), optional `column` |
| `board_add` | New card, default Backlog |
| `board_move` | Change column: `backlog`, `doing` (In progress), `review`, `done` |
| `board_update` | Title, description, checklist, tags, priority |
| `idea_add` | Loose idea into the Notes Ideas inbox |
| `notes_search`, `note_get`, `note_add` | Find, read and write notes (`note`) and docs (`doc`) |
| `issues_list`, `pulls_list`, `notifications_list` | Read the GitHub mirror and the bell |

Anywhere a tool takes a project, the repo name works too.

## At the start of a task in a repo

1. `projects_list` with `repo` set to the repo's name (from `git remote get-url origin`, or the folder name). No project: stop here for proj.
2. `board_list` for that project, `column: "doing"` (and `backlog` if the task sounds like an existing card). If a card matches the task, keep its id for the rest of the session. If the task matches a Backlog card, move it to `doing`.
3. Don't create a card just because work started. Add one only when I ask, or when the task is clearly bigger than this session.

## While working

- **Follow-ups go on the board, not in the code.** Anything you'd write as a `TODO`/`FIXME` comment, or a "worth doing later" note in the reply, becomes a Backlog card (`board_add`, a short imperative title, a description with file paths and context, a tag like `bug` or `feature`). Mention in one line which cards you added.
- **Ideas** that aren't committed work go to `idea_add`, not the board.
- **"Note this for project X"** → `note_add` with that project (`kind: "doc"` for longer reference material). Search first with `notes_search` if it might extend an existing note.

## PRs

- PR opened for a task with a card → `board_move` the card to `review`.
- PR merged → `board_move` it to `done`. If you only opened the PR, leave it in Review; I merge.
- Check boxes on the card's checklist with `board_update` when the PR covers them (pass the whole checklist back).

## Rules

- The board is personal and never synced to GitHub. Don't create GitHub issues from cards; the "Make issue" button in the UI does that.
- Never tag `@claude` or `@codex` anywhere, in cards, notes, comments or PRs.
- Don't delete or archive cards; the UI does that.
- Keep tool calls few: one lookup at task start, then writes only when something changes.
