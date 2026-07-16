import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PHOTO_BUCKET = "card-photos";
const MAX_IMAGE_EDGE = 1800;
const JPEG_QUALITY = 0.82;
const SIGNED_URL_SECONDS = 3600;

const elements = {
  setupPanel: document.querySelector("#setupPanel"), authPanel: document.querySelector("#authPanel"), appPanel: document.querySelector("#appPanel"),
  authForm: document.querySelector("#authForm"), signupButton: document.querySelector("#signupButton"), logoutButton: document.querySelector("#logoutButton"),
  authMessage: document.querySelector("#authMessage"), emailInput: document.querySelector("#emailInput"), passwordInput: document.querySelector("#passwordInput"),
  cardForm: document.querySelector("#cardForm"), saveCardButton: document.querySelector("#saveCardButton"), cardMessage: document.querySelector("#cardMessage"),
  searchInput: document.querySelector("#searchInput"), cardsGrid: document.querySelector("#cardsGrid"), emptyState: document.querySelector("#emptyState"),
  totalCards: document.querySelector("#totalCards"), totalValue: document.querySelector("#totalValue"), tradeCount: document.querySelector("#tradeCount"),
  cardTemplate: document.querySelector("#cardTemplate"), frontPhotoInput: document.querySelector("#frontPhotoInput"), backPhotoInput: document.querySelector("#backPhotoInput"),
  frontPreview: document.querySelector("#frontPreview"), backPreview: document.querySelector("#backPreview")
};

let supabase, cards = [], currentCollectionId = null, currentUserId = null;
let previewObjectUrls = [];
init();

async function init() {
  registerServiceWorker();
  try {
    const config = await import("./config.js");
    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) throw new Error("Missing Supabase configuration.");
    supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  } catch (error) {
    console.error(error); elements.setupPanel.classList.remove("hidden"); elements.authPanel.classList.add("hidden"); return;
  }
  bindEvents();
  const { data, error } = await supabase.auth.getSession();
  if (error) console.error("Could not read session:", error);
  await showCorrectScreen(data?.session ?? null);
  supabase.auth.onAuthStateChange(async (_event, session) => showCorrectScreen(session));
}

function bindEvents() {
  elements.authForm.addEventListener("submit", signIn); elements.signupButton.addEventListener("click", signUp); elements.logoutButton.addEventListener("click", signOut);
  elements.cardForm.addEventListener("submit", saveCard); elements.searchInput.addEventListener("input", renderCards);
  elements.frontPhotoInput.addEventListener("change", () => previewSelectedPhoto(elements.frontPhotoInput, elements.frontPreview));
  elements.backPhotoInput.addEventListener("change", () => previewSelectedPhoto(elements.backPhotoInput, elements.backPreview));
}

async function showCorrectScreen(session) {
  const signedIn = Boolean(session?.user); currentUserId = session?.user?.id ?? null;
  elements.authPanel.classList.toggle("hidden", signedIn); elements.appPanel.classList.toggle("hidden", !signedIn); elements.logoutButton.classList.toggle("hidden", !signedIn);
  if (signedIn) { await loadCurrentCollection(); await loadCards(); }
  else { currentCollectionId = null; cards = []; renderCards(); }
}

async function loadCurrentCollection() {
  const { data, error } = await supabase.from("collection_members").select("collection_id").order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (error) { console.error("Collection loading failed:", error); setCardMessage("Could not open your collection."); currentCollectionId = null; return; }
  currentCollectionId = data?.collection_id ?? null;
  if (!currentCollectionId) setCardMessage("No collection was found for this account.");
}

