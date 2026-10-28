# Step 3 local validation, 2026-10-28

Companion 0.3.0 implements [personal library v1](personal-library.md). Combined real-T3 acceptance is still user-driven after one session restart. The earlier live approved-message test remains passed; local evidence below does not establish later normal-chat context delivery or frame isolation.

| Metric | Baseline 0.2.1 | Personal v1 | Explicit legacy |
| --- | ---: | ---: | ---: |
| Library prompt characters | 29,832 | 9,841 | 29,832 |
| Schema definitions including helpers | 85 | 13 | 85 |
| HTML bytes | 3,975,899 | 1,010,939 | 3,977,137 |
| JS bytes | 3,607,909 | 1,000,534 | 3,608,073 |
| Component CSS bytes | 363,218 | 4,559 | 363,218 |

Personal has 12 top-level components. HTML includes the shell/shared host styles and license; CSS counts the component stylesheet. Prompt characters decrease 67.0%, HTML bytes 74.6%. Actual tokenizer tokens and latency were not measured. Both resources are under 5 MiB. The actual personal esbuild metafile has no `@openuidev/react-ui` inputs; the supported `@openuidev/react-lang` renderer is retained. No private package import paths were added.

Passed `npm run check`, `npm test` (six tests), and `python3 test/browser-qa.py <artifact-directory>` through agent-browser with the official local SDK AppBridge host. Coverage includes all templates; preserved original legacy demo/decision parsing and bar/line signatures; malformed/invented-action/unresolved/oversized programs; unique stable IDs; required reactive bindings; empty data; selection under search/status/sort; hidden selection retained; keyboard controls and details; opt-in context/focus; compact ID/title/focus handoffs; decline; cleared/stopped context; unavailable context capability; pending request; uncertain transport failure; compact demo description/range/reset; and legacy chart-demo state/context.

All review templates passed screenshots and no-horizontal-overflow checks at desktop 1440×900, inline 728×900 and phone 393×852 in light/dark themes. Additional phone footer captures verify sharing controls, and long unbroken evidence wraps. The test fixture's diagnostics relay is test-only. Captured messages never go to T3. No listener/container/VM was started, and test browsers were closed. Headless phone evidence is not physical-device proof.

The local project records screenshots, JSON reports, exact commands and the combined live acceptance checklist at `/Users/clayblasingame/DEV/misc/openui/docs/step-3-validation.md`. Reproduce the artifacts using the browser QA script; generated files are not needed in the reusable skill checkout.
