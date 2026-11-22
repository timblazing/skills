# UI SDK skill provenance

Vendored from [vercel-labs/ui](https://github.com/vercel-labs/ui/tree/8060d16d7a9ab3fc79fee25764607344df078c36/packages/core/skills/ui-sdk) at commit `8060d16d7a9ab3fc79fee25764607344df078c36`, source directory `packages/core/skills/ui-sdk/`. All seven upstream references are retained. The repository root [LICENSE](LICENSE) is copied unchanged (Apache-2.0); no NOTICE file was present in that pinned tree.

Local modifications: narrowed discovery and adoption to existing SDK work or an authorized pilot; linked the shared frontend policy; removed automatic adoption, mandatory bridge/WebMCP integration and blanket test/dependency requirements; kept package-manager and browser choices with the project; made bridge references conditional; report test-only failures honestly. Modified source files carry local adaptation notices. Unmodified references: `patterns.md`, `styles.md`, `web-components.md`.

For updates, compare against this pinned source and preserve the local boundary in [frontend routing](../workflow/build/references/frontend.md). API guidance comes from the project's installed-version docs, not this pin's version assumptions. Review changes to adoption, testing and agent actions before refreshing.
