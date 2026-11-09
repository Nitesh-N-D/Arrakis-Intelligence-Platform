# Testing report: `feature/career-intelligence`

Run date: 2026-11-09, on Windows 11, Node v22.20.0. The project declares Node 24; CI runs Node 24.

| Check | Command | Result |
| --- | --- | --- |
| Server unit tests | `cd server && npm test` | **108 / 108 pass** (baseline before this branch: 75) |
| Backend import | `cd server && npm run check:import` | `backend-import-ok` |
| Client unit tests | `cd client && npm test` | **20 / 20 pass** (baseline: 5) |
| Client production build | `cd client && npm run build` | succeeds |
| Extension syntax | `node --check extension/*.js` | all parse |
| Extension package | ZIP vs `extension/` | 14 files, byte-identical |
| Real Edge handshake | `node scripts/edge-extension-smoke.mjs extension` | **PASS** on Microsoft Edge 157.0.4341.42. Reports v1.2.0, `browser: "edge"`, new policy fields. Untrusted origin gets no reply |
| Real Edge policy sync | `node scripts/edge-policy-smoke.mjs extension` | **PASS** on Edge 157 against a local mock API: pull+push (v3→v4), focus-only not blocking when idle and blocking when active, 409 conflict adopts server copy, foreign-account policy rejected |

## New test coverage

* `planningInsights.test.js` (11): mission validation and 3-priority cap, foreign IDs → 404,
  explicit carry-forward, goal milestones and owner scoping, timezone-aware behaviour metrics,
  insight evidence, the no-data state, retention cutoff, policy version bumps, the 400/409
  extension-policy contract, and the Mentat privacy split.
* `extensionDomainRules.test.js` (+3): `isBlockingActive`, `normalizeExtensionPolicy` (account
  match, sanitising, bounds) and handshake policy fields.
* Career catalogue, selector model, roadmap transitions and evidence gating are covered by the
  career test files added earlier on the branch.

## Not run / not verified

* **MongoDB integration tests** (`server/integration/*`) need a replica set. Not run locally; they
  run in CI.
* The Edge smoke tests use a **mock API**, not the deployed backend. Policy sync against the real
  Render API from a normal Edge profile has not been verified.
* The extension is **not published** on Microsoft Edge Add-ons. Store review has not happened.
* No manual screen-reader/keyboard audit of the new dashboard panels.
* Google OAuth full login with a test identity was not repeated. OAuth code is unchanged.
