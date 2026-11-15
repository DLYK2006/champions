# Profile accordion and Calendar filters (#74)

User-requested focused follow-up. Keep the existing guarded Profile, local settings/outfit drafts, single Calendar and owner data APIs.

- Reproduce active-section collapse failure; allow `section=none`, preserve filter query params and drafts. All sections can open/close, at most one open at once.
- Remove Calendar's color legend. Default to all-date analysis selection; From/To selects an inclusive analysis range; date click shows existing day details, with a return-to-analysis control.
- Expose a typed analysis render slot receiving the active date selection for the teammate's Databricks view. No invented analytics results or backend changes. Confirm the teammate's contract on the board/user question; adapt if supplied.
- Test toggles/drafts, selection/reset/validation, mobile/axe and existing Profile flows; run types/lint/build, review, PR and deployment per team workflow.

Ownership: prior lead handoff covers HistoryController presentation. Board notified before edits to avoid concurrent analytics work; await any new contract. Account delete removal acknowledged, unrelated account code left to owner.
