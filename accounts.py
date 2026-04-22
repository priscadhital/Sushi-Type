"""Local account storage: unique username, password rules, coins, max level, scores, shop inventory."""

from __future__ import annotations

import hashlib
import json
import os
import re
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional


def _accounts_path() -> str:
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "accounts.json")


@dataclass
class User:
    username: str
    password_hash: str
    coins: int = 0
    max_level_unlocked: int = 1
    high_score: int = 0
    games_played: int = 0
    inventory: Dict[str, int] = field(default_factory=dict)


def _hash_pw(username: str, password: str) -> str:
    return hashlib.sha256(f"{username}\x1f{password}\x1fsushi_arcade_v1".encode()).hexdigest()


def validate_password(password: str) -> Optional[str]:
    if len(password) < 8:
        return "Password must be at least 8 characters."
    if not re.search(r"[A-Z]", password):
        return "Password needs an uppercase letter."
    if not re.search(r"[a-z]", password):
        return "Password needs a lowercase letter."
    if not re.search(r"[0-9]", password):
        return "Password needs a number."
    if not re.search(r"[^A-Za-z0-9]", password):
        return "Password needs a symbol."
    return None


def validate_username(username: str) -> Optional[str]:
    u = username.strip()
    if len(u) < 2:
        return "Username at least 2 characters."
    if not re.match(r"^[\w.-]+$", u):
        return "Username: letters, numbers, underscore, dot, hyphen only."
    return None


def load_users() -> List[User]:
    path = _accounts_path()
    if not os.path.isfile(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            raw = json.load(f)
    except (json.JSONDecodeError, OSError):
        return []
    users = []
    for row in raw:
        users.append(
            User(
                username=row["username"],
                password_hash=row["password_hash"],
                coins=int(row.get("coins", 0)),
                max_level_unlocked=int(row.get("max_level_unlocked", 1)),
                high_score=int(row.get("high_score", 0)),
                games_played=int(row.get("games_played", 0)),
                inventory={k: int(v) for k, v in row.get("inventory", {}).items()},
            )
        )
    return users


def save_users(users: List[User]) -> None:
    path = _accounts_path()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump([asdict(u) for u in users], f, indent=2)


def find_user(username: str) -> Optional[User]:
    u = username.strip().lower()
    for x in load_users():
        if x.username.lower() == u:
            return x
    return None


def signup(username: str, password: str) -> tuple[bool, str]:
    e = validate_username(username)
    if e:
        return False, e
    e = validate_password(password)
    if e:
        return False, e
    users = load_users()
    if any(x.username.lower() == username.strip().lower() for x in users):
        return False, "Username already taken."
    users.append(
        User(
            username=username.strip(),
            password_hash=_hash_pw(username.strip(), password),
        )
    )
    save_users(users)
    return True, "OK"


def login(username: str, password: str) -> tuple[Optional[User], str]:
    u = find_user(username)
    if not u:
        return None, "User not found."
    if u.password_hash != _hash_pw(u.username, password):
        return None, "Wrong password."
    return u, "OK"


def update_user(mutated: User) -> None:
    users = load_users()
    for i, x in enumerate(users):
        if x.username.lower() == mutated.username.lower():
            users[i] = mutated
            save_users(users)
            return
    users.append(mutated)
    save_users(users)


def leaderboard_by_score() -> List[User]:
    return sorted(load_users(), key=lambda u: u.high_score, reverse=True)[:20]


def leaderboard_by_coins() -> List[User]:
    return sorted(load_users(), key=lambda u: u.coins, reverse=True)[:20]
