import { getHostFromUrl, getJwtSubject, getNextPendingSyncAt, isOverrideActive, matchesBlockedSite, normalizePattern, shouldClearActivityForAccount } from "./domainRules.js";

const DEFAULT_SETTINGS = {
  backendUrl: "http://localhost:5000/api/v1",
  jwtToken: "",
  accountSubject: "",
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
const ACTIVITY_BUFFER_MAX_HOSTS = 250;
const PENDING_SYNC_TTL_MS = 24 * 60 * 60 * 1000;
const PENDING_SYNC_ALARM = "arrakis-pending-storm-sync";
const BLOCK_CONTEXT_ALARM_PREFIX = "arrakis-block-context-expiry:";
const PENDING_SYNC_MAX_ATTEMPTS = 8;
let activityWriteQueue = Promise.resolve();
let defaultsInitialization = null;
const blockRedirectsByTab = new Map();

chrome.runtime.onInstalled.addListener(async () => {
  await initializeDefaults();
  await scrubLegacyActivityBuffer();
  await purgeExpiredBlockContexts();
  await retryPendingStormSync();
});

chrome.runtime.onStartup.addListener(async () => {
  await initializeDefaults();
  await scrubLegacyActivityBuffer();
  await purgeExpiredOverrides();
  await purgeExpiredBlockContexts();
  await retryPendingStormSync();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith(BLOCK_CONTEXT_ALARM_PREFIX)) {
    const contextId = alarm.name.slice(BLOCK_CONTEXT_ALARM_PREFIX.length);
    await chrome.storage.session.remove(`blockedContext:${contextId}`);
    return;
  }
  if (alarm.name !== PENDING_SYNC_ALARM) return;
  await retryPendingStormSync();
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
    case "SYNC_ACCESS_TOKEN":
      return handleSyncAccessToken(message.payload, sender);
    case "OVERRIDE_BLOCK":
      return handleOverrideBlock(message.payload, sender);
    case "GET_BLOCK_CONTEXT":
      return handleGetBlockContext(message.payload, sender);
    case "GET_SETTINGS":
      return { ok: true, settings: await getSettings() };
    case "SAVE_SETTINGS":
      return handleSaveSettings(message.payload, sender);
    default:
      return { ok: false, error: "Unknown message type" };
  }
}

async function initializeDefaults() {
  if (!defaultsInitialization) {
    defaultsInitialization = (async () => {
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
    })().catch((error) => {
      defaultsInitialization = null;
      throw error;
    });
  }
  return defaultsInitialization;
}

async function scrubLegacyActivityBuffer() {
  const { activityBuffer = {} } = await chrome.storage.local.get("activityBuffer");
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const cleaned = {};
  let changed = false;
  for (const [host, entry] of Object.entries(activityBuffer)) {
    const pendingCreatedAt = new Date(entry?.pendingSync?.createdAt || 0).getTime();
    const pendingExpired = entry?.pendingSync && (!Number.isFinite(pendingCreatedAt) || Date.now() - pendingCreatedAt >= PENDING_SYNC_TTL_MS);
    if (!entry || (!entry.pendingSync && entry.lastSeenAt && new Date(entry.lastSeenAt).getTime() < cutoff) || pendingExpired) {
      changed = true;
      continue;
    }
    const { url: _url, title: _title, ...safeEntry } = entry;
    cleaned[host] = { ...safeEntry, seconds: Math.max(0, Math.min(86400, Number(entry.seconds) || 0)) };
    if ("url" in entry || "title" in entry || cleaned[host].seconds !== entry.seconds) changed = true;
  }
  const rows = Object.entries(cleaned);
  if (rows.length > ACTIVITY_BUFFER_MAX_HOSTS) {
    rows.sort((a, b) => Number(Boolean(b[1].pendingSync)) - Number(Boolean(a[1].pendingSync)) || new Date(b[1].lastSeenAt || 0) - new Date(a[1].lastSeenAt || 0));
    for (const [host] of rows.slice(ACTIVITY_BUFFER_MAX_HOSTS)) delete cleaned[host];
    changed = true;
  }
  if (changed) await chrome.storage.local.set({ activityBuffer: cleaned });
  await schedulePendingSyncAlarm(cleaned);
}

