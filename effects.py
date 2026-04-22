"""Ocean scroll, steam puffs, cute sushi face bob — bright arcade polish."""

from __future__ import annotations

import math
import random
from dataclasses import dataclass
from typing import List, Tuple

import pygame

from config import SCREEN_W, SCREEN_H


@dataclass
class Bubble:
    x: float
    y: float
    r: float
    speed: float
    phase: float


@dataclass
class SteamPuff:
    x: float
    y: float
    life: float
    vx: float
    vy: float


class OceanBackground:
    def __init__(self) -> None:
        self.t = 0.0
        self.bubbles: List[Bubble] = [
            Bubble(
                random.uniform(0, SCREEN_W),
                random.uniform(SCREEN_H * 0.3, SCREEN_H),
                random.uniform(2, 6),
                random.uniform(18, 42),
                random.uniform(0, 6.28),
            )
            for _ in range(36)
        ]

    def update(self, dt: float) -> None:
        self.t += dt
        for b in self.bubbles:
            b.y -= b.speed * dt
            b.x += math.sin(self.t * 0.7 + b.phase) * 12 * dt
            if b.y < -10:
                b.y = SCREEN_H + random.uniform(0, 40)
                b.x = random.uniform(0, SCREEN_W)

    def draw(self, surf: pygame.Surface) -> None:
        for y in range(0, SCREEN_H, 6):
            wave = 0.5 + 0.5 * math.sin(self.t * 0.4 + y * 0.02)
            c = (
                int(18 + 20 * wave),
                int(40 + 35 * wave),
                int(90 + 40 * wave),
            )
            pygame.draw.rect(surf, c, (0, y, SCREEN_W, 6))
        for b in self.bubbles:
            br = max(80, min(220, int(140 - b.y * 0.12)))
            pygame.draw.circle(
                surf,
                (80, br, 255),
                (int(b.x), int(b.y)),
                int(b.r),
            )


class SteamFX:
    def __init__(self) -> None:
        self.puffs: List[SteamPuff] = []

    def burst(self, x: float, y: float, n: int = 6) -> None:
        for _ in range(n):
            self.puffs.append(
                SteamPuff(
                    x + random.uniform(-8, 8),
                    y + random.uniform(-4, 4),
                    1.0,
                    random.uniform(-20, 20),
                    random.uniform(-60, -20),
                )
            )

    def update(self, dt: float) -> None:
        for p in self.puffs:
            p.life -= dt * 0.9
            p.x += p.vx * dt
            p.y += p.vy * dt
        self.puffs = [p for p in self.puffs if p.life > 0]

    def draw(self, surf: pygame.Surface) -> None:
        for p in self.puffs:
            g = int(220 * p.life)
            r = int(8 + 10 * (1 - p.life))
            pygame.draw.circle(surf, (g, g + 10, 255), (int(p.x), int(p.y)), r)


class CuteSushiFace:
    """Simple kawaii plate face near HUD."""

    def __init__(self, x: int, y: int) -> None:
        self.x = x
        self.y = y
        self.t = 0.0

    def update(self, dt: float) -> None:
        self.t += dt

    def draw(self, surf: pygame.Surface) -> None:
        bob = math.sin(self.t * 3) * 3
        cx = self.x
        cy = self.y + int(bob)
        pygame.draw.ellipse(surf, (255, 240, 230), (cx - 36, cy - 26, 72, 52))
        pygame.draw.ellipse(surf, (40, 30, 30), (cx - 36, cy - 26, 72, 52), 2)
        eye = 5
        pygame.draw.circle(surf, (30, 22, 22), (cx - 14, cy - 4), eye)
        pygame.draw.circle(surf, (30, 22, 22), (cx + 14, cy - 4), eye)
        pygame.draw.circle(surf, (255, 255, 255), (cx - 16, cy - 6), 2)
        pygame.draw.circle(surf, (255, 255, 255), (cx + 12, cy - 6), 2)
        smile_off = int(math.sin(self.t * 2) * 2)
        pygame.draw.arc(surf, (180, 60, 90), (cx - 16, cy + 2 + smile_off, 32, 18), 3.3, 6.1, 2)


class FlyingIngredient:
    """After correct word, flies toward plate."""

    def __init__(self, text: str, start: Tuple[float, float], end: Tuple[float, float]) -> None:
        self.text = text
        self.x, self.y = start
        self.tx, self.ty = end
        self.p = 0.0
        self.speed = 1.35

    def update(self, dt: float) -> None:
        self.p = min(1.0, self.p + self.speed * dt)

    @property
    def done(self) -> bool:
        return self.p >= 1.0

    def draw(self, surf: pygame.Surface, font: pygame.font.Font) -> None:
        t = self.p * self.p * (3 - 2 * self.p)
        x = self.x + (self.tx - self.x) * t
        y = self.y + (self.ty - self.y) * t - math.sin(self.p * math.pi) * 40
        s = font.render(self.text, True, (255, 255, 120))
        surf.blit(s, (int(x - s.get_width() / 2), int(y)))
