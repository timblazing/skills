---
name: pr-workflow
description: "How to land changes in product repos (websites, apps, software): branch and PR instead of pushing to main, which tier to use (default / full-stop / full-send), how to fix bugs, when to spend Greptile credits, and how to add free CI. Use at the start of any task that changes code in a product repo (not only when committing), when fixing a bug, or when asked to set up CI or review bots. Opening the PR is part of finishing the task: do it without asking."
---

# PR workflow

## Which repos

- **Product repos** (websites, apps, software, anything deployed or shipped):
  everything below applies.
- **Everything else** (skills, dotfiles, notes, config, scratch): commit and
  push to the default branch directly. No PR.
- A repo's own `AGENTS.md` / `CLAUDE.md` overrides this. If unsure which kind
  a repo is, ask once and offer to record the answer in that file.

## Never push to main

In product repos, never commit or push to the default branch, even for one-line
fixes. The only exception is a direct instruction in the current request
("push this straight to main"); it does not carry over to later tasks.

Branches: work in T3 Code usually starts in a worktree that is already on its
own branch (e.g. `t3/add-search`). **Use the branch you are on** unless it is
the default branch; never create or rename a branch on top of it. Only on the
default branch, create `<type>/<short-slug>` (e.g. `fix/cart-total-rounding`).
A T3 worktree is not a dirty checkout to work around: commit, push, and open
the PR from it. Commit messages follow the repo's history.

## Tiers

This skill is standing authorization to branch, commit, push, and open a PR in
product repos. Don't end a task with "want me to open a PR?" — open it and
report the link. Only the merge needs the user (or "full send").

| User says | What you do | Merges? |
|---|---|---|
| nothing special | Branch, change, prove, open the PR with `file-pr`, report the link. No cross-review, no babysitting. | No |
| "full stop" | `full-stop`: prove, cross-review (if gated in), file, babysit to ready. | No, the user merges |
| "full send" | `full-send`: the same, then merge. | Yes, in the user's personal repos |

"Babysit" alone runs `babysit-pr` on an existing PR. "Take over" runs
`takeover`; "modernize" runs `modernize`.

## Fixing bugs

1. **Reproduce first.** A failing test, a command, or a `ui-qa` session.
   No reproduction: say so and ask before guessing.
2. **Find the cause**, not just the line that throws.
3. **Smallest fix** for the case that happened. No drive-by refactors.
4. **Watch the same reproduction pass.** Add one focused regression test if
   the repo has tests and the bug had none.
5. **Run the repo's checks** (typecheck, lint, test, build, whatever exists).
6. PR description: what was broken (user's words), cause, fix, how proved.

## Proof for UI changes

- Visual: `ui-check` (desktop and phone).
- Behavior or flows: `ui-qa`.
- Before/after in the PR: `ui-evidence`.

Mocked tests passing does not prove the UI works.

## Reviews

- Quick single-model pass on your own diff: the built-in `/code-review`.
- Second opinion from the other provider: `cross-review`.
- Greptile (free plan, ~50 reviews/month): **only for big or risky PRs**
  (roughly 300+ changed lines, or auth/payments/data/security). Keep
  `greptile.json` set to `{"autoReview": []}` so it never runs by itself, and
  trigger it by commenting `@greptileai` on the PR. Ask before spending a
  credit unless the user is running full-send/full-stop on such a PR.
- Comments posted on the user's behalf use `leaving-pr-comments`.

## CI

CI ("continuous integration") means GitHub runs the repo's checks on every PR
automatically, so a PR shows a green tick or a red X.

- Every product repo should have `.github/workflows/ci.yml`. Copy
  [templates/ci.yml](templates/ci.yml); it skips any check the repo has no
  `package.json` script for. Non-JS repos: same shape, their own commands.
  Free on public repos; a run takes a minute or two of the 2,000 free
  minutes/month on private ones.
- Repos deployed with Cloudflare Workers Builds also get a preview deploy per
  branch. Use that URL for `ui-check` / `ui-qa`.
- **No CI yet:** run the same commands locally and paste the results in the
  PR as the proof. `pr-wait --until green` never finishes on a repo with no
  checks, so don't babysit-wait there; offer to add CI in a separate PR.

## Merging

- Squash merge unless the repo's history shows otherwise.
- Delete the remote branch after merge (`gh pr merge --squash --delete-branch`).
  Repos have "Automatically delete head branches" on; turn it on for any new
  repo (`gh api -X PATCH repos/OWNER/REPO -F delete_branch_on_merge=true`).
- Stacked PRs: after a base squash-merges, rebase the next PR onto the default
  branch (`git rebase --onto origin/main <old base head>`), retarget it with
  `gh pr edit N --base main`, and wait for its checks before merging it.
- Never `--admin` or bypass branch protection.

## Cleaning up

Leave nothing behind once work is merged or abandoned. Do this before the
final report, in the same turn:

- **Branches:** delete the remote branch of every merged PR (including PRs
  from delegated agents) and the matching local branches
  (`git fetch --prune`, then `git branch -D`). Never delete a branch that has
  an open PR or commits that never landed.
- **Worktrees:** `git worktree remove` every worktree you or your subagents
  created (delegated `isolation: "worktree"` children, scratch checkouts for
  rebases or QA), then `git worktree prune`. T3 does not remove them on merge.
  Check `git status` first; never remove one with uncommitted work.
- **Your own T3 worktree** can't be removed while the thread uses it: detach it
  (`git checkout --detach origin/main`) and delete its branch, so archiving the
  thread leaves nothing behind. Fast-forward the main checkout's default
  branch (`git -C <main checkout> pull --ff-only`).
- **Processes and sessions:** stop dev/prod servers and background watchers
  you started, and close `agent-browser` sessions.
- **Temp files:** delete scratch copies (database snapshots, `.env.bak`
  backups you made, build output in scratch dirs). Never delete the user's
  own files or backups you didn't create.
- **Board:** move the task's proj card to Done (`proj` skill) and add any
  leftover follow-ups as Backlog cards instead of TODOs.

End the report with one line on what was cleaned up and anything left on
purpose (and why).
