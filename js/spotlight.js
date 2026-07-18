// Rookie Vault - Home spotlight
// "Card of the day" is a deterministic pick from the real collection (same
// card all day, changes daily) - not random noise on every visit.
// Milestones are real thresholds crossed in actual data, shown once each.

const MILESTONES_SEEN_KEY = "rookie-vault-milestones-seen";
const XBOX_GAMERTAG_KEY = "rookie-vault-xbox-gamertag";

const COUNT_MILESTONES = [10, 25, 50, 100, 250, 500, 1000];
const VALUE_MILESTONES = [500, 1000, 2500, 5000, 10000, 25000, 50000];

const elements = {
  panel: document.querySelector("#spotlightPanel"),
  banner: document.querySelector("#milestoneBanner"),
  bannerText: document.querySelector("#milestoneBannerText"),
  bannerDismiss: document.querySelector("#milestoneBannerDismiss"),
  card: document.querySelector("#spotlightCard"),
  empty: document.querySelector("#spotlightEmpty"),
  xboxInput: document.querySelector("#xboxGamertagInput"),
  xboxLink: document.querySelector("#xboxProfileLink")
};

export function initSpotlight() {
  if (!elements.panel) return;

  elements.bannerDismiss?.addEventListener("click", () => {
    elements.banner.classList.add("hidden");
  });

  initXboxLink();

  render();
  window.addEventListener("rookie-vault-ledger-update", render);
}

function initXboxLink() {
  if (!elements.xboxInput || !elements.xboxLink) return;

  const saved = localStorage.getItem(XBOX_GAMERTAG_KEY) || "";
  elements.xboxInput.value = saved;
  updateXboxLink(saved);

  elements.xboxInput.addEventListener("change", () => {
    const gamertag = elements.xboxInput.value.trim();
    localStorage.setItem(XBOX_GAMERTAG_KEY, gamertag);
    updateXboxLink(gamertag);
  });
}

function updateXboxLink(gamertag) {
  if (!gamertag) {
    elements.xboxLink.href = "https://xboxgamertag.com/";
    elements.xboxLink.textContent = "Xbox profile lookup";
    return;
  }

  elements.xboxLink.href = `https://xboxgamertag.com/search/${encodeURIComponent(gamertag)}`;
  elements.xboxLink.textContent = `${gamertag}'s Xbox profile`;
}

function render() {
  const summary = Array.isArray(window.rookieVaultActiveCardsSummary)
    ? window.rookieVaultActiveCardsSummary
    : [];

  renderCardOfTheDay(summary);
  renderMilestones(summary);
}

function renderCardOfTheDay(summary) {
  if (!summary.length) {
    elements.card.classList.add("hidden");
    elements.empty.classList.remove("hidden");
    return;
  }

  elements.empty.classList.add("hidden");
  elements.card.classList.remove("hidden");

  const today = new Date().toISOString().slice(0, 10);
  const index = hashString(today) % summary.length;
  const card = summary[index];

  elements.card.replaceChildren();

  const thumb = document.createElement("div");
  thumb.className = "ledger-thumb spotlight-thumb";
  if (card.front_photo_url) {
    const image = document.createElement("img");
    image.src = card.front_photo_url;
    image.alt = `Front of ${card.player_name}`;
    thumb.append(image);
  }

  const info = document.createElement("div");
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow accent-text";
  eyebrow.textContent = "Card of the day";

  const name = document.createElement("h3");
  name.textContent = card.player_name;

  const meta = document.createElement("p");
  meta.className = "muted";
  const metaParts = [card.card_year, card.brand].filter(Boolean).join(" • ");
  const value = card.estimated_value > 0 ? currencyLike(card.estimated_value) : null;
  meta.textContent = [metaParts, value].filter(Boolean).join(" · ");

  info.append(eyebrow, name, meta);

  if (card.is_rookie) {
    const badge = document.createElement("span");
    badge.className = "filter-chip active";
    badge.style.pointerEvents = "none";
    badge.textContent = "Rookie";
    info.append(badge);
  }

  elements.card.append(thumb, info);
  elements.card.onclick = () => window.rookieVaultOpenCard?.(card.id);
  elements.card.style.cursor = "pointer";
}

function renderMilestones(summary) {
  if (!elements.banner) return;

  const count = summary.length;
  const totalValue = summary.reduce(
    (sum, card) => sum + card.estimated_value * card.quantity, 0
  );

  const seen = getSeenMilestones();

  const crossedCount = [...COUNT_MILESTONES].reverse().find(m => count >= m && !seen.count.includes(m));
  const crossedValue = [...VALUE_MILESTONES].reverse().find(m => totalValue >= m && !seen.value.includes(m));

  const history = Array.isArray(window.rookieVaultPortfolioHistory)
    ? window.rookieVaultPortfolioHistory
    : [];
  const addedThisWeek = getAddedThisWeek(history, count);

  const messages = [];
  if (crossedCount) messages.push(`🎉 ${crossedCount} cards logged!`);
  if (crossedValue) messages.push(`🎉 Collection crossed $${crossedValue.toLocaleString()}!`);
  if (!messages.length && addedThisWeek > 0) {
    messages.push(`${addedThisWeek} card${addedThisWeek === 1 ? "" : "s"} added this week.`);
  }

  if (!messages.length) {
    elements.banner.classList.add("hidden");
    return;
  }

  elements.bannerText.textContent = messages[0];
  elements.banner.classList.remove("hidden");

  if (crossedCount || crossedValue) {
    if (crossedCount) seen.count.push(crossedCount);
    if (crossedValue) seen.value.push(crossedValue);
    saveSeenMilestones(seen);
  }
}

function getAddedThisWeek(history, currentCount) {
  if (history.length < 2) return 0;

  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const past = [...history]
    .filter(entry => new Date(entry.date).getTime() <= cutoff && typeof entry.count === "number")
    .pop();

  if (!past) return 0;
  return Math.max(0, currentCount - past.count);
}

function getSeenMilestones() {
  try {
    const stored = JSON.parse(localStorage.getItem(MILESTONES_SEEN_KEY) || "null");
    if (stored && Array.isArray(stored.count) && Array.isArray(stored.value)) return stored;
  } catch {
    // fall through
  }
  return { count: [], value: [] };
}

function saveSeenMilestones(seen) {
  localStorage.setItem(MILESTONES_SEEN_KEY, JSON.stringify(seen));
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function currencyLike(value) {
  return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
