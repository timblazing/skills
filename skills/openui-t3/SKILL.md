---
name: openui-t3
description: Create interactive forms, charts, filters, and decision interfaces inside T3 Code conversations with OpenUI. Use when an in-chat interactive answer is requested or controls would materially help the task, without building a separate agent frontend. Supports a Codex MCP App with agent handoff and an HTML fallback for other providers.
---

# OpenUI inside T3 Code

Use the official `openui` skill for language and component guidance. This companion supports two hosts. Neither needs an inference API key, Gateway account, or separate chat application.

## Prefer the MCP App when available

Discover the `openui` server's `get_openui_instructions`, `render_openui`, and `render_openui_legacy`. Call instructions before generating a new program. The existing agent writes OpenUI Lang; rendering makes no extra inference call. The official React Lang renderer and MCP Apps SDK run inside self-contained bundled resources without a CDN, listener, or inference key.

### Compact personal library (companion 0.3.1)

New programs use `get_openui_instructions({library:"personal"})` then **`render_openui`**. The exact contract is **openui-personal@1**, shared by renderer, generated schema and prompt in `mcp/library.mjs`. Do not use full-library signatures with this renderer.

Use a task template and adapt its complete sample snapshot:

- `template:"decision"`: comparison and shortlist discussion; source `assets/decision-review.openui`.
- `template:"plan"`: plan steps, assumptions and supplied status; source `assets/plan-review.openui`.
- `template:"snapshot"`: searchable/selectable repository findings; source `assets/snapshot-review.openui`. The same component accepts agent-fetched service snapshots with service IDs, status, version/host/evidence criteria and provenance.
- `template:"demo"`: connection test with editable description, range/reset and Send to agent.

The core provides Card, CardHeader, TextContent, Disclosure, Button, Input, Checkbox, Select, Status, ComparisonPanel, ReviewChecklist and SnapshotTable. Read exact positional signatures from the tool. Each workflow uses `(title, provenance, items, selection, focus)`, where rows are `{id,title,status,details,criteria,recommendation?}`. Use unique stable IDs, at most 100 rows, and named string criteria. Bind selection to a declared boolean record `$variable` and focus to a declared string `$variable`; literal unbound workflow state is rejected. Selection does not change supplied completion status. Filtering/search/sorting retain hidden selections and show their count; Clear removes all selections. Ask stays visible and is disabled while nothing is selected. Search matches visible values (title, status, details, criteria values, recommendation), never field names or IDs. Recommendations are explicitly judgments.

For another decision or review, adapt title, source/revision/time, stable IDs, descriptions, criteria, status, rationale and recommendations together. Label examples as sample data. Real snapshots need actual provenance; do not invent measurements, fetch live data from the frame, or treat a review selection as authorization to execute. When selected context arrives with the next normal message, discuss those entries directly without rebuilding the interface unless requested.

### Sharing and explicit requests

Review templates automatically allowlist `selectedOptions` and `reviewFocus`. For custom programs, pass `selectionKeys` naming only the deliberate reactive values (without `$`). Unlisted/private fields must stay out of context. Sharing starts **off**. The user clicks **Share selection**, inspects **Selection details**, waits for **Selection shared with T3; changes update it.**, then types in T3. T3 keeps the shared value until it is replaced or cleared; it is not consumed by one message. **Stop sharing** clears context. Each completed interface writes one empty envelope after connecting, so a remounted frame (default controls) replaces any selection an earlier mount left behind; a failed clear stays visible. Hosts without context support show a disabled control. Updates are bounded, debounced, serialized and deduplicated; they start no turn and do not restore form state.

Explicit workflow Ask sends only selected IDs/titles and focus. **T3 asks the user to approve each message.** Never bypass confirmation, auto-click Send to agent, or claim a real roundtrip from local SDK-host results. If an incoming `OpenUI handoff test` message arrives, acknowledge its supplied description/range without rendering another test or doing file work.

### Full-library compatibility and charts

Existing full-library programs use `get_openui_instructions({library:"legacy"})`, then **`render_openui_legacy`** (optionally `library:"legacy"`). This preserves the original openuiChatLibrary positional signatures as **openui-chat@0.18.1**. Its `template:"demo"` retains the original bar-chart connection test. `assets/decision-review-legacy.openui` preserves the prior decision program for explicit legacy `code`. BarChart and LineChart remain available in legacy; broad chart migration is deferred. The separate tools statically declare matching resource URIs, avoiding dynamic host routing assumptions. The HTML fallback below remains its own full-library/CDN contract.

After source/tool-schema changes, rebuild and use T3's **Restart agent session**, then send another message in the same thread. Mounted frames and loaded tools do not update automatically. The original live approved-message roundtrip passed; 0.3.0 context sharing, normal-chat follow-up, approval/decline and two-frame isolation still need combined user-driven live acceptance. Headless phone checks are not physical-device proof.

See [personal contract, design source, compatibility and checks](references/personal-library.md) and [installation/host boundaries](references/mcp-app.md). Keep upstream `skills/openui/` unchanged.

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
