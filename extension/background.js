const DEFAULT_SETTINGS = {
  backendUrl: "http://localhost:5000/api/v1",
  jwtToken: "",
  blockedSites: [],
  strictMode: false,
  overrideMinutes: 5,
  activityBuffer: {},
  temporaryOverrides: {},
  lastDeliveryStatus: {
    state: "idle",
    message: "Extension not configured yet.",
    updatedAt: null
  }
};

const HEARTBEAT_SECONDS = 10;

chrome.runtime.onInstalled.addListener(async () => {
  await initializeDefaults();
});

chrome.runtime.onStartup.addListener(async () => {
  await initializeDefaults();
  await purgeExpiredOverrides();
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId).catch(() => null);

  if (tab?.url) {
    await enforceStormZone(tabId, tab.url);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) {
    return;
  }

  await enforceStormZone(tabId, tab.url);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  void handleRuntimeMessage(message, sender)
    .then((response) => sendResponse(response))
    .catch((error) => {
      console.error("Arrakis extension error:", error);
      sendResponse({
        ok: false,
        error: error.message || "Unexpected extension error"
      });
    });

  return true;
});

async function handleRuntimeMessage(message, sender) {
  switch (message?.type) {
    case "CHECK_BLOCK_STATUS":
      return handleBlockStatusCheck(message.payload, sender);
    case "TRACK_SITE_ACTIVITY":
      return handleTrackSiteActivity(message.payload);
    case "OVERRIDE_BLOCK":
      return handleOverrideBlock(message.payload, sender);
    case "GET_SETTINGS":
      return { ok: true, settings: await getSettings() };
    default:
      return { ok: false, error: "Unknown message type" };
  }
}

async function initializeDefaults() {
  const stored = await chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS));
  const nextValues = {};

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (stored[key] === undefined) {
      nextValues[key] = value;
    }
  }

  if (Object.keys(nextValues).length > 0) {
    await chrome.storage.local.set(nextValues);
  }
}

async function getSettings() {
  await initializeDefaults();
  return chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS));
}

async function setLastDeliveryStatus(state, message) {
  await chrome.storage.local.set({
    lastDeliveryStatus: {
      state,
      message,
      updatedAt: new Date().toISOString()
    }
  });
}

