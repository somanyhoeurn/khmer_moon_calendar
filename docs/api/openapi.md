# API reference

Base path: `/api/v1`. Interactive docs: `/api/docs` (Swagger) and `/api/redoc`. Schema: `/api/openapi.json`. The API only accepts `GET`. Behind Nginx, it is rate-limited to 10 requests per second per IP, with a burst of 20.

## Error format

```json
{ "error": { "code": "invalid_lunar_date", "message": "…", "details": { } } }
```

| Code | Status | When |
| --- | --- | --- |
| `validation_error` | 422 | Bad query parameters (`details` lists each field) |
| `unsupported_date_range` | 422 | Outside 1900–2100 |
| `invalid_lunar_date` | 422 | Reverse conversion has no match (with `suggested_months` where relevant) |
| `not_found` | 404 | Unknown holiday slug or route |
| `internal_error` | 500 | Unexpected error (details are logged, never returned) |

## Endpoints

| Method & path | Description |
| --- | --- |
| `GET /health` | `status`, `database` (`ok` or `unavailable`; returns 503 when unavailable), engine version |
| `GET /calendar/today` | Today in Asia/Phnom_Penh, with lunar date |
| `GET /calendar/month?year=2026&month=10` | Every day, with `lunar`, holiday slugs and event slugs, plus the full holiday and event objects |
| `GET /calendar/year?year=2026` | `months[]` of the month payload |
| `GET /lunar-dates/convert?date=2026-10-27` | Gregorian → lunar |
| `GET /lunar-dates/reverse?year=2570&month=assoch&day=1&phase=waning` | Lunar → Gregorian candidates |
| `GET /holidays?year=2026[&category=royal]` | Sourced holiday records |
| `GET /holidays/{slug}` | One holiday |
| `GET /events?year=2026[&month=10]` | Stored events plus calculated lunar observances |
| `GET /search?q=pchum&limit=20&offset=0` | Holidays and events by name (Khmer or English), or an ISO date |

## Examples

```bash
curl -s "http://localhost:8087/api/v1/lunar-dates/convert?date=2026-10-11"
```

```json
{
  "gregorian_date": "2026-10-11",
  "lunar_day": 15,
  "phase": "waning",
  "month": { "id": "phatrabot", "name_km": "ភទ្របទ", "name_en": "Phatrabot", "is_leap_month": false },
  "be_year": 2570,
  "formatted_km": "ថ្ងៃអាទិត្យ ១៥រោច ខែភទ្របទ ឆ្នាំមមី អដ្ឋស័ក ពុទ្ធសករាជ ២៥៧០",
  "verification": {
    "status": "verified",
    "engine": "chhankitek-momentkh-port",
    "engine_version": "1.0.0",
    "reference_status": "secondary_source"
  }
}
```

```bash
curl -s "http://localhost:8087/api/v1/lunar-dates/reverse?year=2570&month=asadh&day=1&phase=waxing"
```

```json
{
  "error": {
    "code": "invalid_lunar_date",
    "message": "BE 2570 has a leap month: use 'pathamasadh' or 'tutiyasadh' instead of 'asadh'.",
    "details": { "suggested_months": ["pathamasadh", "tutiyasadh"] }
  }
}
```
