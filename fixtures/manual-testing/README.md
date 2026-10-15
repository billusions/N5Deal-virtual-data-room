# Manual testing fixtures

Files used during exploratory upload/viewer testing (see [manual-test-log.md](../../manual-test-log.md), R8/R9).

| File | Purpose |
|---|---|
| `simple-invoice.pdf` | Baseline valid PDF, normal size |
| `lorem-ipsum.pdf` | Valid PDF with an embedded title (viewer-name display check) |
| `lorem-ipsum-201-pages.pdf` | Multi-page PDF — scroll/load behavior |
| `broken.pdf` | Non-PDF bytes renamed to `.pdf` — see finding M2 |
| `99mb.pdf` | Oversized file — upload size-limit check (~50MB boundary) |
