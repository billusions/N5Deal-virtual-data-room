# Virtual Data Room — Test Plan

Oct 15, 2026 · @Zhanna

## Goal and scope

The goal is to check whether the deployed Virtual Data Room app meets its original requirements ([task.md](https://github.com/evo9/virtual-data-room/blob/main/task.md)) and is safe to release. The main focus is on access control, sharing, and data integrity (making sure data isn't lost or damaged).

### In scope
- Deployed web app (https://virtual-data-room-ten.vercel.app) and public API (https://virtual-data-room-production.up.railway.app)
- The functional requirements R1–R16, and the two edge cases named in the task (E1, E2)
- Error handling and the look/feel of the app, since the task says this matters most
- Checking again the bugs that the developer's README says are already fixed

### Out of scope
- Performance and load testing — I don't have a separate environment for this; I only looked at how the README describes the system scaling
- Unit tests — these belong to the developers; the existing unit tests in the repo are the base layer of my testing pyramid
- Features the README says were left out on purpose: moving a folder between data rooms, refresh tokens, search, and file versioning (these are known gaps, not bugs)
- Mobile apps and testing on many different browsers — I only used desktop Chrome, plus a quick check with a narrow browser window

## Requirements under test

The requirements come from task.md. Priority shows how bad it would be if that part failed, given that this is a due-diligence product (used to check documents before a business deal).

| ID | Requirement | Priority | Test level |
|----|---|---|---|
| R1 | Email/password authentication | High | API + E2E |
| R2 | Data Room visible only to its owner unless shared | Critical | API + manual |
| R3 | Clean UX, edge cases and error states, no unimplemented features | Medium | Manual |
| R4 | Create and nest folders | High | API + E2E |
| R5 | View contents with breadcrumb navigation | Medium | Manual + E2E |
| R6 | Rename folder | Medium | API + manual |
| R7 | Delete folder with nested content, with warning | High | API + manual |
| R8 | Upload PDFs: multiple, drag-and-drop, per-file progress | High | Manual + E2E |
| R9 | View file in UI | High | Manual + E2E |
| R10 | Rename file, resolve name conflicts | Medium | API + manual |
| R11 | Move file to another folder | Medium | API + manual |
| R12 | Delete file | Medium | API + manual |
| R13 | Share room, folder or file read-only, including nested content | Critical | API + manual |
| R14 | Public link sharing | Critical | API + E2E |
| R15 | Permissioned sharing to specific users | Critical | API + manual |
| R16 | Owner can revoke access | Critical | API + manual |
| E1 | Upload files with the same name | Medium | Manual |
| E2 | Delete a folder while a recipient is viewing it | High | Manual |

## Approach

I test by risk: explore by hand first, then automate the most important and repeatable cases, mostly at the API level.

1. Requirements review — turn task.md into the R1–R16 list, and point out anything unclear or missing (for example: what happens with duplicate upload names, or when a shared item gets deleted).
2. Manual and exploratory testing — testing each area for a set amount of time, using two browsers (one as the owner, one as the person something is shared with), and Chrome's DevTools to slow down the network or go offline.
3. Re-checking old fixes — check again the bugs the README says are already fixed (breadcrumb showing things it shouldn't, old data left after logout, duplicate files after a failed upload retry, empty names).
4. Automation, following the testing pyramid:
   - Unit tests: already written by the developers; I don't add more of these
   - API tests (most of my automated tests): login, access control, sharing, revoking access, name clashes
   - Browser tests (2–4 tests): only the most important user flows
5. Reporting — group what I found by area, and sort it by how serious it is and how much it matters for the business.

Rules for automation: I use Playwright (TypeScript) for both the API and the browser tests. Every test makes its own data with a unique name, because the accounts and the app are shared with other people. Settings and passwords are kept outside the test code, not written directly into it.

AI usage: AI helped with understanding the requirements, coming up with test ideas, writing up the bugs clearly, and writing the repeated setup code for automation. Everything AI produced was checked by actually running it against the app. See [testing-approach.md](testing-approach.md) for more detail.

## Priorities, by risk

Access control comes first. In a data room, data reaching the wrong person is worse than any other kind of bug.

| Priority | Area | Why | Key checks |
|---|---|---|---|
| 1 | Access control | Data reaching the wrong user | Opening another user's room, folder, or file by ID, through the UI and the API; requests with no token or an old token |
| 2 | Sharing and revoke | Read-only access must be checked by the server, not just hidden on screen | The person it's shared with tries to change something via the API; revoking access actually works; checking a public link before and after it's revoked; shared folders pass access down to what's inside them |
| 3 | Data integrity | Losing data for good | Folder delete shows the right counts and removes everything inside; moving and renaming don't break or lose files |
| 4 | Upload | The main workflow, with many ways it can go wrong | Mixing valid and invalid files, fake PDFs, losing the network connection, retrying an upload, name clashes |
| 5 | Session | Login tokens that leak or stay valid too long | Whether the login token still works after logging out; whether old data is still shown after switching users |
| 6 | UX and polish | The task says this matters most, but it's lower risk for the business | Error messages, empty states, breadcrumbs, dialogs, narrow window |

## Environment and test data

I test against the real, shared, live app, so all my test data has a unique name and can be safely thrown away.

- Browser: Chrome (desktop), DevTools for network inspection, throttling and Offline mode
- Accounts: the README's own test accounts (john@example.com as owner, viewer@example.com as recipient), used to double-check results; my own accounts (zhanna.qa.owner@example.com, zhanna.qa.viewer@example.com), used for clean tests that don't depend on anyone else
- Test files: small and multi-page valid PDFs, non-PDF files (JPG, PNG, GIF, SVG), a non-PDF renamed to .pdf, duplicate file names
- Naming: test data is named with a prefix and the time it was created (e.g. qa-room-<timestamp>), so two tests never clash
- Risk with this environment: since accounts are shared, other candidates might change or delete data, which could make a test fail for the wrong reason. I double-check anything unexpected before reporting it as a bug

## When testing starts and ends, and severity levels

Before I start: the app and API must be reachable (the /health check responds), test accounts must be able to log in, and I must have reviewed the requirements.

Ready to release when: there are no open Critical or High bugs; every Critical requirement (R2, R13–R16) has been tested and passes; and the automated tests all pass, except the ones that are meant to fail because they record a known bug.

| Severity | Meaning | Example |
|---|---|---|
| Critical | Data leak, security breach, or losing data for good | Another user can open a private file |
| High | A main feature is broken with no way around it, or something misleads the user right before an action they can't undo | Wrong item count in the delete warning |
| Medium | A feature is broken but there's a way around it, or there's a clear problem with how it looks/feels | Upload retry fails after a connection drop |
| Low | Only about looks, wording, or a small usability issue | Notifications overlapping each other |

## Schedule and deliverables

Up to 24 hours were allowed. Actual time spent came to about 7.5-8.5 hours, with manual testing of the most important areas taking the largest share.

| Block | Time | Output |
|---|---|---|
| Requirements review and test plan | 30m | This test plan |
| Manual and exploratory testing | 5 h | Findings with evidence |
| Findings report | 30m | Findings report, sorted by priority |
| Automation framework and tests | 1-2 h | Playwright repo with API and browser tests, README |
| QA report | 30m | Final QA report with release readiness and next steps |

What I deliver: a test plan, a findings report sorted by priority, automated tests (in this repo), a short note on my testing approach, and a final QA report that also covers how I used AI.
