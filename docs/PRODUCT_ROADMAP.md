# Product roadmap

Status as of 2026-11-09 on `feature/career-intelligence`. Nothing here is merged or deployed. The
owner reviews and approves the branch first.

## Delivered on this branch

| Phase | Item | Status |
| --- | --- | --- |
| 0 | Product audit (`docs/PRODUCT_AUDIT.md`) | Done |
| 1–3 | 81-role catalogue, searchable selector, custom roles, registration/profile/onboarding, post-login role change | Done |
| 4–5 | Catalogue-weighted skill gaps, rich roadmap, evidence-gated mastery, safe role transitions | Done |
| 6 | Daily Mission Control (priorities, planned focus, explicit carry-forward) | Done |
| 7 | Goals and milestones | Done |
| 8 | Configurable focus presets and mission-linked sessions | Done |
| 9 | Edge extension: versioned account policy sync, blocking policy, tracking pause, handshake | Done (unpublished) |
| 10 | Explainable behaviour insights and weekly review | Done |
| 12 | Mentat planning-aware heuristic, aggregate-only provider context, reasoning and disclaimers | Done |
| 13 | Privacy controls: retention period, tracking pause, export/delete cover missions and goals | Done |

## Not delivered

| Item | Notes |
| --- | --- |
| 11 Team accountability | Preferences (`teamSharing`, goal `sharedWithTeam`) are stored, but there is no team view of goals or weekly totals yet |
| Scheduled retention job | Purge currently runs when insights load |
| Push-based extension policy | Polling every 2 minutes. A message from the web app on timer start would remove the lag |
| Edge Add-ons submission | Needs the owner's Partner Center account. Do not claim published until approved |
| Daily briefing delivery | Preference exists. There is no briefing notification yet |

## Next steps (proposed)

1. Owner review of the branch, then CI (Node 24, MongoDB integration tests).
2. Add the extension origin to `ALLOWED_ORIGINS` in the Render environment before testing sync.
3. Team view that honours sharing preferences.
4. Scheduled retention purge.
