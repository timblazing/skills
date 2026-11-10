---
name: retro
description: "Weekly factory retro: read the Factory notes in the week's merged PRs (and any session the user names), find what slowed agents down, and fix the environment: skills, AGENTS.md, verify skills, automated checks. Use for the scheduled skills retro, or when the user asks for a retro or what went wrong in a session."
---

# Retro

Adapted from Matt Pocock's `retro` skill (MIT, see `../LICENSE-mattpocock`).

You are improving the agents' **environment** so the next run goes better,
not grading the work. Call `writing-for-agents` before editing any skill or
AGENTS.md.

## 1. Gather

- Merged PRs since the last retro in every active project repo
  (`proj` `projects_list`, or the repos the user names). Read the
  "Factory notes" section of each body and the review threads.
- Any session the user names: its transcript or T3 thread.
- Earlier retros (closed issues or commits titled "retro") so you don't redo
  a fix.

Done when every note is listed with its PR link.

## 2. Classify

Group notes that share a cause. For each group, pick the cheapest fix that
removes it, in this order of preference:

1. **Automated check**: a lint rule, type, test or CI step that would have
   caught the mistake. Read the repo's existing scripts and CI first: a
   check that exists but is unwired is the finding. A repo with no CI is a
   finding by itself.
2. **Information access**: the agent lacked something it could have been
   given (docs pointer, read-only access, logs).
3. **Navigation**: the agent spent long finding a file or fact; add a
   pointer where it would have looked.
4. **Skill fix**: a skill misled, missed a case, or had a no-op instruction.
5. **AGENTS.md line**: only for something every session in that repo needs.
   Prefer moving lines *out* of AGENTS.md into skills or checks.
6. **Tool economy**: a tool call that cost far more than it needed to.

One-off notes with no repeat and no cheap fix: drop them.

## 3. Fix

- **timblazing/skills**: commit and push to main.
- **A product repo's** `verify` skill, AGENTS.md or checks: a PR via `build`.
- Anything bigger than an edit: an issue (`proj`), `agent-ready` when the
  fix is clear.

## 4. Report

One list, worst first: the cause, the PRs it showed up in, the fix and where
it landed (commit, PR or issue link). In a scheduled run, post it as a
comment on the retro tracking issue, if there is one.
