# Validation sources

Expected values in tests **never** come from the engine under test.

## Reference dates (independent of the engine)

| Gregorian | Lunar date | Holiday | Source |
| --- | --- | --- | --- |
| 2024-05-22 | ១៥កើត ពិសាខ | Visak Bochea | Swiss Embassy 2024 list |
| 2024-05-26 | ៤រោច ពិសាខ | Royal Ploughing | Swiss Embassy 2024 list |
| 2024-10-02 | ១៥រោច ភទ្របទ | Pchum Ben (1–3 Oct) | Swiss Embassy, PPC Bank, ARDB |
| 2024-11-15 | ១៥កើត កត្តិក | Water Festival (14–16 Nov) | ARDB, Calendarific |
| 2025-05-11 | ១៥កើត ពិសាខ | Visak Bochea | MRTS Consulting, Calendarific |
| 2025-05-15 | ៤រោច ពិសាខ | Royal Ploughing | MRTS Consulting, Calendarific |
| 2025-09-22 | ១៥រោច ភទ្របទ | Pchum Ben (21–23 Sep) | MRTS Consulting |
| 2025-11-05 | ១៥កើត កត្តិក | Water Festival (4–6 Nov) | MRTS Consulting |
| 2026-05-01 | ១៥កើត ពិសាខ | Visak Bochea (with Labour Day) | Sub-Decree 167 via Andersen |
| 2026-05-05 | ៤រោច ពិសាខ | Royal Ploughing | Sub-Decree 167 via Andersen |
| 2026-10-11 | ១៥រោច ភទ្របទ | Pchum Ben (10–12 Oct) | Sub-Decree 167 via Andersen |
| 2026-11-24 | ១៥កើត កត្តិក | Water Festival (23–25 Nov) | Sub-Decree 167 via Andersen |

**Result (2026-10-27): 12/12 match the engine.**

Method: each Gregorian date comes from a published holiday list. The lunar date is the traditional rule that holiday follows. These are therefore *derived* references: they confirm the engine only if the government followed the rule that year.

## Known source discrepancies

- **2026 holiday count:** the Andersen article states 22 paid days, but its table sums to 21.
- **Sub-Decree 167 issue date:** 18 Sep 2025 (Andersen) vs 5 Aug 2025 (Prasac page).
- **Remofirst 2026 list** gives Visak 27 May, Ploughing 16 May, Pchum Ben 27–29 Sep and Water Festival 24–26 Nov. These conflict with Andersen, Hono and the lunar rules, and were rejected as an outlier.
- **Siem Reap 2024 listing** gives Visak 4 May and Ploughing 8 May. These conflict with all other sources and were rejected.

## Upstream-example fixtures

`backend/tests/fixtures/reference_lunar_dates.json` also contains MomentKH README examples (`kind: upstream-example`). These only prove the port is faithful to upstream. The README's 2024-04-14 example lists era ឆស័ក and BE ២៥៦៨, which disagree with upstream's own code, so only the lunar day and month are asserted for it.

## To do

- Obtain the primary sub-decree texts (2024–2026) and upgrade records to `official`.
- Add references from a printed Cambodian almanac for non-holiday dates, especially leap-month boundaries (Pathamasadh/Tutiyasadh 2026) and New Year times.
