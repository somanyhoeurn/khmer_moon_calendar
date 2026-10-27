# ADR 0001 – Port MomentKH's Chhankitek algorithm to Python

**Status:** accepted (2026-10-27)

## Context

Khmer lunar dates follow the Chhankitek rules, including adhikameas (a leap month: Asadh doubled into Pathamasadh and Tutiyasadh) and chantrathimeas (a leap day: Jesth has 30 days). Generic Chinese or Thai lunisolar libraries don't reproduce Cambodian conventions.

Candidates evaluated on 2026-10-27:

| Candidate | Language | License | Activity | Verdict |
| --- | --- | --- | --- | --- |
| [ThyrithSor/momentkh](https://github.com/ThyrithSor/momentkh) | TypeScript/JS | MIT | pushed 2025-12 | Documented algorithm, permissive. **Selected (ported).** |
| [danhhong/khmer_lunar_date](https://github.com/danhhong/khmer_lunar_date) | Python | **No license file** | pushed 2025-07 | Can't legally be reused. |
| [emdiya/khmer_lunar_chhankitek](https://github.com/emdiya/khmer_lunar_chhankitek) | Dart | MIT | pushed 2026-10 | Wrong runtime for the backend. |

## Decision

Port MomentKH's calculation core faithfully to `backend/app/domain/calendar/chhankitek.py`, behind the `KhmerLunarCalendarEngine` protocol. There is one deliberate deviation: the animal-year and era comparison at exactly 00:00 on ១រោច ពិសាខ uses a strict `<`, which avoids a double increment upstream. The engine is versioned as `chhankitek-momentkh-port@1.0.0`, and every API response reports that version.

## Consequences

- No runtime dependency on a JS library and no Node in the backend.
- The calculation is checked against 12 independent published holiday dates (2024–2026), and all 12 match. A test also asserts that lunar days advance by exactly one with no gaps across 1900–2100.
- Any engine (e.g. an official Ministry table) can replace it by implementing the protocol.
