# CI failures

Find the failing check, read its log, fix the cause. Don't report green without `gh pr checks N`.

```bash
gh pr checks N
gh run list --branch "$(git branch --show-current)" --limit 5
gh run view RUN_ID --log-failed
gh run view RUN_ID --job JOB_ID --log
```

Without GraphQL: `gh api repos/OWNER/REPO/commits/SHA/check-runs` and `gh api repos/OWNER/REPO/actions/runs/RUN_ID/jobs`. Logs: `gh api repos/OWNER/REPO/actions/runs/RUN_ID/logs > /tmp/logs.zip`.

Reproduce locally with the same command CI runs (see `.github/workflows/`) before changing anything.

## Is it yours?

Compare with the default branch's latest run. If the same check fails there, it's a baseline failure: say so and don't fix it in this PR unless asked. A one-off network, runner or registry error is a flake; rerun once (`gh run rerun RUN_ID --failed`). If it fails twice, treat it as real.

## Patterns

| Signature in the log | Usual cause | Fix |
|---|---|---|
| Test assertion failed, stack points at a test | Code logic changed or the test is stale | Decide which is right; fix that one |
| `Cannot find module`, `ModuleNotFoundError`, `ERR_PNPM_OUTDATED_LOCKFILE` | Missing dependency or lockfile not committed | Add the dependency, commit the lockfile |
| Lint or `would reformat` | Formatter not run | Run the repo's formatter and lint-fix locally |
| Type errors | Signature or type drift | Fix the types; avoid blanket `any` or ignore comments |
| Works locally, fails in CI | Node/Python version, env vars, case-sensitive paths, missing build step | Compare versions and env with the workflow |
| `Resource not accessible by integration`, 403 | Workflow `permissions:` too narrow, or a fork PR with no secrets | See `auth.md`; needs the user if it's a settings change |
| Job cancelled, "exceeded the maximum execution time" | Hung step or slow job | Find the step; add `timeout-minutes`; fix the slowness |
| Docker `COPY failed`, `not found` | Wrong path or file in `.dockerignore` | Fix the path |

## Loop

Check, read the log, fix, push, check the new head. After three attempts at the same failure, stop and tell the user what you tried. Changes to workflow files or repo settings, or secrets you can't see, are the user's call.
