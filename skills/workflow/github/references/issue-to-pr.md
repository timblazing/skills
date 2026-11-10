# Issue to PR

Take a GitHub issue to a tested PR with honest CI reporting. Branch and PR mechanics are in `pr-workflow.md`; policy and tiers are in the `pr-workflow` skill; the PR body is `file-pr`.

1. **Read the live issue and its full thread**: `gh issue view N --comments`. The newest comments hold the current state: partial fixes, maintainer decisions, questions to you. Read the repo's `AGENTS.md` and contribution docs too. Know the wanted behaviour, non-goals and open questions.
2. **Sweep for existing work**: `gh pr list --search "#N" --state all`, plus a couple of keyword searches for the symptom, and `git log --oneline -20 -- <files>`. If a PR already covers it, tell the user instead of building a duplicate.
3. **Validate the premise** on the current default branch: reproduce the bug or show the gap, ideally with a failing test. Then check intent: `git log -p -S "<symbol>"` on the code the issue wants changed. A restriction is sometimes deliberate. If the issue is wrong or stale, say so and ask.
4. **Define done**: acceptance criteria, each tied to a test or a check, plus risks (migrations, compatibility, security).
5. **Smallest complete change**: reproduction first (see "Fixing bugs" in `pr-workflow`). When the fix is in hand, search for the same bug shape at sibling call sites and fix them in this PR. Every changed line traces to the issue; no drive-by cleanup.
6. **Check the test bites**: temporarily restore the old behaviour, confirm the new test fails, put the fix back, confirm it passes.
7. **Run the repo's checks**, then open the PR (`file-pr`) with `Closes #N` in the body. Read it back: base, head, title, files.
8. **Report CI from live evidence** (`ci.md`). Separate failures your diff caused from baseline or infra failures; reproduce on the default branch if unsure.
9. **Close the loop**: when the user has it merged, the issue closes itself via `Closes #N`. If you comment on the issue, link the PR, one line, and end with the proj status marker (`done` once it's finished).

Pitfalls: coding before reading comments, "fixing" intended behaviour, fixing one call site while siblings keep the bug, a regression test that passes without the fix, saying "delivered" because a PR exists.
