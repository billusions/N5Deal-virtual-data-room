# Virtual Data Room — QA Assignment

This is a QA test assignment for N5Deal. Full instructions: [CLAUDE.md](CLAUDE.md).

## Assumptions
- I test the live app (on Vercel and Railway), not a local copy. That's the version real users get.
- I didn't read the [evo9/virtual-data-room](https://github.com/evo9/virtual-data-room) source code myself. Claude Code read it to help design the API tests (see AI usage in [testing-approach.md](testing-approach.md)); the code was never run locally.
- The test accounts are shared with other people. So my tests always make their own new data instead of changing anything that already exists.
- I tested by hand through the screen (UI) only. The API is tested directly by the automated tests, not by hand.

## Contents
- [qa-report.md](qa-report.md) — start here: the final summary of what I covered, risks, whether it's ready to release, and what to do next
- [test-plan.md](test-plan.md) — what I test and how
- [findings-report.md](findings-report.md) — the bugs I found, sorted by how serious they are
- [manual-test-log.md](manual-test-log.md) — the full list of manual checks I did, one by one
- [testing-approach.md](testing-approach.md) — short note on my approach and how I used AI
- [tests/](tests/) — the automated tests (API and browser tests, written with Playwright)
- [fixtures/manual-testing/](fixtures/manual-testing/) — PDF files I used to test uploading and viewing files

## How to run the automated tests

I use Playwright (with TypeScript). The tests are split into levels (API tests and browser tests) — see [test-plan.md](test-plan.md) for why.

```
cd tests
npm install
npx playwright install chromium
cp .env.example .env   # already points at the deployed app

npm test              # everything
npm run test:api      # API tests only (fast, no browser)
npm run test:e2e      # browser tests only
npm run test:flaky-check  # run every test 8 times in a row, to catch flaky ones (~5-10 min)
npm run report        # last HTML report
```

To check for flaky tests, run each test several times in a row and see if any of them pass sometimes and fail other times. No retries are configured locally, so every failure shows up — nothing is hidden. `npm run test:flaky-check` runs the whole suite 8 times (about 5-10 minutes); for a different number of repeats, run `npx playwright test --repeat-each=<N>` directly. Safe to stop early with Ctrl+C — each repeat is independent, so a partial run is still useful.

Set HEADLESS=false in tests/.env if you want to watch the browser while the tests run.

CI (automatic testing): [.github/workflows/qa-tests.yml](.github/workflows/qa-tests.yml) runs all the tests automatically whenever something changes inside tests/. You can also start it by hand from GitHub's website:
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
- tests/specs/api/ — calls the backend directly, with no browser: login, access control (Priority 1), sharing and revoking access (Priority 2), file/folder name clashes (Priority 3/4), and downloaded file names.
- tests/specs/e2e/ — opens a real Chrome browser against the live app, for the few important flows that only a real browser can check: sign up → create folders → sign out, upload a file → view it, and share → revoke access, using two separate browser sessions (one for the owner, one for the person it's shared with).
- tests/src/support/ — shared helper code: a small API client, a helper to sign up through the UI, a way to make unique test names, and PDF test files made on the fly.

Rules I follow:
- Every test creates its own new user and its own new data, with a unique name. The app and its accounts are shared with other people, so no test ever touches data that belongs to someone else.
- Three tests record known bugs (sharing with yourself, a space in the login email, and parentheses in a downloaded file name) using Playwright's test.fail(). They check for the *correct* behavior, which currently fails — that's expected, so the whole test run still shows as green without hiding the bug. If a bug ever gets fixed, that one test will suddenly pass when it shouldn't, and that's the signal to come back and update it.
