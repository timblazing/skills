---
name: git-guardrails
description: Set up an agent hook to block dangerous git commands (push, reset --hard, clean, branch -D, etc.) before they execute. Use when the user wants to prevent destructive git operations, add git safety hooks, or block git push/reset for an AI coding agent.
---

# Setup Git Guardrails

Sets up a pre-tool hook that intercepts and blocks dangerous git commands before the agent executes them. The bundled hook reads a tool-call JSON payload on stdin and exits non-zero to veto the command — the same contract most agent harnesses use for pre-execution hooks.

## What Gets Blocked

- `git push` (all variants including `--force`)
- `git reset --hard`
- `git clean -f` / `git clean -fd`
- `git branch -D`
- `git checkout .` / `git restore .`

When blocked, the agent sees a message telling it that it does not have authority to run these commands.

## Steps

### 1. Ask scope

Ask the user: install for **this project only** or **all projects** (global)?

### 2. Copy the hook script

The bundled script is at: [scripts/block-dangerous-git.sh](scripts/block-dangerous-git.sh)

Copy it to a stable location your agent can execute — e.g. `.agent/hooks/block-dangerous-git.sh` in the project, or `~/.agent/hooks/block-dangerous-git.sh` globally. Make it executable with `chmod +x`.

### 3. Register the hook with your agent

Wire the script in as a **pre-tool-use** (before-Bash) hook so it runs before any shell command executes. The mechanism is harness-specific; configure it in your agent's settings.

For example, a Claude Code project config (`.claude/settings.json`) looks like:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.agent/hooks/block-dangerous-git.sh"
          }
        ]
      }
    ]
  }
}
```

For the global equivalent, point the command at the absolute path of the copied script. If a settings file already exists, merge the hook into the existing pre-tool-use array — don't overwrite other settings. For other harnesses, register the same script through their equivalent pre-execution hook.

### 4. Ask about customization

Ask if the user wants to add or remove any patterns from the blocked list. Edit the copied script accordingly.

### 5. Verify

Run a quick test:

```bash
echo '{"tool_input":{"command":"git push origin main"}}' | <path-to-script>
```

Should exit with code 2 and print a BLOCKED message to stderr.
