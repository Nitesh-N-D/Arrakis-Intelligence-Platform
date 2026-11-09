# API reference (additions on `feature/career-intelligence`)

Base path: `/api/v1`. All responses use `{ success, data, message }`. Unless marked *public*,
endpoints require `Authorization: Bearer <access token>`. Write endpoints are rate-limited.
Existing endpoints (`/auth`, `/focus`/`/spice`, `/storm`, `/skills`, `/prescience`, `/mentat`,
`/leaderboard`, `/team`) keep their contracts.

## Career

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/career/catalogue` | *public*. Roles, categories, skill library and catalogue version |
| GET | `/career` | Current career (role ID or custom title, skills, preferences, `selectionPending`) |
| POST | `/career/preview` | Impact of a proposed change. Writes nothing |
| PUT | `/career` | Apply a confirmed change. Validates role ID, custom title and skills on the server |
| POST | `/career/suggest-skills` | Skill suggestions for a custom title. Writes nothing |

## Roadmap

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/roadmap/current` | Current roadmap with rich phases |
| PATCH | `/roadmap/phases/:phaseId` | Notes, bookmark, task completion, status |
| POST | `/roadmap/phases/:phaseId/evidence` | Add evidence (URL and/or text, length-limited) |
| DELETE | `/roadmap/phases/:phaseId/evidence/:evidenceId` | Remove evidence |
| POST | `/roadmap/phases/:phaseId/complete` | Mark mastered. Requires evidence |

## Missions and goals

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/missions?day=YYYY-MM-DD&tzOffset=` | Board for the day: missions, summary, limits, carry-forward candidates |
| POST | `/missions` | `{ title, priority?, plannedFocusMinutes?, goalId?, day? }`. At most 3 priorities per day |
| POST | `/missions/carry-forward` | `{ missionIds }`. Moves only the listed unfinished missions |
| PATCH | `/missions/:missionId` | Status `todo`/`done`/`dropped`, priority, title, planned minutes |
| DELETE | `/missions/:missionId` | |
| GET | `/goals` | Goals with progress, days left and a summary |
| POST | `/goals` | `{ title, category, deadline?, milestones? }` |
| PATCH | `/goals/:goalId` | Title, status, deadline, `sharedWithTeam` |
| PATCH | `/goals/:goalId/milestones/:milestoneId` | `{ done }` |
| DELETE | `/goals/:goalId` | Linked missions are kept |

Requests for another user's mission or goal IDs return 404.

## Analytics

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/analytics/behavior?tzOffset=` | Productive hours, session success, consistency, weekly comparison, explainable insights. Applies the user's retention setting first |
| GET | `/analytics/weekly-review?tzOffset=` | Last 7 local days vs the previous 7, highlights and ideas |
| GET | `/analytics/dashboard` | Unchanged |

## Profile and extension

| Method | Path | Notes |
| --- | --- | --- |
| PATCH | `/profile/settings` | Also accepts `focusPresets`, `breakMinutes`, `longBreakMinutes`, `blockingPolicy`, `trackingPaused`, `teamSharing`, `dataRetentionDays` (0/30/90/180/365), `dailyBriefingEnabled`. Blocking-related changes bump `policyVersion` |
| GET | `/profile/extension-policy` | `{ accountId, version, updatedAt, blockedSites, strictMode, overrideMinutes, blockingPolicy, trackingPaused, focusActive, blockingActive }` |
| PUT | `/profile/extension-policy` | Requires `baseVersion`. Returns 400 without it and 409 on a stale version |
| GET | `/profile/export` | Now includes `missions` and `goals` |
| DELETE | `/profile/account` | Now also deletes missions and goals in the same transaction |

## Mentat

`POST /mentat/analyze` accepts `tzOffset`. Responses include `reasoning[]` and a `disclaimer`.
See [PRIVACY.md](../PRIVACY.md) for exactly what reaches external providers.
