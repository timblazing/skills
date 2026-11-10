# gh api cheatsheet

Use `gh` commands first. Use `gh api` for what they lack, and when GraphQL is rate limited (`gh api rate_limit --jq .resources.graphql`; REST is `.resources.core`). `gh api` handles auth and JSON. `{owner}` and `{repo}` fill in from the current clone.

```bash
gh api repos/{owner}/{repo}/pulls/N
gh api repos/{owner}/{repo}/pulls?state=open --paginate --jq '.[].number'
gh api -X PATCH repos/{owner}/{repo}/issues/N -f state=closed -f state_reason=not_planned
gh api repos/{owner}/{repo}/pulls -f title=... -f head=... -f base=main -F body=@file.md
```

`-f` sends a string, `-F` sends typed values and `@file` contents. `--input file.json` sends a JSON body.

| Need | Endpoint |
|---|---|
| PR details / files | `GET /repos/{o}/{r}/pulls/N`, `.../pulls/N/files` |
| Create PR | `POST /repos/{o}/{r}/pulls` |
| Merge PR | `PUT /repos/{o}/{r}/pulls/N/merge` (`merge_method`: `squash`, `merge`, `rebase`) |
| Inline comment | `POST /repos/{o}/{r}/pulls/N/comments` |
| Review with comments | `POST /repos/{o}/{r}/pulls/N/reviews` |
| Review threads and replies | `GET /repos/{o}/{r}/pulls/N/comments`, `POST .../comments/ID/replies` |
| Issue read / update | `GET`, `PATCH /repos/{o}/{r}/issues/N` (also returns PRs; filter on `pull_request`) |
| Issue comment | `POST /repos/{o}/{r}/issues/N/comments` |
| Labels | `POST /repos/{o}/{r}/issues/N/labels`, `DELETE .../labels/NAME` |
| Check runs for a commit | `GET /repos/{o}/{r}/commits/SHA/check-runs` |
| Combined commit status | `GET /repos/{o}/{r}/commits/SHA/status` |
| Workflow runs | `GET /repos/{o}/{r}/actions/runs?branch=B` |
| Re-run failed jobs | `POST /repos/{o}/{r}/actions/runs/ID/rerun-failed-jobs` |
| Search issues and PRs | `GET /search/issues?q=...+repo:{o}/{r}` |
| Rate limits | `GET /rate_limit` |

Pagination: `--paginate`, or `?per_page=100&page=2`. Writes through `gh api` follow the same confirmation rules as any other GitHub write (see `SKILL.md`).
