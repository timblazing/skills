# Issues

`gh` run inside a clone targets that repo; add `--repo owner/name` anywhere else.

## Read

```bash
gh issue list                                   # open
gh issue list --state all --search "login error"
gh issue list --label bug --assignee @me
gh issue view 42 --comments                     # always with comments
gh issue view 42 --json title,body,labels,state,comments
```

Search for duplicates (open and closed) before creating one.

## Create

Write for someone with no context: what is wrong or wanted, how to see it, what done looks like. Short and plain.

```bash
gh issue create --title "Login ignores ?next=" --body-file /tmp/issue.md --label bug
```

Use `--body-file` for anything multi-line. Bug body: what happens, steps to reproduce, expected, actual, environment or error output. Feature body: the problem it solves, the proposed behaviour, alternatives if any. Skip sections with nothing to say.

- Don't @-mention bots or people in the body (see the rules in `SKILL.md`).
- Screenshots: `github-issue-images`, uploaded before you create the issue.
- In a repo whose issues feed proj, the issue is the only backlog: don't keep local TODO lists instead.

## Manage

```bash
gh issue edit 42 --add-label "bug" --remove-label "needs-triage"
gh issue edit 42 --add-assignee @me
gh issue comment 42 --body-file /tmp/comment.md
gh issue close 42 --reason completed        # or "not planned"
gh issue reopen 42
gh issue develop 42 --checkout              # branch linked to the issue
```

Comments you post on an issue end with the proj status marker, last line, own line:

```md
Root cause is in the auth middleware; fix is up in the PR.

<!-- proj-agent: working -->
```

Use `needs-input` when you are waiting for an answer and `done` when the work is finished. Follow `leaving-pr-comments` for attribution.

A PR closes an issue when its body has `Closes #42` (also `Fixes`, `Resolves`).

## Triage

1. `gh issue list --label needs-triage` (or the repo's equivalent).
2. Read each one with comments; check it still reproduces on the default branch.
3. Propose labels, duplicates and priority to the user. Apply labels the user asked for. Closing, relabelling in bulk, or closing issues you didn't open needs confirmation.

## Bulk

Preview first, then act:

```bash
gh issue list --label wontfix --json number --jq '.[].number'
```

Run the write only after the user confirms the list.
