/**
 * Sushi Type 🍣⌨️ — vanilla JS typing game
 * Sections: constants → storage → auth → FX helpers → game → typing → UI
 */

// ---------------------------------------------------------------------------
// Sound effect placeholders (no audio files required)
// ---------------------------------------------------------------------------
const SFX = {
  correct() {
    /* new Audio("sfx/pop.mp3").play().catch(() => {}); */
  },
  wrong() {
    /* new Audio("sfx/buzz.mp3").play().catch(() => {}); */
  },
  ingredientDone() {
    /* new Audio("sfx/chop.mp3").play().catch(() => {}); */
  },
  sushiDone() {
    /* new Audio("sfx/bell.mp3").play().catch(() => {}); */
  },
  gameOver() {
    /* new Audio("sfx/curtain.mp3").play().catch(() => {}); */
  },
};

// ---------------------------------------------------------------------------
// Storage keys & sushi menu (recipes + custom rolls)
// ---------------------------------------------------------------------------
const STORAGE_ACCOUNTS = "sushiType_accounts_v1";
const STORAGE_SESSION = "sushiType_session_user";
/** Highest level the player may select (1 = only level 1). Grows when a shift ends on the timer. */
const STORAGE_MAX_UNLOCKED_LEVEL = "sushiType_maxUnlockedLevel_v1";

/**
 * Full ingredient pool per roll. Each order randomly picks a subset (count + order),
 * so two California orders can ask for different ingredients.
 */
const SUSHI_MENU = {
  "California Roll": ["sushi rice", "nori", "crab", "avocado", "cucumber"],
  Nigiri: ["sushi rice", "salmon"],
  "Tempura Roll": ["tempura shrimp", "sushi rice", "nori", "avocado", "cucumber"],
  Sashimi: ["salmon", "tuna"],
  "Philadelphia Roll": ["sushi rice", "nori", "smoked salmon", "cream cheese"],
  /** Classic maki-style pool (distinct from California / rainbow). */
  Maki: ["sushi rice", "nori", "cucumber", "scallion", "sesame seeds", "pickled daikon"],
  "Rainbow Roll": [
    "sushi rice",
    "salmon",
    "tuna",
    "yellowtail",
    "shrimp",
    "cucumber",
    "avocado",
    "nori",
  ],
  "Salmontastic Roll": ["salmon", "sushi rice", "caviar", "nori"],
  ICodeshimi: ["matcha paste", "sushi rice", "nori", "salmon"],
  "Rice Bowl": ["nori", "sushi rice"],
  "Burnt Tempura Roll": ["crispy tempura shrimp", "sushi rice", "nori", "cajun seasoning"],
  "Sushi Salad": ["nori", "sushi rice", "avocado", "cucumber", "cream cheese"],
  "Aquarium Style": ["nori", "crab", "salmon", "tempura shrimp", "caviar"],
  /** No list given — light house specialty pool. */
  "Donta' Sushi": ["sushi rice", "nori", "salmon", "crab"],
  "Mini Roll": ["salmon", "sushi rice"],
  "Koru' Sushi": ["breaded shrimp", "pistachio crumbles", "ranch paste"],
  "Mouthful Roll": ["humuhumunukunukuapua'a", "sushi rice", "nori"],
  "Dragon Roll": ["eel", "avocado", "cucumber", "sushi rice", "nori", "eel sauce"],
  "Volcano Roll": [
    "spicy tuna",
    "crab",
    "baked spicy mayo topping",
    "jalapeno",
    "sushi rice",
    "nori",
  ],
  "Mango Tango Roll": ["shrimp tempura", "mango", "avocado", "cucumber", "sushi rice", "nori"],
  "Tokyo Crunch Roll": ["fried onion crisps", "spicy crab", "cucumber", "sushi rice", "nori"],
  "Samurai Roll": ["steak strips", "cream cheese", "jalapeno", "sushi rice", "nori"],
  "Ocean Blast Roll": ["tuna", "salmon", "yellowtail", "tobiko", "sushi rice", "nori"],
  "Firecracker Roll": ["spicy shrimp", "chili flakes", "avocado", "sushi rice", "nori"],
  "Snow Roll": [
    "crab",
    "cucumber",
    "sushi rice",
    "nori",
    "white sesame",
    "cream cheese topping",
  ],
  "Garden Roll": ["carrot", "cucumber", "avocado", "asparagus", "sushi rice", "nori"],
  "Golden Tiger Roll": ["tempura lobster", "mango sauce", "avocado", "sushi rice", "nori"],
  "Midnight Roll": ["squid ink rice", "tuna", "cucumber", "black sesame", "nori"],
  "Lava Crunch Roll": ["tempura shrimp", "hot mayo", "crushed chips", "sushi rice", "nori"],
  "Neon Roll": ["salmon", "kiwi", "cucumber", "glowing green sauce"],
  "Treasure Roll": ["crab", "shrimp", "gold flakes", "avocado", "sushi rice", "nori"],
  "Thunder Roll": ["eel", "jalapeno", "tempura flakes", "spicy mayo", "sushi rice", "nori"],
  "Sakura Roll": ["tuna", "pickled radish", "cucumber", "pink soy paper"],
  "Cactus Roll": ["grilled chicken", "avocado", "cactus strips", "sushi rice", "nori"],
  "Texas Roll": ["smoked brisket", "jalapeno", "cream cheese", "sushi rice", "nori"],
  "Pixel Roll": ["diced tuna cubes", "avocado cubes", "cucumber cubes", "sushi rice", "nori"],
  "Galaxy Roll": ["purple rice", "salmon", "blue corn crunch", "silver sesame"],
};

/** Numbered levels: 1 (gentlest) → LEVEL_MAX (short timer, tight typing, bigger rolls). */
const LEVEL_MAX = 50;

