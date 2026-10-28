---
name: openui-t3
description: Render OpenUI Lang as interactive interfaces inside T3 Code chat using its HTML artifact tools. Use with OpenUI when the user wants to stay in T3 rather than build a separate agent frontend.
---

# OpenUI inside T3 Code

Use the official `openui` skill for language and component guidance. This companion supplies the T3 artifact host, using the published browser bundle and its built-in `openuiChatLibrary`. No server, API key, gateway account, or separate chat application is needed.

## Workflow

1. Discover `html_preview` and `html_render`. If unavailable, generate the HTML file and explain that this client cannot display the interactive artifact inline; do not claim it was rendered.
2. Write OpenUI Lang to a UTF-8 `.openui` file. Start with `root = Card(...)`. Use the component signatures from the exact browser bundle, rather than assuming `openuiLibrary` and `openuiChatLibrary` have identical roots or children.
3. Run `python3 <this-skill>/scripts/render.py input.openui --out interface.html --title 'Interface title'`.
4. Read the output HTML and send its contents to `html_preview`, then inspect its screenshot and console. Fix errors and check at about 390px as well as desktop width. Use `agent-browser` if functional interaction tests are needed; a preview image alone does not prove clicks work.
5. Send the same HTML to `html_render`, with `contentHeight` from preview and a descriptive title. This shows the actual interactive interface in the conversation. No local server is needed.

The output uses pinned browser-bundle **0.2.1** from jsDelivr, so first load requires network access. If embedding policy blocks that CDN, report the actual error; do not silently replace OpenUI with a hand-built imitation. The wrapper exposes `window.openuiLibraryPrompt`, generated from the matching runtime library with bindings and built-in functions enabled. It also exposes `window.openuiDiagnostics` for parse/error/state/action inspection. For a new component, inspect the matching prompt/schema in a browser or read the pinned package source.

## Interaction boundaries

- `$variables`, `@Set`, `@Reset`, forms, and calculations run locally inside the artifact.
- `@ToAssistant` reaches `onAction`. The wrapper displays its JSON in a selectable textarea so the user can paste it into chat. It **does not submit a T3 message**. Never label such a button as an automatic agent handoff.
- No iframe-to-T3 message bridge is documented by the available HTML tools. Add one only after verifying a supported host API; do not guess `postMessage` event names or call private T3 endpoints.
- `Query` and `Mutation` require a real `toolProvider`. This wrapper does not supply one or give browser code access to CLI/MCP credentials. Fetch data with the agent's tools, then embed the permitted snapshot. External writes still need the user's authorization.
- State lasts for the current artifact instance only. Reloads/remounts are not persistence. Streaming model tokens directly into an already displayed artifact also requires host support; this workflow publishes a completed program.
- Keep the upstream `openui` skill unchanged. Its Gateway recommendation is for inference integrations; this workflow uses the existing Claude/Codex session to generate Lang and makes no extra inference request.

## Sources

- [Browser bundle](https://github.com/thesysdev/openui/tree/main/packages/browser-bundle)
- [Actions](https://www.openui.com/docs/openui-lang/actions)
- [Reactive state](https://www.openui.com/docs/openui-lang/reactive-state)
- [Existing host precedent: Open WebUI plugin](https://github.com/thesysdev/openwebui-plugin)