function normalizeBackendUrl(value) {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");

  if (!trimmed) {
    return DEFAULT_SETTINGS.backendUrl;
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

function getHostFromUrl(url) {
  try {
    const parsed = new URL(url);
    return normalizePattern(parsed.hostname);
  } catch (_error) {
    return "";
  }
}

function isExtensionUrl(url) {
  return typeof url === "string" && url.startsWith(chrome.runtime.getURL(""));
}

function matchesBlockedSite(url, blockedSites) {
  const host = getHostFromUrl(url);
  const normalizedUrl = String(url || "").toLowerCase();

  if (!host) {
    return false;
  }

  return blockedSites.some((entry) => {
    const pattern = normalizePattern(entry);

    if (!pattern) {
      return false;
    }

    return host === pattern || host.endsWith(`.${pattern}`) || normalizedUrl.includes(pattern);
  });
}

async function purgeExpiredOverrides() {
  const { temporaryOverrides = {} } = await chrome.storage.local.get("temporaryOverrides");
  const now = Date.now();
  const nextOverrides = {};
  let changed = false;

  for (const [host, expiresAt] of Object.entries(temporaryOverrides)) {
    if (expiresAt > now) {
      nextOverrides[host] = expiresAt;
    } else {
      changed = true;
    }
  }

  if (changed) {
    await chrome.storage.local.set({ temporaryOverrides: nextOverrides });
  }

  return nextOverrides;
}

async function hasActiveOverride(host) {
  const overrides = await purgeExpiredOverrides();
  return Boolean(host && overrides[host] && overrides[host] > Date.now());
}

function buildBlockPageUrl(url, host) {
  const params = new URLSearchParams({
    original: url,
    host
  });

  return `${chrome.runtime.getURL("block.html")}?${params.toString()}`;
}

async function enforceStormZone(tabId, url) {
  if (!url || isExtensionUrl(url)) {
    return false;
  }

  const settings = await getSettings();
  const host = getHostFromUrl(url);

  if (!host) {
    return false;
  }

  if (await hasActiveOverride(host)) {
    return false;
  }

  if (!matchesBlockedSite(url, settings.blockedSites)) {
    return false;
  }

  const blockUrl = buildBlockPageUrl(url, host);
  await chrome.tabs.update(tabId, { url: blockUrl });
  return true;
}

async function handleBlockStatusCheck(payload, sender) {
  const url = payload?.url || sender?.tab?.url;
  const tabId = sender?.tab?.id;

  if (!url || typeof tabId !== "number") {
    return { ok: false, blocked: false };
  }

  const blocked = await enforceStormZone(tabId, url);
  return { ok: true, blocked };
}

function deriveSeverity(totalSeconds) {
  if (totalSeconds >= 1800) {
    return "high";
  }

  if (totalSeconds >= 600) {
    return "medium";
  }

  return "low";
}

function categorizeSite(host) {
  const value = host.toLowerCase();

  if (/(youtube|netflix|primevideo|hotstar|spotify|twitch)/.test(value)) {
    return "entertainment";
  }

  if (/(instagram|facebook|x\.com|twitter|reddit|linkedin|discord)/.test(value)) {
    return "social";
  }

  if (/(news|medium|substack)/.test(value)) {
    return "reading";
  }

  return "web";
}

async function handleTrackSiteActivity(payload) {
  if (!payload?.url || !payload?.host || !payload?.durationSeconds) {
    return { ok: false, error: "Incomplete activity payload" };
  }

  const settings = await getSettings();
  const normalizedHost = normalizePattern(payload.host);

  if (!normalizedHost) {
    return { ok: false, error: "Invalid host" };
  }

  const nextBuffer = {
    ...settings.activityBuffer
  };
  const existing = nextBuffer[normalizedHost] || {
    seconds: 0,
    title: payload.title || normalizedHost,
    url: payload.url,
    lastSeenAt: null
  };

  existing.seconds += Number(payload.durationSeconds) || HEARTBEAT_SECONDS;
  existing.title = payload.title || existing.title;
  existing.url = payload.url || existing.url;
  existing.lastSeenAt = new Date().toISOString();
  nextBuffer[normalizedHost] = existing;

  let minutesToFlush = 0;

  if (existing.seconds >= 60) {
    minutesToFlush = Math.floor(existing.seconds / 60);
    existing.seconds = existing.seconds % 60;
  }

  await chrome.storage.local.set({ activityBuffer: nextBuffer });

  if (minutesToFlush > 0) {
    await postStormLog(settings, normalizedHost, existing, minutesToFlush);
  }

  return {
    ok: true,
    bufferedSeconds: existing.seconds,
    flushedMinutes: minutesToFlush
  };
}

async function postStormLog(settings, host, entry, minutesToFlush) {
  if (!settings.jwtToken) {
    await setLastDeliveryStatus("warning", "Tracking buffered, but JWT token is missing.");
    return;
  }

  const backendUrl = normalizeBackendUrl(settings.backendUrl);
  const endpoint = `${backendUrl}/storm/log`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.jwtToken}`
      },
      body: JSON.stringify({
        appName: host,
        duration: minutesToFlush,
        severity: deriveSeverity(minutesToFlush * 60),
        metadata: {
          device: "desktop",
          category: categorizeSite(host),
          source: "chrome-extension",
          pageTitle: entry.title || host,
          pageUrl: entry.url || "",
          trackedSeconds: minutesToFlush * 60,
          heartbeatSeconds: HEARTBEAT_SECONDS
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Storm API ${response.status}: ${errorText}`);
    }

    await setLastDeliveryStatus(
      "success",
      `Synced ${minutesToFlush} minute(s) of storm activity for ${host}.`
    );
  } catch (error) {
    await setLastDeliveryStatus("error", error.message || "Failed to sync storm activity.");
  }
}

async function handleOverrideBlock(payload, sender) {
  const settings = await getSettings();
  const host = normalizePattern(payload?.host);
  const originalUrl = payload?.originalUrl;

  if (!host || !originalUrl) {
    return { ok: false, error: "Host and original URL are required" };
  }

  if (settings.strictMode) {
    return {
      ok: false,
      error: "Strict mode is enabled. Overrides are not permitted for this storm zone."
    };
  }

  const { temporaryOverrides = {} } = await chrome.storage.local.get("temporaryOverrides");
  const overrideMinutes = Math.max(1, Number(settings.overrideMinutes) || 5);
  temporaryOverrides[host] = Date.now() + overrideMinutes * 60 * 1000;

  await chrome.storage.local.set({ temporaryOverrides });

  const tabId = sender?.tab?.id;

  if (typeof tabId === "number") {
    await chrome.tabs.update(tabId, { url: originalUrl });
  }

  return { ok: true };
}
