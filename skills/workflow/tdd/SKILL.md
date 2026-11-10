---
name: tdd
description: "Called by build when adding or changing logic that has a test seam in reach: red-green loop, one test at a time, tests at public interfaces. Also use when the user asks for test-first, red-green-refactor or integration tests."
user-invocable: false
---

# Test-driven development

Adapted from Matt Pocock's `tdd` skill (MIT, see `../LICENSE-mattpocock`).

The red → green loop, with tests worth keeping.

## Seams

A **seam** is the public boundary you test at: an interface where you can
watch behaviour without reaching inside. Before the first test, pick the
seams. Prefer an existing seam over a new one, and the highest one that
reaches the logic. Fewer seams is better.

- **Interactive:** name the seams with one line each on what they catch and
  what they miss, and ask before writing tests.
- **Unattended:** pick them yourself and list them under Verification in the
  PR so the reviewer can disagree.

## A good test

Tests check behaviour through public interfaces, not implementation. A good
test reads like a spec ("a closed PR leaves Ready for you") and survives a
refactor. Examples: [tests.md](tests.md). Mocking: [mocking.md](mocking.md).

Watch for:

- **Implementation-coupled**: mocks internal collaborators, tests private
  functions, or checks through a side channel. It breaks on a refactor when
  behaviour didn't change.
- **Tautological**: the expected value is computed the way the code computes
  it, so it can never fail. Expected values come from a literal, a worked
  example or the issue.
- **Horizontal**: all tests first, then all code. Work in vertical slices.

## The loop

1. One seam, one failing test. Run it and watch it go **red** for the right
   reason.
2. The least code that turns it **green**.
3. Repeat with the next behaviour, letting what the last cycle taught you
   pick the next test.

Refactoring is not part of the loop. It belongs to review.

Done when every acceptance criterion has a passing test at an agreed seam,
or a line in the PR saying why it has none.
