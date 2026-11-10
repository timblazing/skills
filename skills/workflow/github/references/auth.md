# gh auth

Check first: `gh auth status`. Most failures are one of the cases below.

## Mac (interactive)

```bash
gh auth login        # GitHub.com, HTTPS, login with browser
gh auth setup-git    # make git use gh as the credential helper
gh auth status
```

Missing scope (for example `workflow` when pushing `.github/workflows/*`): `gh auth refresh -s workflow`. Need `read:org` for org data: `gh auth refresh -s read:org`.

Wrong account: `gh auth switch`, or `gh auth status` to see which is active.

## Token from the environment (servers, scripts)

`gh` uses `GH_TOKEN` (or `GITHUB_TOKEN`) when set, and it wins over stored login. A stale or limited token in the environment is a common cause of "Resource not accessible" or a 403 when a login works. Test with `env -u GH_TOKEN -u GITHUB_TOKEN gh auth status`.

Never print a token, put it in a remote URL, or commit it. Pass it through the environment only.

## GitHub Actions

The built-in `GITHUB_TOKEN` is scoped by the workflow's `permissions:` block. A job that comments or pushes needs `contents: write`, `pull-requests: write` or `issues: write` as appropriate. A token from `GITHUB_TOKEN` does not trigger other workflows; a push made with it won't start CI.

```yaml
permissions:
  contents: read
  pull-requests: write
env:
  GH_TOKEN: ${{ github.token }}
```

Fork PRs get a read-only token and no secrets, by design.

## Codex Cloud and other sandboxes

Often no `gh` login at all, and sometimes no network beyond the allowlist. Check `gh auth status` and `git remote -v`. If there is no credential, don't hunt for one: say what you couldn't do and leave the branch ready for the user to push.

## Git identity

`git config user.name` and `user.email` must be set before committing. Use the existing repo or global config; don't invent one.

## Quick diagnosis

| Symptom | Cause |
|---|---|
| `gh: command not found` | Not installed (`brew install gh`) |
| `HTTP 401` / `Bad credentials` | Expired or revoked token; log in again |
| `HTTP 403 Resource not accessible by integration` | Token lacks the permission (Actions `permissions:`, App scope) |
| `HTTP 403` rate limit | See the rate limit rule in `SKILL.md` |
| `refusing to allow ... without workflow scope` | `gh auth refresh -s workflow` |
| `Permission denied (publickey)` | Remote is SSH and no key is loaded; use the HTTPS URL or `ssh-add` |
