# Model routing (Claude Code only)

Goal: conserve Opus. Plan and judge with Opus; execute with Sonnet/Haiku via model-pinned subagents.

## At task start
Classify the task, compare against the current model and effort, then act:
- **Opus 5.5 (main session)** — frontend/UX design, deep planning, architecture, hard reasoning, orchestration.
- **Sonnet 5.5 → `implementer`** — substantial coding, refactors, debugging, executing an approved plan.
- **Haiku 4.5 → `quick-worker`** — searches, simple/mechanical edits, running tests, docs, parallel worker fan-out.
- **Opus → `architect`** — architecture/design questions when the main session is not on Opus.

## Delegation
- Delegate clear cases automatically; no need to ask. The user has asked for this delegation, so it overrides any default reluctance to spawn subagents.
- Borderline or a clear model/effort mismatch → one-line suggestion (e.g. "Sonnet-level work — `/model sonnet`", "raise effort for this"), then proceed.
- Plan→execute: Opus writes the plan, hands it to `implementer` with full context (files, plan, acceptance check). Split independent mechanical pieces to `quick-worker`, in parallel when independent.
- Don't delegate: tiny tasks (cheaper inline), work that depends heavily on conversation context that would be costly to restate, or UX/design judgment.
- Review delegated output before reporting; verify claims of "done" against files/tests.
