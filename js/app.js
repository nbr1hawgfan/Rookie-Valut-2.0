import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PHOTO_BUCKET = "card-photos";
const MAX_IMAGE_EDGE = 1800;
const JPEG_QUALITY = 0.82;
const SIGNED_URL_SECONDS = 3600;
const THEME_KEY = "rookie-vault-theme";

const elements = {
  setupPanel: document.querySelector("#setupPanel"),
  authPanel: document.querySelector("#authPanel"),
  appPanel: document.querySelector("#appPanel"),
  authForm: document.querySelector("#authForm"),
  signupButton: document.querySelector("#signupButton"),
  logoutButton: document.querySelector("#logoutButton"),
  themeToggle: document.querySelector("#themeToggle"),
  themeIcon: document.querySelector("#themeIcon"),
  formEyebrow: document.querySelector("#formEyebrow"),
  formTitle: document.querySelector("#formTitle"),
  editNotice: document.querySelector("#editNotice"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  cancelEditButtonBottom: document.querySelector("#cancelEditButtonBottom"),
  authMessage: document.querySelector("#authMessage"),
  emailInput: document.querySelector("#emailInput"),
  passwordInput: document.querySelector("#passwordInput"),
  cardForm: document.querySelector("#cardForm"),
  saveCardButton: document.querySelector("#saveCardButton"),
  cardMessage: document.querySelector("#cardMessage"),
  searchInput: document.querySelector("#searchInput"),
  sportFilters: document.querySelector("#sportFilters"),
  statusFilters: document.querySelector("#statusFilters"),
  resultCount: document.querySelector("#resultCount"),
  cardsGrid: document.querySelector("#cardsGrid"),
  emptyState: document.querySelector("#emptyState"),
  totalCards: document.querySelector("#totalCards"),
  totalValue: document.querySelector("#totalValue"),
  tradeCount: document.querySelector("#tradeCount"),
  cardTemplate: document.querySelector("#cardTemplate"),
  frontPhotoInput: document.querySelector("#frontPhotoInput"),
  backPhotoInput: document.querySelector("#backPhotoInput"),
  frontPreview: document.querySelector("#frontPreview"),
  backPreview: document.querySelector("#backPreview"),
  cardDialog: document.querySelector("#cardDialog"),
  closeDialogButton: document.querySelector("#closeDialogButton"),
  detailPhoto: document.querySelector("#detailPhoto"),
  detailPhotoPlaceholder: document.querySelector("#detailPhotoPlaceholder"),
  showFrontButton: document.querySelector("#showFrontButton"),
  showBackButton: document.querySelector("#showBackButton"),
  detailMeta: document.querySelector("#detailMeta"),
  detailPlayer: document.querySelector("#detailPlayer"),
  detailSet: document.querySelector("#detailSet"),
  detailValue: document.querySelector("#detailValue"),
  detailSport: document.querySelector("#detailSport"),
  detailStatus: document.querySelector("#detailStatus"),
  detailLocation: document.querySelector("#detailLocation"),
  detailNotes: document.querySelector("#detailNotes"),
  detailEditButton: document.querySelector("#detailEditButton"),
  detailDeleteButton: document.querySelector("#detailDeleteButton")
};

let supabase;
let cards = [];
let currentCollectionId = null;
let currentUserId = null;
let activeSport = "all";
let activeStatus = "all";
let previewObjectUrls = [];
let selectedCard = null;
let detailSide = "front";
let editingCard = null;

applyInitialTheme();
init();

async function init() {
  registerServiceWorker();

  try {
    const config = await import("./config.js");
    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
      throw new Error("Missing Supabase configuration.");
    }
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
  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.cardForm.addEventListener("submit", saveCard);
  elements.cancelEditButton.addEventListener("click", cancelEdit);
  elements.cancelEditButtonBottom.addEventListener("click", cancelEdit);
  elements.searchInput.addEventListener("input", renderCards);

  elements.sportFilters.addEventListener("click", event => {
    const button = event.target.closest("[data-sport]");
    if (!button) return;
    activeSport = button.dataset.sport;
    setActiveChip(elements.sportFilters, button);
    renderCards();
  });

  elements.statusFilters.addEventListener("click", event => {
    const button = event.target.closest("[data-status]");
    if (!button) return;
    activeStatus = button.dataset.status;
    setActiveChip(elements.statusFilters, button);
    renderCards();
  });

  elements.frontPhotoInput.addEventListener("change", () =>
    previewSelectedPhoto(elements.frontPhotoInput, elements.frontPreview)
  );

  elements.backPhotoInput.addEventListener("change", () =>
    previewSelectedPhoto(elements.backPhotoInput, elements.backPreview)
  );

  elements.closeDialogButton.addEventListener("click", closeCardDialog);
  elements.showFrontButton.addEventListener("click", () => setDetailSide("front"));
  elements.showBackButton.addEventListener("click", () => setDetailSide("back"));
  elements.detailEditButton.addEventListener("click", beginEditSelectedCard);
  elements.detailDeleteButton.addEventListener("click", deleteSelectedCard);

  elements.cardDialog.addEventListener("click", event => {
    if (event.target === elements.cardDialog) closeCardDialog();
  });
}

function applyInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const theme = saved || "dark";
  applyTheme(theme);
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme || "dark";
  applyTheme(current === "dark" ? "light" : "dark");
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  elements.themeIcon.textContent = theme === "dark" ? "☀" : "☾";
  elements.themeToggle.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
  );

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute("content", theme === "dark" ? "#171317" : "#541923");
}

