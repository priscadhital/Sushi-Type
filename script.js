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

/** Full menu: named rolls map to ordered ingredient strings the player must type. */
const SUSHI_MENU = {
  "California Roll": ["sushi rice", "nori", "crab", "avocado", "cucumber"],
  Nigiri: ["sushi rice", "salmon"],
  "Tempura Roll": ["tempura shrimp", "sushi rice", "nori", "avocado", "cucumber"],
  Sashimi: ["salmon", "tuna"],
  "Philadelphia Roll": ["sushi rice", "nori", "smoked salmon", "cream cheese"],
  Maki: ["sushi rice", "nori", "filling"],
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
  "Super Sushi": [
    "sushi rice",
    "nori",
    "salmon",
    "tuna",
    "tempura shrimp",
    "avocado",
    "cucumber",
  ],
  "Salmontastic Roll": [
    "smoked salmon",
    "salmon",
    "sushi rice",
    "nori",
    "cream cheese",
    "cucumber",
  ],
  ICodeshimi: ["salmon", "tuna", "yellowtail", "shrimp"],
  "Rice Bowl": ["sushi rice", "salmon", "avocado", "cucumber", "shrimp"],
  Shushimo: ["tempura shrimp", "nori", "sushi rice", "crab", "cream cheese"],
  Moshimi: ["tuna", "yellowtail", "smoked salmon", "salmon"],
};

const DIFFICULTY = {
  easy: {
    label: "Easy",
    durationSec: 75,
    baseSushiYen: 42,
    msPerCharBudget: 520,
    streakBonusYen: 6,
    pickRecipe(names) {
      const short = names.filter((n) => SUSHI_MENU[n].length <= 5);
      return short.length ? pickRandom(short) : pickRandom(names);
    },
  },
  medium: {
    label: "Medium",
    durationSec: 60,
    baseSushiYen: 35,
    msPerCharBudget: 420,
    streakBonusYen: 8,
    pickRecipe(names) {
      return pickRandom(names);
    },
  },
  hard: {
    label: "Hard",
    durationSec: 45,
    baseSushiYen: 28,
    msPerCharBudget: 340,
    streakBonusYen: 10,
    pickRecipe(names) {
      const epic = names.filter((n) => SUSHI_MENU[n].length >= 6);
      const pool = epic.length ? epic : names;
      const longish = pool.filter((n) => SUSHI_MENU[n].length >= 6);
      if (longish.length && Math.random() < 0.65) return pickRandom(longish);
      return pickRandom(pool);
    },
  },
};

/** Short celebratory lines when a full sushi is plated */
const SUSHI_BURST_LINES = ["Perfect!", "Delicious!", "Fresh!", "Combo!", "Omakase!", "Chef's kiss!", "Irasshaimase!"];

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatYen(n) {
  return `¥${Math.max(0, Math.round(n)).toLocaleString()}`;
}

function $(id) {
  return document.getElementById(id);
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
  difficulty: "medium",
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
  const cfg = DIFFICULTY[game.difficulty] || DIFFICULTY.medium;
  const names = allSushiNames();
  game.currentSushiName = cfg.pickRecipe(names);
  game.ingredients = [...SUSHI_MENU[game.currentSushiName]];
  game.ingredientIndex = 0;
  game.charIndex = 0;
  game.ingredientStartedAt = performance.now();
}

function yenForIngredientSpeed(elapsedMs, ingredient, cfg) {
  const budget = Math.max(
    800,
    ingredient.length * cfg.msPerCharBudget * (game.difficulty === "hard" ? 0.92 : 1)
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
  const cfg = DIFFICULTY[game.difficulty] || DIFFICULTY.medium;
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
  const diffInput = document.querySelector('input[name="difficulty"]:checked');
  game.difficulty = diffInput ? diffInput.value : "medium";
  const cfg = DIFFICULTY[game.difficulty] || DIFFICULTY.medium;
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
    if (game.timeLeft <= 0) endGame();
  }, 1000);
  showScreen("game");
}

function endGame() {
  if (!game.active && !game.timerId) return;
  game.active = false;
  game.inputLocked = false;
  if (game.timerId) {
    clearInterval(game.timerId);
    game.timerId = null;
  }
  SFX.gameOver();

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

  const card = $("order-card");
  if (card) card.classList.remove("order-card--celebrate");

  showScreen("gameover");
}

// ---------------------------------------------------------------------------
// Typing UI: per-character spans, cursor, correct / error states
// ---------------------------------------------------------------------------
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

  const cfg = DIFFICULTY[game.difficulty] || DIFFICULTY.medium;
  $("game-diff-label").textContent = cfg.label;

  renderIngredientPills();
  renderIngredientChars();
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
  if (game.active) endGame();
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  wireIntro();
  wireAuth();
  wireMenu();
  wireGameOver();
  document.addEventListener("keydown", onKeydown);
  showScreen("intro");
});
