from __future__ import annotations

from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok" and body["database"] == "ok"


def test_today_uses_cambodia_date(client: TestClient) -> None:
    body = client.get("/api/v1/calendar/today").json()
    assert body["timezone"] == "Asia/Phnom_Penh"
    assert body["date"]["gregorian_date"] == "2026-10-27"
    assert body["date"]["month"]["id"] == "assoch"
    assert body["date"]["phase"] == "waning"


def test_convert(client: TestClient) -> None:
    body = client.get("/api/v1/lunar-dates/convert", params={"date": "2026-10-11"}).json()
    assert body["lunar_day"] == 15 and body["phase"] == "waning"
    assert body["month"]["name_km"] == "ភទ្របទ"
    # A seeded published reference exists for this date.
    assert body["verification"]["status"] == "verified"
    assert body["verification"]["reference_status"] == "secondary_source"


def test_convert_unverified_date_is_labelled_calculated(client: TestClient) -> None:
    body = client.get("/api/v1/lunar-dates/convert", params={"date": "2030-01-01"}).json()
    assert body["verification"]["status"] == "calculated"


def test_convert_invalid_date(client: TestClient) -> None:
    res = client.get("/api/v1/lunar-dates/convert", params={"date": "2026-02-30"})
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "validation_error"


def test_convert_unsupported_range(client: TestClient) -> None:
    res = client.get("/api/v1/lunar-dates/convert", params={"date": "1850-01-01"})
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "unsupported_date_range"


def test_reverse(client: TestClient) -> None:
    res = client.get(
        "/api/v1/lunar-dates/reverse",
        params={"year": 2570, "month": "assoch", "day": 1, "phase": "waning"},
    )
    assert res.status_code == 200
    body = res.json()
    assert [c["gregorian_date"] for c in body["candidates"]] == ["2026-10-27"]
    assert body["ambiguous"] is False


def test_reverse_leap_month_hint(client: TestClient) -> None:
    res = client.get(
        "/api/v1/lunar-dates/reverse",
        params={"year": 2570, "month": "asadh", "day": 1, "phase": "waxing"},
    )
    assert res.status_code == 422
    error = res.json()["error"]
    assert error["code"] == "invalid_lunar_date"
    assert error["details"]["suggested_months"] == ["pathamasadh", "tutiyasadh"]


def test_reverse_bad_month(client: TestClient) -> None:
    res = client.get(
        "/api/v1/lunar-dates/reverse",
        params={"year": 2570, "month": "january", "day": 1, "phase": "waxing"},
    )
    assert res.status_code == 422


def test_month_view(client: TestClient) -> None:
    body = client.get("/api/v1/calendar/month", params={"year": 2026, "month": 10}).json()
    assert len(body["days"]) == 31
    by_date = {d["date"]: d for d in body["days"]}
    assert by_date["2026-10-27"]["is_today"] is True
    assert "pchum-ben-2026" in by_date["2026-10-11"]["holidays"]
    assert "pchum-ben-2026" in by_date["2026-10-11"]["events"]  # calculated observance too
    assert by_date["2026-10-10"]["is_weekend"] is True


def test_month_validation(client: TestClient) -> None:
    assert client.get("/api/v1/calendar/month", params={"year": 2026, "month": 13}).status_code == 422


def test_year_view(client: TestClient) -> None:
    body = client.get("/api/v1/calendar/year", params={"year": 2026}).json()
    assert len(body["months"]) == 12
    assert sum(len(m["days"]) for m in body["months"]) == 365


def test_holidays(client: TestClient) -> None:
    body = client.get("/api/v1/holidays", params={"year": 2026}).json()
    slugs = [h["slug"] for h in body]
    assert "water-festival-2026" in slugs
    assert all(h["source"] is not None for h in body)
    assert all(h["verification_status"] == "secondary_source" for h in body)
    assert client.get("/api/v1/holidays", params={"year": 2027}).json() == []


def test_holiday_category_filter(client: TestClient) -> None:
    body = client.get("/api/v1/holidays", params={"year": 2026, "category": "royal"}).json()
    assert body and all(h["category"] == "royal" for h in body)


