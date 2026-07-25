from functools import lru_cache
from pathlib import Path
from typing import Literal, Self

from pydantic import AnyHttpUrl, Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

SERVER_ENV = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=SERVER_ENV,
        env_file_encoding="utf-8",
        env_ignore_empty=True,
        extra="ignore",
    )

    app_env: Literal["development", "test", "production"] = "development"
    allowed_origin: AnyHttpUrl
    model_api_key: SecretStr
    model_base_url: AnyHttpUrl
    model_name: str
    vision_model_api_key: SecretStr | None = None
    vision_model_base_url: AnyHttpUrl | None = None
    vision_model_name: str | None = None
    demo_access_password: SecretStr = Field(min_length=32)
    session_secret: SecretStr = Field(min_length=32)
    session_hours: int = 8
    allow_insecure_model_urls: bool = False

    @model_validator(mode="after")
    def validate_model_configuration(self) -> Self:
        vision_values = (
            self.vision_model_api_key,
            self.vision_model_base_url,
            self.vision_model_name,
        )
        if any(value is not None for value in vision_values) and not all(
            value is not None for value in vision_values
        ):
            raise ValueError("vision model configuration must be complete")

        self._validate_upstream_url(self.model_base_url, "model_base_url")
        if self.vision_model_base_url is not None:
            self._validate_upstream_url(
                self.vision_model_base_url,
                "vision_model_base_url",
            )
        return self

    def _validate_upstream_url(self, url: AnyHttpUrl, field_name: str) -> None:
        if url.username is not None or url.password is not None:
            raise ValueError(f"{field_name} must not include credentials")
        if url.query is not None or url.fragment is not None:
            raise ValueError(f"{field_name} must not include a query or fragment")
        if url.scheme == "https":
            return

        insecure_local_url_allowed = (
            self.app_env == "development"
            and self.allow_insecure_model_urls
            and url.host in {"localhost", "127.0.0.1"}
        )
        if not insecure_local_url_allowed:
            raise ValueError(f"{field_name} must use HTTPS")


@lru_cache
def get_settings() -> Settings:
    return Settings()
