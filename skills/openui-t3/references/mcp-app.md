# OpenUI MCP App in T3

The `mcp/` package serves two read-only tools:

- `get_openui_instructions`: signatures/prompt from the exact library used by the renderer.
- `render_openui`: validates a completed program and returns an MCP App view. Pass `code` and optional `title`, or `template: "demo"` for the connection test.

The view uses OpenUI's renderer and `openuiChatLibrary`. Its `@ToAssistant` events become MCP Apps `app.sendMessage` requests, including the action's message and one compact selection envelope (explicit action context, falling back to form state for older programs). T3 asks for approval and then queues a turn in the current conversation. The view can open links through the host, but has no live-data `toolProvider`, arbitrary tool access, credentials, persistence, or external network access.

## Selection sharing (integration 0.2.0)

`render_openui` accepts optional `selectionKeys` (up to 20 reactive binding names without `$`). It returns a fresh `interfaceId` for each call. The user opts in with **Share selection**. The preview shows exactly the allowlisted values; unlisted fields never enter model context. No fields are shared by default for custom programs. The connection demo permits `days` and `goal`.

The SDK's advertised `updateModelContext` capability is required. Updates are debounced by 250ms, serialized, coalesced, and deduplicated. Wait for **Selection available to your next message** before using the composer. Stop sharing sends an empty selection envelope; oversized selections clear the previous selection and turn sharing off. Graceful teardown attempts a clear, but abrupt disconnect/remount cannot guarantee it: check visible status. There is no automatic uncertain-message retry or form restoration.

Both context and handoffs use `{version:1, library, interfaceId, title, selection}` with an 8,000-byte UTF-8 limit. Explicit messages are limited to 2,000 characters plus that envelope. Stable IDs must be supplied by the program author. The selected payload is local data for the agent to interpret, never authority to perform external writes.

Local SDK-host checks passed; live T3 selection-context delivery and simultaneous-frame isolation still need user confirmation. The previously confirmed live approved-message roundtrip remains valid for the earlier build.

## Install on another machine

Prerequisites: Node 20+, npm, Codex CLI configured for the same home/environment used by T3.

From this skill's `mcp/` directory:

```sh
npm ci
npm run build
codex mcp add openui -- "$(command -v node)" "$PWD/server.mjs"
codex mcp get openui --json
```

The command records the machine's absolute Node and server paths. Re-register if Node moves after a version-manager upgrade. No HTTP listener, Docker runtime, Gateway account, or LLM API key is involved. Build output and dependencies stay ignored by Git. After syncing source/dependency changes, rebuild with `npm ci && npm run build`.

In T3, open the command palette, choose **Restart agent session**, then send a message in the existing conversation. This is the documented activation step for changed MCP configuration. Do not interrupt a running task just to reload tools. Uninstall with `codex mcp remove openui`; leave other MCP server entries alone.

Ask: "Show the OpenUI connection test." The agent should call `render_openui` with `template: "demo"`. Change the editable experiment description and/or range, click **Send to agent**, and approve T3's message prompt. The resulting agent reply should repeat those values. This user-driven check proves the live T3 roundtrip; a local host fixture does not.

## Checks

`npm test` builds the resource and tests a real MCP stdio connection: tool discovery/metadata, generated instructions, demo/custom program validation, malformed/unresolved/oversized programs, and the self-contained resource/CSP. T3's 5 MiB HTML limit is checked; this build is about 3.8 MiB.

`npm run check` checks JavaScript syntax.

For browser testing without starting any web server:

```sh
node test/make-browser-fixture.mjs /tmp/openui-mcp-browser-test.html
agent-browser --session openui-qa open file:///tmp/openui-mcp-browser-test.html
agent-browser --session openui-qa snapshot -i
```

The fixture uses the official MCP Apps SDK `AppBridge`, a sandboxed iframe, and the actual server's tool result/resource. It captures messages locally and never sends a T3 message. `window.testMode` accepts `approve`, `decline`, `error`, or `delay`. In delay mode, `window.approvePending()` releases the request. Use `?theme=light` for light host variables and `?no-context` for unsupported context capability. `window.contextUpdates` captures context requests; `window.contextDelay` can simulate slow acknowledgements. Inspect `window.handoffRequests` and `window.handoffMessages` to verify duplicate prevention and declined requests. Test at 1440×900 and 393×852 and close the session afterward. This validates the app's protocol behavior, not T3's approval dialog or live agent execution.

## Components and templates

`mcp/library.mjs` is shared by the browser build, prompt generation, and parser schema. Add a custom component there using `defineComponent`, then extend the library with `.extend({ components: { add: [{ component, slots: ["Card.children"] }] } })`. Rebuild afterward. Do not change only the agent prompt or only the browser library.

Keep reusable OpenUI programs in `assets/` and expose named templates only as needed. The initial `mcp-demo.openui` is a connection test, not a requirement to turn every response into a test. A new component must still fit under the resource-size limit.

## Current boundaries

- Current T3 docs specify inline MCP Apps for Codex; other providers show ordinary tool calls. Claude uses this skill's HTML fallback.
- Message approval belongs to T3. The app waits for its result, prevents duplicate sends while pending, displays failures, and never automatically retries an uncertain delivery.
- App actions require the originating provider session to be available. The view remains viewable after an agent stops, but T3 may require sending a message to resume its runtime before actions work.
- No state is persisted across remounts. Partial-input rendering depends on host notifications.
- Dependencies are pinned in the lockfile. npm currently flags upstream OpenUI transitive dependencies (`@ag-ui/core`'s Zod 3 and KaTeX); this first version does not use the headless chat adapters or live tools. The view is sandboxed with no network domains. Do not treat those restrictions as remediation of upstream advisories; check updated packages before broadening exposure or deploying this as a public service.

Sources: [MCP Apps quickstart](https://apps.extensions.modelcontextprotocol.io/api/documents/quickstart.html), [T3 MCP Apps](https://github.com/pingdotgg/t3code/blob/main/docs/user/html-renders.md), [OpenUI component libraries](https://www.openui.com/docs/openui-lang/defining-components).
