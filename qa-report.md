# Virtual Data Room — QA Report

Oct 16, 2026 · @Zhanna

## What was tested

I tested the full functional scope of the deployed app (Vercel for the frontend, Railway for the API): logging in (R1), owner-only visibility (R2), folders (R4–R7), files (R8–R12), and sharing/public links/revoking access (R13–R16), plus the two named edge cases (E1, E2). I tested by risk — manual and exploratory testing first (two accounts, two browsers, slowing or cutting the network with DevTools), then automated the cases that would matter most if they broke silently later. See [test-plan.md](test-plan.md) for scope and method, [manual-test-log.md](manual-test-log.md) for the full step-by-step log, and [testing-approach.md](testing-approach.md) for how I used AI.

Not tested, and why: performance/load testing — I don't have a separate environment, so this would mean putting load on the shared live system that other candidates also use; unit tests — these belong to the developers; features the README says were left out on purpose (moving a folder between data rooms, refresh tokens, search, file versioning); and testing on mobile or many different browsers.

## Key issues and risks

No Critical or High severity bugs. The two riskiest areas for a due-diligence product — owner-only visibility (R2) and sharing/revoking access (R13–R16) — passed every check, both manual and automated: no user can see another user's data through the UI or the API, revoking access works right away, and changing the ID in a public link to reach something else is correctly blocked.

5 Medium findings, mostly related to uploads, downloads and data integrity:
- M1 — the delete confirmation doesn't warn that a folder is shared (people it's shared with silently lose access)
- M2 — a non-PDF file renamed to .pdf gets accepted and then fails to open (the app only checks the stated file type, not the real file content)
- M3 — retrying an upload after a dropped connection fails with a confusing "status 400" (the real cause: the retry sends the file to the same one-time storage link again, instead of just confirming the upload)
- M4 — a long file name breaks the file-list table layout and hides the row's actions menu
- M5 — a downloaded file whose name contains parentheses or "&" is saved with an encoded name ("Lorem ipsum (5).pdf" → "Lorem ipsum %285%29.pdf"), which hits every duplicate the app renames itself

18 Low findings — mostly about look, feel, and wording; full list in [findings-report.md](findings-report.md). I made one correction while automating: L12 (email with a space, in sharing) turned out to be a bug only on screen — the API itself already removes the space and accepts it correctly.

3 open risk items, marked for the team to make a clear decision on rather than reported as bugs, since they might be deliberate choices for a first version: no login lockout or limit that I could find; login tokens aren't cancelled on the server when you log out (they last 7 days, with no refresh, by design); and a download link opened just before access is revoked keeps working for the rest of its roughly 5-minute lifetime.

## Automated coverage

Written with Playwright (TypeScript), split by level, in tests/:

| Level | Tests | Covers |
|---|---|---|
| API | 29 | Login (not case-sensitive, password rules, can't guess which part of a login attempt was wrong), access control (blocking other users from every type of data), sharing/revoking access (shared access passes down to what's inside, public links only reach what they should, users are kept separate from each other), how file/folder name clashes are solved, whether delete removes the right things, and downloaded file names |
| Browser | 4 | Sign up → organize folders → sign out, upload a file → view it, rejecting a non-PDF file, and share → read-only access → revoke (using two separate browser sessions) |

33 out of 33 tests pass. Three tests are written on purpose to record known bugs (L1, sharing with yourself; L12b, a space in the login email; M5, parentheses in a downloaded file name), using Playwright's test.fail(). They check for the *correct* behavior, which currently fails as expected, so the whole run still shows green without hiding the bug. If any of these bugs gets fixed, that one test will start *failing* instead — that's the signal to go update it. CI (.github/workflows/qa-tests.yml) runs the tests automatically on changes inside tests/, or any time from the Actions tab.

Not automated, on purpose: visual/layout bugs (M4, the breadcrumb not shortening) and the two network-related bugs (M3, L7) — these depend on how the page actually renders, or on exact network timing, which isn't practical to test reliably right now. They're covered in the manual log instead.

## Release readiness

Ready to release, for the areas I tested, with the 5 Medium findings as the list to fix before release — none of them block the release (each one has a way around it, or is only about look/feel), but M2 (accepting fake PDF content) and M1 (deleting a shared folder with no warning) are the two worth fixing first, given this is a due-diligence product. The 3 open risk items need a clear decision from the team — whether each one is a deliberate choice or a real gap — instead of shipping either way without deciding.

## What's next

- Automate M1 and M2 once I can trigger them reliably through the API (M2 needs an upload request where the stated file type doesn't match the real content; M1 needs a check that the delete-preview mentions active shares).
- A simple visual check for the table/breadcrumb layout bugs (M4, L8) — these are hard to catch any other way.
- Check the 3 open risk items directly with the dev team, and get a clear decision on each one.
- Performance/load testing, once there's a separate environment where it's safe to test this without affecting anyone else.
- Add a few more browser tests: layout on a narrow screen, using the keyboard (Enter/Esc in dialogs), and a check that the duplicate-nested-share bug (L13) doesn't come back.
