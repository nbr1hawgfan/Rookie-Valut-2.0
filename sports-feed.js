// Rookie Vault - Card hobby video panel
// Uses YouTube's public embed player - no login, no API key.
// Default channel verified live before shipping: "Sports Card Investor"
// (channel ID UCk9zL0UlZ28uS7tlcguSLQg), one of the hobby's most
// established channels. A channel's "uploads" playlist is always its
// channel ID with the UC prefix swapped for UU - that's how the default
// below is built, no separate playlist ID needed.

const PLAYLISTS_KEY = "rookie-vault-video-playlists";

const DEFAULT_PLAYLISTS = [
  { id: "UUk9zL0UlZ28uS7tlcguSLQg", label: "Sports Card Investor" }
];

let activeIndex = 0;

const elements = {
  panel: document.querySelector("#videoFeedPanel"),
  frame: document.querySelector("#videoFeedFrame"),
  tabs: document.querySelector("#videoFeedTabs"),
  settingsButton: document.querySelector("#videoFeedSettingsButton"),
  settings: document.querySelector("#videoFeedSettings"),
  urlInput: document.querySelector("#videoFeedUrlInput"),
  labelInput: document.querySelector("#videoFeedLabelInput"),
  addButton: document.querySelector("#addVideoPlaylistButton"),
  removeButton: document.querySelector("#removeVideoPlaylistButton"),
  message: document.querySelector("#videoFeedMessage")
};

export function initVideoFeed() {
  if (!elements.panel) return;

  elements.settingsButton?.addEventListener("click", () => {
    elements.settings.classList.toggle("hidden");
  });

  elements.addButton?.addEventListener("click", addPlaylist);
  elements.removeButton?.addEventListener("click", removeActivePlaylist);

  renderTabs();
  renderFrame();
}

function getPlaylists() {
  try {
    const stored = JSON.parse(localStorage.getItem(PLAYLISTS_KEY) || "null");
    if (Array.isArray(stored) && stored.length) return stored;
  } catch {
    // fall through to defaults
  }
  return DEFAULT_PLAYLISTS;
}

function savePlaylists(list) {
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(list));
}

// Accepts a playlist URL (list=...), a channel URL (channel/UC...), or a
// single video URL/ID as a fallback.
function extractPlaylistId(input) {
  const trimmed = input.trim();

  const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (listMatch) return { type: "playlist", id: listMatch[1] };

  const channelMatch = trimmed.match(/channel\/(UC[a-zA-Z0-9_-]+)/);
  if (channelMatch) return { type: "playlist", id: `UU${channelMatch[1].slice(2)}` };

  const videoMatch = trimmed.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (videoMatch) return { type: "video", id: videoMatch[1] };

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return { type: "video", id: trimmed };
  if (/^UU[a-zA-Z0-9_-]{22}$/.test(trimmed)) return { type: "playlist", id: trimmed };

  return null;
}

function addPlaylist() {
  const parsed = extractPlaylistId(elements.urlInput.value || "");

  if (!parsed) {
    elements.message.textContent = "Paste a YouTube playlist, channel, or video link.";
    return;
  }

  const label = elements.labelInput.value.trim() || "Videos";
  const playlists = getPlaylists();
  playlists.push({ ...parsed, label });
  savePlaylists(playlists);

  elements.urlInput.value = "";
  elements.labelInput.value = "";
  activeIndex = playlists.length - 1;

  renderTabs();
  renderFrame();
  elements.message.textContent = `Added "${label}".`;
}

function removeActivePlaylist() {
  const playlists = getPlaylists();
  if (playlists.length <= 1) {
    elements.message.textContent = "Keep at least one.";
    return;
  }

  playlists.splice(activeIndex, 1);
  savePlaylists(playlists);
  activeIndex = 0;

  renderTabs();
  renderFrame();
}

function renderTabs() {
  const playlists = getPlaylists();
  elements.tabs.replaceChildren();

  playlists.forEach((playlist, index) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "filter-chip" + (index === activeIndex ? " active" : "");
    tab.textContent = playlist.label;
    tab.addEventListener("click", () => {
      activeIndex = index;
      renderTabs();
      renderFrame();
    });
    elements.tabs.append(tab);
  });
}

function renderFrame() {
  const playlists = getPlaylists();
  const playlist = playlists[activeIndex] || playlists[0];
  if (!playlist) return;

  elements.frame.src = playlist.type === "video"
    ? `https://www.youtube.com/embed/${playlist.id}`
    : `https://www.youtube.com/embed/videoseries?list=${playlist.id}`;
}
