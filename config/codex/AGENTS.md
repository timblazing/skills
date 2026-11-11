# Codex-only instructions

Appended to `config/AGENTS.md` by `install.sh` to make `~/.codex/AGENTS.md`. Claude Code never loads this file.

## Model and reasoning selection
- At the start of each task, assess the task type and identify the active model and reasoning effort from the current session context or explicit overrides. Do not assume the configured default is the active setting. If either cannot be determined, say so only when it affects the recommendation.
- Keep routine coding, repository exploration, tests, boilerplate, and straightforward fixes on GPT-6 Luna Medium. For harder work where conserving flagship usage matters, recommend GPT-6 Luna High or XHigh when the active client supports that effort.
- Use GPT-6.1 Sol Medium for serious engineering, architecture, debugging, refactors, research synthesis, and orchestration. Recommend Sol High for genuinely difficult work that needs deeper reasoning.
- Treat GPT-6 Astra as a last resort. Ask the user before escalating to it; never switch to Astra on your own.
- Use Standard processing (`service_tier = "default"`) unless the user requests a different tier or a task has a specific reason to change it.
- Avoid GPT-5.6 Terra and GPT-5.5 unless a specific task has a clear reason to use one.
- Keep routine task starts quiet. When the active model or effort appears mismatched, briefly state the task category, current setting if known, and one recommended model and effort. Root-model selection remains with the user; do not claim or imply that you can silently change the active root model.

## Delegation
- Delegate only when independent, bounded exploration, research, implementation, or review work should materially improve speed or coverage. Keep short or dependent work in the main agent, and avoid parallel edits to the same files.
- Use the configured GPT-6 Luna Medium default for general subagents. For serious engineering or architecture work, use the `sol_engineer` custom agent; use `sol_researcher` for research synthesis and `sol_reviewer` for substantial reviews.
- Keep Sol specialists at Medium by default. Select High only for genuinely difficult subtasks, and use XHigh for Luna only when supported and justified by task difficulty.
- Before using any GPT-6 Astra subagent or otherwise escalating a subtask to Astra, ask the user first.