def test_holiday_detail_and_404(client: TestClient) -> None:
    assert client.get("/api/v1/holidays/pchum-ben-2026").json()["end_date"] == "2026-10-12"
    res = client.get("/api/v1/holidays/does-not-exist")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "not_found"


def test_events_are_labelled_calculated(client: TestClient) -> None:
    body = client.get("/api/v1/events", params={"year": 2027}).json()
    assert body, "lunar-rule observances are calculated for any supported year"
    assert {e["verification_status"] for e in body} == {"calculated"}
    assert any(e["slug"] == "visak-bochea-2027" for e in body)


def test_search(client: TestClient) -> None:
    body = client.get("/api/v1/search", params={"q": "pchum"}).json()
    assert any(hit["slug"] == "pchum-ben-2026" for hit in body["items"])
    body = client.get("/api/v1/search", params={"q": "ភ្ជុំ"}).json()
    assert body["total"] >= 1
    body = client.get("/api/v1/search", params={"q": "2026-10-27"}).json()
    assert body["items"][0]["kind"] == "date"


def test_search_validation(client: TestClient) -> None:
    assert client.get("/api/v1/search", params={"q": "x"}).status_code == 422


def test_cors_allows_configured_origin(client: TestClient) -> None:
    res = client.get("/api/v1/health", headers={"Origin": "http://localhost:3000"})
    assert res.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_events_cover_every_year_with_fixed_date_commemorations(client: TestClient) -> None:
    body = client.get("/api/v1/events", params={"year": 2000}).json()
    by_slug = {e["slug"]: e for e in body}
    assert by_slug["independence-day-2000"]["origin"] == "date_rule"
    assert by_slug["independence-day-2000"]["verification_status"] == "calculated"
    assert "end-of-buddhist-lent-2000" in by_slug


def test_rule_based_public_holidays_are_flagged_as_expected(client: TestClient) -> None:
    by_slug = {e["slug"]: e for e in client.get("/api/v1/events", params={"year": 2030}).json()}
    assert by_slug["pchum-ben-2030"]["expected_public_holiday"] is True
    assert by_slug["constitution-day-2030"]["expected_public_holiday"] is True
    assert by_slug["kan-ben-1-2030"]["expected_public_holiday"] is False
    assert by_slug["pchum-ben-2030"]["verification_status"] == "calculated"
    # Removed from the public-holiday list from 2020.
    assert by_slug["human-rights-day-2030"]["expected_public_holiday"] is False
    old = {e["slug"]: e for e in client.get("/api/v1/events", params={"year": 2015}).json()}
    assert old["human-rights-day-2015"]["expected_public_holiday"] is True


def test_chinese_new_year_for_every_supported_year(client: TestClient) -> None:
    by_slug = {e["slug"]: e for e in client.get("/api/v1/events", params={"year": 2027}).json()}
    # 2027: published date 6 February (ICU's Chinese calendar says the 7th; the new moon is at midnight).
    assert (by_slug["chinese-new-year-2027"]["start_date"], by_slug["chinese-new-year-2027"]["end_date"]) == (
        "2027-02-06",
        "2027-02-08",
    )
    assert by_slug["chinese-new-years-eve-2027"]["start_date"] == "2027-02-05"
    assert by_slug["chinese-new-year-2027"]["expected_public_holiday"] is False
    for year in (2000, 2030):
        slugs = {e["slug"] for e in client.get("/api/v1/events", params={"year": year}).json()}
        assert f"chinese-new-year-{year}" in slugs


def test_international_and_national_days(client: TestClient) -> None:
    slugs = {e["slug"] for e in client.get("/api/v1/events", params={"year": 2027}).json()}
    assert {"valentines-day-2027", "halloween-2027", "christmas-day-2027", "peace-day-2027"} <= slugs
    assert "peace-day-2020" not in {
        e["slug"] for e in client.get("/api/v1/events", params={"year": 2020}).json()
    }