/** Display name for each level’s visual theme (tooltips + hints). */
const LEVEL_THEME_TITLES = (() => {
  const a = [
    "Paper Lantern",
    "Harbor Mist",
    "Moon Deck",
    "Coral Kitchen",
    "Sakura Shoji",
    "Midnight Pier",
    "Golden Market",
    "Azure Atoll",
    "Ember Reef",
    "Pearl Tide",
    "Citrus Zest",
    "Velvet Lotus",
    "Lotus Garden",
    "Storm Passage",
    "Zen Kitchen",
    "Neon Dock",
    "Royal Tea",
    "Silk Rice",
    "Bamboo Breeze",
    "Ocean Shell",
    "Crystal Wave",
    "Ruby Flame",
    "Forest Mist",
    "Desert Sun",
    "Arctic Frost",
    "Tropical Glow",
    "Urban Alley",
    "Garden Gate",
    "Kitchen Hearth",
    "Dock Lights",
    "Roof Stars",
    "Temple Bell",
    "River Song",
    "Cliff Wind",
    "Dune Gold",
    "Meadow Dew",
    "Glacier Blue",
    "Volcano Ember",
    "Thunder Roll",
    "Aurora Sky",
    "Cloud Nine",
    "Rain Song",
    "Sunset Grill",
    "Dawn Service",
    "Twilight Bar",
    "Fire Omakase",
    "Ice Sculpture",
    "Mystic Cove",
    "Crown Service",
    "Silver Tray",
  ];
  return a.slice(0, LEVEL_MAX);
})();

function levelProgress(level) {
  const L = Math.max(1, Math.min(LEVEL_MAX, level));
  return (L - 1) / (LEVEL_MAX - 1);
}

function createPickRecipe(progress) {
  return function pickRecipe(names) {
    const r = Math.random();
    const short = names.filter((n) => SUSHI_MENU[n].length <= 5);
    const longish = names.filter((n) => SUSHI_MENU[n].length >= 6);
    if (longish.length && r < progress * 0.72 + 0.08) return pickRandom(longish);
    if (short.length && r > 0.4 + progress * 0.45) return pickRandom(short);
    return pickRandom(names);
  };
}

/** Per-level tuning: shorter rounds and tighter budgets as level rises. */
function getLevelConfig(level) {
  const L = Math.max(1, Math.min(LEVEL_MAX, Math.floor(Number(level)) || 1));
  const p = levelProgress(L);
  const durationSec = Math.round(72 - p * (72 - 18));
  const msPerCharBudget = Math.round(505 - p * (505 - 195));
  const baseSushiYen = Math.round(40 - p * 12);
  const streakBonusYen = Math.round(6 + p * 10);
  const speedTightness = 1 - p * 0.15;
  return {
    level: L,
    label: String(L),
    durationSec,
    baseSushiYen,
    msPerCharBudget,
    streakBonusYen,
    speedTightness,
    pickRecipe: createPickRecipe(p),
  };
}

function loadMaxUnlockedLevel() {
  try {
    const v = Number(localStorage.getItem(STORAGE_MAX_UNLOCKED_LEVEL));
    if (!Number.isFinite(v) || v < 1) return 1;
    return Math.min(LEVEL_MAX, Math.floor(v));
  } catch {
    return 1;
  }
}

function saveMaxUnlockedLevel(n) {
  const v = Math.max(1, Math.min(LEVEL_MAX, Math.floor(n)));
  localStorage.setItem(STORAGE_MAX_UNLOCKED_LEVEL, String(v));
}

/**
 * Timer runs out on level L with at least one plate served → level L+1 becomes playable.
 * Ending shift early does not unlock.
 */
function tryUnlockNextLevel(levelPlayed, platesCompleted) {
  const minPlates = 1;
  if (platesCompleted < minPlates) return false;
  const before = loadMaxUnlockedLevel();
  const candidate = Math.min(LEVEL_MAX, levelPlayed + 1);
  const newMax = Math.max(before, candidate);
  if (newMax > before) {
    saveMaxUnlockedLevel(newMax);
    return true;
  }
  return false;
}

/** Injected once: LEVEL_MAX unique @keyframes for level chip motion + border hue. */
function ensureLevelChipAnimationStyles() {
  if (document.getElementById("level-chip-keyframes")) return;
  const chunks = [];
  for (let n = 1; n <= LEVEL_MAX; n += 1) {
    const t1 = ((n * 3) % 11) - 5;
    const t2 = ((n * 7) % 13) - 6;
    const t3 = ((n * 13) % 9) - 4;
    const u1 = ((n * 5) % 7) - 3;
    const u2 = ((n * 11) % 7) - 3;
    const u3 = ((n * 17) % 9) - 4;
    const r1 = ((n * 19) % 15) - 7;
    const r2 = ((n * 23) % 17) - 8;
    const r3 = ((n * 29) % 13) - 6;
    const s = 1 + ((n % 7) - 3) * 0.02;
    const s2 = 1 + ((n % 5) - 2) * 0.025;
    const h = (n * 47) % 360;
    chunks.push(`@keyframes level-chip-anim-${n} {
  0%, 100% { transform: translate(0,0) rotate(0deg) scale(1); border-color: rgba(255,255,255,0.12); }
  25% { transform: translate(${t1}px,${u1}px) rotate(${r1}deg) scale(${s.toFixed(3)}); border-color: hsla(${h},62%,58%,0.45); }
  50% { transform: translate(${t2}px,${u2}px) rotate(${r2}deg) scale(${s2.toFixed(3)}); border-color: hsla(${(h + 40) % 360},55%,52%,0.5); }
  75% { transform: translate(${t3}px,${u3}px) rotate(${r3}deg) scale(1); border-color: hsla(${(h + 80) % 360},58%,56%,0.42); }
}`);
  }
  const el = document.createElement("style");
  el.id = "level-chip-keyframes";
  el.textContent = chunks.join("\n");
  document.head.appendChild(el);
}