async function getSettings() {
  await initializeDefaults();
  return chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS));
}

async function handleSaveSettings(payload, sender) {
  if (!isExtensionUrl(sender?.url)) return { ok: false, error: "Untrusted extension page" };
  await initializeDefaults();
  const blockedSites = Array.isArray(payload?.blockedSites)
    ? [...new Set(payload.blockedSites.map(normalizePattern).filter(Boolean))].slice(0, 500)
    : [];
  const backendUrl = normalizeBackendUrl(payload?.backendUrl);
  if (!backendUrl) return { ok: false, error: "Use an HTTPS backend URL (HTTP is allowed only for localhost)." };
  const jwtToken = typeof payload?.jwtToken === "string" && payload.jwtToken.length <= 4096
    ? payload.jwtToken.trim()
    : "";
  const overrideMinutes = Math.max(1, Math.min(60, Number(payload?.overrideMinutes) || 5));
  await chrome.storage.local.set({
    backendUrl,
    jwtToken,
    blockedSites,
    strictMode: Boolean(payload?.strictMode),
    overrideMinutes
  });
  return { ok: true, settings: await getSettings() };
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

async function schedulePendingSyncAlarm(activityBuffer) {
  const nextAt = getNextPendingSyncAt(activityBuffer, Date.now(), PENDING_SYNC_TTL_MS);
  if (nextAt === null) {
    await chrome.alarms.clear(PENDING_SYNC_ALARM);
    return;
  }
  await chrome.alarms.create(PENDING_SYNC_ALARM, { when: Math.max(Date.now() + 30_000, nextAt) });
}

function normalizeBackendUrl(value) {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");

  if (!trimmed) {
    return DEFAULT_SETTINGS.backendUrl;
  }

  try {
    const parsed = new URL(trimmed);
    const localHttp = parsed.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    if ((parsed.protocol !== "https:" && !localHttp) || parsed.username || parsed.password) return DEFAULT_SETTINGS.backendUrl;
    const path = parsed.pathname.replace(/\/+$/, "");
    if (path && path !== "/api/v1") return DEFAULT_SETTINGS.backendUrl;
    return `${parsed.origin}/api/v1`;
  } catch { return DEFAULT_SETTINGS.backendUrl; }
}

function isTrustedArrakisClientUrl(value) {
  try {
    const url = new URL(value);
    return ["https://arrakis-intelligence-platform.vercel.app", "http://localhost:5173"].includes(url.origin);
  } catch { return false; }
}

async function handleSyncAccessToken(payload, sender) {
  if (!isTrustedArrakisClientUrl(sender?.tab?.url)) return { ok: false, error: "Untrusted Arrakis client origin" };
  const token = typeof payload?.accessToken === "string" ? payload.accessToken : "";
  if (!token) {
    await chrome.storage.local.set({ jwtToken: "" });
    await setLastDeliveryStatus("warning", "Arrakis sign-in ended. Reopen the app to connect the extension again.");
    return { ok: true };
  }
  if (token.length > 4096) return { ok: false, error: "Arrakis access token is invalid" };
  const subject = getJwtSubject(token);
  if (!subject) return { ok: false, error: "Arrakis access token is invalid or expired" };
  const settings = await getSettings();
  const hasQueuedActivity = Object.keys(settings.activityBuffer || {}).length > 0;
  const activityBuffer = shouldClearActivityForAccount(settings.accountSubject, subject, hasQueuedActivity) ? {} : settings.activityBuffer;
  await chrome.storage.local.set({ jwtToken: token, accountSubject: subject, activityBuffer });
  await setLastDeliveryStatus("success", "Arrakis account connected to the extension.");
  await resumePendingStormSync();
  return { ok: true };
}

async function ensureActivityAccount(settings) {
  const subject = getJwtSubject(settings.jwtToken);
  if (!subject || settings.accountSubject === subject) return settings;
  const hasQueuedActivity = Object.keys(settings.activityBuffer || {}).length > 0;
  const activityBuffer = shouldClearActivityForAccount(settings.accountSubject, subject, hasQueuedActivity) ? {} : settings.activityBuffer;
  const updated = { ...settings, accountSubject: subject, activityBuffer };
  await chrome.storage.local.set({ accountSubject: subject, activityBuffer });
  return updated;
}

async function resumePendingStormSync() {
  const settings = await ensureActivityAccount(await getSettings());
  const activityBuffer = settings.activityBuffer || {};
  for (const entry of Object.values(activityBuffer)) {
    if (!entry?.pendingSync) continue;
    delete entry.pendingSync.awaitingAuth;
    entry.pendingSync.nextAttemptAt = Date.now();
  }
  await chrome.storage.local.set({ activityBuffer });
  await retryPendingStormSync();
}

function isExtensionUrl(url) {
  return typeof url === "string" && url.startsWith(chrome.runtime.getURL(""));
}

async function purgeExpiredOverrides() {
  const { temporaryOverrides = {} } = await chrome.storage.local.get("temporaryOverrides");
  const now = Date.now();
  const nextOverrides = {};
  let changed = false;

  for (const [host, expiresAt] of Object.entries(temporaryOverrides)) {
    if (isOverrideActive(expiresAt, now)) {
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
  return Boolean(host && isOverrideActive(overrides[host]));
}

function buildBlockPageUrl(contextId) {
  return `${chrome.runtime.getURL("block.html")}?context=${encodeURIComponent(contextId)}`;
}

async function enforceStormZone(tabId, url) {
  if (!url || isExtensionUrl(url)) {
    return false;
  }

  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (!tab?.url || tab.url !== url) return false;

  const settings = await ensureActivityAccount(await getSettings());
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

  const inProgress = blockRedirectsByTab.get(tabId);
  if (inProgress) return inProgress;

  const redirectPromise = (async () => {
    const contextId = crypto.randomUUID();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    await chrome.storage.session.set({
      [`blockedContext:${contextId}`]: {
        originalUrl: url,
        host,
        tabId,
        expiresAt
      }
    });
    await chrome.alarms.create(`${BLOCK_CONTEXT_ALARM_PREFIX}${contextId}`, { when: expiresAt });
    try {
      await chrome.tabs.update(tabId, { url: buildBlockPageUrl(contextId) });
    } catch (error) {
      await chrome.storage.session.remove(`blockedContext:${contextId}`);
      await chrome.alarms.clear(`${BLOCK_CONTEXT_ALARM_PREFIX}${contextId}`);
      throw error;
    }
    return true;
  })();
  blockRedirectsByTab.set(tabId, redirectPromise);
  try {
    return await redirectPromise;
  } finally {
    if (blockRedirectsByTab.get(tabId) === redirectPromise) blockRedirectsByTab.delete(tabId);
  }
}

async function getBlockContext(contextId) {
  if (typeof contextId !== "string" || !/^[0-9a-f-]{36}$/i.test(contextId)) return null;
  const key = `blockedContext:${contextId}`;
  const stored = await chrome.storage.session.get(key);
  const context = stored[key];
  if (!context || context.expiresAt <= Date.now()) {
    await chrome.storage.session.remove(key);
    await chrome.alarms.clear(`${BLOCK_CONTEXT_ALARM_PREFIX}${contextId}`);
    return null;
  }
  return { key, ...context };
}

async function purgeExpiredBlockContexts() {
  const stored = await chrome.storage.session.get(null);
  const now = Date.now();
  for (const [key, context] of Object.entries(stored)) {
    if (!key.startsWith("blockedContext:")) continue;
    const contextId = key.slice("blockedContext:".length);
    const alarmName = `${BLOCK_CONTEXT_ALARM_PREFIX}${contextId}`;
    if (!Number.isFinite(Number(context?.expiresAt)) || context.expiresAt <= now) {
      await chrome.storage.session.remove(key);
      await chrome.alarms.clear(alarmName);
    } else {
      await chrome.alarms.create(alarmName, { when: context.expiresAt });
    }
  }
}

async function handleGetBlockContext(payload, sender) {
  if (!isExtensionUrl(sender?.url)) return { ok: false, error: "Untrusted extension page" };
  const context = await getBlockContext(payload?.contextId);
  if (!context) return { ok: false, error: "Blocked destination expired. Navigate to the site again to request an override." };
  return { ok: true, host: context.host };
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

function handleTrackSiteActivity(payload) {
  const result = activityWriteQueue.then(() => processTrackSiteActivity(payload));
  activityWriteQueue = result.catch(() => {});
  return result;
}

async function processTrackSiteActivity(payload) {
  if (!payload?.host || !payload?.durationSeconds) {
    return { ok: false, error: "Incomplete activity payload" };
  }

  const settings = await ensureActivityAccount(await getSettings());
  const normalizedHost = normalizePattern(payload.host);

  if (!normalizedHost) {
    return { ok: false, error: "Invalid host" };
  }

  const nextBuffer = {
    ...settings.activityBuffer
  };
  const existing = nextBuffer[normalizedHost] || {
    seconds: 0,
    lastSeenAt: null
  };

  delete existing.url;
  delete existing.title;
  existing.seconds = Math.min(86400, (Number(existing.seconds) || 0) + Math.max(1, Math.min(HEARTBEAT_SECONDS, Number(payload.durationSeconds) || HEARTBEAT_SECONDS)));
  existing.lastSeenAt = new Date().toISOString();
  nextBuffer[normalizedHost] = existing;

  let minutesToFlush = 0;
  if (!existing.pendingSync && existing.seconds >= 60) {
    minutesToFlush = Math.floor(existing.seconds / 60);
    existing.seconds %= 60;
    existing.pendingSync = {
      sourceEventId: crypto.randomUUID(),
      minutes: minutesToFlush,
      attempts: 0,
      createdAt: new Date().toISOString(),
      nextAttemptAt: Date.now()
    };
  }

  const rows = Object.entries(nextBuffer);
  if (rows.length > ACTIVITY_BUFFER_MAX_HOSTS) {
    rows.sort((a, b) => Number(Boolean(b[1].pendingSync)) - Number(Boolean(a[1].pendingSync)) || new Date(b[1].lastSeenAt || 0) - new Date(a[1].lastSeenAt || 0));
    for (const [host] of rows.slice(ACTIVITY_BUFFER_MAX_HOSTS)) delete nextBuffer[host];
  }
  await chrome.storage.local.set({ activityBuffer: nextBuffer });

  const pendingSync = existing.pendingSync;
  if (pendingSync && pendingSync.nextAttemptAt <= Date.now()) {
    await attemptPendingStormSync(settings, normalizedHost, pendingSync);
  } else {
    await schedulePendingSyncAlarm(nextBuffer);
  }

  return {
    ok: true,
    bufferedSeconds: existing.seconds,
    flushedMinutes: minutesToFlush
  };
}

async function postStormLog(settings, host, pendingSync) {
  if (!settings.jwtToken) {
    await setLastDeliveryStatus("warning", "Tracking is queued. Open the Arrakis app to connect or refresh extension sign-in.");
    return "auth-required";
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
        sourceEventId: pendingSync.sourceEventId,
        appName: host,
        duration: pendingSync.minutes,
        severity: deriveSeverity(pendingSync.minutes * 60),
        metadata: {
          device: "desktop",
          category: categorizeSite(host),
          source: "chrome-extension",
          trackedSeconds: pendingSync.minutes * 60,
          heartbeatSeconds: HEARTBEAT_SECONDS
        }
      })
    });

    if (response.status === 401) {
      await setLastDeliveryStatus("warning", "Arrakis sign-in expired. Open the app to refresh extension sign-in; queued activity will wait.");
      return "auth-required";
    }
    if (!response.ok) {
      throw new Error(`Storm API returned HTTP ${response.status}`);
    }

    await setLastDeliveryStatus(
      "success",
      `Synced ${pendingSync.minutes} minute(s) of storm activity for ${host}.`
    );
    return true;
  } catch (error) {
    await setLastDeliveryStatus("error", error.message || "Failed to sync storm activity.");
    return false;
  }
}

