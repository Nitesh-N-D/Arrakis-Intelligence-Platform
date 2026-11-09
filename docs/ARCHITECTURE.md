# Architecture

```
client (React 18, Vite 6, Tailwind 4)  ──HTTPS──▶  server (Express, Mongoose 8)  ──▶  MongoDB
   │  postMessage (trusted origins only)                ▲
   ▼                                                    │ Bearer token, CORS allow-list
extension (MV3, Microsoft Edge) ────────────────────────┘
```

## Server layers

`routes → controllers → services → repositories → models`. Services receive repositories by
injection, so unit tests run without MongoDB. Errors are `ApiError` objects rendered by one error
handler, which hides internal details in production.

New on this branch:

| Module | Responsibility |
| --- | --- |
| `data/careerRoles.js` | Catalogue, skill library, search, skill suggestions |
| `services/careerService.js`, `careerProfile.js` | Career read/preview/apply; safe role transitions |
| `services/roadmapService.js` (extended) | Rich phases, evidence-gated mastery, archive on role change |
| `models/Mission.js`, `services/missionService.js` | Daily missions, priority cap, explicit carry-forward |
| `models/Goal.js`, `services/goalService.js` | Goals and milestones |
| `services/behaviorService.js`, `insightsEngine.js`, `dailySeries.js` | Timezone-aware behaviour metrics, explainable insights, retention purge |
| `services/profileService.js` (extended) | Preferences validation, versioned extension policy |
| `services/mentatService.js` (extended) | Planning-aware heuristic; aggregate-only provider context |

## Client

* `components/career/*`: selector, custom-role form, change dialog, Discipline Map, roadmap panel.
* `components/planning/*`: Mission Control and goals. `components/insights/*`: patterns and the
  weekly review.
* `services/platformService.js` sends `tzOffset = -getTimezoneOffset()` so day boundaries follow the
  user's clock.

## Extension

`background.js` (service worker) handles tracking, blocking, the pending-sync queue (alarms with
backoff) and account policy sync (a 2-minute alarm, versioned PUT). `domainRules.js` holds the pure
rules shared with the server tests: hostname normalisation, `isBlockingActive`,
`normalizeExtensionPolicy` and the handshake status.

## Data ownership

Every mission, goal, session, log and roadmap query is scoped by `userId`. Cross-user IDs return 404.
AI providers never write to the database. Their text is shown as a suggestion only.