/** Injected once: per-level chip gradients + matching in-game glow. */
function ensureLevelThemeStyles() {
  if (document.getElementById("level-theme-styles")) return;
  const chunks = [];
  for (let n = 1; n <= LEVEL_MAX; n += 1) {
    const h1 = (n * 47) % 360;
    const h2 = (h1 + 48 + (n % 17) * 3) % 360;
    const h3 = (h2 + 35) % 360;
    chunks.push(`#screen-game[data-theme-level="${n}"]{--game-theme-glow:hsla(${h1},72%,52%,0.32);}`);
    chunks.push(
      `.level-chip.level-theme-${n}:not(.level-chip--locked){background:linear-gradient(152deg,hsla(${h1},52%,26%,0.95),hsla(${h2},46%,16%,0.98) 55%,hsla(${h3},40%,20%,0.92));color:hsla(${h1},18%,97%,0.98);border-color:hsla(${h1},45%,48%,0.38);}`
    );
    chunks.push(
      `.level-chip.level-theme-${n}.level-chip--locked{background:linear-gradient(165deg,hsla(${h1},28%,12%,0.92),hsla(${h2},22%,8%,0.96));border-color:rgba(255,255,255,0.08);}`
    );
  }
  const el = document.createElement("style");
  el.id = "level-theme-styles";
  el.textContent = chunks.join("\n");
  document.head.appendChild(el);
}