function setActiveChip(container, activeButton) {
  for (const button of container.querySelectorAll(".filter-chip")) {
    button.classList.toggle("active", button === activeButton);
  }
}

async function showCorrectScreen(session) {
  const signedIn = Boolean(session?.user);
  currentUserId = session?.user?.id ?? null;

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
  if (!currentCollectionId) setCardMessage("No collection was found for this account.");
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
  await attachSignedPhotoUrls(cards);
  setCardMessage("");
  renderCards();
}

async function attachSignedPhotoUrls(cardRows) {
  await Promise.all(cardRows.map(async card => {
    card.front_photo_url = null;
    card.back_photo_url = null;

    if (card.front_photo_path) {
      card.front_photo_url = await createSignedPhotoUrl(card.front_photo_path);
    }

    if (card.back_photo_path) {
      card.back_photo_url = await createSignedPhotoUrl(card.back_photo_path);
    }
  }));
}

async function createSignedPhotoUrl(path) {
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS);

  if (error) {
    console.error(`Could not sign photo URL for ${path}:`, error);
    return null;
  }

  return data?.signedUrl ?? null;
}

async function saveCard(event) {
  event.preventDefault();

  if (!currentCollectionId || !currentUserId) {
    setCardMessage("Your collection is not ready yet. Sign out and sign back in.");
    return;
  }

  setSavingState(true);
  setCardMessage(editingCard ? "Updating card..." : "Preparing card...");

  const uploadedPaths = [];
  const oldPathsToDelete = [];

  try {
    let frontPhotoPath = editingCard?.front_photo_path ?? null;
    let backPhotoPath = editingCard?.back_photo_path ?? null;

    const frontFile = elements.frontPhotoInput.files?.[0];
    const backFile = elements.backPhotoInput.files?.[0];

    if (frontFile) {
      setCardMessage("Uploading front photo...");
      const newFrontPath = await uploadCardPhoto(frontFile);
      uploadedPaths.push(newFrontPath);

      if (frontPhotoPath) oldPathsToDelete.push(frontPhotoPath);
      frontPhotoPath = newFrontPath;
    }

    if (backFile) {
      setCardMessage("Uploading back photo...");
      const newBackPath = await uploadCardPhoto(backFile);
      uploadedPaths.push(newBackPath);

      if (backPhotoPath) oldPathsToDelete.push(backPhotoPath);
      backPhotoPath = newBackPath;
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
      notes: valueOf("#notesInput") || null,
      front_photo_path: frontPhotoPath,
      back_photo_path: backPhotoPath
    };

    let error;

    if (editingCard) {
      setCardMessage("Updating card...");
      ({ error } = await supabase
        .from("cards")
        .update(payload)
        .eq("id", editingCard.id)
        .eq("collection_id", currentCollectionId));
    } else {
      setCardMessage("Saving card...");
      ({ error } = await supabase.from("cards").insert(payload));
    }

    if (error) throw error;

    if (oldPathsToDelete.length) {
      const { error: cleanupError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .remove(oldPathsToDelete);

      if (cleanupError) {
        console.error("Old photo cleanup failed:", cleanupError);
      }
    }

    const successMessage = editingCard
      ? "Card updated successfully."
      : "Card and photos saved.";

    resetCardForm();
    setCardMessage(successMessage);
    await loadCards();
  } catch (error) {
    console.error("Card save failed:", error);
    setCardMessage(error?.message || "Could not save the card.");

    if (uploadedPaths.length) {
      const { error: cleanupError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .remove(uploadedPaths);

      if (cleanupError) {
        console.error("Could not clean up new photos:", cleanupError);
      }
    }
  } finally {
    setSavingState(false);
  }
}

async function uploadCardPhoto(file) {
  if (!file.type.startsWith("image/")) throw new Error("Photo must be an image.");

  const compressedBlob = await resizeImage(file, MAX_IMAGE_EDGE, JPEG_QUALITY);
  const path = `${currentUserId}/${currentCollectionId}/${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, compressedBlob, {
      cacheControl: "3600",
      contentType: "image/jpeg",
      upsert: false
    });

  if (error) throw error;
  return path;
}

async function resizeImage(file, maxEdge, quality) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) return reject(new Error("Could not prepare the photo."));
      resolve(blob);
    }, "image/jpeg", quality);
  });
}

function previewSelectedPhoto(input, imageElement) {
  const file = input.files?.[0];

  if (!file) {
    imageElement.removeAttribute("src");
    imageElement.classList.add("hidden");
    return;
  }

  if (!file.type.startsWith("image/")) {
    input.value = "";
    setCardMessage("Please choose an image file.");
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  previewObjectUrls.push(objectUrl);
  imageElement.src = objectUrl;
  imageElement.classList.remove("hidden");
}

function getFilteredCards() {
  const query = elements.searchInput.value.trim().toLowerCase();

  return cards.filter(card => {
    const matchesSport =
      activeSport === "all" ||
      String(card.sport || "").toLowerCase() === activeSport.toLowerCase();

    const matchesStatus =
      activeStatus === "all" ||
      String(card.status || "").toLowerCase() === activeStatus.toLowerCase();

    const haystack = [
      card.player_name,
      card.sport,
      card.brand,
      card.set_name,
      card.card_number,
      card.storage_location,
      card.status,
      card.card_year,
      card.notes
    ].filter(Boolean).join(" ").toLowerCase();

    return matchesSport && matchesStatus && haystack.includes(query);
  });
}

function renderCards() {
  const filtered = getFilteredCards();
  elements.cardsGrid.replaceChildren();

  for (const card of filtered) {
    const fragment = elements.cardTemplate.content.cloneNode(true);
    const cardElement = fragment.querySelector(".collection-card");
    const photo = fragment.querySelector(".card-photo");
    const placeholder = fragment.querySelector(".card-photo-placeholder");

    if (card.front_photo_url) {
      photo.src = card.front_photo_url;
      photo.alt = `Front of ${card.player_name} card`;
      photo.classList.remove("hidden");
      placeholder.classList.add("hidden");
    }

    fragment.querySelector(".card-meta").textContent =
      [card.card_year, card.brand].filter(Boolean).join(" • ");
    fragment.querySelector(".card-player").textContent = card.player_name;
    fragment.querySelector(".card-value").textContent = currency(card.estimated_value);
    fragment.querySelector(".card-details").textContent =
      [card.set_name, card.card_number ? `#${card.card_number}` : null]
        .filter(Boolean).join(" • ") || "No set details";
    fragment.querySelector(".card-location").textContent =
      card.storage_location ? `Stored: ${card.storage_location}` : "";
    fragment.querySelector(".card-sport").textContent = card.sport || "Other";
    fragment.querySelector(".card-status").textContent =
      String(card.status || "keep").replace("-", " ");

    cardElement.addEventListener("click", () => openCardDialog(card));
    cardElement.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openCardDialog(card);
      }
    });

    elements.cardsGrid.append(fragment);
  }

  const noun = filtered.length === 1 ? "card" : "cards";
  elements.resultCount.textContent = `${filtered.length} ${noun} shown`;
  elements.emptyState.classList.toggle("hidden", filtered.length > 0);

  elements.totalCards.textContent = cards.length;
  elements.totalValue.textContent = currency(
    cards.reduce((sum, card) => sum + Number(card.estimated_value || 0), 0)
  );
  elements.tradeCount.textContent =
    cards.filter(card => card.status === "trade").length;
}

