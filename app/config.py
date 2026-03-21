from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping

import yaml


class ConfigError(Exception):
    pass


@dataclass(frozen=True, slots=True)
class AppConfig:
    openai_api_key: str
    openai_model: str = "gpt-4o-mini"

    @classmethod
    def load(cls, file_path: str | Path = "config.yaml") -> "AppConfig":
        path = Path(file_path)
        if not path.exists():
            raise ConfigError(f"Config file not found: {path}")

        try:
            raw_config: Any = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        except yaml.YAMLError as exc:
            raise ConfigError(f"Config file is not valid YAML: {path}") from exc

        if not isinstance(raw_config, Mapping):
            raise ConfigError("Config root must be a key-value object.")

        openai_api_key = str(raw_config.get("openai_api_key", "")).strip()
        openai_model = str(raw_config.get("openai_model", "gpt-4o-mini")).strip() or "gpt-4o-mini"

        return cls(openai_api_key=openai_api_key, openai_model=openai_model)