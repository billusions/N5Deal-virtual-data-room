# Manual Test Execution Log

Oct 15, 2026 · @Zhanna · Requirement-by-requirement checklist executed against the deployed app. "Fine" = passed as expected. Findings are cross-referenced to [findings-report.md](findings-report.md) (M = Medium, L = Low, Risk = open risk item).

## Fixtures (R8/R9)

PDF files used for upload/viewer testing, in [fixtures/manual-testing/](fixtures/manual-testing/):

| File | Purpose |
|---|---|
| `simple-invoice.pdf` | Baseline valid PDF, normal size |
| `lorem-ipsum.pdf` | Valid PDF with an embedded title (viewer-name display check) |
| `lorem-ipsum-201-pages.pdf` | Multi-page PDF — scroll/load behavior |
| `broken.pdf` | Non-PDF bytes renamed to `.pdf` — see finding M2 |
| `99mb.pdf` | Oversized file — upload size-limit check (~50MB boundary) |
| `not-a-pdf.txt` | Plain text file — non-PDF upload rejection (used by the E2E suite too) |

## R1. Authentication
- Register with valid data → logged in, room created automatically — fine
- Same email twice → clear error, no crash (known-fixed-bug retest) — fine
- Same email, different case (`Test@Example.com` vs `test@example.com`) — fine
- Email with leading/trailing spaces — rejected rather than trimmed, confirmed via API automation (see L12b)
- Empty fields, invalid email format → clear messages — fine
- Password rules: very short (1 char) accepted; very long capped at 72 characters (bcrypt limit)
- Login with valid credentials → "My data rooms" — fine
- Wrong password or unknown email → error doesn't reveal which was wrong — fine
- Many wrong password attempts → no lockout observed; not conclusively tested (see Risk items)
- Sign out → redirected to login — fine
- After sign out, browser Back → no private data shown — fine
- Private URL (`/folder/<id>`) while logged out → login page — fine
- After login from that redirect → UX note: returns to root, not the originally requested page
- Sign out as owner, log in as viewer → no cached owner data (known-fixed-bug retest) — fine
- Token after logout reused directly against the API → not conclusively tested (see Risk items; no server-side revocation by design)
- Session expiry after 7 days → not testable in this window; documented behavior only
- Two tabs, sign out in one → other tab correctly requires re-auth on next action

## R2. Owner-only visibility (Critical)
- Owner's folder URL opened as another logged-in user → denied — fine
- Owner's file URL opened as another user → denied — fine
- Same URLs logged out → login page — fine
- Viewer can't see the owner's other items in "Shared with me" or by search — fine
- API with no token → 401 — fine
- API with a fake/broken token → 401 — fine
- Error responses don't leak names/details of private items — fine

**All R2 checks passed.**

## R3. UX, edge cases, error states
- Every button/menu item does something; no dead or "coming soon" options — fine
- Every action shows feedback (toast, loading state, or error) — fine
- Error messages are user-friendly → see L6 for exceptions
- Empty states (empty room, empty folder, empty "Shared with me") — fine
- Loading states under Slow 4G → spinners/skeletons, no frozen UI — fine
- Double-click on Create/Share/Delete → no duplicates — fine
- Keyboard: Enter submits dialogs, Esc closes them, sensible Tab order — fine
- Narrow window (~400px) → usable, nothing overlaps — fine
- Long names in list/breadcrumb/dialogs → see M4, L8
- Unknown URL (`/abc`) → proper 404 with a way back — fine
- Deleted item URL → clear "not found" message — fine
- Browser zoom 200% → still usable — fine
- Console errors during normal use → none observed

## R4. Create and nest folders
- Create in room root — fine
- Create nested 3+ levels — fine
- Duplicate name in same folder → blocked, toast `"A folder named '1' already exists here"` — fine
- Duplicate name, different case (`"Docs"` vs `"docs"`) → also blocked — fine
- Empty name → error `"Enter a folder name"` — fine
- Spaces-only name → same as empty — fine
- Very long name → capped at 50 characters, cursor silently stops, **no message** (see L9)
- Special characters `/ \ < > " '`, emoji → accepted — fine
- Deep nesting (15–20 levels) → works, but see L8 (breadcrumb display)
- As viewer in a shared folder → cannot create — fine

