# PR mechanics with gh

Which repos get PRs, never pushing to the default branch, the tiers, merge policy and cleanup are in the `pr-workflow` skill. The PR title and body are `file-pr`. This file is only the commands.

## Branch and commit

```bash
git status && git branch --show-current     # use the branch you are on unless it's the default
git fetch origin
git switch -c fix/short-slug origin/main    # only when you're on the default branch
git add <specific files>                    # not `git add .`
git commit -m "Fix login redirect to keep ?next="
```

Commit messages follow the repo's history (`git log --oneline -15`). Don't impose Conventional Commits unless the history uses them.

## Push and open

```bash
git push -u origin HEAD
gh pr list --head "$(git branch --show-current)"     # already open?
gh pr create --title "..." --body-file /tmp/pr.md --base main
```

Open a real PR, not a draft, so review bots can run. Other options: `--reviewer`, `--label`. Don't put bot @-mentions in the body.

GraphQL used up? Create through REST:

```bash
gh api repos/OWNER/REPO/pulls -f title="..." -f head=BRANCH -f base=main -F body=@/tmp/pr.md
```

## Check state

```bash
gh pr view N --json state,mergeStateStatus,reviewDecision,headRefOid,statusCheckRollup
gh pr checks N
gh pr checks N --required
gh pr diff N
```

For waiting on CI and review bots, use `babysit-pr`; don't write a polling loop. `gh pr checks --watch` is fine for a short one-off wait by hand when no watcher is running on that PR.

REST equivalents when GraphQL is out: `gh api repos/OWNER/REPO/pulls/N` and `gh api repos/OWNER/REPO/commits/SHA/check-runs`.

## CI failed

See `ci.md`. Fix, commit, push, and check again. After three failed attempts at the same failure, stop and tell the user what you've tried.

## Update the branch

```bash
git fetch origin && git rebase origin/main
git push --force-with-lease
```

Force-push only your own PR branch, and only with `--force-with-lease`.

## Merge (only when the tier or the user says so)

```bash
gh pr view N --json state,mergeStateStatus,mergedAt    # not BEHIND or DIRTY
gh pr merge N --squash --delete-branch
gh pr view N --json state,mergedAt                      # confirm it merged
```

Squash unless the repo's history shows otherwise. Don't use `--auto` or `--admin`. Fall back to merge commit or rebase only if the repo's history uses them.

## Handy

| Action | Command |
|---|---|
| My open PRs | `gh pr list --author @me` |
| Check out a PR | `gh pr checkout N` |
| Edit title or base | `gh pr edit N --title "..." --base main` |
| Close | `gh pr close N` (confirm first if it isn't yours) |
| Request a human reviewer | `gh pr edit N --add-reviewer login` |

Copilot review requests are a review bot: only when the user asks.
