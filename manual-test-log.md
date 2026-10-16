# Manual Test Execution Log

Oct 15, 2026 · @Zhanna · A step-by-step checklist, run against the deployed app, one requirement at a time. Each line starts with its result: Pass, Fail, or Not tested. Findings link to [findings-report.md](findings-report.md) (M = Medium, L = Low, Risk = open risk item).

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
- Pass — Register with valid data → logged in, a room is created automatically
- Pass — Same email twice → clear error, no crash (checked again since the dev said this was fixed); no link to log in instead (see L17)
- Pass — Same email, different case (Test@Example.com vs test@example.com)
- Fail — Email with leading/trailing spaces → rejected instead of trimmed, confirmed with an automated API test (see L12b)
- Pass — Empty fields, invalid email format → clear messages
- Pass — Password under 8 characters → "Password must be at least 8 characters"; over 72 characters → "Password must be at most 72 characters" (both also confirmed with an automated API test)
- Pass — Login with valid credentials → "My data rooms"
- Pass — Wrong password or unknown email → the error doesn't say which one was wrong
- Note — 11 wrong password attempts in a row → no warning and no lockout; the correct password then logged in straight away (see Risk items)
- Pass — Sign out → redirected to login
- Pass — After sign out, browser Back → no private data shown
- Pass — Private URL (/folder/<id>) while logged out → login page
- Note — After logging in from that redirect → it returns to the home page, not the page you originally asked for
- Pass — Sign out as owner, log in as viewer → no leftover owner data shown (checked again since the dev said this was fixed)
- Not tested — Using the login token again after logging out, directly against the API (see Risk items; by design, the server doesn't cancel tokens)
- Not tested — Does the session expire after 7 days? → couldn't test this in the time I had; this is just what the docs say
- Pass — Two tabs open, sign out in one → the other tab correctly asks you to log in again on the next action

## R2. Owner-only visibility (Critical)
- Pass — Owner's folder URL opened as another logged-in user → blocked
- Pass — Owner's file URL opened as another user → blocked
- Pass — Same URLs while logged out → login page
- Pass — A viewer can't see the owner's other items, in "Shared with me" or by search
- Not tested — API calls with no token or a fake/broken token → not checked by hand; covered by automated API tests (401 on every protected endpoint)
- Pass — Error messages don't reveal the names or details of private items

All R2 checks done by hand passed; the token checks are covered by automated API tests.

## R3. UX, edge cases, error states
- Pass — Every button and menu item does something; nothing is dead or "coming soon"
- Pass — Every action shows feedback (a toast message, a loading state, or an error)
- Fail — Error messages are easy to understand → see L6 for the exceptions
- Pass — Empty states look right (empty room, empty folder, empty "Shared with me")
- Pass — Loading states under a slow connection (Slow 4G) → spinners/placeholders shown, nothing freezes
- Pass — Double-clicking Create/Share/Delete → doesn't create duplicates
- Pass — Keyboard: Enter submits dialogs, Esc closes them, Tab order makes sense
- Pass — Narrow window (~400px wide) → still usable, nothing overlaps
- Fail — Long names in the list, breadcrumb, and dialogs → see M4, L8
- Note — An unknown URL (/abc) → silently redirects to the home page, with no "page not found" message (an unknown folder URL, /folder/abc, does show a proper "Folder not found" page with "Back to data room")
- Pass — The URL of a deleted item → a clear "not found" message
- Pass — Browser zoom at 200% → still usable
- Pass — Errors in the browser console during normal use → none seen

## R4. Create and nest folders
- Pass — Create in the room's root
- Pass — Create nested, 3+ levels deep
- Pass — Same name twice in the same folder → blocked, with the message "A folder named '1' already exists here"
- Pass — Same name, different case ("Docs" vs "docs") → also blocked
- Pass — Empty name → error message "Enter a folder name"
- Pass — Spaces-only name → same as an empty name
- Fail — A very long name → capped at 50 characters, the cursor just stops moving, with no message (see L9)
- Pass — Special characters / \ < > " ', and emoji → all accepted
- Pass — Deep nesting (15–20 levels) → still works
- Pass — As a viewer in a shared folder → can't create a folder

## R5. View contents with breadcrumbs
- Pass — A folder lists its subfolders and files correctly
- Pass — An empty folder shows an empty state
- Pass — The breadcrumb path is correct, and every part is clickable
- Fail — Deep nesting or long names → see L8
- Pass — Browser Back/Forward → work correctly
- Pass — Pressing F5 inside a nested folder → stays there, no "not found" error
- Pass — Copying a folder's URL and opening it in a new tab → shows the same folder
- Pass — Sort order makes sense (folders first, then alphabetical)
- Pass — As a viewer in a shared nested folder → no parent folder names leak above the shared one (checked again since the dev said this was fixed)

## R6. Rename a folder
- Pass — Rename to a valid new name
- Pass — Rename to a name a sibling folder already has → blocked, with "A folder named 'a' already exists here"
- Pass — Same name, different case → also blocked
- Pass — Empty or spaces-only name → rejected, with "Enter a folder name"
- Pass — Cancel (Esc or Cancel button) → name stays the same
- Pass — As a viewer → no rename option shown

## R7. Delete a folder
- Pass — The warning shows the correct number of subfolders/files and the total size
- Pass — Cancel → nothing is deleted
- Pass — Delete → the folder and everything inside it is gone, both in the list and after a refresh
- Pass — Delete an empty folder → the warning makes sense ("0 files")
- Pass — Delete a folder while you're inside one of its subfolders (in another tab) → it's gone after a refresh
- Pass — Opening a deleted file's URL (copied before deleting it) → "File not found. This file does not exist, or you don't have access to it."
- Fail — Delete a folder that's shared → the warning does not mention the sharing (see M1)
- Pass — E2: a viewer has the folder open, and the owner deletes it → the viewer gets a clear "Folder not found" message after a refresh or a click, not a broken page
- Pass — As a viewer → no delete option shown

## R8. Upload PDFs
- Pass — A single PDF through the Upload button
- Pass — Several PDFs at once
- Pass — Drag-and-drop, for one file and for several
- Pass — Dragging a file onto a subfolder row → not supported; it only works in the folder you currently have open (okay for a first version)
- Pass — Per-file progress is visible under Slow 4G
- Fail — A non-PDF file → rejected, but see L3 for the unhelpful wording
- Fail — Several non-PDF files at once → a grouped message is shown, but see L5 (contrast and formatting)
- Fail — A PDF and a JPG together → the PDF uploads, the JPG is rejected, but see L4 (the message overlaps the panel)
- Fail — A JPG renamed to .pdf → see M2
- Pass — Same file name as an existing file → auto-renamed with (1), (2)
- Pass — Going offline before starting an upload → shows an error, and retry works
- Fail — Going offline mid-upload, then retrying after reconnecting → see M3
- Fail — Failed uploads still "use up" their file name → see L7
- Pass — A large PDF (20–50MB) → a clear message, e.g. "99mb.pdf is larger than 50 MB"
- Pass — An empty (0 KB) PDF → rejected with "size must not be less than 1"; blocked correctly, but the message is technical rather than telling the user what's wrong (same kind of issue as L6)
- Pass — A 100+ character file name → uploaded fine (how the long name is shown in the list is a separate issue, see M4)
- Pass — As a viewer in a shared folder → no upload option shown

## R9. View a file
- Pass — Opening a PDF → opens inside the viewer, not as a download
- Pass — A multi-page PDF (201 pages) → scrolls and loads correctly
- Pass — The viewer shows the correct file name (a storage ID is shown only for the broken-PDF case — see M2)
- Pass — Closing the viewer, or pressing Back → returns to the same folder
- Pass — Pressing F5 while viewing → stays on the same file
- Pass — Download → saved with the correct file name, not a storage ID
- Fail — Download a file with parentheses in its name ("Lorem ipsum (5).pdf") → saved as "Lorem ipsum %285%29.pdf" (see M5)
- Pass — As a viewer → can view/download if allowed, but can't edit
- Fail — The row's actions menu (⋮) has no "View" or "Open" option — only Rename, Move, Download, Share, Delete. The only way to open a file is to click the row itself, and nothing tells you that (see L16, found while writing the browser test for the viewer)

## R10. Rename a file
- Pass — Rename to a valid name → updated in the list
- Pass — Rename to a name a sibling file already has → handled automatically, with "Renamed to '1 (3).pdf' to avoid a naming conflict"
- Pass — Same name, different case → handled the same way
- Pass — Empty or spaces-only name → rejected, with "Enter a file name"
- Pass — Removing or changing the file extension → .pdf is added back automatically, and it still opens
- Pass — A very long name → rejected, with the message "Name is too long" (contrast this with folder rename, L9)
- Pass — Cancel → name stays the same
- Pass — A renamed file still opens correctly
- Pass — As a viewer → no rename option shown

## R11. Move a file
- Pass — Move to a subfolder → appears there, gone from the original folder
- Pass — Move to the room's root
- Pass — Move into a folder that already has a file with the same name → handled, with "Moved and renamed to '1 (1) (1).pdf' to avoid a naming conflict"
- Pass — Move to the same folder it's already in → no error, no duplicate
- Pass — The folder picker can reach deeply nested folders
- Pass — A moved file still opens correctly
- Pass — Move a file into a shared folder → the viewer now has access to it
- Pass — Move a file out of a shared folder → the viewer loses access
- Pass — As a viewer → no move option shown

## R12. Delete a file
- Pass — Delete → a confirmation is shown; Cancel keeps the file; confirming removes it (and it stays removed after a refresh)
- Pass — Opening a deleted file's URL (copied before deleting it) → "not found"
- Pass — Delete a file that's open in another tab → that tab shows "not found" after a refresh or a click
- Pass — Delete a shared file → the viewer loses access, with a clear message
- Pass — As a viewer → no delete option shown

## R13. Share a room, folder, or file (read-only, including everything inside) — Critical
- Pass — Share the whole Data Room → the viewer can see everything inside it
- Pass — Share a folder → the viewer can see its subfolders and files, at every level
- Pass — Share a single file → the viewer can see only that file
- Pass — The viewer can't see anything outside the shared item
- Pass — The viewer's breadcrumb starts at the shared item, with no parent folder names (checked again since the dev said this was fixed)
- Pass — The viewer's screen has no Upload, New folder, Rename, Move, or Delete options
- Pass — The viewer can open and download files
- Pass — The owner adds a file to a shared folder → the viewer sees it after a refresh
- Pass — The owner moves a file into, or out of, a shared folder → the viewer gains or loses access to it, correctly
- Fail — Sharing a folder that's already inside another shared folder → shows up twice for the person it's shared with (see L13)
- Fail — A shared item in "Shared with me" doesn't show who shared it, or which room it's from (see L14)

All critical sharing checks passed, except L13/L14 (both Low).

## R14. Public link
- Pass — Creating a link → easy to copy
- Pass — Opening it in a private/logged-out window → the content opens, read-only
- Pass — A logged-out user can browse nested folders through a folder link
- Pass — A logged-out user can't reach anything outside the shared item by editing the URL/ID
- Pass — Creating a link twice → a new one is issued each time
- Pass — A link to a deleted item → a clear "not found" state
- Pass — The link's token looks random and long, not something you could guess

## R15. Permissioned share (to specific users)
- Pass — Share with viewer@example.com → it shows up in their "Shared with me"
- Pass — A different logged-in user who wasn't given access opens the same URL → blocked
- Pass — A logged-out user opens the URL → the login page, not the content
- Pass — Email case doesn't matter (Viewer@Example.com still works)
- Fail — An email with spaces before or after it → rejected instead of trimmed (see L12)
- Pass — Invalid email format → rejected, with a message
- Pass — Sharing with an email that has no account yet, then registering with that email → access is granted
- Pass — Sharing with the same user twice → no duplicate
- Fail — Sharing with your own email → allowed, and shows up in your own "Shared with me" (see L1)
- Pass — The owner can see the full list of who has access

## R16. Revoke access — Critical
- Pass — Revoking a user → the item disappears from their "Shared with me"
- Pass — A viewer has the item open when access is revoked → the next click or refresh is blocked
- Pass — Revoking a public link → it stops working, both logged in and logged out
- Pass — A file link opened before the revoke stays working for up to 5 minutes afterward (the link's own lifetime, documented — see Risk items in findings-report.md)
- Pass — Revoking one user → other users keep their access
- Pass — Revoking a folder share → the files inside it can't be reached by a direct link anymore
- Pass — Sharing again after a revoke → access works again

All R16 checks passed (the 5-minute link window is a documented, known behavior, not a bug).

## E1. Upload files with the same name
Covered under R8 — automatically renaming on a clash passed; the failure cases around it are M3/L7.

## E2. Delete a folder while a recipient is viewing it
Covered under R7 — passed; the viewer gets a clear "not found" state, not a broken page.