function openCardDialog(card) {
  selectedCard = card;
  detailSide = "front";

  elements.detailMeta.textContent =
    [card.card_year, card.brand].filter(Boolean).join(" • ");
  elements.detailPlayer.textContent = card.player_name;
  elements.detailSet.textContent =
    [card.set_name, card.card_number ? `#${card.card_number}` : null]
      .filter(Boolean).join(" • ") || "No set details";
  elements.detailValue.textContent = currency(card.estimated_value);
  elements.detailSport.textContent = card.sport || "Other";
  elements.detailStatus.textContent = String(card.status || "keep").replace("-", " ");
  elements.detailLocation.textContent = card.storage_location || "Not specified";
  elements.detailNotes.textContent = card.notes || "No notes";

  setDetailSide("front");
  elements.cardDialog.showModal();
}

function closeCardDialog() {
  if (elements.cardDialog.open) elements.cardDialog.close();
  selectedCard = null;
}

function setDetailSide(side) {
  detailSide = side;

  elements.showFrontButton.classList.toggle("active", side === "front");
  elements.showBackButton.classList.toggle("active", side === "back");

  const url =
    side === "front"
      ? selectedCard?.front_photo_url
      : selectedCard?.back_photo_url;

  if (url) {
    elements.detailPhoto.src = url;
    elements.detailPhoto.alt =
      `${side === "front" ? "Front" : "Back"} of ${selectedCard.player_name} card`;
    elements.detailPhoto.classList.remove("hidden");
    elements.detailPhotoPlaceholder.classList.add("hidden");
  } else {
    elements.detailPhoto.removeAttribute("src");
    elements.detailPhoto.classList.add("hidden");
    elements.detailPhotoPlaceholder.textContent =
      `No ${side} photo available`;
    elements.detailPhotoPlaceholder.classList.remove("hidden");
  }
}


