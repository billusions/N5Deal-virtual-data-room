# Virtual Data Room — QA Assignment

QA practical assignment for N5Deal. Brief: [CLAUDE.md](CLAUDE.md).

## Assumptions
- Target is the deployed app (Vercel + Railway), not a local setup — no infra secrets provided.
- [evo9/virtual-data-room](https://github.com/evo9/virtual-data-room) source used only for white-box test design.
- Test accounts are shared — tests create their own throwaway data rather than touching shared state.
- API is tested directly, not just through the UI.

## Contents
- `test-plan.md` — scope and approach
- `findings-report.md` — bugs, grouped and prioritized
- `manual-test-log.md` — full requirement-by-requirement execution log
- `testing-approach.md` — short description of the approach and AI usage
- `tests/` — automated suite (API + E2E, Playwright/TypeScript)
- `fixtures/manual-testing/` — PDFs used for manual upload/viewer testing
- `qa-report.md` — final summary (coverage, risks, release readiness, next steps)

## Running the automated suite

Playwright (TypeScript), split by testing-pyramid level — see [test-plan.md](test-plan.md) for the approach and priorities.

```
cd tests
npm install
npx playwright install chromium
cp .env.example .env   # already points at the deployed app

npm test              # everything
npm run test:api      # API suite only (fast, no browser)
npm run test:e2e      # E2E suite only
npm run report        # last HTML report
```

Set `HEADLESS=false` in `tests/.env` to watch the E2E browser while iterating.

**CI:** `.github/workflows/qa-tests.yml` runs the full suite automatically on pushes to `tests/**`. To run it manually from GitHub's UI:
1. Open the repo on GitHub → **Actions** tab.
2. Select **QA automated tests** in the left sidebar.
3. Click **Run workflow** (top right) → pick the branch → **Run workflow**.
4. Click into the run to watch live logs.

To view the report once the run finishes:
1. On the finished run's summary page, scroll down to **Artifacts**.
2. Download **playwright-report** (a `.zip`) — GitHub doesn't render it inline.
3. Unzip it and open `index.html` in a browser.

Artifacts are kept for 14 days, then GitHub deletes them — the link to a specific run's artifact isn't permanent, so don't bookmark one.

**Layout:**
- `tests/specs/api/` — hits the backend directly (no browser): auth, access control (Priority 1), sharing/revoke (Priority 2), file/folder name conflicts (Priority 3/4).
- `tests/specs/e2e/` — drives a real Chromium browser against the deployed UI for the few critical journeys the API layer can't verify: sign up → organize → sign out, upload → view, and the share → revoke flow across two independent browser sessions.
- `tests/src/support/` — shared helpers: API client, UI registration helper, unique test-data naming, PDF fixtures generated in-memory.

**Conventions:**
- Every test creates its own uniquely-named, throwaway user and data — the deployed app and accounts are shared, so nothing here touches another test's or candidate's data.
- Two tests document known product bugs (self-share, whitespace-in-login-email) using Playwright's `test.fail()`: they assert the *correct* behavior and are expected to fail while the bug exists, so the suite stays green without hiding the bug. If either bug gets fixed, that test flips to an unexpected pass, which is the signal to update it.
