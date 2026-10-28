# Personal library v1 (companion 0.3.0)

New interfaces use `get_openui_instructions({library:"personal"})` and `render_openui`.
The shared `mcp/library.mjs` defines **openui-personal@1** for renderer, schema and generated prompt. Read the generated instructions for exact positional signatures. It has 12 top-level components and 13 schema definitions (including a helper action type).

- Composition: `Card`, `CardHeader`, `TextContent`, `Disclosure`.
- Controls: `Button`, `Input`, `Checkbox`, `Select`.
- Supplied status: `Status`.
- Workflows: `ComparisonPanel`, `ReviewChecklist`, `SnapshotTable`.

Each workflow takes `(title, provenance, items, selection, focus)`. Items are plain objects `{id,title,status,details,criteria,recommendation?}`; `criteria` maps named criteria/fields to string values. At most 100 rows; IDs must be unique, 1–120 characters, beginning with a letter/digit and containing only letters, digits, `.`, `_`, `:`, `/`, or `-`. Bind `selection` to a declared boolean-record `$variable` and `focus` to a declared string `$variable`. The server rejects duplicate/unsafe IDs and unbound workflow selection/focus. Only `true` record entries represent selection; stale IDs are ignored when composing explicit messages.

Search examines row text, including details/criteria. Status filtering and title/status sorting change visibility/order, preserving selections. A visible summary counts hidden selections. Clear removes the entire selection, including hidden entries. Disclosure reveals rationale, named criteria and any explicitly labeled recommendation judgment. Snapshot rows form a semantic table on desktop and readable stacked entries on phones. Checklist status is supplied data; only literal `complete` counts toward its supplied completion summary. Selecting a step never changes completion. Every workflow handles no rows and no search results. Empty selection disables Clear and omits Ask.

Explicit Ask sends only selected stable IDs/titles and focus. It requests discussion, never execution. Opt-in context sharing observes the same bound values. Allowlist only the selection/focus variables; do not share the complete snapshot or private inputs. Normal follow-ups should discuss the existing selected context without rebuilding the frame.

## Templates

- `template:"decision"`: `assets/decision-review.openui` uses ComparisonPanel.
- `template:"plan"`: `assets/plan-review.openui` uses ReviewChecklist.
- `template:"snapshot"`: `assets/snapshot-review.openui` uses SnapshotTable.
- `template:"demo"`: `assets/compact-demo.openui` retains description, range, reset and approved-message testing.

Review templates allowlist `selectedOptions` and `reviewFocus`. Adapt all sample title/provenance/IDs/criteria/status/evidence together. Samples are labeled examples, not claims about actual repositories. Real snapshots must name their source, revision and collection time. A service snapshot uses the same SnapshotTable: service stable ID/name/status, details, and criteria such as host/version/health evidence, plus source/time/revision in provenance. Fetch permitted data with agent tools first; the frame has no live-data provider or credentials.

## Compatibility and charts

Existing full-library programs must use `get_openui_instructions({library:"legacy"})`, then **`render_openui_legacy`**. It serves `openui-chat@0.18.1` with every original positional signature. `template:"demo"` there loads the unchanged `assets/mcp-demo.openui`, including its bar chart. The previous decision source is preserved as `assets/decision-review-legacy.openui` for explicit legacy `code`. BarChart and LineChart remain available with their original signatures in this profile; broad chart migration is deferred.

Each renderer tool statically declares its own resource URI; no result metadata override is needed for host routing. Parser/tool result/resource/context envelope identify the same library. The app rejects a completed result identifying a different library. Old mounted legacy frames retain their original resource URI, but no persistence or restoration is promised. The HTML/CDN fallback is unchanged and uses its own full-library contract; do not pass personal components to it.

## Design source and updates

The read-only Components checkout was verified clean at `107bbc7fd6e5ef439a328cff0ca20285ca153106` (2026-10-28). Reference patterns: `src/app/global.css`, table-03/table-05 filtering/selection, onboarding-03 status presentation. Source: https://github.com/timblazing/components/tree/107bbc7fd6e5ef439a328cff0ca20285ca153106 . MIT notice is retained in `mcp/COMPONENTS-LICENSE.txt` and emitted resources.

The adapter uses host appearance and transparent background, SF Pro/system body typography, neutral semantic surfaces, 6/8px radii, quiet row rules, labeled native controls, visible keyboard focus, and 44px phone controls. No extra font or site shell is loaded. Native controls supply the behavior needed here; copying Base UI and its Tailwind dependency graph provided no concrete benefit for these bounded controls. `mcp/personal.css` is the scoped CSS equivalent of the reference styling. No Tailwind JSX is pasted without compiled styles.

To update: inspect a new Components revision read-only, compare those source patterns/tokens, update this pinned reference and license as needed, adapt scoped CSS, build, run protocol plus SDK-host browser QA, and record new measurements/screenshots. Do not edit the Components site or upstream `skills/openui/` for this companion.

## Build and verification

`npm test` builds personal and legacy resources, checks both against the 5 MiB cap and tests the real stdio protocol. `dist/measurements.json` records prompt characters, schema definitions, HTML/JS/CSS bytes separately. Tokenizer tokens and latency are not measured. `dist/*-metafile.json` records esbuild's actual inputs; the personal bundle has no react-ui dependency. All imports use supported package exports. `legacy-library.mjs` is the explicit compatibility entry; the build aliases the shared renderer to it only for legacy.

Run `python3 test/browser-qa.py /tmp/openui-step3-qa` from `mcp/` for repeatable agent-browser SDK-host checks plus desktop 1440×900, inline 728px and phone 393×852 light/dark screenshots. The test fixture adds a test-only diagnostics relay, not a production host bridge. It captures messages locally; it never sends a T3 message. It closes its browser session and starts no server.

After publishing/building, restart the T3 agent session once and render fresh decision/plan/snapshot frames. User-driven acceptance still needs share/change/clear followed by normal chat, explicit request approval/decline, and two-frame context isolation. Local checks and headless phone viewports do not prove live T3 delivery or physical-device behavior.

See [recorded step 3 measurements and local validation](step-3-evidence.md).
