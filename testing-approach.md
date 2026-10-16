# Testing Approach

Oct 16, 2026 · @Zhanna

## Approach

I test by risk: turn the task's requirements into a checklist (R1–R16, E1–E2), explore by hand first with real browsers and two accounts (one owner, one person it's shared with), logging every result and finding as I go, then use that log to pick what to automate — the cases that would matter most if they broke silently: access control, sharing/revoking access, and data integrity. This follows the testing pyramid: unit tests belong to the developers, most of my automated tests are at the API level, and a few browser tests cover what only a real browser can check. Full detail is in [test-plan.md](test-plan.md); what I found is in [findings-report.md](findings-report.md) and [manual-test-log.md](manual-test-log.md).

## AI usage

AI (Claude Code) was used all through this work, but always checked. Every point below was tested by actually running it against the live app, or checked against the product's own source code (Claude read it; I didn't read it myself) — nothing was just taken on trust.

- Understanding the requirements and planning tests: turning task.md into the R1–R16/E1–E2 checklist, and putting things in priority order by risk in the test plan.
- Writing and organizing: turning rough notes from exploring the app into the test plan, a findings report sorted by priority, and the full step-by-step log — including rewriting bug reports to be clearer about what was expected versus what actually happened.
- Reading the product's own source code (on GitHub) to write API tests against the real routes and rules, instead of guessing, and to understand *why* the app behaves a certain way — for example, why a blocked request returns 404 instead of 403, or why a cancelled public link returns 410.
- Setting up the Playwright test framework (API tests, browser tests, shared helper code, and the automatic CI tests).
- Looking at the real page structure first: before writing browser tests, I used a real (invisible, "headless") browser against the live app to see its actual page structure and flows, instead of writing tests blind.
- Double-checking the manual findings: Claude tested key findings again against the live API, which found one correction (L12 — the email-spacing bug in sharing is only on screen, the backend already handles it correctly) and one new finding (L16 — no "View" option in the file row's menu, found while writing the viewer test).

Where AI helped the most: speed on structure and repeated setup work (turning requirements into a list, formatting reports, setting up tests), and a second check that caught one of my own findings having the wrong explanation, by actually testing the API instead of assuming. AI did not replace judgment on what matters most, how serious something is, or what was really worth automating — those decisions, and checking every result against the real app, were always made by hand.
