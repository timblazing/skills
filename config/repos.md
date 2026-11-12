# Repos

My repo pointers, all under github.com/timblazing. proj's MCP `projects_list` lists registered projects; this map also includes supporting repos such as skills and homelab. On the Mac each repo is at `~/DEV/github/<repo>` unless the table says otherwise, and T3 Code has its own project registry. If a repo isn't checked out on this machine, clone it to that path with `gh repo clone timblazing/<repo>`.

Before changing a repo, read its `AGENTS.md`, and prove the change with its `verify` skill or its AGENTS.md commands.

For changes spanning services, read [the system map](../docs/architecture.md) in the skills checkout. If reading this file through its installed symlink, resolve that link and follow the relative path from its target.

On anton, the installed skills source is `~/.local/share/agent-skills` (resolve `~/.agents/repos.md` to confirm); `~/skills` is another checkout used by agent workflows, not the installed source. proj is at `~/DEV/github/proj`. These locations were checked on 2026-11-12. Discover other checkout paths in the linked environment before cloning; Mac paths are not an inventory of anton. For a missing project checkout, use `~/DEV/github/<repo>` and read its own instructions.

| Repo | What it is | Mac path, if different |
| --- | --- | --- |
| skills | The home repo: skills, the shared AGENTS.md, Claude and Codex config, this file | |
| proj | My dev hub and agent control tower (Next.js, deployed on anton) | |
| components | blasingame.dev, my design system: shadcn/Base UI components, blocks and charts (Fumadocs) | |
| fillrate | Truckload planner: inventory allocation, stop clustering, PyVRP loads | |
| graco-dashboard | Internal CRM and admin dashboard for Graco Roofing & Construction (Bun, Next.js) | |
| picks | Jacob Hays' static site (Cloudflare Pages) | |
| scores | NFL and NBA scores app, web and iOS (ESPN API) | |
| sleeper-fantasy | Sleeper fantasy football dashboard | `~/DEV/github/sleeper-fantasy-dashboard` |
| homelab | Homelab infrastructure docs (Fumadocs) | |

Keep pointers for repos used by shared workflows, even when they are not registered proj projects. Update paths when checkouts move; remove a row when the repo is no longer used.
