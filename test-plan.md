# Virtual Data Room — Test Plan

Oct 15, 2026 · @Zhanna

## Objective and scope

The goal is to assess whether the deployed Virtual Data Room MVP meets its original requirements ([task.md](https://github.com/evo9/virtual-data-room/blob/main/task.md)) and is safe to release, with focus on access control, sharing and data integrity.

### In scope
- Deployed web app (https://virtual-data-room-ten.vercel.app) and public API (https://virtual-data-room-production.up.railway.app)
- Functional requirements R1–R16 and the edge cases named in the task (E1, E2)
- Error handling, UX and basic UI polish, since the task ranks UX first
- Recheck of bugs the developer lists as fixed in the README

### Out of scope
- Performance and load testing (no environment for it; scale reviewed from the README design only)
- Unit tests (owned by developers; existing unit tests in the repo noted as the base of the pyramid)
- Features the README documents as cut: folder move between data rooms, refresh tokens, search, versioning (listed as known risks, not bugs)
- Mobile apps and cross-browser matrix (Chrome desktop only, plus a quick narrow-window check)

## Requirements under test

Requirements are taken from task.md; priority reflects the impact of failure in a due diligence product.

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

Testing is risk-based: explore manually first, then automate the critical and repeatable scenarios, mostly at API level.

1. **Requirements review** — map task.md to requirements R1–R16 and flag gaps and ambiguities (e.g., upload name conflicts, behavior after a shared item is deleted).
2. **Manual and exploratory testing** — time-boxed sessions per area, using two browsers (owner and recipient) and DevTools Network tab with throttling and Offline mode.
3. **Regression of known fixes** — recheck the bugs listed as fixed in the README (breadcrumb leak, logout cache leak, upload retry duplicates, empty names).
4. **Automation following the testing pyramid:**
   - Unit: existing developer tests in the repo; not extended by QA
   - API (most automated tests): auth, access control, sharing, revoke, name conflicts
   - E2E UI (2–4 tests): critical user journeys only
5. **Reporting** — findings grouped by area and prioritized by severity and business impact.

**Automation principles:** Playwright (TypeScript) for both API and UI; each test creates its own uniquely named data and cleans up, because accounts and environment are shared; config and credentials kept outside test code.

**AI usage:** requirement analysis, test idea generation, bug report wording, and automation boilerplate; all output reviewed and verified by running it against the app. See [testing-approach.md](testing-approach.md) for details.

## Risk-based priorities

Access control comes first: in a data room, a leak to the wrong user is worse than any functional defect.

| Priority | Area | Why | Key checks |
|---|---|---|---|
| 1 | Access control | Data leak between users | Another user's room, folder or file by ID via UI and API; requests without or with an old token |
| 2 | Sharing and revoke | Read-only must be enforced server-side | Recipient write attempts via API; revoke takes effect; public link before and after revoke; nested inheritance |
| 3 | Data integrity | Permanent data loss | Folder delete counts and cascade; move and rename keep files intact |
| 4 | Upload | Core workflow, many failure modes | Mixed and invalid files, fake PDFs, network loss, retry, name conflicts |
| 5 | Session | Leaked or stale tokens | Token valid after logout; cached data after switching users |
| 6 | UX and polish | Ranked first by the task, lower business risk | Error messages, empty states, breadcrumbs, dialogs, narrow window |

## Environment and test data

Testing runs against the shared production deployment, so all test data is uniquely named and disposable.

- **Browser:** Chrome (desktop), DevTools for network inspection, throttling and Offline mode
- **Accounts:** README accounts (`john@example.com` as owner, `viewer@example.com` as recipient) for confirmation; own registered accounts (`zhanna.qa.owner@example.com`, `zhanna.qa.viewer@example.com`) for clean, isolated runs
- **Test files:** small and multi-page valid PDFs, non-PDF files (JPG, PNG, GIF, SVG), a non-PDF renamed to .pdf, duplicate file names
- **Naming:** test data prefixed and timestamped (e.g., `qa-room-<timestamp>`) to avoid collisions
- **Environment risk:** shared accounts mean other candidates may change or delete data, causing false failures; unexpected changes are verified before reporting

## Entry, exit and severity

**Entry criteria:** app and API reachable (`/health` responds), test accounts can log in, requirements reviewed.

**Exit criteria (release ready):** no open Critical or High findings; all Critical requirements (R2, R13–R16) tested and passing; automated suite runs green except tests that document known bugs.

| Severity | Meaning | Example |
|---|---|---|
| Critical | Data leak, security breach or permanent data loss | Another user can open a private file |
| High | Core feature broken, no workaround, or misleading before an irreversible action | Wrong item count in delete warning |
| Medium | Feature broken with a workaround, or notable UX failure | Upload retry fails after connection loss |
| Low | Cosmetic, wording or minor UX issue | Overlapping notifications |

## Schedule and deliverables

Work is time-boxed to 24 hours, with automation limited to about 6 hours so manual coverage of the critical areas comes first.

| Block | Time | Output |
|---|---|---|
| Requirements review and test plan | 1–2 h | This test plan |
| Manual and exploratory testing | 5–6 h | Findings with evidence |
| Findings report | 1–2 h | Prioritized bug and findings report |
| Automation framework and tests | 5–6 h | Playwright repo with API and E2E tests, README |
| QA report | 1–2 h | Final QA report with release readiness and next steps |

**Deliverables:** test plan, prioritized findings report, automated tests (this repo), testing approach description, final QA report including AI usage.
