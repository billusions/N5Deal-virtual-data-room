# Manual Test Execution Log

Oct 15, 2026 · @Zhanna · A step-by-step checklist, run against the deployed app, one requirement at a time. "Fine" means it passed as expected. Findings link to [findings-report.md](findings-report.md) (M = Medium, L = Low, Risk = open risk item).

## Fixtures (R8/R9)

PDF files used for upload/viewer testing, in [fixtures/manual-testing/](fixtures/manual-testing/):

| File | Purpose |
|---|---|
| simple-invoice.pdf | A normal, valid PDF of normal size |
| lorem-ipsum.pdf | Valid PDF with its own embedded title (to check the viewer's name display) |
| lorem-ipsum-201-pages.pdf | Multi-page PDF — to check scrolling/loading |
| broken.pdf | Non-PDF bytes renamed to .pdf — see finding M2 |
| 99mb.pdf | An oversized file — to check the ~50MB upload limit |
| not-a-pdf.txt | Plain text file — to check that non-PDF uploads are rejected (used by the browser tests too) |

## R1. Authentication
- Register with valid data → logged in, a room is created automatically — fine
- Same email twice → clear error, no crash (checked again since the dev said this was fixed) — fine
- Same email, different case (Test@Example.com vs test@example.com) — fine
- Email with leading/trailing spaces → rejected instead of trimmed, confirmed with an automated API test (see L12b)
- Empty fields, invalid email format → clear messages — fine
- Password rules: very short (1 char) is accepted; very long is capped at 72 characters (a bcrypt limit)
- Login with valid credentials → "My data rooms" — fine
- Wrong password or unknown email → the error doesn't say which one was wrong — fine
- Many wrong password attempts → no lockout seen; not fully tested (see Risk items)
- Sign out → redirected to login — fine
- After sign out, browser Back → no private data shown — fine
- Private URL (/folder/<id>) while logged out → login page — fine
- After logging in from that redirect → note: it returns to the home page, not the page you originally asked for
- Sign out as owner, log in as viewer → no leftover owner data shown (checked again since the dev said this was fixed) — fine
- Using the login token again after logging out, directly against the API → not fully tested (see Risk items; by design, the server doesn't cancel tokens)
- Does the session expire after 7 days? → couldn't test this in the time we had; this is just what the docs say
- Two tabs open, sign out in one → the other tab correctly asks you to log in again on the next action

## R2. Owner-only visibility (Critical)
- Owner's folder URL opened as another logged-in user → blocked — fine
- Owner's file URL opened as another user → blocked — fine
- Same URLs while logged out → login page — fine
- A viewer can't see the owner's other items, in "Shared with me" or by search — fine
- API call with no token → 401 — fine
- API call with a fake/broken token → 401 — fine
- Error messages don't reveal the names or details of private items — fine

All R2 checks passed.

## R3. UX, edge cases, error states
- Every button and menu item does something; nothing is dead or "coming soon" — fine
- Every action shows feedback (a toast message, a loading state, or an error) — fine
- Error messages are easy to understand → see L6 for the exceptions
- Empty states look right (empty room, empty folder, empty "Shared with me") — fine
- Loading states under a slow connection (Slow 4G) → spinners/placeholders shown, nothing freezes — fine
- Double-clicking Create/Share/Delete → doesn't create duplicates — fine
- Keyboard: Enter submits dialogs, Esc closes them, Tab order makes sense — fine
- Narrow window (~400px wide) → still usable, nothing overlaps — fine
- Long names in the list, breadcrumb, and dialogs → see M4, L8
- An unknown URL (/abc) → a proper "not found" page, with a way back — fine
- The URL of a deleted item → a clear "not found" message — fine
- Browser zoom at 200% → still usable — fine
- Errors in the browser console during normal use → none seen

## R4. Create and nest folders
- Create in the room's root → fine
- Create nested, 3+ levels deep → fine
- Same name twice in the same folder → blocked, with the message "A folder named '1' already exists here" — fine
- Same name, different case ("Docs" vs "docs") → also blocked — fine
- Empty name → error message "Enter a folder name" — fine
- Spaces-only name → same as an empty name — fine
- A very long name → capped at 50 characters, the cursor just stops moving, with no message (see L9)
- Special characters / \ < > " ', and emoji → all accepted — fine
- Deep nesting (15–20 levels) → still works, but see L8 (breadcrumb display)
- As a viewer in a shared folder → can't create a folder — fine

## R5. View contents with breadcrumbs
- A folder lists its subfolders and files correctly — fine
- An empty folder shows an empty state — fine
- The breadcrumb path is correct, and every part is clickable — fine
- Deep nesting or long names → see L8
- Browser Back/Forward → work correctly — fine
- Pressing F5 inside a nested folder → stays there, no "not found" error — fine
- Copying a folder's URL and opening it in a new tab → shows the same folder — fine
- Sort order makes sense (folders first, then alphabetical) — fine
- As a viewer in a shared nested folder → no parent folder names leak above the shared one (checked again since the dev said this was fixed) — fine

## R6. Rename a folder
- Rename to a valid new name → fine
- Rename to a name a sibling folder already has → blocked, with "A folder named 'a' already exists here" — fine
- Same name, different case → also blocked — fine
- Empty or spaces-only name → rejected, with "Enter a folder name" — fine
- Cancel (Esc or Cancel button) → name stays the same — fine
- As a viewer → no rename option shown — fine

## R7. Delete a folder
- The warning shows the correct number of subfolders/files and the total size — fine
- Cancel → nothing is deleted — fine
- Delete → the folder and everything inside it is gone, both in the list and after a refresh — fine
- Delete an empty folder → the warning makes sense ("0 files") — fine
- Delete a folder while you're inside one of its subfolders (in another tab) → it's gone after a refresh — fine
- Opening a deleted file's URL (copied before deleting it) → "File not found. This file does not exist, or you don't have access to it." — fine
- Delete a folder that's shared → the warning does not mention the sharing (see M1)
- E2: a viewer has the folder open, and the owner deletes it → the viewer gets a clear "Folder not found" message after a refresh or a click, not a broken page — fine
- As a viewer → no delete option shown — fine

## R8. Upload PDFs
- A single PDF through the Upload button — fine
- Several PDFs at once — fine
- Drag-and-drop, for one file and for several — fine
- Dragging a file onto a subfolder row → not supported; it only works in the folder you currently have open (okay for a first version)
- Per-file progress is visible under Slow 4G — fine
- A non-PDF file → rejected, with a message — fine (see L3 for the wording)
- Several non-PDF files at once → a grouped message is shown, but see L5 (contrast and formatting)
- A PDF and a JPG together → the PDF uploads, the JPG is rejected, but see L4 (the message overlaps the panel)
- A JPG renamed to .pdf → see M2
- Same file name as an existing file → auto-renamed with (1), (2) — fine
- Going offline before starting an upload → shows an error, and retry works — fine
- Going offline mid-upload, then retrying after reconnecting → see M3
- Failed uploads still "use up" their file name → see L7
- A large PDF (20–50MB) → a clear message, e.g. "99mb.pdf is larger than 50 MB" — fine
- An empty (0 KB) PDF, and a 100+ character file name → not fully tested this time
- As a viewer in a shared folder → no upload option shown — fine

## R9. View a file
- Opening a PDF → opens inside the viewer, not as a download — fine
- A multi-page PDF (201 pages) → scrolls and loads correctly — fine
- The viewer shows the correct file name (a storage ID is shown only for the broken-PDF case — see M2) — fine otherwise
- Closing the viewer, or pressing Back → returns to the same folder — fine
- Pressing F5 while viewing → stays on the same file — fine
- Download → saved with the correct file name, not a storage ID — fine
- As a viewer → can view/download if allowed, but can't edit — fine
- The row's actions menu (⋮) has no "View" or "Open" option — only Rename, Move, Download, Share, Delete. The only way to open a file is to click the row itself, and nothing tells you that (see L16, found while writing the browser test for the viewer)

## R10. Rename a file
- Rename to a valid name → updated in the list — fine
- Rename to a name a sibling file already has → handled automatically, with "Renamed to '1 (3).pdf' to avoid a naming conflict" — fine
- Same name, different case → handled the same way — fine
- Empty or spaces-only name → rejected, with "Enter a file name" — fine
- Removing or changing the file extension → .pdf is added back automatically, and it still opens — fine
- A very long name → rejected, with the message "Name is too long" — fine (contrast this with folder rename, L9)
- Cancel → name stays the same — fine
- A renamed file still opens correctly — fine
- As a viewer → no rename option shown — fine

## R11. Move a file
- Move to a subfolder → appears there, gone from the original folder — fine
- Move to the room's root → fine
- Move into a folder that already has a file with the same name → handled, with "Moved and renamed to '1 (1) (1).pdf' to avoid a naming conflict" — fine
- Move to the same folder it's already in → no error, no duplicate — fine
- The folder picker can reach deeply nested folders — fine
- A moved file still opens correctly — fine
- Move a file into a shared folder → the viewer now has access to it — fine
- Move a file out of a shared folder → the viewer loses access — fine
- As a viewer → no move option shown — fine

## R12. Delete a file
- Delete → a confirmation is shown; Cancel keeps the file; confirming removes it (and it stays removed after a refresh) — fine
- Opening a deleted file's URL (copied before deleting it) → "not found" — fine
- Delete a file that's open in another tab → that tab shows "not found" after a refresh or a click — fine
- Delete a shared file → the viewer loses access, with a clear message — fine
- As a viewer → no delete option shown — fine

## R13. Share a room, folder, or file (read-only, including everything inside) — Critical
- Share the whole Data Room → the viewer can see everything inside it — fine
- Share a folder → the viewer can see its subfolders and files, at every level — fine
- Share a single file → the viewer can see only that file — fine
- The viewer can't see anything outside the shared item — fine
- The viewer's breadcrumb starts at the shared item, with no parent folder names (checked again since the dev said this was fixed) — fine
- The viewer's screen has no Upload, New folder, Rename, Move, or Delete options — fine
- The viewer can open and download files — fine
- The owner adds a file to a shared folder → the viewer sees it after a refresh — fine
- The owner moves a file into, or out of, a shared folder → the viewer gains or loses access to it, correctly — fine
- Sharing a folder that's already inside another shared folder → shows up twice for the person it's shared with (see L13)
- A shared item in "Shared with me" doesn't show who shared it, or which room it's from (see L14)

All critical sharing checks passed, except L13/L14 (both Low).

## R14. Public link
- Creating a link → easy to copy — fine
- Opening it in a private/logged-out window → the content opens, read-only — fine
- A logged-out user can browse nested folders through a folder link — fine
- A logged-out user can't reach anything outside the shared item by editing the URL/ID — fine
- Creating a link twice → a new one is issued each time — fine
- A link to a deleted item → a clear "not found" state — fine
- The link's token looks random and long, not something you could guess — fine

## R15. Permissioned share (to specific users)
- Share with viewer@example.com → it shows up in their "Shared with me" — fine
- A different logged-in user who wasn't given access opens the same URL → blocked — fine
- A logged-out user opens the URL → the login page, not the content — fine
- Email case doesn't matter (Viewer@Example.com still works) — fine
- An email with spaces before or after it → rejected instead of trimmed (see L12)
- Invalid email format → rejected, with a message — fine
- Sharing with an email that has no account yet, then registering with that email → access is granted — fine
- Sharing with the same user twice → no duplicate — fine
- Sharing with your own email → allowed, and shows up in your own "Shared with me" (see L1)
- The owner can see the full list of who has access — fine

## R16. Revoke access — Critical
- Revoking a user → the item disappears from their "Shared with me" — fine
- A viewer has the item open when access is revoked → the next click or refresh is blocked — fine
- Revoking a public link → it stops working, both logged in and logged out — fine
- A file link opened before the revoke stays working for up to 5 minutes afterward (the link's own lifetime) — documented; see Risk items in findings-report.md
- Revoking one user → other users keep their access — fine
- Revoking a folder share → the files inside it can't be reached by a direct link anymore — fine
- Sharing again after a revoke → access works again — fine

All R16 checks passed (the 5-minute link window is a documented, known behavior, not a bug).

## E1. Upload files with the same name
Covered under R8 — automatically renaming on a clash passed; the failure cases around it are M3/L7.

## E2. Delete a folder while a recipient is viewing it
Covered under R7 — passed; the viewer gets a clear "not found" state, not a broken page.
