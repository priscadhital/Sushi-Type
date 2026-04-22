"""Sound effect placeholders — swap paths for real WAV/OGG files."""

from __future__ import annotations

import pygame


def init_audio() -> None:
    try:
        pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=512)
    except pygame.error:
        pass


def play_correct() -> None:
    # pygame.mixer.Sound("assets/correct.wav").play()
    pass


def play_wrong() -> None:
    pass


def play_plate() -> None:
    pass


def play_coin() -> None:
    pass


def play_menu_tick() -> None:
    pass