## R5. View contents with breadcrumbs
- Subfolders/files listed correctly — fine
- Empty folder → empty state — fine
- Breadcrumb path correct, each segment clickable — fine
- Deep nesting / long names → see L8
- Browser Back/Forward → correct — fine
- F5 inside a nested folder → stays there, no 404 — fine
- Copy folder URL, open in new tab → same folder — fine
- Sort order logical (folders first, alphabetical) — fine
- As viewer in a shared nested folder → no parent folder names leak above the shared root (known-fixed-bug retest) — fine

## R6. Rename a folder
- Valid new name → fine
- Rename to existing sibling name → blocked, `"A folder named 'a' already exists here"` — fine
- Same name, different case → same block — fine
- Empty/spaces-only name → rejected, `"Enter a folder name"` — fine
- Cancel (Esc/Cancel) → unchanged — fine
- As viewer → no rename option — fine

## R7. Delete a folder
- Warning shows correct subfolder/file counts and total size — fine
- Cancel → nothing deleted — fine
- Delete → folder and nested content gone, confirmed after refresh — fine
- Delete an empty folder → sensible "0 files" warning — fine
- Delete a folder you're inside (in another tab) → gone on refresh — fine
- Deleted file's previously-copied URL → "File not found. This file does not exist, or you don't have access to it." — fine
- Delete a shared folder → warning does **not** mention sharing (see M1)
- E2: viewer has the folder open, owner deletes it → viewer gets a clear "Folder not found" message after refresh/click, not a broken page — fine
- As viewer → no delete option — fine

## R8. Upload PDFs
- Single PDF via Upload button — fine
- Multiple PDFs at once — fine
- Drag-and-drop (single and multiple) — fine
- Drag-and-drop onto a subfolder row → not supported; only works in the currently open folder (acceptable for MVP)
- Per-file progress visible under Slow 4G — fine
- Non-PDF file → rejected with message — fine (wording: see L3)
- Several non-PDFs at once → grouped message, but see L5 (contrast/formatting)
- PDF + JPG together → PDF uploads, JPG rejected, but see L4 (toast overlap)
- JPG renamed to `.pdf` → see M2
- Duplicate file name → auto-renamed `(1)`, `(2)` — fine
- Offline before upload starts → error + retry works — fine
- Offline mid-upload, retry after reconnect → see M3
- Failed uploads reserve file names → see L7
- Large PDF (20–50MB boundary) → clear message, e.g. `"99mb.pdf is larger than 50 MB"` — fine
- Empty (0 KB) PDF, 100+ character file name → not fully exercised this pass
- As viewer in a shared folder → no upload option — fine

## R9. View a file
- Open a PDF → opens inline in viewer, not downloaded — fine
- Multi-page PDF (201 pages) → scrolls and loads — fine
- Viewer shows the correct data room file name (storage UUID shown only for the broken-PDF case — see M2) — fine otherwise
- Close viewer / Back → returns to the same folder — fine
- F5 while viewing → stays on the file — fine
- Download → saved with correct file name, not a UUID — fine
- As viewer → can view/download if allowed, cannot edit — fine
- Row actions menu (⋮) has no "View"/"Open" item — only Rename, Move, Download, Share, Delete; opening a file is only discoverable by clicking the row (see L16, found while writing the E2E viewer test)

## R10. Rename a file
- Valid new name → updated in list — fine
- Rename to existing sibling file name → resolved automatically, `"Renamed to '1 (3).pdf' to avoid a naming conflict"` — fine
- Same name, different case → same resolution — fine
- Empty/spaces-only name → rejected, `"Enter a file name"` — fine
- Remove/change extension → `.pdf` re-appended automatically, opens fine — fine
- Very long name → rejected with message `"Name is too long"` — fine (contrast with folder rename, L9)
- Cancel → unchanged — fine
- Renamed file still opens correctly — fine
- As viewer → no rename option — fine