async function signIn(event) {
  event.preventDefault(); setAuthMessage("Signing in...");
  const { error } = await supabase.auth.signInWithPassword({ email: elements.emailInput.value.trim(), password: elements.passwordInput.value });
  if (error) { console.error("Sign-in failed:", error); setAuthMessage(error.message); return; }
  elements.authForm.reset(); setAuthMessage("");
}
async function signUp() {
  setAuthMessage("Creating account...");
  const { error } = await supabase.auth.signUp({ email: elements.emailInput.value.trim(), password: elements.passwordInput.value });
  if (error) { console.error("Sign-up failed:", error); setAuthMessage(error.message); return; }
  setAuthMessage("Account created. Check email if confirmation is enabled, then sign in.");
}
async function signOut() { const { error } = await supabase.auth.signOut(); if (error) console.error("Sign-out failed:", error); }

async function loadCards() {
  if (!currentCollectionId) { cards = []; renderCards(); return; }
  const { data, error } = await supabase.from("cards").select("*").eq("collection_id", currentCollectionId).is("deleted_at", null).order("created_at", { ascending: false });
  if (error) { console.error("Card loading failed:", error); setCardMessage("Could not load the collection."); return; }
  cards = data ?? []; await attachSignedPhotoUrls(cards); setCardMessage(""); renderCards();
}

async function attachSignedPhotoUrls(rows) {
  await Promise.all(rows.map(async card => {
    card.front_photo_url = card.front_photo_path ? await createSignedPhotoUrl(card.front_photo_path) : null;
    card.back_photo_url = card.back_photo_path ? await createSignedPhotoUrl(card.back_photo_path) : null;
  }));
}
async function createSignedPhotoUrl(path) {
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error) { console.error(`Could not sign photo URL for ${path}:`, error); return null; }
  return data?.signedUrl ?? null;
}

async function saveCard(event) {
  event.preventDefault();
  if (!currentCollectionId || !currentUserId) { setCardMessage("Your collection is not ready yet. Sign out and sign back in."); return; }
  setSavingState(true); setCardMessage("Preparing card...");
  const uploadedPaths = [];
  try {
    let frontPhotoPath = null, backPhotoPath = null;
    const frontFile = elements.frontPhotoInput.files?.[0], backFile = elements.backPhotoInput.files?.[0];
    if (frontFile) { setCardMessage("Uploading front photo..."); frontPhotoPath = await uploadCardPhoto(frontFile); uploadedPaths.push(frontPhotoPath); }
    if (backFile) { setCardMessage("Uploading back photo..."); backPhotoPath = await uploadCardPhoto(backFile); uploadedPaths.push(backPhotoPath); }
    const payload = {
      collection_id: currentCollectionId, player_name: valueOf("#playerInput"), sport: valueOf("#sportInput"), card_year: numberOrNull(valueOf("#yearInput")),
      brand: valueOf("#brandInput") || null, set_name: valueOf("#setInput") || null, card_number: valueOf("#cardNumberInput") || null,
      estimated_value: numberOrNull(valueOf("#valueInput")) ?? 0, status: valueOf("#statusInput"), storage_location: valueOf("#locationInput") || null,
      notes: valueOf("#notesInput") || null, front_photo_path: frontPhotoPath, back_photo_path: backPhotoPath
    };
    setCardMessage("Saving card...");
    const { error } = await supabase.from("cards").insert(payload);
    if (error) throw error;
    resetCardForm(); setCardMessage("Card and photos saved."); await loadCards();
  } catch (error) {
    console.error("Card save failed:", error); setCardMessage(error?.message || "Could not save the card.");
    if (uploadedPaths.length) { const { error: cleanupError } = await supabase.storage.from(PHOTO_BUCKET).remove(uploadedPaths); if (cleanupError) console.error("Photo cleanup failed:", cleanupError); }
  } finally { setSavingState(false); }
}

