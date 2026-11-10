---
name: build
description: "The factory loop for any task that changes code: understand, build, prove, review, ship. Load it at the start of every code change (fix, feature, refactor, issue to PR), not only when committing. It calls the child skills itself: clarify for fuzzy asks, plan for work bigger than one PR, diagnose for bugs, tdd for new logic, then verify, review and file the PR. Also covers branch policy, tiers (default / full-stop / full-send), Greptile, CI and cleanup."
---

# Build

The one entry point for changing code. Walk the phases in order. Each phase
names the child skill to call with the Skill tool; call it yourself, the user
never types these. A phase that doesn't apply is skipped silently.

## Phases

**1. Understand.** Read the issue and its comments (`github`), or the request.
Then decide which case you're in:

- *Clear and fits one PR*: go to Build.
- *Fuzzy*: a decision only the user can make is missing (behaviour, scope,
  UX, a trade-off). Call `clarify`. A missing *fact* is yours to look up.
- *Bigger than one PR*: call `plan`. It files sub-issues and decides whether
  the user must approve them first. Then build the first unblocked ticket, or
  stop if `plan` is waiting on the user.

Done when you can state the change in two sentences and name how you'll prove it.

**2. Build.**

- Something is broken, failing, throwing or slow: call `diagnose`. No fix
  before it has a red loop.
- New or changed logic with a test seam in reach: call `tdd`.
- Copy, config, styling, docs, wiring: just make the change.
- UI: check for a Devl component first (`devl`), then `frontend-design` for new screens.

**3. Prove.** The repo's `verify` skill when it has one, otherwise the
commands in its AGENTS.md. UI proof: `ui-check` (visual), `ui-qa` (flows).

**4. Review.** Call `cross-review` when the tier is full-stop/full-send, or
when you'd mark the PR `Risk: medium` or `high`. Hand it the issue so it can
check the diff against what was asked. Otherwise the built-in `/code-review`
on your own diff is enough.

**5. Ship.** `file-pr` (Agent/Risk header, Verification, Factory notes),
then `babysit-pr` until CI is green and the review bots have nothing open.
Hand the PR back with its link. Merging needs the user or "full send".

**6. Leave notes.** Anything that slowed you down goes under "Factory notes"
in the PR body: a missing doc, a flaky check, a skill that misled you, a
command that cost too much. `retro` reads them weekly.

In an unattended run (cloud agent, scheduled task, a thread started from an
issue) nobody can answer a question mid-run. When `clarify` or `plan` need
the user, they post on the issue and the run stops; the user's reply starts
the next run.

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

`gh` mechanics (issues, PRs, checks, reviews, CI, auth) live in the `github`
skill. Every PR body follows the `file-pr` contract (`Agent:` and `Risk:`
lines first).

## Tiers

This skill is standing authorization to branch, commit, push, and open a PR in
product repos. Don't end a task with "want me to open a PR?" — open it and
report the link. Only the merge needs the user (or "full send").

| User says | What you do | Merges? |
|---|---|---|
| nothing special | The phases above: cross-review only at medium/high risk, babysit to green, report the link. | No |
| "full stop" | `full-stop`: prove, cross-review (if gated in), file, babysit to ready. | No, the user merges |
| "full send" | `full-send`: the same, then merge. | Yes, in the user's personal repos |

"Babysit" alone runs `babysit-pr` on an existing PR. "Take over" runs
`takeover`; "modernize" runs `modernize`.

## Fixing bugs

The procedure is `diagnose`. Keep the fix to the case that happened, no
drive-by refactors. PR description: what was broken (user's words), cause,
fix, how proved.

## Proof for UI changes

Before/after images in the PR: `ui-evidence`. Mocked tests passing does not
prove the UI works.

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
- **Follow-ups:** the PR's `Closes #N` closes the task's issue on merge.
  Open leftover follow-ups as GitHub issues (`proj` skill) instead of TODOs.

End the report with one line on what was cleaned up and anything left on
purpose (and why).
