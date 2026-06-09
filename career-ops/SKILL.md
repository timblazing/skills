---
name: career-ops
description: "Use when operating a local Career Ops job-search pipeline: onboarding, evaluating job descriptions, generating tailored CVs/PDFs, scanning portals, tracking applications, and maintaining the local repo."
version: 2.0.0
author: Hermes Agent
license: MIT
platforms: [macos]
metadata:
  hermes:
    tags: [career, job-search, productivity, cv, applications]
    related_skills: [google-workspace, ocr-and-documents, macos-computer-use]
---

# Career Ops for Hermes

## Overview

This skill wraps a local open-source Career Ops repository. Career Ops is a local job-search command center: it evaluates job listings against your CV/profile, produces structured reports and tailored CV/PDF outputs, scans configured portals, and keeps application tracking data in markdown/YAML/TSV files.

The canonical repo location on this machine is configured via `$CAREER_OPS_REPO` (default: `~/Projects/career-ops`).

Operate from that directory unless the user explicitly points you elsewhere. Do not treat this skill as a hosted service: all user data lives locally in the repo and any LLM calls go directly through the active agent/provider the user chooses.

## Environment variables

Set these before using the skill. They control file paths and Playwright browser cache isolation.

| Variable | Default | Purpose |
|---|---|---|
| `$CAREER_OPS_REPO` | `~/Projects/career-ops` | Path to the local Career Ops repository. |
| `$CAREER_OPS_HOME` | `$HOME` | Override `HOME` for Playwright browser cache (useful under a Hermes profile with isolated home). |
| `$CAREER_OPS_SKILL_DIR` | *(not set)* | Path to the career-ops skill directory containing `scripts/check-career-ops.sh`. Set this if you want to run the bundled helper by path. |

## First action every session

Before using Career Ops, run the repo update checker silently from the repo root:

```bash
cd "$CAREER_OPS_REPO"
node update-system.mjs check
```

Parse the JSON:

- `status: "update-available"` → tell the user: `career-ops update available (v{local} → v{remote}). Your data (CV, profile, tracker, reports) will NOT be touched. Want me to update?`
- `status: "up-to-date"`, `"dismissed"`, `"offline"`, or `"no-remote-version"` → say nothing unless asked about updates.

If the user asks to update, run:

```bash
node update-system.mjs apply
```

Rollback command:

```bash
node update-system.mjs rollback
```

## Guardrails

- Do not read `.env` or print secrets. If credentials are missing, ask the user to configure them or use provider OAuth outside this workflow.
- The repo contains `gemini-eval.mjs` which loads `dotenv` from `.env`. **Do not run `npm run gemini:eval` from this Hermes skill** — it reads `.env` directly. All Hermes-driven workflows should use the active agent's provider/credentials instead.
- Never submit applications automatically. Produce drafts, reports, PDFs, and guidance; the user decides and submits.
- Always review generated content for hallucinated experience before recommending it.
- Keep user-specific personalization in the user layer: `cv.md`, `config/profile.yml`, `modes/_profile.md`, `article-digest.md`, `portals.yml`, `data/*`, `reports/*`, `output/*`, `interview-prep/*`.
- Do not put user-specific preferences or archetypes into system files such as `modes/_shared.md` or shipped mode prompts.
- Do not overwrite existing user data without first reading the target file and making a narrow patch.
- If the current Hermes profile lacks browser/web tools for a live URL workflow, use user-provided job text or ask to enable those toolsets in a fresh Hermes session.

## macOS Desktop Fallback (Computer Use)

When URL-based job description fetching fails (e.g., Indeed returns 403, Cloudflare blocks the request, LinkedIn requires login), use the `macos-computer-use` skill as the fallback:

1. Attempt direct URL fetch first (via Playwright, Jina reader, or the repo's built-in fetcher).
2. If the URL is blocked (403/5xx/CAPTCHA), fall back to `macos-computer-use`:
   - Open the URL in the user's default browser via desktop automation
   - Screenshot the page to extract the job listing text
   - Feed the extracted text into the normal career-ops evaluation pipeline (report generation, tracker update, etc.)
3. If computer-use is also unavailable or fails, ask the user to paste the job description text directly with structured fields (title, company, location, requirements, pay).

This approach works for any blocked portal: Indeed, LinkedIn, company career pages behind Cloudflare, etc.

## Onboarding checks

Run these checks from the repo root before evaluations, scans, or PDF generation:

```bash
test -f cv.md
test -f config/profile.yml
test -f modes/_profile.md
test -f portals.yml
```

If `modes/_profile.md` is missing but `modes/_profile.template.md` exists, copy it once:

```bash
cp modes/_profile.template.md modes/_profile.md
```

If any required user-layer file is missing, enter onboarding instead of evaluating jobs.

### Missing `cv.md`

Ask for one of:

1. Paste an existing CV; convert it to clean markdown.
2. Paste a LinkedIn/profile URL; extract only information the user approves or can verify.
3. Describe experience; draft a CV and mark uncertain areas for confirmation.

Create `cv.md` with standard sections: Summary, Experience, Projects, Education, Skills.

### Missing `config/profile.yml`

Copy the template and fill with user-provided facts:

```bash
cp config/profile.example.yml config/profile.yml
```

Ask for full name/email, location/timezone, target roles, salary/comp target, work-mode constraints, deal-breakers, and search geography. Put narrative, archetypes, and preferences in `config/profile.yml` and/or `modes/_profile.md`.

### Missing `portals.yml`

Copy the template:

```bash
cp templates/portals.example.yml portals.yml
```

If the user gave target roles, update the title filters/search terms narrowly.

### Missing tracker

If `data/applications.md` is missing, create:

```markdown
# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
```

## Common workflows

### Health check

Use the bundled Hermes helper script to verify repo setup, dependencies, Playwright browser cache, and user-layer files without reading `.env`. The helper respects `$CAREER_OPS_REPO` and `$CAREER_OPS_HOME`.

Find and run the helper with:

```bash
# The skill directory is configurable via $CAREER_OPS_SKILL_DIR.
# If set, run:
${CAREER_OPS_SKILL_DIR}/scripts/check-career-ops.sh
```

If you don't know the skill path, use repo-relative checks instead:

```bash
cd "$CAREER_OPS_REPO"
npm run doctor
npm run sync-check
npm run verify
```

`npm run doctor` may fail when user-layer files are not set up; report missing files as onboarding work, not as a broken install.

### Evaluate a pasted job description

1. Run first-action update check.
2. Confirm onboarding files exist.
3. Read the relevant mode files at runtime, especially:
   - `AGENTS.md`
   - `DATA_CONTRACT.md`
   - `modes/_shared.md`
   - `modes/_profile.md`
   - `modes/oferta.md`
4. Read `cv.md`, `config/profile.yml`, and optional `article-digest.md`.
5. Evaluate the job using the repository's A-F report structure and scoring rules.
6. Write a report under `reports/` using the repo naming pattern, then update `data/applications.md` only if the user wants tracking.
7. Recommend whether to apply; never auto-submit.

### Evaluate a job URL / auto-pipeline URL import

Read `modes/auto-pipeline.md` before URL evaluation; it contains the live portal-support matrix and protected-portal fallback prompt. Current expectations:

- Greenhouse, Ashby, Lever, Workday, Workable, SmartRecruiters, Recruitee: usually fetchable after Playwright/browser rendering; static/Jina-style readers may also work for some pages.
- Static company pages, ZipRecruiter, WeLoveProduct, Built In: often fetchable via WebFetch/Jina-style reader, with Playwright fallback for JS-heavy pages.
- Indeed and LinkedIn: treat as protected/paste-required when the page returns `Request Blocked`, `Security Check`, `Just a moment`, CAPTCHA, Cloudflare, or login-wall content. Do not generic-block; explain the portal limitation and ask for pasted JD text with fields for company, role title, location/remote policy, comp, responsibilities, requirements, and source URL.

If the current Hermes profile lacks browser/web tools, skip URL fetching and ask for pasted JD text using the clear protected-portal prompt from `modes/auto-pipeline.md`.

### Generate a tailored CV/PDF

1. Confirm a report/job target exists and user-layer setup is complete.
2. Read `modes/pdf.md`, `templates/cv-template.html`, `cv.md`, `config/profile.yml`, and the target report/JD.
3. Produce or update the tailored markdown/HTML as the repo expects.
4. Generate the PDF:

```bash
node generate-pdf.mjs <input.html> <output.pdf> [--format=letter|a4]
```

Note: `npm run pdf` may not work as a zero-argument command. Use the explicit `node generate-pdf.mjs` form.

If Playwright/Chromium is missing, install:

```bash
npx playwright install chromium
```

### Scan portals

1. Confirm `portals.yml` exists and reflects current target roles.
2. Run:

```bash
npm run scan
```

For liveness-verified scanning:

```bash
node scan.mjs --verify
```

3. Review `data/pipeline.md` and dedupe/normalize if needed:

```bash
npm run normalize
npm run dedup
npm run verify
```

### Tracker and follow-ups

Useful commands:

```bash
npm run patterns
node followup-cadence.mjs
npm run verify
```

Keep follow-up history in `data/follow-ups.md`. Do not send outreach without the user's approval.

## Helper script

This skill includes `scripts/check-career-ops.sh`. Run it to verify the local checkout, dependencies, Playwright browser availability, user-layer setup status, and safe career-ops checks without reading `.env`:

```bash
# Set $CAREER_OPS_SKILL_DIR to the skill directory, then:
${CAREER_OPS_SKILL_DIR}/scripts/check-career-ops.sh
```

The helper respects `$CAREER_OPS_REPO` (repo path) and `$CAREER_OPS_HOME` (Playwright cache home).

## File map

See `references/runtime-file-map.md` for the user-layer/system-layer split and the files to load for each workflow.

## Common pitfalls

1. Treating missing `cv.md`/`profile.yml` as an install failure. It is onboarding state.
2. Reading `.env` to debug API issues. Do not read it; ask the user to configure credentials.
3. Editing `modes/_shared.md` for user-specific preferences. Put personalization in `modes/_profile.md` or `config/profile.yml`.
4. Running `npm run gemini:eval` — it loads dotenv from `.env`. Use the active agent's provider instead.
5. Claiming PDF generation works without Playwright Chromium. Verify with `npx playwright install chromium` first.
6. Using stale copied prompt text. Read Career Ops repo files at runtime because upstream updates may change mode instructions.
7. **Forgetting the computer-use fallback.** When a URL fetch fails (403 from Indeed/Cloudflare, LinkedIn login wall), don't immediately ask the user to paste text — try `macos-computer-use` first to open the URL on their desktop and read the listing off the screen. Only fall back to paste-text as a last resort.

## Verification checklist

- [ ] Repo exists at `$CAREER_OPS_REPO` (default: `~/Projects/career-ops`).
- [ ] `npm install` has been run in the repo.
- [ ] `npx playwright install chromium` has completed before claiming PDF readiness.
- [ ] `node update-system.mjs check` was run for the session.
- [ ] User-layer setup files are present or missing files are reported as onboarding blockers.
- [ ] Reports/PDFs/tracker edits were produced from actual repo files, not generic job-search assumptions.
- [ ] `scripts/check-career-ops.sh` runs without error (respecting `$CAREER_OPS_REPO` and `$CAREER_OPS_HOME`).
- [ ] `macos-computer-use` skill is available (optional — URL-based JD evaluation with computer-use fallback).
