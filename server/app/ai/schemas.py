import base64
import binascii
import re
from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    RootModel,
    field_validator,
)


class ApiModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class UserProfile(ApiModel):
    gender: Literal["male", "female"]
    height_cm: Annotated[float, Field(alias="heightCm", ge=100, le=250)]
    weight_kg: Annotated[float, Field(alias="weightKg", ge=25, le=400)]
    age: Annotated[int, Field(ge=13, le=100)]
    goal: Literal["fatloss", "muscle", "shape"]
    level: Literal["beginner", "intermediate", "advanced"]
    days_per_week: Annotated[int, Field(alias="daysPerWeek", ge=1, le=7)]
    equipment: Literal["bodyweight", "dumbbell", "gym"]
    diet_pref: Literal["none", "halal", "vegetarian"] = Field(alias="dietPref")
    notes: Annotated[str | None, Field(max_length=1000)] = None
    target_calories: Annotated[
        int | None,
        Field(alias="targetCalories", ge=800, le=6000),
    ] = None

    @field_validator("notes", mode="before")
    @classmethod
    def normalize_notes(cls, value: object) -> object:
        if isinstance(value, str):
            stripped = value.strip()
            return stripped or None
        return value


class Exercise(ApiModel):
    name: Annotated[str, Field(min_length=1, max_length=100)]
    sets: Annotated[int, Field(ge=1, le=20)]
    reps: Annotated[str, Field(min_length=1, max_length=40)]
    rest_sec: Annotated[int, Field(alias="restSec", ge=0, le=900)]
    note: Annotated[str | None, Field(max_length=300)] = None


class WorkoutDay(ApiModel):
    day: Annotated[int, Field(ge=1, le=7)]
    focus: Annotated[str, Field(min_length=1, max_length=100)]
    exercises: Annotated[list[Exercise], Field(min_length=1, max_length=12)]


class WorkoutPayload(ApiModel):
    days: Annotated[list[WorkoutDay], Field(min_length=1, max_length=7)]


class WorkoutPlan(WorkoutPayload):
    id: str
    created_at: int = Field(alias="createdAt")


class FoodItem(ApiModel):
    food: Annotated[str, Field(min_length=1, max_length=100)]
    portion: Annotated[str, Field(min_length=1, max_length=100)]
    kcal: Annotated[float, Field(ge=0, le=10000)]
    protein: Annotated[float, Field(ge=0, le=1000)]
    carb: Annotated[float, Field(ge=0, le=2000)]
    fat: Annotated[float, Field(ge=0, le=1000)]


class Meal(ApiModel):
    name: Annotated[str, Field(min_length=1, max_length=50)]
    items: Annotated[list[FoodItem], Field(max_length=30)]


class DietPayload(ApiModel):
    daily_calories: Annotated[int, Field(alias="dailyCalories", ge=800, le=6000)]
    meals: Annotated[list[Meal], Field(min_length=1, max_length=8)]


class DietPlan(DietPayload):
    id: str
    created_at: int = Field(alias="createdAt")


class FoodItems(RootModel[list[FoodItem]]):
    pass


DATA_URL = re.compile(
    r"^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]*={0,2})$"
)
MAX_IMAGE_BYTES = 5 * 1024 * 1024


class RecognizeFoodRequest(ApiModel):
    image_data_url: str = Field(alias="imageDataUrl")

    @field_validator("image_data_url")
    @classmethod
    def validate_image(cls, value: str) -> str:
        match = DATA_URL.fullmatch(value)
        if match is None:
            raise ValueError("unsupported image data URL")
        try:
            decoded = base64.b64decode(match.group(2), validate=True)
        except (binascii.Error, ValueError) as exc:
            raise ValueError("invalid base64 image") from exc
        if len(decoded) > MAX_IMAGE_BYTES:
            raise ValueError("image exceeds 5 MiB")
        return value