/** Short celebratory lines when a full sushi is plated */
const SUSHI_BURST_LINES = ["Perfect!", "Delicious!", "Fresh!", "Combo!", "Omakase!", "Chef's kiss!", "Irasshaimase!"];

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleCopy(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build this order’s ingredient list: random count and order from the roll’s pool.
 * Higher levels skew toward more ingredients per plate.
 */
function randomIngredientsForRoll(pool, level) {
  const n = pool.length;
  if (n === 0) return [];
  const p = levelProgress(level);
  const minDesired = 1 + Math.floor(p * Math.max(0, n - 1) * 0.55);
  const minK = Math.min(n, Math.max(1, minDesired));
  const k = minK + Math.floor(Math.random() * (n - minK + 1));
  return shuffleCopy(pool).slice(0, k);
}

function formatYen(n) {
  return `¥${Math.max(0, Math.round(n)).toLocaleString()}`;
}

function $(id) {
  return document.getElementById(id);
}

/** Last tapped playable level on the menu (used when starting a shift). */
let menuSelectedLevel = 1;

function refreshLevelHint() {
  const hint = $("level-hint");
  if (!hint) return;
  const maxU = loadMaxUnlockedLevel();
  if (menuSelectedLevel > maxU) menuSelectedLevel = maxU;
  const cfg = getLevelConfig(menuSelectedLevel);
  const theme = LEVEL_THEME_TITLES[menuSelectedLevel - 1] || "Kitchen";
  hint.textContent = `Selected: level ${menuSelectedLevel} — ${theme} · ${cfg.durationSec}s clock · unlocked through level ${maxU}. Let the timer finish with at least one plate to unlock the next.`;
}

function fillLockedLevelChip(btn, n) {
  const lock = document.createElement("span");
  lock.className = "level-chip__lock";
  lock.setAttribute("aria-hidden", "true");
  lock.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 18V12a10 10 0 0 1 20 0v6"/><rect x="7" y="18" width="26" height="18" rx="3.5"/><circle cx="20" cy="27" r="2.2" fill="currentColor" stroke="none"/></svg>';
  const num = document.createElement("span");
  num.className = "level-chip__num";
  num.textContent = String(n);
  btn.appendChild(lock);
  btn.appendChild(num);
}

function renderLevelGrid() {
  const grid = $("level-grid");
  if (!grid) return;
  ensureLevelChipAnimationStyles();
  ensureLevelThemeStyles();
  const maxU = loadMaxUnlockedLevel();
  if (menuSelectedLevel > maxU) menuSelectedLevel = maxU;
  if (menuSelectedLevel < 1) menuSelectedLevel = 1;

  grid.innerHTML = "";
  for (let n = 1; n <= LEVEL_MAX; n += 1) {
    const unlocked = n <= maxU;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `level-chip level-theme-${n}`;
    btn.dataset.level = String(n);
    const themeTitle = LEVEL_THEME_TITLES[n - 1] || "Kitchen";
    btn.title = `Level ${n} — ${themeTitle}`;

    const dur = `${(1.72 + (n % 19) * 0.035).toFixed(3)}s`;
    if (unlocked) {
      const num = document.createElement("span");
      num.className = "level-chip__num";
      num.textContent = String(n);
      btn.appendChild(num);
      btn.style.animation = `level-chip-anim-${n} ${dur} ease-in-out infinite`;
      btn.classList.toggle("level-chip--selected", n === menuSelectedLevel);
      btn.setAttribute("aria-pressed", n === menuSelectedLevel ? "true" : "false");
      btn.setAttribute("aria-label", `Level ${n}, ${themeTitle}, unlocked`);
      btn.addEventListener("click", () => {
        menuSelectedLevel = n;
        renderLevelGrid();
      });
    } else {
      btn.classList.add("level-chip--locked");
      btn.disabled = true;
      btn.style.animation = "none";
      fillLockedLevelChip(btn, n);
      btn.setAttribute(
        "aria-label",
        `Level ${n}, ${themeTitle}, locked until level ${n - 1} is cleared`
      );
    }
    grid.appendChild(btn);
  }
  refreshLevelHint();
}

/** Escape text for safe inline HTML in burst UI */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Account storage (localStorage)
// ---------------------------------------------------------------------------
function loadAccounts() {
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(STORAGE_ACCOUNTS, JSON.stringify(accounts));
}

function getSessionUser() {
  return localStorage.getItem(STORAGE_SESSION) || "";
}

function setSessionUser(username) {
  if (username) localStorage.setItem(STORAGE_SESSION, username);
  else localStorage.removeItem(STORAGE_SESSION);
}

function findUser(username) {
  return loadAccounts().find((u) => u.username === username) || null;
}

function createUserRecord(username, password) {
  return {
    username,
    password,
    totalMoneyEarned: 0,
    gamesPlayed: 0,
    highestScore: 0,
    bestSushiStreak: 0,
  };
}

// ---------------------------------------------------------------------------
// Password rules (signup) — returns { ok, errors[] }
// ---------------------------------------------------------------------------
function validatePassword(pw) {
  const errors = [];
  if (typeof pw !== "string") {
    errors.push("Password is required.");
    return { ok: false, errors };
  }
  if (pw.length < 8) errors.push("Use at least 8 characters.");
  if (!/[A-Z]/.test(pw)) errors.push("Add at least one uppercase letter (A–Z).");
  if (!/[a-z]/.test(pw)) errors.push("Add at least one lowercase letter (a–z).");
  if (!/[0-9]/.test(pw)) errors.push("Add at least one number (0–9).");
  if (!/[^A-Za-z0-9]/.test(pw)) {
    errors.push("Add at least one special character (for example !@#$%).");
  }
  return { ok: errors.length === 0, errors };
}

/** Live checklist for the signup form */
function updatePasswordRuleUI(password) {
  const rules = $("signup-rules");
  if (!rules) return;
  const set = (key, pass) => {
    const li = rules.querySelector(`[data-rule="${key}"]`);
    if (li) li.classList.toggle("ok", pass);
  };
  set("len", password.length >= 8);
  set("upper", /[A-Z]/.test(password));
  set("lower", /[a-z]/.test(password));
  set("num", /[0-9]/.test(password));
  set("special", /[^A-Za-z0-9]/.test(password));
}

// ---------------------------------------------------------------------------
// Screen routing
// ---------------------------------------------------------------------------
const screens = {
  intro: $("screen-intro"),
  auth: $("screen-auth"),
  menu: $("screen-menu"),
  game: $("screen-game"),
  gameover: $("screen-gameover"),
};

function showScreen(name) {
  Object.values(screens).forEach((el) => el && el.classList.remove("active"));
  const el = screens[name];
  if (el) el.classList.add("active");

  document.body.classList.toggle("game-restaurant", name === "game");

  if (name === "menu") renderLevelGrid();

  const goCard = $("gameover-card");
  if (goCard) {
    goCard.classList.remove("gameover--enter");
    if (name === "gameover") {
      void goCard.offsetWidth;
      goCard.classList.add("gameover--enter");
    }
  }
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------
let leaderboardSort = "score"; // 'score' | 'money'

function renderLeaderboard() {
  const list = $("leaderboard-list");
  if (!list) return;
  const accounts = loadAccounts();
  const sorted = [...accounts].sort((a, b) => {
    if (leaderboardSort === "money") {
      return (b.totalMoneyEarned || 0) - (a.totalMoneyEarned || 0);
    }
    return (b.highestScore || 0) - (a.highestScore || 0);
  });
  const top = sorted.slice(0, 10);
  list.innerHTML = "";
  if (!top.length) {
    const li = document.createElement("li");
    li.textContent = "No chefs yet — be the first!";
    li.style.gridColumn = "1 / -1";
    li.style.color = "var(--muted)";
    list.appendChild(li);
    return;
  }
  top.forEach((u, i) => {
    const li = document.createElement("li");
    li.style.animationDelay = `${i * 0.04}s`;
    const name = document.createElement("span");
    name.className = "lb-name";
    name.textContent = u.username;
    const val = document.createElement("span");
    val.className = "lb-val";
    val.textContent =
      leaderboardSort === "money"
        ? formatYen(u.totalMoneyEarned || 0)
        : `${(u.highestScore || 0).toLocaleString()} pts`;
    const sub = document.createElement("span");
    sub.className = "lb-sub";
    sub.textContent =
      leaderboardSort === "money"
        ? `Best run: ${(u.highestScore || 0).toLocaleString()} pts`
        : `Lifetime: ${formatYen(u.totalMoneyEarned || 0)}`;
    li.appendChild(name);
    li.appendChild(val);
    li.appendChild(sub);
    list.appendChild(li);
  });
}

// ---------------------------------------------------------------------------
// Profile panel on main menu
// ---------------------------------------------------------------------------
function refreshProfile() {
  const u = findUser(getSessionUser());
  const set = (id, text) => {
    const el = $(id);
    if (el) el.textContent = text;
  };
  if (!u) {
    set("stat-total-money", "—");
    set("stat-games", "—");
    set("stat-high-score", "—");
    set("stat-best-streak", "—");
    return;
  }
  set("stat-total-money", formatYen(u.totalMoneyEarned || 0));
  set("stat-games", String(u.gamesPlayed || 0));
  set("stat-high-score", (u.highestScore || 0).toLocaleString());
  set("stat-best-streak", String(u.bestSushiStreak || 0));
}

// ---------------------------------------------------------------------------
// Visual / motion helpers (FX layer + HUD micro-animations)
// ---------------------------------------------------------------------------
function pulseHudChip(chipEl) {
  if (!chipEl) return;
  chipEl.classList.remove("hud-chip--tick");
  void chipEl.offsetWidth;
  chipEl.classList.add("hud-chip--tick");
}

/** Smooth count for money display (short tween) */
function animateNumberTo(el, target, formatFn, durationMs = 260) {
  if (!el) return;
  const start = performance.now();
  const from = Number(el.dataset.value || 0);
  if (from === target) {
    el.textContent = formatFn(target);
    return;
  }
  const step = (t) => {
    const p = Math.min(1, (t - start) / durationMs);
    const eased = 1 - (1 - p) * (1 - p);
    const val = Math.round(from + (target - from) * eased);
    el.textContent = formatFn(val);
    if (p < 1) requestAnimationFrame(step);
    else {
      el.textContent = formatFn(target);
      el.dataset.value = String(target);
    }
  };
  requestAnimationFrame(step);
}

function updateTimerBar() {
  const bar = $("timer-bar");
  const fill = $("timer-bar-fill");
  const chip = $("timer-chip");
  if (!bar || !fill) return;
  const max = game.durationSec || 1;
  const pct = game.active ? Math.max(0, Math.min(1, game.timeLeft / max)) : 0;
  bar.style.setProperty("--timer-pct", String(pct));
  /* Same ratio on the clock face so the hand tracks remaining time */
  if (chip) chip.style.setProperty("--timer-pct", String(pct));
  const pct100 = Math.round(pct * 100);
  bar.setAttribute("aria-valuenow", String(pct100));

  const warn = game.active && game.timeLeft <= 10;
  bar.classList.toggle("warn", warn);
  if (chip) chip.classList.toggle("warn", warn);
}

function triggerSuccessBurst(message) {
  const host = $("success-burst");
  if (!host) return;
  host.innerHTML = `<span class="order-ribbon__text">${escapeHtml(message)}</span>`;
  host.classList.remove("is-visible");
  void host.offsetWidth;
  host.classList.add("is-visible");
  window.setTimeout(() => {
    host.classList.remove("is-visible");
    host.innerHTML = "";
  }, 900);
}

/** Floating +¥ near the order card when sushi is plated */
function spawnFloatingMoney(amount) {
  const root = $("fx-root");
  const card = $("order-card");
  if (!root || !card) return;
  const el = document.createElement("div");
  el.className = "fx-money";
  el.textContent = `+${formatYen(amount)}`;
  const r = card.getBoundingClientRect();
  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top = `${r.top + r.height * 0.28}px`;
  root.appendChild(el);
  window.setTimeout(() => el.remove(), 1200);
}

function triggerTypingLinePop() {
  const panel = $("ingredient-type-wrap");
  if (!panel) return;
  panel.classList.remove("typing-panel--pop");
  void panel.offsetWidth;
  panel.classList.add("typing-panel--pop");
}

function flashStreakCombo(streakAfter) {
  const wrap = $("streak-wrap");
  if (!wrap) return;
  wrap.classList.toggle("is-hot", streakAfter >= 2);
  if (streakAfter >= 2) {
    wrap.classList.remove("combo-pop");
    void wrap.offsetWidth;
    wrap.classList.add("combo-pop");
  }
}

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------
const game = {
  active: false,
  /** Blocks typing while the next order animates in */
  inputLocked: false,
  level: 1,
  durationSec: 60,
  timeLeft: 60,
  timerId: null,
  money: 0,
  /** Run score = money earned this session (shown as points) */
  score: 0,
  completed: 0,
  streak: 0,
  bestStreakThisRun: 0,
  currentSushiName: "",
  ingredients: [],
  ingredientIndex: 0,
  charIndex: 0,
  ingredientStartedAt: 0,
  _lastMoneyShown: 0,
};

function allSushiNames() {
  return Object.keys(SUSHI_MENU);
}

function pickNextOrder() {
  const cfg = getLevelConfig(game.level);
  const names = allSushiNames();
  game.currentSushiName = cfg.pickRecipe(names);
  const pool = SUSHI_MENU[game.currentSushiName] || [];
  game.ingredients = randomIngredientsForRoll(pool, game.level);
  game.ingredientIndex = 0;
  game.charIndex = 0;
  game.ingredientStartedAt = performance.now();
}

function yenForIngredientSpeed(elapsedMs, ingredient, cfg) {
  const budget = Math.max(
    800,
    ingredient.length * cfg.msPerCharBudget * (cfg.speedTightness ?? 1)
  );
  const ratio = Math.min(1, elapsedMs / budget);
  const speedPortion = 22 * (1 - ratio);
  return Math.max(0, Math.round(speedPortion));
}

/**
 * After a full sushi is plated: FX, float text, then load next order.
 * Keeps typing locked briefly so animations read cleanly (TypingClub-like cadence).
 */
function scheduleNextOrderAfterSushi(totalReward, burstText, detailLine) {
  const card = $("order-card");
  if (card) {
    card.classList.remove("order-card--celebrate");
    void card.offsetWidth;
    card.classList.add("order-card--celebrate");
  }

  triggerSuccessBurst(burstText);
  spawnFloatingMoney(totalReward);

  const hint = $("combo-hint");
  if (hint) {
    hint.textContent = detailLine;
    hint.style.opacity = "1";
  }

  window.setTimeout(() => {
    pickNextOrder();
    game.inputLocked = false;
    if (card) card.classList.remove("order-card--celebrate");
    if (hint) {
      hint.textContent = "";
      hint.style.opacity = "";
    }
    renderGameUI({ animateMoney: true });
  }, 520);
}

function completeCurrentIngredient() {
  /** Money before this ingredient line resolves (used for smooth HUD counting). */
  const prevMoney = game.money;
  const cfg = getLevelConfig(game.level);
  const ing = game.ingredients[game.ingredientIndex];
  const elapsed = performance.now() - game.ingredientStartedAt;
  const bonus = yenForIngredientSpeed(elapsed, ing, cfg);
  game.money += bonus;
  game.score += bonus;
  SFX.ingredientDone();

  game.ingredientIndex += 1;
  game.charIndex = 0;

  if (game.ingredientIndex >= game.ingredients.length) {
    const streakPart = game.streak * cfg.streakBonusYen;
    const plateBonus = cfg.baseSushiYen + streakPart;
    game.money += plateBonus;
    game.score += plateBonus;
    game.completed += 1;
    game.streak += 1;
    game.bestStreakThisRun = Math.max(game.bestStreakThisRun, game.streak);
    SFX.sushiDone();

    game.inputLocked = true;

    const burst = pickRandom(SUSHI_BURST_LINES);
    const detail = `${formatYen(plateBonus)} this plate · streak ×${game.streak}`;
    scheduleNextOrderAfterSushi(plateBonus, burst, detail);

    flashStreakCombo(game.streak);
    pulseHudChip($("hud-money-wrap"));

    renderGameUI({ animateMoney: true, prevMoney });
    return;
  }

  game.ingredientStartedAt = performance.now();
  triggerTypingLinePop();
  pulseHudChip($("hud-money-wrap"));
  renderGameUI({ animateMoney: true, prevMoney });
}

function resetGameState() {
  game.active = false;
  game.inputLocked = false;
  game.money = 0;
  game.score = 0;
  game.completed = 0;
  game.streak = 0;
  game.bestStreakThisRun = 0;
  game.ingredientIndex = 0;
  game.charIndex = 0;
  game._lastMoneyShown = 0;
  if (game.timerId) {
    clearInterval(game.timerId);
    game.timerId = null;
  }
}

function startGame() {
  const maxU = loadMaxUnlockedLevel();
  game.level = Math.max(1, Math.min(maxU, Math.floor(menuSelectedLevel) || 1));
  const cfg = getLevelConfig(game.level);
  resetGameState();
  game.durationSec = cfg.durationSec;
  game.timeLeft = cfg.durationSec;
  game.active = true;
  pickNextOrder();

  const timerChip = $("timer-chip");
  if (timerChip) timerChip.classList.remove("warn");
  const bar = $("timer-bar");
  if (bar) bar.classList.remove("warn");

  renderGameUI({ animateMoney: false, resetMoneyAnim: true });
  updateTimerBar();

  game.timerId = setInterval(() => {
    if (!game.active) return;
    game.timeLeft -= 1;
    $("game-timer").textContent = String(Math.max(0, game.timeLeft));
    updateTimerBar();
    if (game.timeLeft <= 0) endGame("timer");
  }, 1000);
  showScreen("game");
}

function endGame(reason = "timer") {
  if (!game.active && !game.timerId) return;
  const levelPlayed = game.level;
  const plates = game.completed;
  game.active = false;
  game.inputLocked = false;
  if (game.timerId) {
    clearInterval(game.timerId);
    game.timerId = null;
  }
  SFX.gameOver();

  let unlockedNext = false;
  if (reason === "timer") {
    unlockedNext = tryUnlockNextLevel(levelPlayed, plates);
  }

  const user = findUser(getSessionUser());
  if (user) {
    user.gamesPlayed = (user.gamesPlayed || 0) + 1;
    user.totalMoneyEarned = (user.totalMoneyEarned || 0) + game.money;
    user.highestScore = Math.max(user.highestScore || 0, game.score);
    user.bestSushiStreak = Math.max(user.bestSushiStreak || 0, game.bestStreakThisRun);
    const all = loadAccounts();
    const idx = all.findIndex((u) => u.username === user.username);
    if (idx >= 0) {
      all[idx] = user;
      saveAccounts(all);
    }
  }

  $("go-score").textContent = (game.score || 0).toLocaleString();
  $("go-money").textContent = formatYen(game.money);
  $("go-served").textContent = String(game.completed);
  $("go-streak").textContent = String(game.bestStreakThisRun);

  const goUnlock = $("go-unlock");
  if (goUnlock) {
    if (unlockedNext) {
      const m = loadMaxUnlockedLevel();
      goUnlock.textContent =
        m >= LEVEL_MAX
          ? "Every level is now unlocked. You cleared the path to the top!"
          : `Level ${m} unlocked. Main menu → pick your next challenge.`;
      goUnlock.classList.remove("hidden");
    } else {
      goUnlock.textContent = "";
      goUnlock.classList.add("hidden");
    }
  }

  const card = $("order-card");
  if (card) card.classList.remove("order-card--celebrate");

  const gameScreen = $("screen-game");
  if (gameScreen) gameScreen.removeAttribute("data-theme-level");

  renderSushiStage();

  showScreen("gameover");
}

// ---------------------------------------------------------------------------
// Typing UI: per-character spans, cursor, correct / error states
// ---------------------------------------------------------------------------
function mapIngredientVisual(ing) {
  const s = String(ing).toLowerCase();
  const pairs = [
    ["nori", "sushi-layer--nori"],
    ["rice", "sushi-layer--rice"],
    ["salmon", "sushi-layer--salmon"],
    ["tuna", "sushi-layer--tuna"],
    ["crab", "sushi-layer--crab"],
    ["avocado", "sushi-layer--avocado"],
    ["cucumber", "sushi-layer--cucumber"],
    ["shrimp", "sushi-layer--shrimp"],
    ["tempura", "sushi-layer--tempura"],
    ["lobster", "sushi-layer--lobster"],
    ["eel", "sushi-layer--eel"],
    ["egg", "sushi-layer--egg"],
    ["tamago", "sushi-layer--egg"],
    ["mayo", "sushi-layer--mayo"],
    ["cheese", "sushi-layer--cheese"],
    ["cream", "sushi-layer--cheese"],
    ["spicy", "sushi-layer--spicy"],
    ["sauce", "sushi-layer--sauce"],
    ["jalap", "sushi-layer--veg"],
    ["mango", "sushi-layer--mango"],
    ["corn", "sushi-layer--corn"],
    ["carrot", "sushi-layer--carrot"],
    ["tobiko", "sushi-layer--tobiko"],
    ["caviar", "sushi-layer--tobiko"],
    ["sesame", "sushi-layer--sesame"],
    ["ink", "sushi-layer--ink"],
    ["squid", "sushi-layer--ink"],
    ["chicken", "sushi-layer--chicken"],
    ["steak", "sushi-layer--steak"],
    ["brisket", "sushi-layer--steak"],
    ["smoked", "sushi-layer--smoked"],
    ["matcha", "sushi-layer--matcha"],
    ["gold", "sushi-layer--gold"],
    ["pistachio", "sushi-layer--pistachio"],
    ["ranch", "sushi-layer--sauce"],
    ["crunch", "sushi-layer--crunch"],
    ["flake", "sushi-layer--crunch"],
    ["kiwi", "sushi-layer--mango"],
    ["radish", "sushi-layer--veg"],
    ["asparagus", "sushi-layer--veg"],
    ["scallion", "sushi-layer--veg"],
    ["yellowtail", "sushi-layer--tuna"],
    ["purple", "sushi-layer--matcha"],
    ["wagyu", "sushi-layer--steak"],
    ["breaded", "sushi-layer--tempura"],
    ["pickled", "sushi-layer--veg"],
    ["daikon", "sushi-layer--veg"],
    ["shiso", "sushi-layer--veg"],
    ["cactus", "sushi-layer--veg"],
    ["jalapeno", "sushi-layer--veg"],
    ["lime", "sushi-layer--mango"],
    ["yuzu", "sushi-layer--mango"],
    ["miso", "sushi-layer--sauce"],
    ["teriyaki", "sushi-layer--sauce"],
    ["bbq", "sushi-layer--sauce"],
    ["cajun", "sushi-layer--spicy"],
    ["crispy", "sushi-layer--crunch"],
    ["chips", "sushi-layer--crunch"],
    ["onion", "sushi-layer--veg"],
    ["tofu", "sushi-layer--egg"],
    ["uni", "sushi-layer--tobiko"],
  ];
  for (const [k, cls] of pairs) {
    if (s.includes(k)) return cls;
  }
  return "sushi-layer--accent";
}

function sushiTypingProgress() {
  const ings = game.ingredients;
  if (!ings.length) return { ratio: 0 };
  let total = 0;
  for (const x of ings) total += x.length;
  let done = 0;
  for (let i = 0; i < game.ingredientIndex; i += 1) done += ings[i].length;
  done += game.charIndex;
  const ratio = total ? done / total : 0;
  return { ratio };
}

function renderSushiStage() {
  const stack = $("sushi-stack");
  const stage = $("sushi-stage");
  if (!stack || !stage) return;
  if (!game.active) {
    stack.innerHTML = "";
    stage.dataset.progress = "0";
    stage.classList.remove("sushi-stage--alive", "sushi-stage--happy");
    return;
  }
  const ings = game.ingredients;
  stack.innerHTML = "";
  ings.forEach((ing, i) => {
    const el = document.createElement("div");
    let fill = 0;
    if (i < game.ingredientIndex) fill = 1;
    else if (i === game.ingredientIndex) {
      const len = ing.length || 1;
      fill = game.charIndex / len;
    } else {
      fill = 0.1;
    }
    const ghost = i > game.ingredientIndex;
    el.className = `sushi-layer ${mapIngredientVisual(ing)}${ghost ? " sushi-layer--ghost" : ""}`;
    const minFill = ghost ? 0.08 : 0.04;
    el.style.setProperty("--fill", String(Math.min(1, Math.max(minFill, fill))));
    el.title = ing;
    stack.appendChild(el);
  });
  const { ratio } = sushiTypingProgress();
  stage.dataset.progress = String(Math.round(ratio * 100));
  stage.classList.toggle("sushi-stage--alive", ratio > 0.04);
  stage.classList.toggle("sushi-stage--happy", ratio >= 0.94);
}

function spawnSushiSparkle() {
  const host = $("sushi-sparkles");
  if (!host) return;
  const sp = document.createElement("span");
  sp.className = "sushi-spark";
  sp.style.setProperty("--sx", `${16 + Math.random() * 68}%`);
  sp.style.bottom = `${36 + Math.random() * 48}px`;
  host.appendChild(sp);
  window.setTimeout(() => sp.remove(), 800);
}

function renderIngredientChars() {
  const wrap = $("ingredient-chars");
  if (!wrap) return;
  wrap.innerHTML = "";
  const text = game.ingredients[game.ingredientIndex] || "";
  for (let i = 0; i < text.length; i += 1) {
    const span = document.createElement("span");
    span.textContent = text[i];
    if (i < game.charIndex) span.classList.add("correct");
    else if (i === game.charIndex) span.classList.add("cursor", "pending");
    else span.classList.add("pending");
    wrap.appendChild(span);
  }
  renderSushiStage();
}

function renderIngredientPills() {
  const ul = $("ingredient-pills");
  if (!ul) return;
  ul.innerHTML = "";
  game.ingredients.forEach((ing, i) => {
    const li = document.createElement("li");
    li.textContent = ing;
    if (i < game.ingredientIndex) li.classList.add("done");
    else if (i === game.ingredientIndex) li.classList.add("current");
    ul.appendChild(li);
  });
}

function renderGameUI(opts = {}) {
  const { animateMoney = true, prevMoney, resetMoneyAnim = false } = opts;

  $("sushi-name").textContent = game.currentSushiName || "—";
  const moneyEl = $("game-money");
  const timerEl = $("game-timer");
  if (timerEl) timerEl.textContent = String(Math.max(0, game.timeLeft));

  if (resetMoneyAnim && moneyEl) {
    moneyEl.dataset.value = "0";
    moneyEl.textContent = formatYen(0);
    game._lastMoneyShown = 0;
  } else if (moneyEl) {
    const target = Math.round(game.money);
    if (animateMoney && typeof prevMoney === "number" && target > prevMoney) {
      moneyEl.dataset.value = String(prevMoney);
      moneyEl.textContent = formatYen(prevMoney);
      animateNumberTo(moneyEl, target, formatYen, 240);
    } else {
      moneyEl.textContent = formatYen(target);
      moneyEl.dataset.value = String(target);
    }
    game._lastMoneyShown = target;
  }

  const completedEl = $("game-completed");
  if (completedEl) completedEl.textContent = String(game.completed);

  const streakEl = $("game-streak");
  if (streakEl) streakEl.textContent = String(game.streak);

  const cfg = getLevelConfig(game.level);
  const levelEl = $("game-level-label");
  if (levelEl) levelEl.textContent = cfg.label;

  const gameScreen = $("screen-game");
  if (gameScreen) {
    if (game.active) {
      gameScreen.dataset.themeLevel = String(game.level);
    } else {
      gameScreen.removeAttribute("data-theme-level");
    }
  }

  renderIngredientPills();
  renderIngredientChars();
  renderSushiStage();
  updateTimerBar();
}

function flashIngredientError() {
  const panel = $("ingredient-type-wrap");
  if (!panel) return;
  panel.classList.remove("error-flash");
  void panel.offsetWidth;
  panel.classList.add("error-flash");
  window.setTimeout(() => panel.classList.remove("error-flash"), 450);
}

function onKeydown(ev) {
  if (!game.active || game.inputLocked) return;
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const target = ev.target;
  if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

  const ing = game.ingredients[game.ingredientIndex];
  if (!ing) return;

  if (ev.key === "Backspace") {
    ev.preventDefault();
    if (game.charIndex > 0) {
      game.charIndex -= 1;
      renderIngredientChars();
    }
    return;
  }

  if (ev.key.length !== 1) return;

  const expected = ing[game.charIndex];
  if (ev.key === expected) {
    SFX.correct();
    spawnSushiSparkle();
    const tw = $("ingredient-type-wrap");
    if (tw) {
      tw.classList.remove("typing-panel--tick");
      void tw.offsetWidth;
      tw.classList.add("typing-panel--tick");
      window.setTimeout(() => tw.classList.remove("typing-panel--tick"), 260);
    }
    game.charIndex += 1;
    if (game.charIndex >= ing.length) {
      completeCurrentIngredient();
    } else {
      renderIngredientChars();
    }
  } else {
    SFX.wrong();
    game.streak = 0;
    const streakEl = $("game-streak");
    if (streakEl) streakEl.textContent = "0";
    const wrap = $("streak-wrap");
    if (wrap) {
      wrap.classList.remove("is-hot", "combo-pop");
    }
    flashIngredientError();
    const spans = $("ingredient-chars")?.querySelectorAll("span");
    if (spans && spans[game.charIndex]) {
      const s = spans[game.charIndex];
      s.classList.remove("pending", "cursor");
      s.classList.add("error");
      window.setTimeout(() => {
        renderIngredientChars();
      }, 280);
    } else {
      renderIngredientChars();
    }
  }
}

// ---------------------------------------------------------------------------
// Auth UI handlers
// ---------------------------------------------------------------------------
function wireAuth() {
  const tabLogin = $("tab-login");
  const tabSignup = $("tab-signup");
  const formLogin = $("form-login");
  const formSignup = $("form-signup");
  const loginErr = $("login-error");
  const signupErr = $("signup-error");
  const pwInput = $("signup-password");

  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabSignup.classList.remove("active");
    tabLogin.setAttribute("aria-selected", "true");
    tabSignup.setAttribute("aria-selected", "false");
    formLogin.classList.remove("hidden");
    formSignup.classList.add("hidden");
    loginErr.textContent = "";
  });

  tabSignup.addEventListener("click", () => {
    tabSignup.classList.add("active");
    tabLogin.classList.remove("active");
    tabSignup.setAttribute("aria-selected", "true");
    tabLogin.setAttribute("aria-selected", "false");
    formSignup.classList.remove("hidden");
    formLogin.classList.add("hidden");
    signupErr.textContent = "";
  });

  if (pwInput) {
    pwInput.addEventListener("input", () => updatePasswordRuleUI(pwInput.value));
  }

  formLogin.addEventListener("submit", (e) => {
    e.preventDefault();
    loginErr.textContent = "";
    const username = $("login-username").value.trim();
    const password = $("login-password").value;
    const user = findUser(username);
    if (!user) {
      loginErr.textContent = "No account found with that username.";
      return;
    }
    if (user.password !== password) {
      loginErr.textContent = "Incorrect password.";
      return;
    }
    setSessionUser(username);
    $("menu-username").textContent = username;
    refreshProfile();
    renderLeaderboard();
    showScreen("menu");
  });

  formSignup.addEventListener("submit", (e) => {
    e.preventDefault();
    signupErr.textContent = "";
    const username = $("signup-username").value.trim();
    const password = $("signup-password").value;
    if (username.length < 2) {
      signupErr.textContent = "Username must be at least 2 characters.";
      return;
    }
    if (!/^[\w.-]+$/.test(username)) {
      signupErr.textContent = "Username may use letters, numbers, dot, underscore, or hyphen.";
      return;
    }
    const accounts = loadAccounts();
    if (accounts.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      signupErr.textContent = "That username is already taken. Pick another.";
      return;
    }
    const pwCheck = validatePassword(password);
    if (!pwCheck.ok) {
      signupErr.textContent = pwCheck.errors[0];
      return;
    }
    accounts.push(createUserRecord(username, password));
    saveAccounts(accounts);
    setSessionUser(username);
    $("menu-username").textContent = username;
    refreshProfile();
    renderLeaderboard();
    showScreen("menu");
  });
}

