# Agent Skills

A personal, curated collection of agent skills. Each skill is a directory with a
`SKILL.md` (YAML frontmatter `name`/`description` that drive triggering, plus the
body and any bundled `references/`, `scripts/`, and `templates/`).

These skills are written to be **universal** — they avoid vendor-specific language
and work with any capable agent harness. Where a concrete implementation is
inherently harness-specific (e.g. pre-tool hooks), the skill names that mechanism
as an example while keeping the guidance portable.

## The engineering suite

Several skills interlock into a primary loop for feature work. Run the setup skill
once per repo, then use the loop; reach for the architecture skill periodically.

```
setup-engineering-skills   ← run once per repo (issue tracker, triage labels, domain docs)

   grill-with-docs   →   to-prd   →   to-issues   →   tdd
   (sharpen plan        (write the    (slice into     (red-green-refactor
    against the          PRD)          grabbable        each slice)
    domain model)                      issues)

improve-codebase-architecture   ← run periodically to find deepening opportunities
diagnose · triage · zoom-out · prototype   ← supporting skills
```

The loop depends on two per-repo artifacts that `setup-engineering-skills`
configures and `grill-with-docs` maintains lazily:

- **`CONTEXT.md`** (or `CONTEXT-MAP.md` → per-context `CONTEXT.md` in a monorepo) —
  the project's domain glossary.
- **`docs/adr/`** — architectural decision records.

## Other clusters

- **Frontend / design** — `frontend-ui-engineering` (build production UI), `impeccable`
  (design → critique → polish → audit engine), `design-an-interface`, `prototype`,
  `popular-web-designs`, `design-md`.
- **Skill authoring & discovery** — `write-a-skill`, `using-agent-skills`, `find-skills`.
- **Repo safety & hygiene** — `git-guardrails` (block dangerous git commands),
  `setup-pre-commit` (Husky + lint-staged + Prettier), `git-workflow-and-versioning`.
- **Documents** — `pdf`, `docx`, `xlsx`, `pptx`.
- Plus standalone utilities (`graphify`, `humanizer`, `diagnose`, etc.).

## Notes

- Adapted from several upstream collections and de-branded for portability. Where a
  skill is inspired by or ported from another source, the attribution is kept inline.
- The engineering suite mirrors Matt Pocock's interlocking skill design; kept skills
  are verified current against upstream.
