---
name: cross-review
description: Get a second opinion on a change from the other flagship model (Opus reviews Sol's work, Sol reviews Opus's) in a short, budgeted loop until both agree. Use when the user says "cross review", "sol loop", "council", or "second opinion", and as the review step of full-send / full-stop.
---

# Cross-review

A budget version of tstack's `sol-loop` and `council`. The user is on $20
Claude and $20 Codex plans, so one reviewer, medium effort, and few rounds.
The main session is already one "council member"; the reviewer is the other.

Make the smallest changes that satisfy the reviewer. Fight scope creep and
push back with evidence.

## Pick the reviewer

| You are running | Reviewer |
|---|---|
| Claude (Opus/Sonnet) | Latest GPT Sol |
| Codex (Sol/Luna) | Latest Claude Opus |

Effort: **medium**, always. Use high only if the user asks for it.

Routes, in order:

1. **T3 Code:** `orchestrator_capabilities` once, then `delegate_task`
   (`role: "review"`, `mode: "async"`) with the other provider's flagship and
   medium effort in `target.options`. New `clientRequestId` per round. Save
   `taskId`. Never use `t3_thread_send`, `create_threads`, or
   `t3_thread_launch` for review.
2. **Outside T3:** Codex has no route to Claude and Claude Code has no route
   to Sol. Fall back to a fresh same-provider reviewer: the `sol_reviewer`
   agent in Codex, the `architect` agent in Claude Code. Label the report
   "same-provider review" so it is not mistaken for a cross-check.

Do not start more than one reviewer, and do not let the reviewer start
subagents.

## When to skip (full-send / full-stop only)

When invoked by name, always run. When called from full-send or full-stop,
skip and say why in the report if the change is:

- docs, comments, formatting, config values, or copy only; or
- under ~30 changed lines of behavior code with direct proof, outside the
  risk areas below.

Risk areas, which always get review: auth, permissions, payments, data
deletion or migration, security, concurrency/state, public API changes.

## Budget

- Default **2 rounds**. Round 1 full; round 2 checks only fixes and open ids.
- **3 rounds** only for the risk areas above while a blocker or should stays
  open with evidence, or when the user asks.
- Stop early when a round returns only nits. Declined nits and
  doc/format-only fixes need no new round.
- Keep a ledger: id, severity, outcome, usage if returned. Never guess usage.

## 1. Scope

Run `git status --short`. Do not stash, discard, or include unrelated
changes. Base: `git fetch origin` then `git merge-base HEAD origin/<base>`
(the PR's `baseRefName` for a PR, else the default branch). The change is base
to working tree, including untracked files, in the change's paths. Use the
same diff command every round. Run the covering checks first; do not send
code the change breaks.

## 2. Brief (round 1)

T3 children get no history, so the brief is complete:

```
Review only. Do not edit, commit, push, comment on PRs, or start subagents.
Repo: <abs path> Base: <sha> Intent: <1-2 sentences> Out of scope: <scope>
Checks: <commands and results>
See: git diff <base> [-- <paths>]; git status --short (read untracked).
Read the diff, the functions it touches, and their direct callers. Do not
survey the rest of the repo. Find bugs, broken callers, mismatch with intent.
Skip style unless it hides a bug. Hold to the smallest change: flag code,
tests, or guards the intent does not need.
blocker = intended case wrong. should = real bug callers will hit. nit = rest.
Reply in under 300 words:
VERDICT: APPROVE or CHANGES
S1 [blocker|should|nit] <file>:<line> <claim>. Fix: <suggestion>
```

Do not edit scoped files while the review runs. Wait for the notice; do not
poll. A timeout, error, or empty reply is not approval: cancel, then retry
once with the ledger.

## 3. Answer findings

Check each finding and its severity yourself. Another path, a rare case, or a
small cost is a nit, whatever label it came with.

- **Agree:** smallest fix; prefer delete or narrow over new helpers, locks,
  caches, options. Add one focused test only if the intent needs it.
- **Disagree:** say why with evidence (file:line, test, output).
- **Nit / out of scope:** decline in one line; list as a follow-up.

Re-run checks and `git diff --shortstat <base>`. If review grew the diff, cut
first. Do not agree just to end the loop.

## 4. Next round

Only if budget remains and a blocker/should is open or behavior code changed
since approval. In T3, a fresh `delegate_task`; natively, follow up the same
agent. Send the round-1 brief, the ledger (`fixed:` / `disagree:` /
`declined:` + evidence), and the change since last round. Ask only about open
ids and changed code.

## 5. Stop

- **Agreed:** APPROVE on the current behavior diff, nothing blocker/should
  open, no concern of your own.
- **Stuck:** an item disputed after two replies, or budget spent. Show both
  sides in 2-3 lines each; the user decides. Budget end is not approval.

Do not push during the loop. If the work goes into a PR, add above the model
line in the description:

`Cross-reviewed: <N> rounds with <model>. Verdict: <approved|disputed>`

Report: rounds, reviewer model and route, what changed, diff size before and
after, fixed and declined findings with reasons, usage if exposed.