async function uploadCardPhoto(file) {
  if (!file.type.startsWith("image/")) throw new Error("The selected photo must be an image.");
  const compressedBlob = await resizeImage(file, MAX_IMAGE_EDGE, JPEG_QUALITY);
  const path = `${currentUserId}/${currentCollectionId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, compressedBlob, { cacheControl: "3600", contentType: "image/jpeg", upsert: false });
  if (error) throw error; return path;
}

async function resizeImage(file, maxEdge, quality) {
  const bitmap = await createImageBitmap(file); const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale)), height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false }); context.fillStyle = "#fff"; context.fillRect(0, 0, width, height); context.drawImage(bitmap, 0, 0, width, height); bitmap.close?.();
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not prepare the photo.")), "image/jpeg", quality));
}

function previewSelectedPhoto(input, imageElement) {
  const file = input.files?.[0];
  if (!file) { imageElement.removeAttribute("src"); imageElement.classList.add("hidden"); return; }
  if (!file.type.startsWith("image/")) { input.value = ""; setCardMessage("Please choose an image file."); return; }
  const objectUrl = URL.createObjectURL(file); previewObjectUrls.push(objectUrl); imageElement.src = objectUrl; imageElement.classList.remove("hidden");
}

async function softDeleteCard(cardId) {
  if (!window.confirm("Move this card to the trash?")) return;
  const { error } = await supabase.from("cards").update({ deleted_at: new Date().toISOString() }).eq("id", cardId);
  if (error) { console.error("Card delete failed:", error); setCardMessage("Could not remove the card."); return; }
  await loadCards();
}

function renderCards() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const filtered = cards.filter(card => [card.player_name, card.sport, card.brand, card.set_name, card.card_number, card.storage_location, card.status].filter(Boolean).join(" ").toLowerCase().includes(query));
  elements.cardsGrid.replaceChildren();
  for (const card of filtered) {
    const fragment = elements.cardTemplate.content.cloneNode(true); const photo = fragment.querySelector(".card-photo"), placeholder = fragment.querySelector(".card-photo-placeholder");
    if (card.front_photo_url) { photo.src = card.front_photo_url; photo.alt = `Front of ${card.player_name} card`; photo.classList.remove("hidden"); placeholder.classList.add("hidden"); }
    fragment.querySelector(".card-meta").textContent = [card.card_year, card.brand, card.sport].filter(Boolean).join(" • ");
    fragment.querySelector(".card-player").textContent = card.player_name; fragment.querySelector(".card-value").textContent = currency(card.estimated_value);
    fragment.querySelector(".card-details").textContent = [card.set_name, card.card_number ? `#${card.card_number}` : null].filter(Boolean).join(" • ") || "No set details";
    fragment.querySelector(".card-location").textContent = card.storage_location ? `Stored: ${card.storage_location}` : "";
    fragment.querySelector(".card-status").textContent = card.status.replace("-", " "); fragment.querySelector(".delete-button").addEventListener("click", () => softDeleteCard(card.id));
    elements.cardsGrid.append(fragment);
  }
  elements.emptyState.classList.toggle("hidden", filtered.length > 0); elements.totalCards.textContent = cards.length;
  elements.totalValue.textContent = currency(cards.reduce((sum, card) => sum + Number(card.estimated_value || 0), 0)); elements.tradeCount.textContent = cards.filter(card => card.status === "trade").length;
}

function resetCardForm() { elements.cardForm.reset(); previewObjectUrls.forEach(URL.revokeObjectURL); previewObjectUrls = []; [elements.frontPreview, elements.backPreview].forEach(p => { p.removeAttribute("src"); p.classList.add("hidden"); }); }
function setSavingState(value) { elements.saveCardButton.disabled = value; elements.saveCardButton.textContent = value ? "Saving..." : "Save card"; }
function valueOf(selector) { return document.querySelector(selector).value.trim(); }
function numberOrNull(value) { if (value === "") return null; const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
function currency(value) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0)); }
function setAuthMessage(message) { elements.authMessage.textContent = message; }
function setCardMessage(message) { elements.cardMessage.textContent = message; }
function registerServiceWorker() { if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(error => console.error("Service worker registration failed:", error))); }
