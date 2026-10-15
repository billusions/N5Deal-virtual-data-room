# Virtual Data Room — QA Assignment

QA practical assignment for N5Deal. Brief: [CLAUDE.md](CLAUDE.md).

## Assumptions
- Target is the deployed app (Vercel + Railway), not a local setup — no infra secrets provided.
- [evo9/virtual-data-room](https://github.com/evo9/virtual-data-room) source used only for white-box test design.
- Test accounts are shared — tests create their own throwaway data rather than touching shared state.
- API is tested directly, not just through the UI.

## Contents
- `test-plan.md` — scope and approach
- `findings-report.md` — bugs, grouped and prioritized
- `manual-test-log.md` — full requirement-by-requirement execution log
- `tests/` — automated suite (API + E2E, Playwright/TypeScript)
- `fixtures/manual-testing/` — PDFs used for manual upload/viewer testing
- `qa-report.md` — final summary (coverage, risks, release readiness, next steps)
