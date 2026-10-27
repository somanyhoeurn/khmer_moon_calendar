# Database schema

PostgreSQL 17, managed with Alembic (`backend/migrations`). Enums are stored as `VARCHAR` with `CHECK` constraints, which keeps them portable to SQLite for tests. Timestamps are `timestamptz`. The database timezone is set to `Asia/Phnom_Penh` (`infra/database/init`). Calendar dates are plain `date` values in Cambodian civil time.

```mermaid
erDiagram
  calendar_sources ||--o{ holidays : "source_id"
  calendar_sources ||--o{ calendar_events : "source_id"
  calendar_sources ||--o{ lunar_date_records : "source_id"
  calendar_sources {
    int id PK
    varchar name UK
    varchar source_url
    varchar source_type "government|publication|secondary|algorithm"
    smallint publication_year
    text description
    text verification_notes
    timestamptz created_at
  }
  holidays {
    int id PK
    varchar slug UK "e.g. pchum-ben-2026"
    varchar name_km
    varchar name_en
    text description_km
    text description_en
    date start_date
    date end_date "CHECK end_date >= start_date"
    varchar category "national|royal|buddhist|traditional|international"
    varchar holiday_type "public_holiday|observance|cultural_event"
    bool is_official_public_holiday
    varchar lunar_rule "links to a lunar observance rule"
    int source_id FK
    varchar verification_status "official|secondary_source|calculated|disputed"
    timestamptz created_at
    timestamptz updated_at
  }
  calendar_events {
    int id PK
    varchar slug UK
    varchar title_km
    varchar title_en
    varchar event_type "buddhist_observance|festival|cultural|astronomical"
    date start_date
    date end_date
    int source_id FK
    varchar verification_status
  }
  lunar_date_records {
    int id PK
    date gregorian_date
    smallint lunar_year "BE"
    smallint lunar_month "0..13"
    smallint lunar_day "1..15"
    varchar lunar_phase "waxing|waning"
    varchar verification_status
    int source_id FK
    varchar calculation_version
    text notes
    timestamptz verified_at
  }
  user_preferences {
    int id PK
    varchar client_id UK
    varchar locale "km|en"
    varchar preferred_numeral_system "khmer|latin"
    varchar preferred_calendar_view "month|year"
    varchar timezone
    json notification_preferences
  }
```

## Indexes and constraints

| Table | Index / constraint | Purpose |
| --- | --- | --- |
| holidays | `ix_holidays_start_end (start_date, end_date)` | Year and month range queries |
| holidays | `ix_holidays_category`, `ix_holidays_name_en`, `uq_holidays_slug` | Filters, search, detail lookup |
| calendar_events | `ix_calendar_events_start_end`, `ix_calendar_events_event_type` | Range queries, filters |
| lunar_date_records | `ix_lunar_date_records_gregorian_date` | Per-day reference lookup |
| lunar_date_records | `ix_lunar_date_records_lookup (lunar_year, lunar_month, lunar_day, lunar_phase)` | Reverse lookups |
| lunar_date_records | `UNIQUE (gregorian_date, source_id)` | One record per source per day |
| all FKs | `ON DELETE RESTRICT` | Sources can't be removed while referenced |

## Design notes

- **Calculated lunar dates are not stored.** `lunar_date_records` only holds dates published by a source (see [ADR 0002](../architecture/decisions/0002-data-provenance.md)).
- `user_preferences` exists for future use. No authentication is implemented, and no endpoint writes it yet.
- Seed data lives in `infra/database/seeds/verified` (sourced). Load it with `python -m app.db.seed`, which is idempotent.
