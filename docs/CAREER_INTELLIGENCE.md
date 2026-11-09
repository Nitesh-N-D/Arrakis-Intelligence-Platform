# Career Intelligence

## Career catalogue

* Server-owned catalogue: `server/src/data/careerRoles.js`, version `2026.11.1`, with **81 roles in
  11 categories**: software engineering, AI/ML, data, cloud and DevOps, cybersecurity, product and
  design, engineering leadership, research, business, education, and other.
* Every role has a stable `id`, aliases for search, and weighted skills (`core`, `important`,
  `supporting`) with a minimum proficiency level.
* The client copy (`client/src/data/careerRoles.js`) is display-only. The server re-validates
  every role ID and skill it receives.
* The two original roles ("AI Systems Engineer" and "Product Engineering Lead") keep their
  original skill weights, so existing users' scores do not change.

## Choosing a role, any time

* **Registration:** a searchable `CareerRoleSelector` with category tabs, keyboard navigation and
  a mobile sheet replaces the old two-option dropdown.
* **After login:** the dashboard's Operative State card links to `/onboarding/career` ("Choose
  your career", or "Change career or type your own role"). The page pre-fills the current career.
* **Custom roles:** a user can type any role title. The server trims it, limits its length, and
  rejects control characters and markup. `POST /career/suggest-skills` proposes skills for the
  title from the skill library. The user confirms or edits them; nothing is applied automatically.
  Custom roles are stored on that user only and never change the global catalogue.
* **New Google accounts** get `career.selectionPending` and are asked to choose. Existing accounts
  (no field) are never blocked.
* Unknown legacy role strings resolve to a custom career instead of failing the whole dashboard
  with a 400 error (audit finding F3).

## Changing roles safely

1. `POST /career/preview` returns the impact: skills gained or removed, roadmap phases kept,
   archived or added.
2. The user confirms in `CareerChangeDialog`.
3. `PUT /career` applies it. Completed and in-progress roadmap phases are preserved. Nothing is
   silently regenerated (audit finding F4).

## Skill intelligence and roadmap

* Gap scoring uses the existing `skillAnalyzerService` formula, extended to catalogue weights.
* Roadmap phases carry objectives, exercises and an assessment. A phase is mastered only after the
  user submits evidence (a URL and/or short text; no file uploads). Notes, bookmarks and task
  completion are persisted.

## Planning layer (connects career to daily work)

* **Goals** (`/goals`): career, academic, project or personal goals with milestones. Progress
  comes only from milestones the user ticks off.
* **Mission Control** (`/missions`): today's missions, at most 3 priorities, planned focus minutes,
  an optional goal link, and carry-forward that the user must explicitly choose.
* **Focus timer:** configurable presets (1–240 minutes, up to 6) and an optional mission link.
  Completed minutes are credited to the linked mission.
* **Insights** (`/analytics/behavior`, `/analytics/weekly-review`): productive hours, session
  completion, consistency and week-over-week change. Every insight shows its evidence ("Why am I
  seeing this?") and a confidence level. Wording is supportive, and estimates are labelled as
  estimates, not diagnoses.