function beginEditSelectedCard() {
  if (!selectedCard) return;

  editingCard = selectedCard;

  document.querySelector("#playerInput").value = selectedCard.player_name || "";
  document.querySelector("#sportInput").value = selectedCard.sport || "Other";
  document.querySelector("#yearInput").value = selectedCard.card_year ?? "";
  document.querySelector("#brandInput").value = selectedCard.brand || "";
  document.querySelector("#setInput").value = selectedCard.set_name || "";
  document.querySelector("#cardNumberInput").value = selectedCard.card_number || "";
  document.querySelector("#valueInput").value = selectedCard.estimated_value ?? 0;
  document.querySelector("#statusInput").value = selectedCard.status || "keep";
  document.querySelector("#locationInput").value = selectedCard.storage_location || "";
  document.querySelector("#notesInput").value = selectedCard.notes || "";

  showExistingPreview(
    elements.frontPreview,
    selectedCard.front_photo_url,
    "Current front photo"
  );

  showExistingPreview(
    elements.backPreview,
    selectedCard.back_photo_url,
    "Current back photo"
  );

  elements.formEyebrow.textContent = "Update collection";
  elements.formTitle.textContent = `Edit ${selectedCard.player_name}`;
  elements.editNotice.classList.remove("hidden");
  elements.cancelEditButton.classList.remove("hidden");
  elements.cancelEditButtonBottom.classList.remove("hidden");
  elements.saveCardButton.textContent = "Update card";

  closeCardDialog();

  elements.cardForm.closest(".panel").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  setCardMessage("Choose a new front or back photo only when you want to replace the current one.");
}

function showExistingPreview(imageElement, url, altText) {
  if (!url) {
    imageElement.removeAttribute("src");
    imageElement.classList.add("hidden");
    return;
  }

  imageElement.src = url;
  imageElement.alt = altText;
  imageElement.classList.remove("hidden");
}

function cancelEdit() {
  resetCardForm();
  setCardMessage("Edit cancelled.");
}

async function deleteSelectedCard() {
  if (!selectedCard) return;
  if (!window.confirm("Move this card to the trash?")) return;

  const { error } = await supabase
    .from("cards")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", selectedCard.id);

  if (error) {
    console.error("Card delete failed:", error);
    setCardMessage("Could not remove the card.");
    return;
  }

  closeCardDialog();
  await loadCards();
}

function resetCardForm() {
  elements.cardForm.reset();

  for (const url of previewObjectUrls) URL.revokeObjectURL(url);
  previewObjectUrls = [];

  for (const preview of [elements.frontPreview, elements.backPreview]) {
    preview.removeAttribute("src");
    preview.classList.add("hidden");
  }

  editingCard = null;
  elements.formEyebrow.textContent = "Add to collection";
  elements.formTitle.textContent = "New card";
  elements.editNotice.classList.add("hidden");
  elements.cancelEditButton.classList.add("hidden");
  elements.cancelEditButtonBottom.classList.add("hidden");
  elements.saveCardButton.textContent = "Save card";
}

function setSavingState(isSaving) {
  elements.saveCardButton.disabled = isSaving;

  if (isSaving) {
    elements.saveCardButton.textContent = editingCard ? "Updating..." : "Saving...";
  } else {
    elements.saveCardButton.textContent = editingCard ? "Update card" : "Save card";
  }
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
