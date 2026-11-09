# Arrakis Product Audit — Career Intelligence Evolution

Audit date: 2026-11-09 · Branch: `feature/career-intelligence` (from `main` @ `d39184f`)

This audit was written **before** implementation. It records what exists, what is
fragile, and which existing pieces are reused so the evolution does not recreate
or break the production application.

## 1. Baseline verification (before any change)

| Check | Result |
| --- | --- |
| `server: npm test` | 75 / 75 pass |
| `server: npm run check:import` | `backend-import-ok` |
| `client: npm test` | 5 / 5 pass |
| `client: npm run build` | Vite build succeeds |
| `extension: node --check *.js` | all scripts parse |
| Local Node | v22.20.0 (project declares 24.x; CI runs 24) |
| Local MongoDB | not installed — replica-set integration tests run in CI only |
| Microsoft Edge | installed (156/157) — usable for Playwright `channel: "msedge"` |

## 2. Architecture as found

* **client** – React 18 + Vite 6 + Tailwind 4 + Framer Motion 12 (`MotionConfig reducedMotion="user"`).
  Axios `http` client with a shared refresh flow; `AuthContext` bootstraps via refresh → `/auth/me`
  and hands the access token to the extension via `window.postMessage` on trusted origins.
* **server** – Express 4 → controllers → services → repositories → Mongoose models.
  Services accept injected repositories (unit tests mock them). Errors use `ApiError`.
  Envelope: `{ success, data, message }`. JWT access token + rotating refresh cookie.
  Google OAuth via passport with a custom state store.
* **extension** – MV3 service worker (`background.js`), heartbeat content script that sends only
  hostname + duration, block page, popup. Settings are **local-only** today.

## 3. Findings

| # | Area | Finding | Severity | Plan |
| --- | --- | --- | --- | --- |
| F1 | Registration | `RegisterPage` uses a native `<select>` with exactly two roles ("AI Systems Engineer", "Product Engineering Lead"). | High (product) | Replace with searchable `CareerRoleSelector`; keep `targetRole` in the payload for API compatibility. |
| F2 | Skill model | `server/src/dune/skillMatrix.js` defines only two roles. `skillAnalyzerService.analyze` throws 400 for anything else. | High | Introduce a shared career catalogue with stable IDs; keep `roleSkillMatrix` as a derived compatibility export. |
| F3 | Dashboard resilience | `analyticsService.getDashboard` calls `analyze()`; any user whose `targetRole` is not in the matrix gets a **400 on the whole dashboard**. The seed script already writes such roles ("Frontend Intelligence Engineer", "Systems Reliability Engineer"). | High (latent bug) | Unknown/legacy role strings resolve to a custom career; analysis degrades gracefully instead of throwing. |
| F4 | Roadmap integrity | `roadmapService.ensureRoadmap` silently **regenerates all phases (wiping progress)** when `roadmap.targetRole !== user.targetRole`. | High (data loss) | Role change becomes preview → confirm. Completed phases are archived and preserved; no silent regeneration. |
| F5 | Profile | `targetRole` is a free-text input that the server rejects unless it is one of two strings. Skills are a `name:level` textarea. | Medium | Profile uses the selector, shows a change-impact preview, requires confirmation, keeps skills and history. |
| F6 | Google onboarding | Passport creates Google users with the schema default role, so a new Google user cannot be distinguished from one who chose a role. | Medium | Add `career.selectionPending` set **only** on new Google-created accounts; existing users (field absent) are never blocked. |
| F7 | Roadmap depth | Phases carry only skill, difficulty, duration and template task strings. No objectives, resources, evidence, notes or bookmarks. "Mark done" needs no evidence. | Medium | Rich phases with objectives, exercises, assessment; mastery requires submitted evidence; notes/bookmarks/task completion persisted. |
| F8 | Extension sync | Extension settings are local-only; dashboard cannot show whether the extension is installed/connected. | Medium | Versioned settings sync from server preferences + real `postMessage` handshake for connection status. |
| F9 | Browser messaging | README and guides describe Chrome and Edge interchangeably. | Low | Edge becomes the only officially supported browser; Chromium internals (`chrome.*` APIs) stay. |
| F10 | Route order | `App.jsx` declares the `*` route before `/privacy`. React Router v7 ranks routes so it still works, but it reads as a bug. | Low | Reorder for clarity. |
| F11 | Tests | One unit test asserts `updateProfile({targetRole:"Unknown Role"})` → 400; this encodes the two-role restriction. | — | Deliberately updated: custom roles become valid; empty/overlong/unsafe titles still 400. |

## 4. Security posture to preserve

* OAuth callback, state store and refresh-token rotation are **not modified**.
* `req.user` is a server-loaded document; career IDs and skills from the client are re-validated
  against the server catalogue (`server/src/data/careerRoles.js`). The client catalogue is display-only.
* Custom role titles/descriptions are trimmed, length-limited, and control characters stripped;
  React escapes on render. Custom roles are stored per user and never change the global catalogue.
* AI providers receive only aggregated metrics + the role title + gap skill names (no email, notes,
  evidence text, or browsing data).
* No AI output mutates the database; recommendations are suggestions the user applies explicitly.
* No file uploads are introduced: roadmap evidence is a URL and/or short text.

## 5. Components reused (not recreated)

| Existing piece | Reused for |
| --- | --- |
| `components/ui/Modal.jsx` + `hooks/useDialogFocus` | Mobile selector sheet, role-change confirmation |
| `components/ui/Button.jsx`, `Card.jsx`, `Toast.jsx`, `EmptyState.jsx` | All new career/roadmap UI |
| `AuthShell`, `GoogleButton` | Registration + onboarding |
| `services/http.js` interceptor & envelope | New career / roadmap endpoints |
| `rateLimitMiddleware` | Career mutation and evidence endpoints |
| `skillAnalyzerService` scoring formula | Extended, not replaced (same priority maths for catalogue roles) |
| `mentatService` heuristic / OpenAI / Gemini pipeline | Career-aware context, unchanged provider architecture |
| Extension `SYNC_ACCESS_TOKEN` trusted-origin relay | Handshake + settings sync channel |

## 6. Scope and honesty notes

The requested programme spans 13 phases. Phases 0–5 (catalogue, selector, registration/profile,
skill intelligence, roadmap) and the Edge-only transition are the core of this branch.
Later phases are implemented where they can be delivered fully and tested; anything not delivered
is listed explicitly in `docs/TESTING_REPORT.md` and the final report rather than stubbed.

## 7. Post-implementation addendum (2026-11-09)

Every finding F1–F11 above was addressed on this branch. F8 (extension sync) now uses the
versioned `/profile/extension-policy` endpoints, with account-matched adoption and 409
server-wins conflict handling, verified by the real-Edge smoke test. Phase 11 (team
accountability) was not delivered. Results are in [TESTING_REPORT.md](TESTING_REPORT.md), and the
remaining risks are in [SECURITY_REVIEW.md](SECURITY_REVIEW.md).
