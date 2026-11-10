---
name: clarify
description: "Called by build and backlog when a request or issue is missing a decision only the user can make (behaviour, scope, UX, a trade-off). Interviews the user in rounds of numbered questions with recommended answers, and records hard-to-reverse decisions as ADRs. Also use when the user says grill me or wants a plan stress-tested."
user-invocable: false
---

# Clarify

Adapted from Matt Pocock's `grilling` and `domain-modeling` skills (MIT, see
`../LICENSE-mattpocock`).

Reach a shared understanding before building. Map the open questions as a
**design tree**: every decision branches into the decisions that hang off it.

## Rounds

The **frontier** is every decision whose prerequisites are already settled.
Ask the whole frontier in one round, numbered, each with your recommended
answer, worded so "yes" accepts it:

```
**Q1. <title>**: <question, with the options if there are several>
→ Recommended: <answer>
```

A question that depends on another question still open belongs to a later
round. After each round, recompute the frontier and ask the next one.

**Facts are yours, decisions are the user's.** Anything you can read from
the repo, docs, the issue thread or the web, look up yourself (a subagent for
anything big) instead of asking. Ask only what needs the user's judgement.

Keep it short: most asks need one round of two to five questions. Stop at
three rounds and summarise what is still open.

Done when the frontier is empty and the user has confirmed the summary.

## Where the questions go

- **Interactive session:** ask in chat.
- **Unattended run** (cloud agent, scheduled task, a thread started from an
  issue): post the round as an issue comment (`leaving-pr-comments`), ending
  with `<!-- proj-agent: needs-input -->`, and end the run. The user's reply
  starts the next run, which reads the thread and continues from there.

## While you talk

- **Sharpen words.** When the user uses a vague or overloaded term, propose
  the precise one. When they describe behaviour, check the code agrees and
  say so when it doesn't.
- **Test with scenarios.** Invent concrete edge cases that force a boundary
  decision.
- **Record decisions.** Write an ADR in the repo's `docs/decisions/`
  (`NNNN-short-title.md`, next number, Context / Decision / Consequences)
  only when all three hold: hard to reverse, surprising to a future reader,
  and the result of a real trade-off. Everything else goes in the issue or PR.

## Hand back

Summarise the settled decisions in a few bullets. When called from `build`,
continue to its Build phase (or `plan` if the answers made the work bigger
than one PR). When called from `backlog`, update the issue with the
decisions and let `triage` relabel it.
