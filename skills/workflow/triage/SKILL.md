---
name: triage
description: "Called by proj and build to move GitHub issues labelled triage (or unlabelled) toward agent-ready: check the claim against the code, clarify what's missing, and post an agent brief. Also use when the user asks what needs attention, what's ready for agents, or to triage an issue."
user-invocable: false
---

# Triage

Adapted from Matt Pocock's `triage` skill (MIT, see `../LICENSE-mattpocock`).

## Labels

| Label | Meaning |
|---|---|
| `triage` | Half-formed. Not ready for an agent. |
| `agent-ready` | Has an agent brief. Any agent may start it. |
| `ios` | Needs the mac (simulator, Xcode). Add beside the others. |
| `bug` / `enhancement` | Category, when the repo uses them. |

Close as not planned (with one line why) for won't-do and already-done.

## What needs attention

When asked, list oldest first with one line each: unlabelled open issues,
then `triage` issues, then `triage` issues where the owner has replied since
the last agent comment. Then `agent-ready` issues with no open PR. Let the
user pick.

## Triage one issue

1. **Read it all**: body, comments, labels, linked PRs. Earlier agent
   comments hold settled answers; don't re-ask them.
2. **Check it against the code.** Is it already built? Does the bug
   reproduce (`diagnose` phase 1 is the bar)? Say what you found.
3. **Fill the gaps.** Missing decisions go to `clarify`. Too big for one PR
   goes to `plan`, which sets its own labels.
4. **Write the brief** as an issue comment, then swap `triage` for
   `agent-ready`. In an interactive session, show the brief first. In an
   unattended run, relabel only when the brief needs no decision from the
   owner; otherwise the `clarify` questions go up with
   `<!-- proj-agent: needs-input -->` and the label stays.

Comments follow `leaving-pr-comments` and end with a `proj-agent` marker.

## Agent brief

The brief is the contract the next agent works from. Write it to survive the
code moving for a few weeks: behaviour, interfaces and types, not file paths
or line numbers. [AGENT-BRIEF.md](AGENT-BRIEF.md) has worked examples.

```markdown
## Agent brief

**Summary:** <one line>

**Now:** <current behaviour; for a bug, the broken behaviour and how to reproduce it>

**Wanted:** <behaviour after the change, including edge cases and errors>

**Key interfaces:** <types, functions, routes or config the change goes through>

**Acceptance criteria:**
- [ ] <independently checkable>

**Out of scope:**
- <adjacent things to leave alone>

**Risk:** <low|medium|high, per file-pr>
```
