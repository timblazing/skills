---
name: openui-t3
description: Create interactive forms, charts, filters, and decision interfaces inside T3 Code conversations with OpenUI. Use when an in-chat interactive answer is requested or controls would materially help the task, without building a separate agent frontend. Supports a Codex MCP App with agent handoff and an HTML fallback for other providers.
---

# OpenUI inside T3 Code

Use the official `openui` skill for language and component guidance. This companion supports two hosts. Neither needs an inference API key, Gateway account, or separate chat application.

## Prefer the MCP App when available

Discover the `openui` MCP server's `get_openui_instructions` and `render_openui` tools. Call the instructions tool for exact component signatures, then render the generated program with `render_openui`. The existing agent writes OpenUI Lang; the tool serves the interactive UI and makes no extra model call. For the connection test, call `render_openui` with `template: "demo"` and a descriptive title.

The MCP App uses the official OpenUI React runtime, a single shared library definition, and the MCP Apps SDK. It bundles scripts and CSS into its HTML resource, so rendering requires no CDN or listening port. The Node MCP server is launched on demand over stdio by Codex.

OpenUI's `@ToAssistant` actions request a message into the current T3 conversation. **T3 asks the user to approve every message.** Never bypass that confirmation, auto-click Send to agent, or claim a real roundtrip passed based only on a local test host. An app message starts or queues an agent turn after approval. If the user sends a connection-test message, acknowledge its supplied description/range; do not rebuild or render another test in response.

T3 currently documents inline MCP Apps for Codex. For Claude or a host without MCP Apps, use the HTML fallback below. After MCP configuration changes, use T3's **Restart agent session** command and send another message in the same conversation; installing a skill alone does not refresh the current runtime's MCP tools.

Read [references/mcp-app.md](references/mcp-app.md) for installation, tests, custom components, and host limitations. MCP App source is in [mcp/](mcp/).

## HTML fallback workflow

1. Discover `html_preview` and `html_render`. If unavailable, generate the HTML file and explain that this client cannot display the interactive artifact inline; do not claim it was rendered.
2. Write OpenUI Lang to a UTF-8 `.openui` file. Start with `root = Card(...)`. Use the component signatures from the exact browser bundle, rather than assuming `openuiLibrary` and `openuiChatLibrary` have identical roots or children.
3. Run `python3 <this-skill>/scripts/render.py input.openui --out interface.html --title 'Interface title'`.
4. Read the output HTML and send its contents to `html_preview`, then inspect its screenshot and console. Fix errors and check at about 390px as well as desktop width. Use `agent-browser` if functional interaction tests are needed; a preview image alone does not prove clicks work.
5. Send the same HTML to `html_render`, with `contentHeight` from preview and a descriptive title. This shows the actual interactive interface in the conversation. No local server is needed.

The output uses pinned browser-bundle **0.2.1** from jsDelivr, so first load requires network access. If embedding policy blocks that CDN, report the actual error; do not silently replace OpenUI with a hand-built imitation. The wrapper exposes `window.openuiLibraryPrompt`, generated from the matching runtime library with bindings and built-in functions enabled. It also exposes `window.openuiDiagnostics` for parse/error/state/action inspection. For a new component, inspect the matching prompt/schema in a browser or read the pinned package source.

## Interaction boundaries

- `$variables`, `@Set`, `@Reset`, forms, and calculations run locally inside the artifact.
- In the HTML fallback, `@ToAssistant` reaches `onAction` and displays selectable JSON for manual paste. It **does not submit a T3 message**. Only the MCP App supplies the supported conversation bridge.
- Do not guess `postMessage` event names or call private T3 endpoints. Use the MCP Apps SDK for the app's bridge.
- `Query` and `Mutation` require a real `toolProvider`. Neither implementation supplies one or gives browser code access to CLI/MCP credentials. Fetch data with the agent's tools, then embed the permitted snapshot. External writes still need the user's authorization.
- State lasts for the current artifact instance only. Reloads/remounts are not persistence. The MCP App accepts partial tool-input notifications when the host provides them; do not promise live token streaming for a host that only supplies completed input/results.
- Keep the upstream `openui` skill unchanged. Its Gateway recommendation is for inference integrations; this workflow uses the existing Claude/Codex session to generate Lang and makes no extra inference request.

## Sources

- [Browser bundle](https://github.com/thesysdev/openui/tree/main/packages/browser-bundle)
- [Actions](https://www.openui.com/docs/openui-lang/actions)
- [Reactive state](https://www.openui.com/docs/openui-lang/reactive-state)
- [Existing host precedent: Open WebUI plugin](https://github.com/thesysdev/openwebui-plugin)
- [T3 visual replies and MCP Apps](https://github.com/pingdotgg/t3code/blob/main/docs/user/html-renders.md)