function wireMenu() {
  $("btn-start-game").addEventListener("click", () => startGame());
  $("btn-logout").addEventListener("click", () => {
    setSessionUser("");
    showScreen("auth");
  });
  $("lb-by-score").addEventListener("click", () => {
    leaderboardSort = "score";
    $("lb-by-score").classList.add("active");
    $("lb-by-money").classList.remove("active");
    renderLeaderboard();
  });
  $("lb-by-money").addEventListener("click", () => {
    leaderboardSort = "money";
    $("lb-by-money").classList.add("active");
    $("lb-by-score").classList.remove("active");
    renderLeaderboard();
  });
}

function wireGameOver() {
  $("btn-restart").addEventListener("click", () => startGame());
  $("btn-to-menu").addEventListener("click", () => {
    refreshProfile();
    renderLeaderboard();
    showScreen("menu");
  });
}

function wireIntro() {
  $("btn-intro-continue").addEventListener("click", () => {
    const session = getSessionUser();
    if (session && findUser(session)) {
      $("menu-username").textContent = session;
      refreshProfile();
      renderLeaderboard();
      showScreen("menu");
    } else {
      showScreen("auth");
    }
  });
}

$("btn-abort-game").addEventListener("click", () => {
  if (game.active) endGame("abort");
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  ensureLevelChipAnimationStyles();
  renderLevelGrid();
  wireIntro();
  wireAuth();
  wireMenu();
  wireGameOver();
  document.addEventListener("keydown", onKeydown);
  showScreen("intro");
});
