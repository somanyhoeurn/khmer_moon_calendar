"""Enumerations persisted as constrained strings (portable across databases)."""

from __future__ import annotations

from enum import StrEnum


class VerificationStatus(StrEnum):
    OFFICIAL = "official"  # checked against the primary government publication
    SECONDARY_SOURCE = "secondary_source"  # reputable summary of an official publication
    CALCULATED = "calculated"  # algorithmic only; never presented as confirmed
    DISPUTED = "disputed"  # sources disagree; needs review


class SourceType(StrEnum):
    GOVERNMENT = "government"
    PUBLICATION = "publication"
    SECONDARY = "secondary"
    ALGORITHM = "algorithm"


class HolidayCategory(StrEnum):
    NATIONAL = "national"
    ROYAL = "royal"
    BUDDHIST = "buddhist"
    TRADITIONAL = "traditional"
    INTERNATIONAL = "international"


class HolidayType(StrEnum):
    PUBLIC_HOLIDAY = "public_holiday"
    OBSERVANCE = "observance"
    CULTURAL_EVENT = "cultural_event"


class EventType(StrEnum):
    BUDDHIST_OBSERVANCE = "buddhist_observance"
    FESTIVAL = "festival"
    CULTURAL = "cultural"
    ASTRONOMICAL = "astronomical"


class LunarPhase(StrEnum):
    WAXING = "waxing"
    WANING = "waning"


def enum_values(enum: type[StrEnum]) -> str:
    return ", ".join(f"'{member.value}'" for member in enum)