## R11. Move a file
- Move to subfolder → appears there, gone from original — fine
- Move to room root — fine
- Move into a folder with a same-named file → resolved, `"Moved and renamed to '1 (1) (1).pdf' to avoid a naming conflict"` — fine
- Move to the same folder it's already in → no error, no duplicate — fine
- Folder picker reaches deeply nested folders — fine
- Moved file still opens correctly — fine
- Move into a shared folder → viewer gains access — fine
- Move out of a shared folder → viewer loses access — fine
- As viewer → no move option — fine

## R12. Delete a file
- Delete → confirmation shown, cancel keeps file, confirm removes it (persists after refresh) — fine
- Previously-copied URL of a deleted file → "not found" — fine
- Delete a file open in another tab → that tab shows "not found" after refresh/click — fine
- Delete a shared file → viewer loses access with a clear message — fine
- As viewer → no delete option — fine

## R13. Share a room, folder, or file (read-only, nested) — Critical
- Share whole Data Room → viewer sees everything inside — fine
- Share a folder → viewer sees its subfolders/files at all levels — fine
- Share a single file → viewer sees only that file — fine
- Viewer cannot see anything outside the shared item — fine
- Viewer's breadcrumb starts at the shared item, no parent names (known-fixed-bug retest) — fine
- Viewer UI has no Upload/New folder/Rename/Move/Delete — fine
- Viewer can open and download files — fine
- Owner adds a file to a shared folder → viewer sees it after refresh — fine
- Owner moves a file into/out of a shared folder → viewer gains/loses access accordingly — fine
- Share a folder already inside a shared folder → appears twice for the recipient (see L13)
- Shared item in "Shared with me" doesn't show who shared it or from which room (see L14)

**All critical sharing checks except L13/L14 (both Low) passed.**

## R14. Public link
- Create a link → easy to copy — fine
- Open in a private/logged-out window → content opens, read-only — fine
- Logged-out user can browse nested folders through a folder link — fine
- Logged-out user cannot reach anything outside the shared item by editing the URL/ID — fine
- Creating a link twice → issues a new one — fine
- Link to a deleted item → clear not-found state — fine
- Link token is random/long, not guessable — fine

## R15. Permissioned share (specific users)
- Share with `viewer@example.com` → appears in their "Shared with me" — fine
- A different logged-in user (not granted) opening the same URL → denied — fine
- Logged-out user opening the URL → login page, not content — fine
- Email case-insensitivity (`Viewer@Example.com`) → still resolves correctly — fine
- Email with leading/trailing spaces → rejected instead of trimmed (see L12)
- Invalid email format → rejected with message — fine
- Sharing with an email with no existing account, then registering that email → access is granted — fine
- Sharing with the same user twice → no duplicate — fine
- Sharing with your own email → allowed, appears in own "Shared with me" (see L1)
- Owner can see the list of who has access — fine

## R16. Revoke access — Critical
- Revoke a user → item disappears from their "Shared with me" — fine
- Viewer has the item open when revoked → next click/refresh is denied — fine
- Revoke a public link → stops working, logged in and out — fine
- A file link opened before revoke stays valid for up to 5 minutes after (signed URL lifetime) — documented; see Risk items in findings-report.md
- Revoking one user → other users keep access — fine
- Revoking a folder share → files inside no longer reachable by direct URL — fine
- Re-sharing after revoke → access restored — fine

**All R16 checks passed** (the 5-minute signed-URL window is a documented, bounded behavior, not a functional failure).

## E1. Upload files with the same name
Covered under R8 — auto-renaming on conflict passed; failure-mode variants are M3/L7.

## E2. Delete a folder while a recipient is viewing it
Covered under R7 — passed; viewer gets a clear not-found state, not a broken page.
