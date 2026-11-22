# Frontend routing

Use this reference for UI work in the build loop, or from a design or UI SDK skill. Choose only the branches the task needs.

## Direction and patterns

1. Inspect the project's UI, tokens and primitive library first. Reuse those primitives and their composition conventions; catalog examples are patterns to adapt, not permission to replace the library.
2. For a new screen or a visual redesign, use `frontend-design` for the design intent and `design-taste-frontend` for researched composition and critique (its app-screen branch for dashboards, settings and other working screens). A small fix in an established UI keeps its direction.
3. Before building a component or screen, inspect the personal catalog index at [components.blasingame.dev/llms.txt](https://components.blasingame.dev/llms.txt). Read the relevant pages; use [llms-full.txt](https://components.blasingame.dev/llms-full.txt) when the index or linked pages lack the needed detail. Check applicable `devl` patterns when that skill is available, particularly for React/Next.js components, screens and motion. If a source is unavailable, report that limit and continue from the project's existing components; do not invent catalog contents or install a new tool to bypass access restrictions.
4. Choose the interaction primitive from the project's existing library. Only use `ui-sdk` for work on an existing `@ui-sdk/*` integration or an explicitly authorized pilot. A catalog match, missing widget, generic request for accessible UI, or mention of the SDK while comparing options does not authorize adoption or migration. A pilot stays within the approved surface and dependencies.

Keep the project's package manager and commands (proj uses pnpm only), framework, tokens and model policy. This routing grants no browser or external-action permissions. Design scripts that launch or inspect a browser are browser work too: use the authorized browser workflow and obey repo restrictions. If browsing is forbidden or requires a request the user has not made, skip browser steps and report the missing evidence. Tool choice follows the active harness and repo instructions.

## Proof

Use the repo's verification commands for code correctness. For changed interaction logic, add focused tests at the public interface: meaningful user actions and resulting state, validation, submission, cancellation and error recovery as applicable. Avoid tests that only mirror markup or restate a library's own tests.

- **Functional proof — `ui-qa`:** exercise the affected flow, keyboard and focus behavior, state changes and console/network errors. Test relevant loading, empty, error, disabled and success states, rather than merely showing the default screen. External writes still need the existing authorization.
- **Visual proof — `ui-check`:** inspect screenshots at desktop and phone sizes for layout, wrapping, overflow, hierarchy, contrast and the states changed by the task. Design critique uses this evidence. A screenshot does not establish that a control works.
- **PR evidence — `ui-evidence`:** capture before/after images when requested or required by the repo; these document the change, not functional acceptance.

Run browser checks only when authorized. Without them, complete available static/tests/build checks and name the unverified flows, focus/layout behavior and viewport coverage in the handoff. jsdom, axe and a passing build are useful evidence with different limits; none establishes real-browser, Safari or physical-device acceptance.
