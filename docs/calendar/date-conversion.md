# Date conversion

## Gregorian → lunar

`GET /api/v1/lunar-dates/convert?date=YYYY-MM-DD`

1. The date is validated: a strict ISO date within 1900–2100.
2. `ChhankitekEngine.to_lunar` walks from the epoch **1900-01-01 = ១កើត ខែបុស្ស** by whole lunar years, months and days, using the leap rules.
3. The BE year is `AD + 543` before ១រោច ពិសាខ of that AD year and `AD + 544` from that day on.
4. `CalendarValidationService` compares the result with the best stored reference record for that day (an `official` source beats a `secondary_source`).

## Lunar → Gregorian

`GET /api/v1/lunar-dates/reverse?year=<BE>&month=<id>&day=1..15&phase=waxing|waning`

A BE year runs from ១រោច ពិសាខ of AD `be − 544` to the day before the next one, so the engine scans that window (about 13 months) and returns **every** match:

- **No match:** `422 invalid_lunar_date` with guidance. For example, `asadh` in a leap-month year suggests `pathamasadh`/`tutiyasadh`, and `pathamasadh` in a regular year suggests `asadh`. A ១៥រោច in a 29-day month also has no match.
- **One match:** `candidates: [..]`, `ambiguous: false`.
- **Several matches:** all are returned with `ambiguous: true`. The engine never silently picks one. Several matches can't occur with the current engine but remain part of the contract for future engines.

## Assumptions

- Calendar days are civil days in `Asia/Phnom_Penh`. "Today" is computed in that zone.
- Results are evaluated at 00:00 local time (see limitations in [khmer-lunar-calendar.md](khmer-lunar-calendar.md)).

## Deviations from MomentKH

| Area | Upstream | This project | Why |
| --- | --- | --- | --- |
| Animal year/era at 00:00 on ១រោច ពិសាខ | `<=` comparison double-increments | strict `<` | Avoids an off-by-one at the exact BE transition moment |
| Reverse conversion | picks the nearest candidate | returns all candidates | Ambiguity must be explicit |
| Month spelling | កត្ដិក | កត្តិក | Standard Unicode spelling |
