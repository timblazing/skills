# Career Ops runtime file map

Canonical repo path: `$CAREER_OPS_REPO` (default: `~/Projects/career-ops`).
Set this environment variable to point the helper and skill at a custom location.

## User layer: preserve and personalize here

Never auto-overwrite these. Read before editing; use narrow patches.

| Path | Purpose |
|---|---|
| `cv.md` | Canonical CV in markdown; required for evaluations and CV tailoring. |
| `config/profile.yml` | Contact info, location, target roles, comp targets, deal-breakers, narrative. |
| `modes/_profile.md` | User-specific archetypes, framing, scoring adjustments, preferences. |
| `article-digest.md` | Optional proof points from projects/articles/case studies. |
| `portals.yml` | Scanner companies, queries, title filters. |
| `data/applications.md` | Main application tracker. |
| `data/pipeline.md` | Scanner/job URL inbox. |
| `data/scan-history.tsv` | Scanner dedupe state. |
| `data/follow-ups.md` | Follow-up history. |
| `reports/*.md` | Job evaluation reports. |
| `output/*` | Generated CV/PDF artifacts. |
| `interview-prep/*` | Story bank and company-specific interview prep. |

## System layer: updateable upstream files

Do not place user-specific personalization here.

| Path | Purpose |
|---|---|
| `AGENTS.md` | Canonical agent operating instructions and onboarding rules. |
| `DATA_CONTRACT.md` | Full user-layer/system-layer contract. |
| `CLAUDE.md`, `GEMINI.md`, `.gemini/commands/*` | CLI-specific adapters. Use as reference, not as Hermes config. |
| `modes/_shared.md` | Shared evaluation logic. Do not customize per user. |
| `modes/oferta.md` | Single job evaluation mode. |
| `modes/pdf.md` | Tailored CV/PDF mode. |
| `modes/scan.md` | Portal scanning mode. |
| `modes/batch.md` | Batch processing mode. |
| `modes/tracker.md` | Tracker maintenance mode. |
| `modes/apply.md` | Application-form assistance mode; still requires human final submit. |
| `templates/*` | CV, portal, state templates. |
| `*.mjs` | Node automation scripts. |
| `dashboard/*` | Go TUI dashboard. |
| `gemini-eval.mjs` | Loads dotenv from `.env`. **Do not run from Hermes** unless you explicitly configure credentials via env vars instead of `.env`. |

## Runtime loading by workflow

### Start of session / health check

Read/run:

- `AGENTS.md`
- `DATA_CONTRACT.md`
- `package.json`
- `node update-system.mjs check`
- `npm run doctor` (or the bundled helper at `scripts/check-career-ops.sh`)
- `npm run verify`

### Onboarding

Read:

- `AGENTS.md` onboarding section
- `DATA_CONTRACT.md`
- `config/profile.example.yml`
- `modes/_profile.template.md`
- `templates/portals.example.yml`

Write only user-layer files listed above.

### Job evaluation

Read:

- `AGENTS.md`
- `DATA_CONTRACT.md`
- `modes/_shared.md`
- `modes/_profile.md`
- `modes/oferta.md`
- `cv.md`
- `config/profile.yml`
- optional `article-digest.md`
- the pasted JD, fetched page text, or user-provided job file

Write:

- `reports/{###}-{company-slug}-{YYYY-MM-DD}.md`
- optionally `data/applications.md` if tracker update is desired
- optionally `interview-prep/story-bank.md` if a new reusable STAR story emerges

### Tailored CV/PDF

Read:

- `modes/pdf.md`
- `templates/cv-template.html`
- `templates/cv-template.tex` if LaTeX is requested
- `cv.md`
- `config/profile.yml`
- target report/JD

Run:

- `node generate-pdf.mjs <input.html> <output.pdf> [--format=letter|a4]` (explicit command; `npm run pdf` may not work without arguments)
- `node generate-latex.mjs` only if LaTeX output is requested and local TeX tooling exists

Write:

- `output/*`
- any repo-defined generated CV artifact

### Portal scan

Read:

- `modes/scan.md`
- `portals.yml`
- `data/scan-history.tsv` if present

Run:

- `npm run scan`
- `node scan.mjs --verify` when liveness verification is desired
- `npm run normalize`
- `npm run dedup`
- `npm run verify`

Write:

- `data/pipeline.md`
- `data/scan-history.tsv`

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `$CAREER_OPS_REPO` | `~/Projects/career-ops` | Path to the local Career Ops repository. |
| `$CAREER_OPS_HOME` | `$HOME` | Override `HOME` for Playwright browser cache isolation (useful when running under a Hermes profile with a different home directory). |
| `$CAREER_OPS_SKILL_DIR` | *(not set)* | Path to the career-ops skill directory. Set this to run `scripts/check-career-ops.sh` by absolute path. |