async function attemptPendingStormSync(settings, host, pendingSync) {
  const succeeded = await postStormLog(settings, host, pendingSync);
  const stored = await chrome.storage.local.get("activityBuffer");
  const buffer = stored.activityBuffer || {};
  const current = buffer[host];
  if (!current || current.pendingSync?.sourceEventId !== pendingSync.sourceEventId) return;
  if (succeeded === true) {
    delete current.pendingSync;
  } else if (succeeded === "auth-required") {
    const createdAt = new Date(current.pendingSync.createdAt).getTime();
    current.pendingSync = {
      ...current.pendingSync,
      awaitingAuth: true,
      nextAttemptAt: (Number.isFinite(createdAt) ? createdAt : Date.now()) + PENDING_SYNC_TTL_MS
    };
  } else {
    const attempts = (Number(current.pendingSync.attempts) || 0) + 1;
    if (attempts >= PENDING_SYNC_MAX_ATTEMPTS) {
      delete current.pendingSync;
      await setLastDeliveryStatus("error", "A storm activity event could not sync after 8 attempts and was removed from the retry queue.");
    } else {
      current.pendingSync = {
        ...current.pendingSync,
        attempts,
        nextAttemptAt: Date.now() + Math.min(60 * 60 * 1000, 1000 * (2 ** Math.min(attempts, 12)))
      };
    }
  }
  buffer[host] = current;
  await chrome.storage.local.set({ activityBuffer: buffer });
  await schedulePendingSyncAlarm(buffer);
}

