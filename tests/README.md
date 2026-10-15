# Automation framework

Playwright (TypeScript) suite against the live deployed app, split by testing-pyramid level — see [test-plan.md](../test-plan.md) for the approach and priorities.

## Setup

```
npm install
npx playwright install chromium
cp .env.example .env   # already points at the deployed app
```

## Run

```
npm test              # everything
npm run test:api      # API suite only (fast, no browser)
npm run test:e2e      # E2E suite only
npm run report        # last HTML report
```

Set `HEADLESS=false` in `.env` to watch the E2E browser while iterating.

## Layout

- `specs/api/` — hits the backend directly (no browser): auth, access control (Priority 1), sharing/revoke (Priority 2), file/folder name conflicts (Priority 3/4).
- `specs/e2e/` — drives a real Chromium browser against the deployed UI for the few critical journeys the API layer can't verify: sign up → organize → sign out, upload → view, and the share → revoke flow across two independent browser sessions.
- `src/support/` — shared helpers: API client (register/login/CRUD/sharing), UI registration helper, unique test-data naming, PDF fixtures generated in-memory.

## Conventions

- Every test creates its own uniquely-named, throwaway user and data — the deployed app and accounts are shared, so nothing here touches another test's or candidate's data.
- Two tests document known product bugs (self-share, whitespace-in-login-email) using Playwright's `test.fail()`: they assert the *correct* behavior and are expected to fail while the bug exists, so the suite stays green without hiding the bug. If either bug gets fixed, that test flips to an unexpected pass — Playwright reports that as a failure, which is the signal to update it.
