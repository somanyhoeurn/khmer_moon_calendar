# Developer guide

## Workflow

1. Branch from `main`.
2. Make the change and add or adjust tests.
3. Run `make lint` and `make test`. Run `make test-e2e` for UI flows.
4. Before opening a pull request, run `make lint` and `make test` (and `npx playwright test` for UI changes) locally; there is no hosted CI.

## Code style

- **Python:** Ruff (lint and format, 110 columns), mypy `--strict`. Keep route handlers thin; logic belongs in `services/` or `domain/`. The domain must not import FastAPI or SQLAlchemy.
- **TypeScript:** strict mode with `noUncheckedIndexedAccess`; ESLint uses `next/core-web-vitals`. All API reads use the query factories in `src/lib/api/query-options.ts` (TanStack Query).
- **i18n:** every user-visible string lives in both `frontend/src/messages/km.json` and `en.json`. Khmer is the default.

## Testing procedures

| Suite | Location | Command |
| --- | --- | --- |
| Engine and domain unit tests | `backend/tests/unit` | `cd backend && pytest tests/unit` |
| Database, migrations, seed | `backend/tests/integration` | `pytest tests/integration` (set `TEST_DATABASE_URL` for PostgreSQL) |
| API | `backend/tests/api` | `pytest tests/api` |
| Frontend components | `frontend/tests` | `npm --prefix frontend test` |
| End-to-end | `tests/e2e` | `npx playwright test` (stack running) |

**Rule for calendar tests:** expected lunar dates must come from an independent published reference (`backend/tests/fixtures/reference_lunar_dates.json`, `tests/fixtures/`), never from running the engine. Frontend fixtures in `frontend/tests/fixtures` are captured API responses, used only to test rendering.

## Changing calendar data

See [calendar/khmer-lunar-calendar.md § Updating official holiday data](calendar/khmer-lunar-calendar.md#updating-official-holiday-data). Every record needs a source. Use `official` only after checking the primary government text.

## Changing the engine

Implement the `KhmerLunarCalendarEngine` protocol, bump `version`, and keep `test_matches_independent_reference_dates` and the continuity test green. Document deviations in `calendar/date-conversion.md`.
