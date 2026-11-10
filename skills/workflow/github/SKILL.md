---
name: github
description: "Work GitHub with the gh CLI: read and triage issues, carry an issue to a verified PR, branch/commit/PR/CI/merge mechanics, review a PR with inline comments and a verdict, debug failing CI, and fix gh auth. Use when the user mentions a GitHub issue or PR number or URL, says 'fix issue #N', 'triage', 'review this PR', 'why is CI failing', or when gh/git push auth breaks. Policy (tiers, never push to main) lives in build; this skill is the gh mechanics."
---

# GitHub

Adapted from the `github` skill in [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) (MIT, see `LICENSE-hermes`; upstream commit `95fc3e6`).

This file only routes. Read the matching reference before starting that job.

| Task | Read first |
|---|---|
| `gh` or push auth fails, new machine, Actions or Codex Cloud token | `references/auth.md` |
| Read, search, create, label, assign, close issues | `references/issues.md` |
| Take an issue to a verified PR | `references/issue-to-pr.md` |
| Branch, commit, open PR, watch CI, merge (mechanics) | `references/pr-workflow.md` |
| Review a PR: diff, inline comments, verdict | `references/code-review.md` |
| A check failed and you need the cause | `references/ci.md` |
| An endpoint `gh` has no command for | `references/api-cheatsheet.md` |

## Rules

- **Policy comes from `build`**: tiers (default, full-stop, full-send) and never pushing to the default branch in product repos. Skills, dotfiles and notes repos push to the default branch directly. The PR body format is `file-pr`.
- **No bot @-mentions** (`@claude`, `@codex`, `@greptileai`, `@copilot`) in anything you write to GitHub: PR bodies, commits, issue bodies, comments. Bots react even inside backticks. Say "the Codex bot" or "Greptile" without the `@`. Only write one when the user explicitly asked you to trigger that bot.
- **Review bots** (Greptile, Codex review, Copilot) run only when the user asks.
- **Comments posted for the user** follow `leaving-pr-comments`.
- **Issue comments end with a status marker** on their own last line, as an HTML comment: `<!-- proj-agent: needs-input -->` (waiting on the owner), `<!-- proj-agent: working -->` (acknowledgement or progress), `<!-- proj-agent: done -->` (finished).
- **Images** in issues or comments: `github-issue-images`. `gh` can't upload attachments.
- **Confirm before writes the user didn't ask for**: closing someone else's issue, deleting a branch, comment or release, editing labels in bulk, changing repo settings. Never `--admin` past branch protection.
- **Commit messages** follow the repo's history, not a fixed convention.
- **GraphQL rate limit**: `gh pr view/create/checks` and `gh issue` use GraphQL. When it's spent, use `gh api` REST (`references/api-cheatsheet.md`); the REST limit is separate. Check with `gh api rate_limit`.
- **Never claim remote state from memory.** CI green, merged, issue closed: read it with `gh` first.
- **Read the thread first**: `gh issue view N --comments`, `gh pr view N --comments`. Decisions live in comments, not titles. Search for duplicates before creating anything.
