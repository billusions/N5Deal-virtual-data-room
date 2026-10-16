# Testing Approach

Oct 16, 2026 · @Zhanna

## Approach

Risk-based: map the task's requirements (R1–R16, E1–E2), explore manually first with real browsers and two accounts (owner + recipient), then automate the scenarios that matter most if they silently broke — access control, sharing/revoke, and data integrity — following the testing pyramid (unit owned by the developers, API as the bulk of automation, a handful of E2E journeys for what only a real browser can verify). Full detail in [test-plan.md](test-plan.md); findings in [findings-report.md](findings-report.md) and [manual-test-log.md](manual-test-log.md).

## AI usage

AI (Claude Code) was used throughout, always under review — every AI-assisted claim below was checked by actually running it against the live app or reading the product's source, not taken on faith.

- **Requirement analysis & test design:** turning task.md's requirements into the R1–R16/E1–E2 checklist and the risk-based priority ordering in the test plan.
- **Drafting and organizing:** structuring raw exploratory notes into the test plan, a prioritized findings report, and the full execution log — including rewording bug reports into clearer expected/actual statements.
- **Reading the product's source** (controllers, DTOs, access-control logic on GitHub) to write API tests against real routes and validation rules instead of guessing, and to understand *why* certain behavior occurs (e.g. why unauthorized access returns 404 instead of 403, why a revoked public link returns 410).
- **Scaffolding the Playwright framework** (API + E2E projects, shared fixtures/helpers, CI workflow).
- **Live DOM exploration:** before writing E2E tests, drove a real headless browser against the deployed app to discover actual selectors and page flows, rather than writing UI tests blind.
- **Independent verification of manual findings:** re-running key findings against the live API surfaced one correction (L12 — the sharing-email-trim bug is frontend-only, the backend already works) and one new finding (L16 — no "View" item in the file row's actions menu, discovered while writing the viewer test).

Where AI helped most: speed on structure and boilerplate (requirement mapping, report formatting, test scaffolding), and a second pass that caught one of my own findings' incorrect root cause by actually hitting the API instead of assuming. It did not replace judgment on prioritization, severity, or what was actually worth automating — those calls, and verifying every result against the real app, stayed manual.
