import base64

import pytest
from pydantic import ValidationError

from app.ai.schemas import RecognizeFoodRequest, UserProfile


def profile_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "gender": "male",
        "heightCm": 175,
        "weightKg": 75,
        "age": 28,
        "goal": "fatloss",
        "level": "beginner",
        "daysPerWeek": 4,
        "equipment": "dumbbell",
        "dietPref": "none",
    }
    payload.update(overrides)
    return payload


def test_profile_uses_camel_case_and_forbids_provider_controls() -> None:
    profile = UserProfile.model_validate(profile_payload(notes="  膝盖不适  "))
    assert profile.days_per_week == 4
    assert profile.notes == "膝盖不适"

    for key in ("apiKey", "baseURL", "model", "system", "messages"):
        with pytest.raises(ValidationError):
            UserProfile.model_validate(profile_payload(**{key: "forbidden"}))


def test_image_validation_enforces_mime_and_decoded_size() -> None:
    valid = "data:image/png;base64," + base64.b64encode(b"image").decode()
    assert RecognizeFoodRequest(imageDataUrl=valid).image_data_url == valid

    with pytest.raises(ValidationError):
        RecognizeFoodRequest(imageDataUrl="data:image/svg+xml;base64,PHN2Zz4=")
    oversized = "data:image/jpeg;base64," + base64.b64encode(
        b"x" * (5 * 1024 * 1024 + 1)
    ).decode()
    with pytest.raises(ValidationError):
        RecognizeFoodRequest(imageDataUrl=oversized)

