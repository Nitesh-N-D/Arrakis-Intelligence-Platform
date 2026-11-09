# Security and privacy review: `feature/career-intelligence`

Reviewed: 2026-11-09. Scope: every change on this branch. This is a self-review by the implementer,
not an independent audit.

## Unchanged by design

* Google OAuth callback, state store, refresh-token rotation and cookie flags are unchanged.
* The CORS allow-list was **not** loosened. Extension requests still need their origin in
  `ALLOWED_ORIGINS` (see EDGE_INSTALLATION.md).
* No secrets were added to the repository. Provider keys stay server-side env vars and never
  `VITE_`.
* No production data was read or modified. No deployment or push was performed.

## Input validation (server)

| Input | Control |
| --- | --- |
| Role ID / custom role title / skills | Role IDs checked against the server catalogue. Custom titles trimmed, length-limited, control characters and markup rejected (400). Skill names and levels validated |
| Mission / goal text | `cleanText` rejects markup and control characters. Lengths capped. At most 3 priorities per day. Planned minutes bounded |
| Mission / goal IDs | Queries scoped by `userId`. Foreign IDs return 404, so other users' records cannot be detected |
| Roadmap evidence | URL (http/https) and/or short text only. **No file uploads** |
| Preferences | Enumerated values only (`blockingPolicy`, `teamSharing`, retention options). Presets 1–240 min, at most 6 |
| Extension policy PUT | `baseVersion` required. Stale versions return 409 (optimistic concurrency) |

## AI and automated changes

* AI output (Gemini/OpenAI) is advisory text. **No code path lets AI output mutate the database.**
  Skill suggestions and roadmap changes need explicit user confirmation.
* External providers receive aggregates only: totals, rates, best-hour shares and mission counts.
  Mission/goal titles, site names, email, notes, evidence and tokens stay on the server.
  `server/test/planningInsights.test.js` asserts this split.

## Extension

* Collects hostname and duration only. No page content, form data, passwords, URLs or titles.
* Account policy is adopted only when `accountId` equals the token's `sub`. Switching accounts
  resets the local policy and clears queued activity. The real-Edge smoke test
  (`scripts/edge-policy-smoke.mjs`) checks that a foreign-account policy is rejected.
* The handshake reply never includes the token, account ID or hostnames.
* The JWT is decoded **without verification** in the extension, only to read `sub`/`exp` for
  routing. The server verifies every request, so a forged token gets nothing.

## Residual risks and follow-ups

1. Retention purge runs when insights are requested, not on a schedule. Records can outlive the
   chosen period for users who never open insights. Recommend a scheduled job.
2. `focus-only` blocking can lag a timer start/stop by up to two minutes (polling interval).
3. `teamSharing` and goal `sharedWithTeam` are stored but not used by any team feature yet. Any
   future team view must honour them.
4. MongoDB integration tests (transactions for export/delete) run only in CI. They were not run
   locally (no MongoDB on this machine).
5. A manual accessibility review with assistive technology has not been done for the new panels.
