# Virtual Data Room — Findings Report

Oct 15, 2026 · @Zhanna · See [test-plan.md](test-plan.md) for methodology and severity definitions, and [manual-test-log.md](manual-test-log.md) for the full requirement-by-requirement execution log this report is drawn from.

## Summary

No Critical or High severity bugs were found. Access control (R2) and sharing/revoke (R13–R16) — the two highest-risk areas for a due diligence product — passed every manual check performed. Findings are concentrated in upload error-handling and UI polish.

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 4 |
| Low | 17 |
| Open risk items (not confirmed bugs) | 3 |

## Medium

### M1 — [Delete folder] Confirmation dialog doesn't warn that the folder is shared
**Area:** Data integrity (R7) · **Why it matters:** A data room is used in live deals; cutting off a buyer's access without warning matters.
**Expected:** Dialog states something like "This folder is shared with 2 people and has a public link. They will lose access."
**Actual:** Warning shows item/size counts but no mention of active shares.

### M2 — [Upload] Non-PDF file renamed to `.pdf` is accepted, then fails to open in the viewer
**Area:** Upload (R8) · **Why it matters:** In due diligence, a document that looks valid in the list but is actually broken is a real problem; accepting arbitrary content under a `.pdf` name is also a content-validation gap.
**Expected:** Upload rejected with a message like "This file isn't a valid PDF."
**Actual:** Upload succeeds; opening the file shows the browser error "Failed to load PDF document," and the viewer header shows an internal file ID (`0b491ba5-...`) instead of the file name (`1.pdf`).

### M3 — [Upload] Retry after connection loss fails with status 400; file can't be recovered
**Area:** Upload (R8) · **Why it matters:** Uploads on unstable connections can't be completed via retry — the user has to start over, with no indication why.
**Steps:** Upload 3 PDFs → go Offline mid-upload → "Some uploads failed – Network Error" → go back online → click Retry.
**Expected:** The file uploads successfully and appears once.
**Actual:** Retry fails with "Upload failed with status 400." Network log shows the retry re-sending the file to the *same* storage URL, which the storage layer rejects (`409 Duplicate – "The resource already exists" (KeyAlreadyExists)`) instead of re-confirming the existing upload. The UI surfaces this as a generic, misleading "status 400."
**Related:** L7 (failed uploads reserve file names) shares the same root cause — abandoned uploads are not cleaned up server-side.

### M4 — [File list] Long file name is not truncated — table expands and pushes columns off-screen
**Area:** UX/polish (R3, R10) · **Why it matters:** One long name breaks the layout for the entire folder and hides the row's `⋮` actions menu.
**Expected:** Long names truncate with `…`; full name on hover; columns stay in place.
**Actual:** Full name shown on one line, table gains horizontal scroll, Size/Modified/actions pushed out of view.

## Low

| # | Area | Finding | Note |
|---|---|---|---|
| L1 | Sharing | Owner can share an item with their own email; it appears in "Shared with me" | Expected to be blocked with a message |
| L2 | Navigation | "My data rooms" label implies multiple rooms, but a user has exactly one with no way to create another | Naming/IA mismatch with actual capability |
| L3 | Upload | File-type rejection message states the problem but not what to do (e.g. `"huge_flower.jpg is not a PDF"`) | Suggest: `"huge_flower.jpg can't be uploaded. Only PDF files are supported."` |
| L4 | Upload | Error toast visually overlaps the upload progress panel when a PDF and non-PDF are uploaded together | Notifications should stack, not cover each other |
| L5 | Upload | Rejected-files list has very low text contrast, and renders as one long comma-separated line | Hard to read; unbounded with 20+ rejections — show one per line or "and N more" |
| L6 | Upload | Error wording is technical ("Network Error", "status 400") rather than user-actionable | E.g. "Upload failed. Check your connection and try again." |
| L7 | Upload | Failed uploads still reserve their file name; a re-upload of the same file gets renamed (`(4)` instead of `(3)`) even though nothing with that name is visible | Same root cause as M3 — abandoned uploads not cleaned up (README documents this) |
| L8 | Navigation | Breadcrumb is not truncated for deep paths / long folder names — spans multiple lines and keeps growing | Low; would be Medium if it breaks layout on a narrow screen |
| L9 | Folders | Folder name is capped at 50 characters with no message — typing silently stops | User doesn't know why typing stopped; suggest a character counter or a "Max 50 characters" hint. Also inconsistent with file rename, which does show "Name is too long" (see manual-test-log R4 vs R10) |
| L10 | File viewer | Viewer header shows the PDF's internal title or a storage ID instead of the data room file name | Observed specifically for broken/untitled PDFs (see M2); normal PDFs displayed the correct name correctly in retest |
| L11 | Rename | Rename dialog doesn't preselect the current name on open | User must manually delete the old name first; for files, ideally select only the name part (not `.pdf`) |
| L12 | Sharing | Share dialog's **client-side** validation rejects an email with a trailing/leading space (`"Enter a valid email"`) | **Corrected during automation:** confirmed frontend-only — the API itself (`CreateShareDto`) already trims the email server-side and the share succeeds (verified directly against the live API). Fixing the share dialog's input validation to trim before checking would resolve this with no backend change needed |
| L12b | Auth | Login/register reject an email with a leading/trailing space **at the API itself**, not just the UI | Different root cause from L12, despite the similar symptom: `LoginDto`/`RegisterDto` have no trim-before-validate step, so the backend rejects it directly (400) regardless of what the UI does. Automated as a known-failing test in `tests/api/auth.spec.ts` |
| L13 | Sharing | A folder shared directly *and* via a shared parent appears twice for the recipient | Arguably acceptable, but confusing without a hint like "Already shared through 'parent folder'" |
| L14 | Shared with me | List doesn't show who shared an item or which data room it came from | Matters once a recipient receives items from multiple parties |
| L15 | File list | No total item count shown for large folders using infinite scroll | Suggest e.g. "124 items" |
| L16 | File list | Row actions menu (⋮) has no "View"/"Open" item — Rename, Move, Download, Share, Delete only | Opening a file only works by clicking the row itself; not discoverable from the menu. Found while writing the E2E viewer test |

## Open risk items (not confirmed bugs — flagged for explicit product sign-off)

These were not conclusively verified as pass or fail in this testing pass; they are architectural trade-offs worth a deliberate decision rather than silent defaults.

- **No observed lockout or rate limit on repeated failed login attempts.** Not confirmed to be absent — worth explicit verification before release, given the product's due-diligence use case.
- **JWTs are not revoked server-side on logout** (by design — README documents 7-day expiry, no refresh). A token captured before logout (e.g. via DevTools) may remain valid until natural expiry. Acceptable if this is a conscious trade-off for an MVP; should not be an unexamined default.
- **A signed file-download URL opened before an access revoke remains valid for up to 5 minutes after the revoke** (signed URL lifetime, documented in the README). Verified: a link worked immediately after revoke and expired ~5 minutes later. Acceptable as a known, bounded window, but should be called out explicitly in release notes.
