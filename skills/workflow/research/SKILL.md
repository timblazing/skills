---
name: research
description: "Investigate a question against primary sources (official docs, source code, specs) in a background agent and save cited findings as markdown. Use when a decision waits on facts outside the repo: how a library or API behaves, which product fits, what changed in a version."
---

# Research

Adapted from Matt Pocock's `research` skill (MIT, see `../LICENSE-mattpocock`).

Start a **background agent** with a fresh context so you keep working while
it reads. Its brief:

1. Answer the question from **primary sources**: official docs, source code,
   specs, first-party APIs. Follow each claim back to the source that owns it.
   Use `gh` for GitHub repos and Firecrawl or web search for the web.
2. Write the findings to one markdown file, citing a source for each claim,
   and flag anything it could not confirm.
3. Save it where the repo keeps such notes (`docs/reference/` in repos with
   the standard docs layout), or in the scratchpad for a throwaway answer.
   Say where.

Only the questions downstream of the research wait for it.
