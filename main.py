"""
Sushi Arcade — Pygame typing game.
Run from this folder:  python main.py
Requires: pip install -r requirements.txt
"""

from __future__ import annotations

import pygame

from config import FPS, SCREEN_H, SCREEN_W
from effects import OceanBackground
import sounds
from screens import AuthScreen, LeaderboardScreen, MenuScreen, PlayScreen, ShopScreen


def main() -> None:
    pygame.init()
    sounds.init_audio()
    pygame.display.set_caption("Sushi Arcade — Typing Shift")
    screen = pygame.display.set_mode((SCREEN_W, SCREEN_H))
    clock = pygame.time.Clock()
    ocean = OceanBackground()

    state = "AUTH"
    user = None
    auth: AuthScreen | None = None
    menu: MenuScreen | None = None
    play: PlayScreen | None = None
    shop: ShopScreen | None = None
    lb: LeaderboardScreen | None = None
    running = True

    def quit_all() -> None:
        nonlocal running
        running = False

    def enter_menu(u) -> None:
        nonlocal user, menu, state
        user = u
        menu = MenuScreen(u, enter_play, enter_shop, enter_lb, quit_all)
        state = "MENU"

    def enter_play() -> None:
        nonlocal play, state
        play = PlayScreen(user, enter_menu)
        state = "PLAY"

    def enter_shop() -> None:
        nonlocal shop, state
        shop = ShopScreen(user, enter_menu)
        state = "SHOP"

    def enter_lb() -> None:
        nonlocal lb, state
        lb = LeaderboardScreen(lambda: enter_menu(user))
        state = "LB"

    auth = AuthScreen(enter_menu)

    while running:
        dt = clock.tick(FPS) / 1000.0
        for ev in pygame.event.get():
            if ev.type == pygame.QUIT:
                running = False
            elif state == "AUTH" and auth:
                auth.handle(ev)
            elif state == "MENU" and menu:
                menu.handle(ev)
            elif state == "PLAY" and play:
                play.handle(ev)
            elif state == "SHOP" and shop:
                shop.handle(ev)
            elif state == "LB" and lb:
                lb.handle(ev)

        ocean.update(dt)
        if state == "PLAY" and play:
            play.update(dt)

        ocean.draw(screen)
        if state == "AUTH" and auth:
            auth.draw(screen)
        elif state == "MENU" and menu:
            menu.draw(screen)
        elif state == "PLAY" and play:
            play.draw(screen)
        elif state == "SHOP" and shop:
            shop.draw(screen)
        elif state == "LB" and lb:
            lb.draw(screen)

        pygame.display.flip()

    pygame.quit()


if __name__ == "__main__":
    main()
