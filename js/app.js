import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const elements = {
  setupPanel: document.querySelector("#setupPanel"),
  authPanel: document.querySelector("#authPanel"),
  appPanel: document.querySelector("#appPanel"),
  authForm: document.querySelector("#authForm"),
  signupButton: document.querySelector("#signupButton"),
  logoutButton: document.querySelector("#logoutButton"),
  authMessage: document.querySelector("#authMessage"),
  emailInput: document.querySelector("#emailInput"),
  passwordInput: document.querySelector("#passwordInput"),
  cardForm: document.querySelector("#cardForm"),
  cardMessage: document.querySelector("#cardMessage"),
  searchInput: document.querySelector("#searchInput"),
  cardsGrid: document.querySelector("#cardsGrid"),
  emptyState: document.querySelector("#emptyState"),
  totalCards: document.querySelector("#totalCards"),
  totalValue: document.querySelector("#totalValue"),
  tradeCount: document.querySelector("#tradeCount"),
  cardTemplate: document.querySelector("#cardTemplate")
};

let supabase;
let cards = [];
let currentCollectionId = null;

init();

async function init() {
  registerServiceWorker();

  try {
    const config = await import("./config.js");
    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) throw new Error("Missing Supabase configuration.");
    supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  } catch (error) {
    console.error(error);
    elements.setupPanel.classList.remove("hidden");
    elements.authPanel.classList.add("hidden");
    return;
  }

  bindEvents();

  const { data, error } = await supabase.auth.getSession();
  if (error) console.error("Could not read session:", error);
  await showCorrectScreen(data?.session ?? null);

  supabase.auth.onAuthStateChange(async (_event, session) => {
    await showCorrectScreen(session);
  });
}

function bindEvents() {
  elements.authForm.addEventListener("submit", signIn);
  elements.signupButton.addEventListener("click", signUp);
  elements.logoutButton.addEventListener("click", signOut);
  elements.cardForm.addEventListener("submit", saveCard);
  elements.searchInput.addEventListener("input", renderCards);
}

async function showCorrectScreen(session) {
  const signedIn = Boolean(session?.user);
  elements.authPanel.classList.toggle("hidden", signedIn);
  elements.appPanel.classList.toggle("hidden", !signedIn);
  elements.logoutButton.classList.toggle("hidden", !signedIn);

  if (signedIn) {
    await loadCurrentCollection();
    await loadCards();
  } else {
    currentCollectionId = null;
    cards = [];
    renderCards();
  }
}

async function loadCurrentCollection() {
  const { data, error } = await supabase
    .from("collection_members")
    .select("collection_id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Collection loading failed:", error);
    setCardMessage("Could not open your collection.");
    currentCollectionId = null;
    return;
  }

  currentCollectionId = data?.collection_id ?? null;

  if (!currentCollectionId) {
    setCardMessage("No collection was found for this account.");
  }
}

async function signIn(event) {
  event.preventDefault();
  setAuthMessage("Signing in...");

  const { error } = await supabase.auth.signInWithPassword({
    email: elements.emailInput.value.trim(),
    password: elements.passwordInput.value
  });

  if (error) {
    console.error("Sign-in failed:", error);
    setAuthMessage(error.message);
    return;
  }

  elements.authForm.reset();
  setAuthMessage("");
}

async function signUp() {
  setAuthMessage("Creating account...");

  const { error } = await supabase.auth.signUp({
    email: elements.emailInput.value.trim(),
    password: elements.passwordInput.value
  });

  if (error) {
    console.error("Sign-up failed:", error);
    setAuthMessage(error.message);
    return;
  }

  setAuthMessage("Account created. Check email if confirmation is enabled, then sign in.");
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Sign-out failed:", error);
}

async function loadCards() {
  if (!currentCollectionId) {
    cards = [];
    renderCards();
    return;
  }

  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("collection_id", currentCollectionId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Card loading failed:", error);
    setCardMessage("Could not load the collection.");
    return;
  }

  cards = data ?? [];
  setCardMessage("");
  renderCards();
}

async function saveCard(event) {
  event.preventDefault();
  setCardMessage("Saving...");

  if (!currentCollectionId) {
    setCardMessage("Your collection is not ready yet. Sign out and sign back in.");
    return;
  }

  const payload = {
    collection_id: currentCollectionId,
    player_name: valueOf("#playerInput"),
    sport: valueOf("#sportInput"),
    card_year: numberOrNull(valueOf("#yearInput")),
    brand: valueOf("#brandInput") || null,
    set_name: valueOf("#setInput") || null,
    card_number: valueOf("#cardNumberInput") || null,
    estimated_value: numberOrNull(valueOf("#valueInput")) ?? 0,
    status: valueOf("#statusInput"),
    storage_location: valueOf("#locationInput") || null,
    notes: valueOf("#notesInput") || null
  };

  const { error } = await supabase.from("cards").insert(payload);

  if (error) {
    console.error("Card save failed:", error);
    setCardMessage(error.message);
    return;
  }

  elements.cardForm.reset();
  setCardMessage("Card saved.");
  await loadCards();
}

async function softDeleteCard(cardId) {
  const confirmed = window.confirm("Move this card to the trash?");
  if (!confirmed) return;

  const { error } = await supabase
    .from("cards")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", cardId);

  if (error) {
    console.error("Card delete failed:", error);
    setCardMessage("Could not remove the card.");
    return;
  }

  await loadCards();
}

function renderCards() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const filtered = cards.filter(card => {
    const haystack = [
      card.player_name,
      card.sport,
      card.brand,
      card.set_name,
      card.card_number,
      card.storage_location,
      card.status
    ].filter(Boolean).join(" ").toLowerCase();

    return haystack.includes(query);
  });

  elements.cardsGrid.replaceChildren();

  for (const card of filtered) {
    const fragment = elements.cardTemplate.content.cloneNode(true);
    fragment.querySelector(".card-meta").textContent =
      [card.card_year, card.brand, card.sport].filter(Boolean).join(" • ");
    fragment.querySelector(".card-player").textContent = card.player_name;
    fragment.querySelector(".card-value").textContent =
      currency(card.estimated_value);
    fragment.querySelector(".card-details").textContent =
      [card.set_name, card.card_number ? `#${card.card_number}` : null]
        .filter(Boolean).join(" • ") || "No set details";
    fragment.querySelector(".card-location").textContent =
      card.storage_location ? `Stored: ${card.storage_location}` : "";
    fragment.querySelector(".card-status").textContent = card.status.replace("-", " ");
    fragment.querySelector(".delete-button").addEventListener("click", () => softDeleteCard(card.id));
    elements.cardsGrid.append(fragment);
  }

  elements.emptyState.classList.toggle("hidden", filtered.length > 0);
  elements.totalCards.textContent = cards.length;
  elements.totalValue.textContent = currency(
    cards.reduce((sum, card) => sum + Number(card.estimated_value || 0), 0)
  );
  elements.tradeCount.textContent = cards.filter(card => card.status === "trade").length;
}

function valueOf(selector) {
  return document.querySelector(selector).value.trim();
}

function numberOrNull(value) {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Number(value || 0));
}

function setAuthMessage(message) {
  elements.authMessage.textContent = message;
}

function setCardMessage(message) {
  elements.cardMessage.textContent = message;
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(error => {
        console.error("Service worker registration failed:", error);
      });
    });
  }
}
