"""Load level tier + recipe definitions from JSON."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class LevelRecipe:
    level: int
    tier: str
    recipe: str
    ingredients: List[str]


def _data_path() -> str:
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(here, "data", "levels.json")


def load_levels() -> List[LevelRecipe]:
    path = _data_path()
    with open(path, "r", encoding="utf-8") as f:
        raw: Dict[str, Any] = json.load(f)
    out: List[LevelRecipe] = []
    for row in raw["levels"]:
        out.append(
            LevelRecipe(
                level=int(row["level"]),
                tier=str(row["tier"]),
                recipe=str(row["recipe"]),
                ingredients=list(row["ingredients"]),
            )
        )
    out.sort(key=lambda x: x.level)
    return out


LEVELS: List[LevelRecipe] = load_levels()


def recipe_by_level(n: int) -> Optional[LevelRecipe]:
    for lr in LEVELS:
        if lr.level == n:
            return lr
    return None


def unlocked_recipes(max_level: int) -> List[LevelRecipe]:
    """All recipes from level 1 through max_level inclusive."""
    return [lr for lr in LEVELS if lr.level <= max(1, max_level)]


def tier_for_level(level: int) -> str:
    lr = recipe_by_level(level)
    return lr.tier if lr else "easy"


def difficulty_speed_y(level: int) -> float:
    """Pixels per second — rises with level."""
    return 38 + level * 2.4


def miss_line_y() -> int:
    return 520
