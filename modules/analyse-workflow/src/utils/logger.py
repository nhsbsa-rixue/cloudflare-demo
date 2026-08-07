import json
from importlib import import_module
from typing import Any

try:
    console = import_module("js").console
except ImportError:
    console = None

_LEVELS = {"debug": 20, "info": 30, "warn": 40, "error": 50}
_MIN_LEVEL = _LEVELS["info"]


class Logger:
    def __init__(self, name: str, context: dict[str, Any] | None = None) -> None:
        self._name = name
        self._ctx: dict[str, Any] = context or {}

    def child(self, **extra: Any) -> "Logger":
        return Logger(self._name, {**self._ctx, **extra})

    def _emit(self, level: str, msg: str, **fields: Any) -> None:
        if _LEVELS.get(level, 0) < _MIN_LEVEL:
            return
        entry = {"level": level, "name": self._name, **self._ctx, **fields, "msg": msg}
        payload = json.dumps(entry)
        if console is None:
            print(payload)
            return
        getattr(console, level if level != "warn" else "warn")(payload)

    def debug(self, msg: str, **fields: Any) -> None:
        self._emit("debug", msg, **fields)

    def info(self, msg: str, **fields: Any) -> None:
        self._emit("info", msg, **fields)

    def warn(self, msg: str, **fields: Any) -> None:
        self._emit("warn", msg, **fields)

    def error(self, msg: str, **fields: Any) -> None:
        self._emit("error", msg, **fields)


def create_logger(name: str) -> Logger:
    return Logger(name)


# Default app-level logger — mirrors `export const logger` in utils/logger.ts
logger = create_logger("app")
