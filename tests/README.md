# Repository-level tests

- `e2e/journey.spec.ts`: Playwright user journey. It opens the homepage (Khmer default), checks today's lunar date, changes month, selects a date, converts a date, browses holidays, and switches language. It runs on desktop Chrome and a Pixel 7 viewport.
- `fixtures/published-holidays.json`: expected values taken from published holiday lists, not from the engine.

```bash
npm install && npx playwright install chromium
make up            # or make dev
npx playwright test                         # default base URL http://localhost:3000
E2E_BASE_URL=http://localhost npx playwright test   # production compose behind Nginx
```

Backend and frontend unit tests live in `backend/tests` and `frontend/tests`.
