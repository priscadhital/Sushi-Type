"""Global constants — Japanese arcade feel, 60 FPS target."""

SCREEN_W = 960
SCREEN_H = 640
FPS = 60

FONT_TITLE = 42
FONT_UI = 22
FONT_ING = 28

# Tier labels for HUD
TIER_NAMES = {
    "easy": "Easy",
    "medium": "Medium",
    "hard": "Hard",
    "expert": "Expert",
    "master": "Master Chef",
}

# Combo → coin multiplier (applied to per-keystroke micro reward + plate bonus)
COMBO_MULT_STEPS = [
    (0, 1.0),
    (3, 1.15),
    (6, 1.35),
    (10, 1.55),
    (15, 1.8),
]

# Shop (coins) — placeholders; effects can hook into game later
SHOP_ITEMS = [
    {"id": "knife_steel", "name": "Steel Knife", "price": 120, "desc": "+5% coin from perfect chars"},
    {"id": "knife_gold", "name": "Gold Knife", "price": 400, "desc": "+12% coin bonus"},
    {"id": "plate_porcelain", "name": "Porcelain Plate", "price": 90, "desc": "Longer combo window"},
    {"id": "plate_lacquer", "name": "Lacquer Plate", "price": 280, "desc": "Streak decay slower"},
    {"id": "theme_neon", "name": "Neon Arcade Theme", "price": 200, "desc": "UI glow pack"},
    {"id": "theme_ocean", "name": "Deep Ocean Theme", "price": 200, "desc": "Background pack"},
]

COLORS = {
    "bg_top": (24, 36, 72),
    "bg_bot": (12, 22, 48),
    "ui": (255, 252, 245),
    "muted": (160, 185, 210),
    "accent": (255, 120, 160),
    "mint": (94, 234, 212),
    "sun": (253, 224, 71),
    "hud_bg": (20, 30, 55, 200),
}

DATA_DIR = "data"
LEVELS_FILE = "levels.json"
ACCOUNTS_FILE = "accounts.json"