async function retryPendingStormSync() {
  const settings = await ensureActivityAccount(await getSettings());
  const now = Date.now();
  const buffer = settings.activityBuffer || {};
  let expired = false;
  for (const [host, entry] of Object.entries(buffer)) {
    const pending = entry?.pendingSync;
    if (!pending) continue;
    const createdAt = new Date(pending.createdAt).getTime();
    if (!Number.isFinite(createdAt) || now - createdAt >= PENDING_SYNC_TTL_MS) {
      delete buffer[host];
      expired = true;
    }
  }
  if (expired) await chrome.storage.local.set({ activityBuffer: buffer });
  for (const [host, entry] of Object.entries(buffer)) {
    const pending = entry?.pendingSync;
    if (!pending || pending.awaitingAuth || pending.nextAttemptAt > now) continue;
    await attemptPendingStormSync(settings, host, pending);
  }
  const latest = await chrome.storage.local.get("activityBuffer");
  await schedulePendingSyncAlarm(latest.activityBuffer || {});
}

async function handleOverrideBlock(payload, sender) {
  const settings = await getSettings();
  if (!isExtensionUrl(sender?.url)) return { ok: false, error: "Untrusted extension page" };
  const context = await getBlockContext(payload?.contextId);
  if (!context || !Number.isInteger(context.tabId)) return { ok: false, error: "Blocked destination expired. Navigate to the site again to request an override." };
  const { host, originalUrl } = context;

  if (settings.strictMode) {
    return {
      ok: false,
      error: "Strict mode is enabled. Overrides are not permitted for this storm zone."
    };
  }

  const tab = await chrome.tabs.get(context.tabId).catch(() => null);
  const tabContextId = tab?.url ? new URL(tab.url).searchParams.get("context") : null;
  if (!tab?.url || !tab.url.startsWith(chrome.runtime.getURL("block.html")) || tabContextId !== payload?.contextId) {
    await chrome.storage.session.remove(context.key);
    return { ok: false, error: "Blocked tab is no longer available. Navigate to the site again to request an override." };
  }

  const { temporaryOverrides = {} } = await chrome.storage.local.get("temporaryOverrides");
  const overrideMinutes = Math.max(1, Number(settings.overrideMinutes) || 5);
  temporaryOverrides[host] = Date.now() + overrideMinutes * 60 * 1000;

  await chrome.storage.local.set({ temporaryOverrides });

  await chrome.tabs.update(context.tabId, { url: originalUrl });
  await chrome.storage.session.remove(context.key);
  await chrome.alarms.clear(`${BLOCK_CONTEXT_ALARM_PREFIX}${payload.contextId}`);

  return { ok: true };
}
