import { normalizePattern } from "./domainRules.js";

const DEFAULTS = {
  backendUrl: "http://localhost:5000/api/v1",
  jwtToken: "",
  blockedSites: [],
  lastDeliveryStatus: {
    state: "idle",
    message: "No sync attempts yet.",
    updatedAt: null
  }
};

const backendUrlInput = document.getElementById("backend-url");
const jwtTokenInput = document.getElementById("jwt-token");
const blockedSitesInput = document.getElementById("blocked-sites");
const strictModeInput = document.getElementById("strict-mode");
const overrideMinutesInput = document.getElementById("override-minutes");
const activeSiteLabel = document.getElementById("active-site");
const statusMessage = document.getElementById("status-message");
const statusTime = document.getElementById("status-time");
const syncState = document.getElementById("sync-state");
const saveButton = document.getElementById("save-settings");
const addCurrentSiteButton = document.getElementById("add-current-site");

let activeHost = "";

initializePopup().catch((error) => {
  renderStatus({
    state: "error",
    message: error.message || "Failed to initialize popup.",
    updatedAt: new Date().toISOString()
  });
});

saveButton.addEventListener("click", async () => {
  const rawBlockedSites = blockedSitesInput.value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
  const normalizedSites = rawBlockedSites.map(normalizePattern);
  if (normalizedSites.some((host) => !host)) {
    renderStatus({ state: "error", message: "One or more blocked domains are invalid. Use a hostname such as example.com.", updatedAt: new Date().toISOString() });
    return;
  }

  const uniqueBlockedSites = [...new Set(normalizedSites)];
  const backendUrl = normalizeBackendUrl(backendUrlInput.value);
  if (!backendUrl) {
    renderStatus({ state: "error", message: "Use an HTTPS backend URL (HTTP is allowed only for localhost).", updatedAt: new Date().toISOString() });
    return;
  }
  const jwtToken = jwtTokenInput.value.trim();
  const strictMode = strictModeInput.checked;
  const overrideMinutes = Math.max(1, Number(overrideMinutesInput.value) || 5);

  saveButton.disabled = true;
  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_SETTINGS",
      payload: {
        backendUrl,
        jwtToken,
        blockedSites: uniqueBlockedSites,
        strictMode,
        overrideMinutes
      }
    });
    if (!response?.ok) {
      renderStatus({ state: "error", message: response?.error || "Settings could not be saved.", updatedAt: new Date().toISOString() });
      return;
    }

    blockedSitesInput.value = (response.settings?.blockedSites || []).join("\n");
    backendUrlInput.value = response.settings?.backendUrl || backendUrl;
    renderStatus({
      state: "success",
      message: "Storm control settings saved.",
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    renderStatus({ state: "error", message: error.message || "Settings could not be saved.", updatedAt: new Date().toISOString() });
  } finally {
    saveButton.disabled = false;
  }
});

addCurrentSiteButton.addEventListener("click", () => {
  if (!activeHost) {
    return;
  }

  const existing = blockedSitesInput.value
    .split(/\r?\n/)
    .map(normalizePattern)
    .filter(Boolean);

  if (!existing.includes(activeHost)) {
    existing.push(activeHost);
    blockedSitesInput.value = existing.join("\n");
  }
});

async function initializePopup() {
  const [settingsResponse, tab] = await Promise.all([
    chrome.runtime.sendMessage({ type: "GET_SETTINGS" }),
    getActiveTab()
  ]);

  const stored = settingsResponse?.settings || {};
  const settings = {
    ...DEFAULTS,
    ...stored
  };

  backendUrlInput.value = settings.backendUrl;
  jwtTokenInput.value = settings.jwtToken;
  blockedSitesInput.value = (settings.blockedSites || []).join("\n");
  strictModeInput.checked = Boolean(settings.strictMode);
  overrideMinutesInput.value = settings.overrideMinutes || 5;
  renderStatus(settings.lastDeliveryStatus || DEFAULTS.lastDeliveryStatus);

  const tabUrl = tab?.url || "";
  activeHost = normalizePattern(tabUrl ? new URL(tabUrl).hostname : "");
  activeSiteLabel.textContent = activeHost
    ? `Current site: ${activeHost}`
    : "Current site: unavailable on this tab";
}

function getActiveTab() {
  return chrome.tabs
    .query({
      active: true,
      currentWindow: true
    })
    .then((tabs) => tabs[0] || null);
}

function normalizeBackendUrl(value) {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");

  if (!trimmed) {
    return DEFAULTS.backendUrl;
  }

  try {
    const parsed = new URL(trimmed);
    const localHttp = parsed.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    const path = parsed.pathname.replace(/\/+$/, "");
    if ((parsed.protocol !== "https:" && !localHttp) || parsed.username || parsed.password || (path && path !== "/api/v1")) return "";
    return `${parsed.origin}/api/v1`;
  } catch { return ""; }
}

function renderStatus(status) {
  const nextStatus = status || DEFAULTS.lastDeliveryStatus;

  statusMessage.textContent = nextStatus.message;
  statusTime.textContent = nextStatus.updatedAt
    ? `Updated ${new Date(nextStatus.updatedAt).toLocaleString()}`
    : "No timestamp yet";

  syncState.dataset.state = nextStatus.state;
}
