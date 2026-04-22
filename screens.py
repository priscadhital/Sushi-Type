"""All game screens: auth, menu, play (falling ingredients + typing), shop, leaderboard."""

from __future__ import annotations

import math
import random
from typing import Callable, List, Optional, Tuple

import pygame

from accounts import User, find_user, leaderboard_by_coins, leaderboard_by_score, login, signup, update_user
from config import (
    COLORS,
    COMBO_MULT_STEPS,
    SCREEN_H,
    SCREEN_W,
    SHOP_ITEMS,
    TIER_NAMES,
    FONT_ING,
    FONT_TITLE,
    FONT_UI,
)
from effects import CuteSushiFace, FlyingIngredient, OceanBackground, SteamFX
from levels_data import difficulty_speed_y, miss_line_y, unlocked_recipes
import sounds


def _font(size: int) -> pygame.font.Font:
    try:
        return pygame.font.SysFont("arial", size)
    except (OSError, ValueError, pygame.error):
        return pygame.font.Font(None, size)


def combo_multiplier(combo: int) -> float:
    m = 1.0
    for thr, mult in COMBO_MULT_STEPS:
        if combo >= thr:
            m = mult
    return m


class TextField:
    def __init__(self, label: str, y: int, secret: bool = False) -> None:
        self.label = label
        self.y = y
        self.secret = secret
        self.text = ""
        self.focused = False
        self.rect = pygame.Rect(SCREEN_W // 2 - 200, y, 400, 40)

    def draw(self, surf: pygame.Surface, font: pygame.font.Font, small: pygame.font.Font) -> None:
        lab = small.render(self.label, True, COLORS["muted"])
        surf.blit(lab, (self.rect.x, self.rect.y - 22))
        border = COLORS["mint"] if self.focused else COLORS["muted"]
        pygame.draw.rect(surf, (20, 28, 48), self.rect, border_radius=8)
        pygame.draw.rect(surf, border, self.rect, 2, border_radius=8)
        disp = "*" * len(self.text) if self.secret else self.text
        t = font.render(disp + ("|" if self.focused and pygame.time.get_ticks() // 500 % 2 == 0 else ""), True, COLORS["ui"])
        surf.blit(t, (self.rect.x + 10, self.rect.y + 8))

    def handle_event(self, ev: pygame.event.Event) -> None:
        if ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1:
            self.focused = self.rect.collidepoint(ev.pos)
        if not self.focused or ev.type != pygame.KEYDOWN:
            return
        if ev.key == pygame.K_BACKSPACE:
            self.text = self.text[:-1]
        elif ev.key == pygame.K_v and (ev.mod & pygame.KMOD_CTRL):
            pass
        elif ev.unicode and ev.unicode.isprintable() and len(self.text) < 32:
            self.text += ev.unicode


class AuthScreen:
    def __init__(self, on_done: Callable[[Optional[User]], None]) -> None:
        self.on_done = on_done
        self.user_field = TextField("Username", 200, False)
        self.pass_field = TextField("Password", 290, True)
        self.msg = ""
        self.font = _font(FONT_UI)
        self.small = _font(18)
        self.title = _font(FONT_TITLE)
        self.btn_login = pygame.Rect(SCREEN_W // 2 - 210, 380, 200, 44)
        self.btn_signup = pygame.Rect(SCREEN_W // 2 + 10, 380, 200, 44)
        self.btn_guest = pygame.Rect(SCREEN_W // 2 - 120, 440, 240, 40)

    def draw(self, surf: pygame.Surface) -> None:
        t = self.title.render("Sushi Arcade", True, COLORS["accent"])
        surf.blit(t, t.get_rect(center=(SCREEN_W // 2, 100)))
        self.user_field.draw(surf, self.font, self.small)
        self.pass_field.draw(surf, self.font, self.small)
        if self.msg:
            m = self.small.render(self.msg, True, COLORS["sun"])
            surf.blit(m, m.get_rect(center=(SCREEN_W // 2, 350)))
        for rect, label in (
            (self.btn_login, "Login"),
            (self.btn_signup, "Sign up"),
            (self.btn_guest, "Guest (no save)"),
        ):
            pygame.draw.rect(surf, (32, 44, 78), rect, border_radius=10)
            pygame.draw.rect(surf, COLORS["mint"], rect, 2, border_radius=10)
            tx = self.font.render(label, True, COLORS["ui"])
            surf.blit(tx, tx.get_rect(center=rect.center))

    def handle(self, ev: pygame.event.Event) -> None:
        self.user_field.handle_event(ev)
        self.pass_field.handle_event(ev)
        if ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1:
            if self.btn_login.collidepoint(ev.pos):
                u, err = login(self.user_field.text, self.pass_field.text)
                if u:
                    sounds.play_menu_tick()
                    self.on_done(u)
                else:
                    self.msg = err
            elif self.btn_signup.collidepoint(ev.pos):
                ok, err = signup(self.user_field.text, self.pass_field.text)
                if ok:
                    u = find_user(self.user_field.text)
                    sounds.play_menu_tick()
                    self.on_done(u)
                else:
                    self.msg = err
            elif self.btn_guest.collidepoint(ev.pos):
                sounds.play_menu_tick()
                self.on_done(
                    User(username="Guest", password_hash="", coins=0, max_level_unlocked=1, high_score=0)
                )


class MenuScreen:
    def __init__(self, user: User, on_play: Callable[[], None], on_shop: Callable[[], None], on_lb: Callable[[], None], on_quit: Callable[[], None]) -> None:
        self.user = user
        self.on_play = on_play
        self.on_shop = on_shop
        self.on_lb = on_lb
        self.on_quit = on_quit
        self.font = _font(FONT_UI)
        self.title = _font(FONT_TITLE)
        self.big = _font(26)
        self.r_play = pygame.Rect(SCREEN_W // 2 - 140, 230, 280, 52)
        self.r_shop = pygame.Rect(SCREEN_W // 2 - 140, 300, 280, 48)
        self.r_lb = pygame.Rect(SCREEN_W // 2 - 140, 362, 280, 48)
        self.r_quit = pygame.Rect(SCREEN_W // 2 - 140, 424, 280, 44)

    def draw(self, surf: pygame.Surface) -> None:
        t = self.title.render("Kitchen Menu", True, COLORS["accent"])
        surf.blit(t, t.get_rect(center=(SCREEN_W // 2, 120)))
        info = f"{self.user.username}  ·  Coins {self.user.coins}  ·  Max level {self.user.max_level_unlocked}"
        surf.blit(self.font.render(info, True, COLORS["muted"]), self.font.render(info, True, COLORS["muted"]).get_rect(center=(SCREEN_W // 2, 175)))
        for rect, label in (
            (self.r_play, "Play shift"),
            (self.r_shop, "Shop"),
            (self.r_lb, "Leaderboard"),
            (self.r_quit, "Quit"),
        ):
            pygame.draw.rect(surf, (28, 38, 68), rect, border_radius=12)
            pygame.draw.rect(surf, COLORS["mint"], rect, 2, border_radius=12)
            tx = self.big.render(label, True, COLORS["ui"])
            surf.blit(tx, tx.get_rect(center=rect.center))

    def handle(self, ev: pygame.event.Event) -> None:
        if ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1:
            if self.r_play.collidepoint(ev.pos):
                sounds.play_menu_tick()
                self.on_play()
            elif self.r_shop.collidepoint(ev.pos):
                self.on_shop()
            elif self.r_lb.collidepoint(ev.pos):
                self.on_lb()
            elif self.r_quit.collidepoint(ev.pos):
                self.on_quit()


class PlayScreen:
    """Timer mode: type falling ingredients in order; coins + combo; unlock next level on success."""

    def __init__(self, user: User, on_exit: Callable[[User], None]) -> None:
        self.user = user
        self.on_exit = on_exit
        self.play_level = max(1, min(50, user.max_level_unlocked))
        self.pool = unlocked_recipes(self.play_level)
        self.timer = max(28.0, 88.0 - self.play_level * 1.05)
        self.combo = 0
        self.plates = 0
        self.coins_run = 0
        self.steam = SteamFX()
        self.face = CuteSushiFace(SCREEN_W - 100, 120)
        self.flying: List[FlyingIngredient] = []
        self.font_big = _font(FONT_ING)
        self.font_ui = _font(FONT_UI)
        self.font_small = _font(18)
        self.lr: Optional[LevelRecipe] = None
        self.ing_index = 0
        self.partial = ""
        self.fall_y = -40.0
        self.miss_flash = 0.0
        self._pick_recipe()

    def _pick_recipe(self) -> None:
        self.lr = random.choice(self.pool)
        self.ing_index = 0
        self.partial = ""
        self.fall_y = -40.0

    def _target(self) -> str:
        assert self.lr is not None
        return self.lr.ingredients[self.ing_index]

    def _finish_ingredient(self) -> None:
        assert self.lr is not None
        sounds.play_correct()
        self.steam.burst(SCREEN_W // 2, miss_line_y() - 40)
        self.flying.append(
            FlyingIngredient(
                self._target(),
                (SCREEN_W // 2, self.fall_y),
                (SCREEN_W - 120, 140),
            )
        )
        self.combo += 1
        mult = combo_multiplier(self.combo)
        gain = int(4 * mult * (1 + self.play_level * 0.08))
        self.coins_run += gain
        self.ing_index += 1
        self.partial = ""
        self.fall_y = -40.0
        if self.ing_index >= len(self.lr.ingredients):
            sounds.play_plate()
            self.plates += 1
            bonus = int(22 * mult * (1 + self.play_level * 0.12))
            self.coins_run += bonus
            self._pick_recipe()

    def update(self, dt: float) -> None:
        self.timer -= dt
        self.steam.update(dt)
        self.face.update(dt)
        for f in self.flying:
            f.update(dt)
        self.flying = [f for f in self.flying if not f.done]
        self.miss_flash = max(0.0, self.miss_flash - dt)
        if self.timer <= 0:
            self._end_session()
            return
        speed = difficulty_speed_y(self.play_level)
        self.fall_y += speed * dt
        if self.fall_y > miss_line_y() and self.lr is not None:
            sounds.play_wrong()
            self.combo = 0
            self.partial = ""
            self.fall_y = -30.0
            self.timer = max(0.0, self.timer - 4.0)
            self.miss_flash = 0.35

    def _end_session(self) -> None:
        u = self.user
        if u.username != "Guest":
            u.coins += self.coins_run
            u.games_played += 1
            u.high_score = max(u.high_score, self.coins_run + self.plates * 50)
            if self.plates >= 1 and u.max_level_unlocked < 50 and self.play_level == u.max_level_unlocked:
                u.max_level_unlocked += 1
            update_user(u)
        self.on_exit(u)

    def draw(self, surf: pygame.Surface) -> None:
        if self.play_level <= 10:
            tier = TIER_NAMES["easy"]
        elif self.play_level <= 20:
            tier = TIER_NAMES["medium"]
        elif self.play_level <= 30:
            tier = TIER_NAMES["hard"]
        elif self.play_level <= 40:
            tier = TIER_NAMES["expert"]
        else:
            tier = TIER_NAMES["master"]

        hud = f"Level {self.play_level} ({tier})  ·  Timer {max(0, int(self.timer))}s  ·  Combo x{combo_multiplier(self.combo):.2f}  ·  Coins +{self.coins_run}  ·  Plates {self.plates}"
        surf.blit(self.font_ui.render(hud, True, COLORS["ui"]), (24, 18))
        if self.lr:
            rec = self.font_small.render(f"Order: {self.lr.recipe}", True, COLORS["sun"])
            surf.blit(rec, (24, 48))
            prog = " · ".join(
                [("✓ " if i < self.ing_index else "→ " if i == self.ing_index else "") + self.lr.ingredients[i] for i in range(len(self.lr.ingredients))]
            )
            surf.blit(self.font_small.render(prog[:90] + ("…" if len(prog) > 90 else ""), True, COLORS["muted"]), (24, 72))

        target = self._target() if self.lr else ""
        typed = self.partial
        rest = target[len(typed) :]
        w1 = self.font_big.render(typed, True, COLORS["mint"])
        w2 = self.font_big.render(rest, True, COLORS["ui"])
        tx = SCREEN_W // 2 - (w1.get_width() + w2.get_width()) // 2
        surf.blit(w1, (tx, self.fall_y))
        surf.blit(w2, (tx + w1.get_width(), self.fall_y))
        pygame.draw.line(surf, (255, 100, 140), (40, miss_line_y()), (SCREEN_W - 40, miss_line_y()), 2)
        if self.miss_flash > 0:
            overlay = pygame.Surface((SCREEN_W, SCREEN_H), pygame.SRCALPHA)
            overlay.fill((255, 60, 100, 60))
            surf.blit(overlay, (0, 0))
        for f in self.flying:
            f.draw(surf, self.font_big)
        self.steam.draw(surf)
        self.face.draw(surf)
        surf.blit(self.font_small.render("Type the falling word · Backspace fixes · ESC ends shift", True, COLORS["muted"]), (24, SCREEN_H - 36))

    def handle(self, ev: pygame.event.Event) -> None:
        if ev.type == pygame.KEYDOWN and ev.key == pygame.K_ESCAPE:
            self.timer = 0
            self._end_session()
            return
        if self.timer <= 0 or not self.lr:
            return
        if ev.type != pygame.KEYDOWN:
            return
        target = self._target()
        if ev.key == pygame.K_BACKSPACE:
            self.partial = self.partial[:-1]
            return
        if not ev.unicode or not ev.unicode.isprintable():
            return
        ch = ev.unicode
        next_ch = target[len(self.partial)] if len(self.partial) < len(target) else None
        if next_ch is not None and ch == next_ch:
            self.partial += ch
            sounds.play_coin()
            if self.partial == target:
                self._finish_ingredient()
        else:
            sounds.play_wrong()
            self.combo = max(0, self.combo - 2)


class ShopScreen:
    def __init__(self, user: User, on_back: Callable[[User], None]) -> None:
        self.user = user
        self.on_back = on_back
        self.font = _font(FONT_UI)
        self.small = _font(18)
        self.title = _font(FONT_TITLE)
        self.msg = ""
        self.rows: List[Tuple[pygame.Rect, dict]] = []
        y = 200
        for it in SHOP_ITEMS:
            self.rows.append((pygame.Rect(120, y, SCREEN_W - 240, 56), it))
            y += 64
        self.back = pygame.Rect(40, SCREEN_H - 64, 160, 44)

    def draw(self, surf: pygame.Surface) -> None:
        surf.blit(self.title.render("Shop", True, COLORS["accent"]), (40, 40))
        surf.blit(self.font.render(f"Coins: {self.user.coins}", True, COLORS["sun"]), (40, 100))
        if self.msg:
            surf.blit(self.small.render(self.msg, True, COLORS["mint"]), (40, 130))
        for rect, it in self.rows:
            pygame.draw.rect(surf, (26, 36, 62), rect, border_radius=10)
            pygame.draw.rect(surf, COLORS["muted"], rect, 1, border_radius=10)
            t = self.font.render(f"{it['name']}  —  {it['price']} coins", True, COLORS["ui"])
            surf.blit(t, (rect.x + 12, rect.y + 6))
            surf.blit(self.small.render(it["desc"], True, COLORS["muted"]), (rect.x + 12, rect.y + 32))
        pygame.draw.rect(surf, (40, 50, 90), self.back, border_radius=8)
        surf.blit(self.font.render("Back", True, COLORS["ui"]), (self.back.x + 42, self.back.y + 10))

    def handle(self, ev: pygame.event.Event) -> None:
        if ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1:
            if self.back.collidepoint(ev.pos):
                self.on_back(self.user)
                return
            for rect, it in self.rows:
                if rect.collidepoint(ev.pos) and self.user.username != "Guest":
                    price = int(it["price"])
                    if self.user.coins < price:
                        self.msg = "Not enough coins."
                        return
                    self.user.coins -= price
                    self.user.inventory[it["id"]] = self.user.inventory.get(it["id"], 0) + 1
                    update_user(self.user)
                    self.msg = f"Bought {it['name']}!"
                    sounds.play_plate()
                    return
                if rect.collidepoint(ev.pos):
                    self.msg = "Sign in to buy upgrades."


class LeaderboardScreen:
    def __init__(self, on_back: Callable[[], None]) -> None:
        self.on_back = on_back
        self.font = _font(FONT_UI)
        self.small = _font(18)
        self.title = _font(FONT_TITLE)
        self.back = pygame.Rect(40, SCREEN_H - 64, 160, 44)
        self.tab_scores = pygame.Rect(200, 120, 200, 36)
        self.tab_coins = pygame.Rect(420, 120, 200, 36)
        self.mode = "score"

    def draw(self, surf: pygame.Surface) -> None:
        surf.blit(self.title.render("Leaderboard", True, COLORS["accent"]), (40, 40))
        pygame.draw.rect(surf, (30, 40, 70), self.tab_scores, border_radius=6)
        pygame.draw.rect(surf, (30, 40, 70), self.tab_coins, border_radius=6)
        if self.mode == "score":
            pygame.draw.rect(surf, COLORS["mint"], self.tab_scores, 2, border_radius=6)
        else:
            pygame.draw.rect(surf, COLORS["mint"], self.tab_coins, 2, border_radius=6)
        surf.blit(self.small.render("Top score", True, COLORS["ui"]), (self.tab_scores.x + 40, self.tab_scores.y + 8))
        surf.blit(self.small.render("Top coins", True, COLORS["ui"]), (self.tab_coins.x + 44, self.tab_coins.y + 8))
        users = leaderboard_by_score() if self.mode == "score" else leaderboard_by_coins()
        y = 180
        if not users:
            surf.blit(self.font.render("No chefs yet — be the first!", True, COLORS["muted"]), (60, y))
            y += 40
        for i, u in enumerate(users[:12], 1):
            if self.mode == "score":
                line = f"{i}. {u.username}  —  {u.high_score} pts  ({u.games_played} games)"
            else:
                line = f"{i}. {u.username}  —  {u.coins} coins"
            surf.blit(self.font.render(line, True, COLORS["ui"]), (60, y))
            y += 32
        pygame.draw.rect(surf, (40, 50, 90), self.back, border_radius=8)
        surf.blit(self.font.render("Back", True, COLORS["ui"]), (self.back.x + 42, self.back.y + 10))

    def handle(self, ev: pygame.event.Event) -> None:
        if ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1:
            if self.back.collidepoint(ev.pos):
                self.on_back()
            elif self.tab_scores.collidepoint(ev.pos):
                self.mode = "score"
            elif self.tab_coins.collidepoint(ev.pos):
                self.mode = "coins"
