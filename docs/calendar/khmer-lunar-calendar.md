# Khmer lunar calendar methodology

## Engine

`ChhankitekEngine` (`backend/app/domain/calendar/engine.py`) wraps a Python port of MomentKH's Chhankitek arithmetic. See [ADR 0001](../architecture/decisions/0001-calendar-engine.md). The engine name and version (`chhankitek-momentkh-port@1.0.0`) are returned in every lunar date's `verification` block.

**Supported range:** 1900-01-01 – 2100-12-31. Dates outside it return `422 unsupported_date_range`.

## Representation

| Field | Meaning |
| --- | --- |
| `month.id` | One of `migasir, boss, meak, phalkun, cheit, pisakh, jesth, asadh, srap, phatrabot, assoch, kadeuk, pathamasadh, tutiyasadh` |
| `lunar_day` + `phase` | 1–15 with `waxing` (កើត) or `waning` (រោច) |
| `day_of_month` / `days_in_month` | 1–30 counted from ១កើត / 29 or 30 |
| `be_year` | Buddhist Era. Increments on **១រោច ខែពិសាខ** (the day after Visak Bochea). |
| `js_year`, `sak` | Jolak Sakaraj and the 10-year Sak cycle. They change on Lerng Sak (the last day of Khmer New Year). |
| `animal_year` | 12-year cycle. It changes at the calculated Moha Songkran moment. |
| `is_full_moon` | ១៥កើត |
| `is_new_moon` | Last day of the month (១៤ or ១៥រោច) |
| `is_sila_day` | ៨កើត, ១៥កើត, ៨រោច and the last day of the month |

A day number and phase alone don't identify a lunar date. The month id **and** BE year are required, because in leap-month years `asadh` does not exist and is replaced by `pathamasadh` + `tutiyasadh`.

## Month lengths

Months alternate 29/30 days starting with Migasir (29). Jesth has 30 days in a chantrathimeas (leap-day) year. Pathamasadh and Tutiyasadh have 30 days each and exist only in adhikameas (leap-month) years. Year lengths are 354, 355 or 384 days.

## Leap rules

- **Leap month (អធិកមាស):** derived from *Bodithey* of the current and next BE year (`bodithey ≥ 25 or < 6`, with the 24/6 and 25/5 exceptions).
- **Leap day (ចន្ទ្រាធិមាស):** derived from *Avoman* and whether the solar year is a leap year (*Kromthupul* ≤ 207). A leap day can't share a year with a leap month, so it is carried forward to the next eligible year.
- Leap flags in the API (`year_has_leap_month`, `year_has_leap_day`) describe **the Asadh/Jesth season of that Gregorian year**. Calculated leap-month years in 2020–2030: 2021, 2023, 2026, 2029.

## Khmer New Year

The engine estimates the Moha Songkran moment with the traditional solar computation. MomentKH hard-codes some upstream values (2011–2015, 2024), and those overrides are kept. The result is shown only as a `calculated` observance. **Official** Khmer New Year holiday dates come from sub-decrees (e.g. 14–16 April 2026).

## Known limitations

1. **Reference coverage.** Independent references cover 12 lunar-anchored holiday dates in 2024–2026 from **secondary** sources. Other dates are `calculated`.
2. **Upstream quirks kept for comparability.** `_sun_info` assigns `kaen` instead of the left-over value for kaen 0–2 (marked in code). Correcting it would change New Year times versus upstream and needs an authoritative reference first.
3. **Time-of-day effects.** Lunar dates are evaluated at 00:00 Phnom Penh time. The animal year changes at the Songkran *moment*, so on Songkran day itself the API shows the previous animal year.
4. **Royal Ploughing** is decided by royal decree. The `4 រោច ពិសាខ` rule matches 2024–2026, but this is a convention, not a guarantee.
5. **Buddhist sects.** Thammayut and Mahanikay observance days can occasionally differ. Only the Chhankitek civil calendar is modelled.

## Updating official holiday data

1. Get the sub-decree or Prakas for the year, ideally from an official source (Council of Ministers, Ministry of Labour and Vocational Training).
2. Add or extend the source in `infra/database/seeds/verified/sources.json`.
3. Create `infra/database/seeds/verified/holidays-<year>.json`. Use `verification_status: "official"` only if you checked the primary text, otherwise `secondary_source`.
4. For lunar-anchored holidays, add matching `lunar-reference-dates.json` records (rule → lunar date) so the engine is verified against them.
5. Run `make seed` (idempotent) and `make test`. If a reference disagrees with the engine, the API returns `overridden`. Investigate it and document it in [validation-sources.md](validation-sources.md).
