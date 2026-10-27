# ADR 0002 – Separate calculated dates, references and official holidays

**Status:** accepted

## Decision

Four kinds of data are kept separate:

1. **Calculated lunar dates.** Produced by the engine on the fly and not stored. Labelled `calculated`.
2. **Reference lunar dates** (`lunar_date_records`). A lunar date attributed to a source (`calendar_sources`). When one exists for a day, the API reports `verified` (agreement) or `overridden` (the reference wins, and the calculated value is also returned).
3. **Holidays** (`holidays`). Official public holidays with a source and a `verification_status` (`official`, `secondary_source`, `calculated`, `disputed`). Future dates are never invented: a year without a published list simply has no holiday records.
4. **Observances** (lunar rules in `domain/holidays/rules.py`). Calculated for any year, always labelled `calculated`, and returned by `/events`, never by `/holidays`.

Seed data in `infra/database/seeds/verified/` must cite a source. Sample or demo data belongs in `seeds/sample/` and only loads with `--include-samples`.

## Consequences

The UI can always say how much trust a date deserves. Upgrading a record from `secondary_source` to `official` is a data change, not a code change.
