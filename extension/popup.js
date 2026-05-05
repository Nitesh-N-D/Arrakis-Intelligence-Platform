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
  const blockedSites = blockedSitesInput.value
    .split(/\r?\n/)
    .map(normalizePattern)
    .filter(Boolean);

  const uniqueBlockedSites = [...new Set(blockedSites)];
  const backendUrl = normalizeBackendUrl(backendUrlInput.value);
  const jwtToken = jwtTokenInput.value.trim();

  await chrome.storage.local.set({
    backendUrl,
    jwtToken,
    blockedSites: uniqueBlockedSites
  });

  blockedSitesInput.value = uniqueBlockedSites.join("\n");
  renderStatus({
    state: "success",
    message: "Storm control settings saved.",
    updatedAt: new Date().toISOString()
  });
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
  const [stored, tab] = await Promise.all([
    chrome.storage.local.get(Object.keys(DEFAULTS)),
    getActiveTab()
  ]);

  const settings = {
    ...DEFAULTS,
    ...stored
  };

  backendUrlInput.value = settings.backendUrl;
  jwtTokenInput.value = settings.jwtToken;
  blockedSitesInput.value = (settings.blockedSites || []).join("\n");
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

  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
}

function normalizePattern(value) {
  if (!value) {
    return "";
  }

  let normalized = String(value).trim().toLowerCase();

  normalized = normalized.replace(/^https?:\/\//, "");
  normalized = normalized.replace(/^www\./, "");
  normalized = normalized.replace(/\/.*$/, "");

  return normalized;
}

function renderStatus(status) {
  const nextStatus = status || DEFAULTS.lastDeliveryStatus;

  statusMessage.textContent = nextStatus.message;
  statusTime.textContent = nextStatus.updatedAt
    ? `Updated ${new Date(nextStatus.updatedAt).toLocaleString()}`
    : "No timestamp yet";

  syncState.dataset.state = nextStatus.state;
}
