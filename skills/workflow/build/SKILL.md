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

- *Clear and fits one PR*: go to Build. One PR means under ~400 changed
  lines, not counting lockfiles, generated files and snapshots. Bigger work
  is several PRs, stacked or in sequence.
- *Fuzzy*: a decision only the user can make is missing (behaviour, scope,
  UX, a trade-off). Call `clarify`. A missing *fact* is yours to look up.
- *Bigger than one PR*: call `plan`. It files sub-issues and decides whether
  the user must approve them first. Then build the first unblocked ticket, or
  stop if `plan` is waiting on the user.

Done when you can state the change in two sentences and name its
**acceptance check**: a test or a `verify` step that fails now and passes
once the change is done. Take it from the issue's acceptance criteria; when
there are none, write one and put it in the PR body.

**2. Build.** A fresh worktree has no dependencies: run the repo's install
(`pnpm install --frozen-lockfile`, `bun install`, and the same in any nested
package with its own lockfile) before tests, typecheck, or reading docs under
`node_modules/`. On the Mac the shell is zsh with BSD tools: quote globs
(`--include='*.ts'`) and write `sed -i ''`.

- Something is broken, failing, throwing or slow: call `diagnose`. No fix
  before it has a red loop.
- New or changed logic with a test seam in reach: call `tdd`, and make the
  acceptance check its first red test.
- Copy, config, styling, docs, wiring: just make the change.
- UI: read [Frontend routing](references/frontend.md) for design direction, catalog patterns, existing primitives and the UI SDK boundary before choosing components.

**3. Prove.** The repo's `verify` skill when it has one, otherwise the
commands in its AGENTS.md. For UI proof selection and authorization, follow
[Frontend routing](references/frontend.md#proof).
If `next build` stops with a Next.js security-upgrade notice
(`SecurityFatalError`), the repo's Next version has a published advisory: a
retry passes, but the advisory is real. Check for an open upgrade issue or PR
and file one if there is none; keep the upgrade out of this PR.

**4. Review.** The PR's `Risk:` level sets the gate it must pass before it
merges:

| Risk | Gate |
|---|---|
| low | CI green, and one review bot has reviewed the latest head with no open P0/P1 finding. Your own `/code-review` before pushing. |
| medium | The low gate, plus `cross-review`. |
| high | The medium gate, plus the owner reads the PR's Intent block (`file-pr`) before it merges. |

Full-stop/full-send also call `cross-review` on a low-risk PR (it may skip
a tiny one). Hand `cross-review` the issue so it can check the diff against
what was asked.
If your brief forbids subagents, you can't run `cross-review`: write
"Cross-review: not run (brief forbade subagents)" in the PR and in your
hand-back, and the parent that delegated to you runs it before the PR merges.

**5. Ship.** Before every push, `git fetch origin` and rebase on the default
branch: main moves under parallel agents. Then re-check the numbers of any
ADRs you added against `docs/decisions/` on main (parallel branches take the
same next number). Then read the branch name with `git branch --show-current`
and push with `git push -u origin HEAD:<that name>`, because T3 can rename the
worktree's branch mid-task and the branch may be checked out in another
worktree. Run git as one plain command per shell call: worktree-isolated
agents refuse git inside `&&` chains or `$(...)`. Before pushing a follow-up to an existing
PR, check it's still open (`gh pr view --json state`); if it merged, open a
new PR from the default branch.
`file-pr` (Agent/Risk header, Verification, Factory notes),
then `babysit-pr` until CI is green and the review bots have nothing open.
Hand the PR back with its link. Merging needs the user or "full send", unless
the project's auto-merge in proj will merge it (`babysit-pr`, "When proj merges it").

**6. Leave notes.** Anything that slowed you down goes under "Factory notes"
in the PR body: a missing doc, a flaky check, a skill that misled you, a
command that cost too much. `retro` reads them weekly.

In an unattended run (cloud agent, scheduled task, a thread started from an
issue) nobody can answer a question mid-run. When `clarify` or `plan` need
the user, they post on the issue and the run stops; the user's reply starts
the next run.

## Work in progress

Keep at most ~3 agent threads running per project at once, counting
delegated children and T3 threads. A fourth waits until one hands back its
PR. Parallel branches collide on ADR numbers, migrations and shared files,
and each open PR is one more thing the owner reviews. This is a soft cap:
go over it when the owner asks.

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

Use the [frontend proof guidance](references/frontend.md#proof); before/after
images for a PR use `ui-evidence`.

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
