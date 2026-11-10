---
name: plan
description: "Called by build and triage when work is bigger than one PR: break it into tracer-bullet GitHub sub-issues with blocking links, and decide whether they go straight to agent-ready or wait for the user's approval. Also use when the user asks to break something down, split it up or turn a discussion into issues."
user-invocable: false
---

# Plan

Adapted from Matt Pocock's `to-spec` and `to-tickets` skills (MIT, see
`../LICENSE-mattpocock`).

Turn a goal into a set of GitHub issues an agent can each finish in one PR.
Synthesise from what's already known (the issue, its thread, the
conversation, the code). If a decision is missing, call `clarify` first.

## 1. Read the ground

Read the parent issue and its comments, the repo's AGENTS.md and the docs
and ADRs in the area. Look for a **prefactor**: a change that makes the rest
easy ("make the change easy, then make the easy change"). It becomes the
first ticket.

## 2. Slice

Each ticket is a **tracer bullet**: a narrow but complete path through every
layer it touches (schema, API, UI, tests), demoable or verifiable on its own,
sized for one agent session and one PR. Not a horizontal layer.

Give each ticket its **blockers**: the tickets that must merge first. No
blockers means it can start now.

A **wide refactor** (one mechanical change with a huge blast radius, such as
a rename across the codebase) is the exception: sequence it as
expand → migrate in batches → contract, each batch its own ticket.

## 3. Decide the gate

The plan goes straight to `agent-ready` when **all** of these hold:

- three tickets or fewer;
- every ticket would be a `Risk: low` PR, so none touches a `file-pr`
  protected path;
- no ticket adds an external service or a paid dependency;
- no ticket makes a product or UX decision the parent issue didn't already
  settle.

Otherwise the plan **needs approval**.

## 4. Publish

Create one issue per ticket with `gh`, blockers first, so later tickets can
reference real numbers. Make each a sub-issue of the parent when there is one
(`github` skill, `references/issues.md`). Never close or rewrite the parent.

Body:

```markdown
## Parent
#<n>

## What to build
<the end-to-end behaviour, from the user's side>

## Acceptance criteria
- [ ] <independently checkable>

## Blocked by
- #<n>, or "None, can start now"

## Out of scope
- <what to leave alone>
```

Describe behaviour, interfaces and types, not file paths or line numbers:
the issue may wait days and the code will move.

**Labels:**

- Auto plan: every ticket gets `agent-ready`.
- Needs approval: every ticket gets `triage`. Post one comment on the parent
  listing the tickets (title, blockers, one line each) and the reason it
  needs approval, ending with `<!-- proj-agent: needs-input -->`. In an
  interactive session, show the same list in chat and ask; on a yes,
  relabel them `agent-ready`.

Add `ios` to any ticket that needs the mac.

## Hand back

Report the issues with links and which gate applied. When called from
`build` with an auto plan, carry on with the first unblocked ticket in this
session. When the plan needs approval, stop.
