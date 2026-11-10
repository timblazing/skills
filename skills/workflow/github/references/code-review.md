# Reviewing a PR with gh

Review bots (Greptile, Codex review, Copilot) are not part of this; they run only when the user asks. For a second opinion from the other model, use `cross-review`.

Anything you post follows `leaving-pr-comments`. Don't post a review to GitHub unless the user asked you to; by default give the findings in chat.

## Local changes before pushing

```bash
git diff main...HEAD --stat
git log main..HEAD --oneline
git diff main...HEAD
git diff main...HEAD | grep -nE "console\.log|debugger|TODO|FIXME|<<<<<<<|>>>>>>>"
git diff main...HEAD | grep -inE "password|secret|api_key|private_key"
```

Use `origin/<default>` if your local default branch is stale.

## A PR on GitHub

```bash
gh pr view N --comments
gh pr diff N --name-only
gh pr checks N
gh pr checkout N          # then read files with full context and run the tests
git diff main...HEAD      # inside the checkout
```

Read the whole diff, then each changed file around the change. A diff alone hides problems visible in the surrounding code. Run the repo's tests and lint on the checkout when you can. Go back to your branch when done (`git switch -`).

## What to look for

- **Correctness**: does it do what the PR says? Empty, null, large and concurrent cases. Error paths.
- **Security**: secrets, missing auth or validation, injection, path traversal, data exposure.
- **Regressions**: behaviour that changed without the PR saying so; data loss; migrations.
- **Tests**: new paths covered, and the test would fail without the change.
- **Scope**: changes unrelated to the stated goal.

Skip style nits unless they hide a bug. A repo's own review rules (in `AGENTS.md`) win over this list.

## Findings format

Lead with the verdict, then findings by severity. Cite `file:line`, say what breaks and when, suggest a fix. Say so plainly when nothing needs changing.

```md
**Verdict: changes requested** (1 critical, 1 warning, 1 suggestion)

**Critical**
- `src/auth.ts:45` User input reaches the SQL string, so a crafted `next` value can read other rows. Use a parameterized query.

**Warning**
- `src/models/user.ts:23` Password stored unhashed. Hash with argon2 before saving.

**Suggestion**
- `src/utils.ts:8` Repeats `core/utils.ts:34`; reuse it.

**Good**
- Middleware split is clean; the happy path is tested.
```

| Level | Use for | Blocks merge |
|---|---|---|
| Critical | Security holes, data loss, crashes, broken core behaviour | Yes |
| Warning | Bugs off the main path, missing error handling, untested new code | Usually |
| Suggestion | Refactors, performance hints, docs | No |

Verdict: **approve** with no critical or warning items; **changes requested** with any; **comment** for observations only, drafts, or when unsure.

## Posting (only when asked)

Inline comment on one line:

```bash
SHA=$(gh pr view N --json headRefOid --jq .headRefOid)
gh api repos/OWNER/REPO/pulls/N/comments -f body="..." -f path="src/a.ts" -f commit_id="$SHA" -F line=45 -f side=RIGHT
```

`line` is the line in the new file; use `side=LEFT` for a deleted line.

Several inline comments as one review:

```bash
gh api repos/OWNER/REPO/pulls/N/reviews --input review.json
```

```json
{
  "commit_id": "<sha>",
  "event": "COMMENT",
  "body": "Summary...",
  "comments": [
    {"path": "src/a.ts", "line": 45, "body": "..."},
    {"path": "src/b.ts", "line": 23, "body": "..."}
  ]
}
```

`event` is `APPROVE`, `REQUEST_CHANGES` or `COMMENT`. Approving or requesting changes on someone else's PR is the user's call: confirm first.

Single-shot reviews and top-level comments:

```bash
gh pr review N --comment --body-file /tmp/review.md
gh pr comment N --body-file /tmp/comment.md
```

Verify GitHub returned the review or comment URL, and that the commit you reviewed is still the head.
