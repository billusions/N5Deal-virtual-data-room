# Virtual Data Room — QA Assignment

This is a QA test assignment for N5Deal. Full instructions: [CLAUDE.md](CLAUDE.md).

## Assumptions
- We test the live app (on Vercel and Railway), not a local copy — we don't have the passwords/keys needed to run it locally.
- We looked at the [evo9/virtual-data-room](https://github.com/evo9/virtual-data-room) source code only to design better tests, not to run it ourselves.
- The test accounts are shared with other people. So our tests always make their own new data instead of changing anything that already exists.
- We test the API directly too, not only through the screen (UI).

## Contents
- test-plan.md — what we test and how
- findings-report.md — the bugs we found, sorted by how serious they are
- manual-test-log.md — the full list of manual checks we did, one by one
- testing-approach.md — short note on our approach and how we used AI
- tests/ — the automated tests (API and browser tests, written with Playwright)
- fixtures/manual-testing/ — PDF files we used to test uploading and viewing files
- qa-report.md — the final summary: what we covered, risks, is it ready to release, and what to do next

## How to run the automated tests

We use Playwright (with TypeScript). The tests are split into levels (API tests and browser tests) — see [test-plan.md](test-plan.md) for why.

```
cd tests
npm install
npx playwright install chromium
cp .env.example .env   # already points at the deployed app

npm test              # everything
npm run test:api      # API tests only (fast, no browser)
npm run test:e2e      # browser tests only
npm run report        # last HTML report
```

Set HEADLESS=false in tests/.env if you want to watch the browser while the tests run.

CI (automatic testing): .github/workflows/qa-tests.yml runs all the tests automatically whenever something changes inside tests/. You can also start it by hand from GitHub's website:
1. Open the repo on GitHub → Actions tab.
2. Select QA automated tests in the left sidebar.
3. Click Run workflow (top right) → pick the branch → Run workflow.
4. Click on the run to see the logs while it's working.

To view the report once the run finishes:
1. On the finished run's summary page, scroll down to Artifacts.
2. Download playwright-report (a .zip file) — GitHub can't show it on the page directly.
3. Unzip it and open index.html in a browser.

GitHub keeps these report files for 14 days, then deletes them. So don't save a link to one run's report — it will stop working.

What's inside tests/:
- tests/specs/api/ — calls the backend directly, with no browser: login, access control (Priority 1), sharing and revoking access (Priority 2), and file/folder name clashes (Priority 3/4).
- tests/specs/e2e/ — opens a real Chrome browser against the live app, for the few important flows that only a real browser can check: sign up → create folders → sign out, upload a file → view it, and share → revoke access, using two separate browser sessions (one for the owner, one for the person it's shared with).
- tests/src/support/ — shared helper code: a small API client, a helper to sign up through the UI, a way to make unique test names, and PDF test files made on the fly.

Rules we follow:
- Every test creates its own new user and its own new data, with a unique name. The app and its accounts are shared with other people, so no test ever touches data that belongs to someone else.
- Two tests record known bugs (sharing with yourself, and a space in the login email) using Playwright's test.fail(). They check for the *correct* behavior, which currently fails — that's expected, so the whole test run still shows as green without hiding the bug. If a bug ever gets fixed, that one test will suddenly pass when it shouldn't, and that's the signal to come back and update it.
