export function normalizePattern(value) {
  const input = String(value || "").trim().toLowerCase();
  if (!input || /[\s@]/.test(input)) return "";
  let host = input;
  if (/^https?:\/\//.test(input)) {
    try { host = new URL(input).hostname; } catch { return ""; }
  }
  host = host.replace(/^www\./, "").replace(/\.$/, "");
  if (host.length > 253 || host.includes(":")) return "";
  const labels = host.split(".");
  if (labels.length < 2 || labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return "";
  return host;
}

export function getHostFromUrl(value) {
  try {
    return normalizePattern(new URL(value).hostname);
  } catch {
    return "";
  }
}

export function matchesBlockedSite(url, blockedSites) {
  const host = getHostFromUrl(url);
  if (!host || !Array.isArray(blockedSites)) return false;
  return blockedSites.some((entry) => {
    const pattern = normalizePattern(entry);
    return Boolean(pattern && (host === pattern || host.endsWith(`.${pattern}`)));
  });
}

export function isOverrideActive(expiresAt, now = Date.now()) {
  const expiration = Number(expiresAt);
  return Number.isFinite(expiration) && expiration > now;
}

export function getNextPendingSyncAt(activityBuffer, now = Date.now(), ttlMs = 24 * 60 * 60 * 1000) {
  if (!activityBuffer || typeof activityBuffer !== "object") return null;
  let nextAt = Infinity;
  for (const entry of Object.values(activityBuffer)) {
    const pending = entry?.pendingSync;
    if (!pending) continue;
    const createdAt = new Date(pending.createdAt || 0).getTime();
    const retryAt = Number(pending.nextAttemptAt);
    if (!Number.isFinite(createdAt) || !Number.isFinite(retryAt)) continue;
    const expiresAt = createdAt + ttlMs;
    if (expiresAt <= now) continue;
    nextAt = Math.min(nextAt, Math.max(now, Math.min(retryAt, expiresAt)));
  }
  return Number.isFinite(nextAt) ? nextAt : null;
}

export function getJwtSubject(token, now = Date.now()) {
  if (typeof token !== "string") return "";
  const payload = token.split(".")[1];
  if (!payload) return "";
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const claims = JSON.parse(atob(base64));
    if (typeof claims.sub !== "string" || !claims.sub || !Number.isFinite(Number(claims.exp)) || Number(claims.exp) * 1000 <= now) return "";
    return claims.sub;
  } catch {
    return "";
  }
}

export function shouldClearActivityForAccount(previousSubject, nextSubject, hasQueuedActivity = false) {
  if (!nextSubject) return false;
  return previousSubject ? previousSubject !== nextSubject : hasQueuedActivity;
}

export function getSafeExtensionErrorMessage(error) {
  if (error?.name === "AbortError") return "The request timed out. Check your connection and try again.";
  if (error?.name === "TypeError") return "The request failed. Check your connection and API URL.";
  return "The extension action failed. Check your settings and try again.";
}

export const HANDSHAKE_PROTOCOL = 1;
export const BLOCKING_POLICIES = ["always", "focus-only", "off"];

/** Whether blocked sites should be redirected right now, given the account's blocking policy. */
export function isBlockingActive(settings = {}) {
  const policy = BLOCKING_POLICIES.includes(settings.blockingPolicy) ? settings.blockingPolicy : "always";
  if (policy === "off") return false;
  if (policy === "focus-only") return Boolean(settings.focusActive);
  return true;
}

/**
 * Validates a policy returned by GET /profile/extension-policy. Returns the local settings to store,
 * or null when the response is malformed or belongs to a different account than the signed-in token.
 */
export function normalizeExtensionPolicy(policy, expectedSubject, now = Date.now()) {
  if (!policy || typeof policy !== "object" || !expectedSubject) return null;
  if (String(policy.accountId || "") !== String(expectedSubject)) return null;
  const version = Number(policy.version);
  if (!Number.isInteger(version) || version < 0) return null;
  const blockedSites = Array.isArray(policy.blockedSites)
    ? [...new Set(policy.blockedSites.map(normalizePattern).filter(Boolean))].slice(0, 500)
    : [];
  return {
    blockedSites,
    strictMode: Boolean(policy.strictMode),
    overrideMinutes: Math.max(1, Math.min(60, Number(policy.overrideMinutes) || 5)),
    blockingPolicy: BLOCKING_POLICIES.includes(policy.blockingPolicy) ? policy.blockingPolicy : "always",
    trackingPaused: Boolean(policy.trackingPaused),
    focusActive: Boolean(policy.focusActive),
    policyVersion: version,
    policyAccount: String(expectedSubject),
    policySyncedAt: new Date(now).toISOString()
  };
}

/** Best-effort browser label. Only Microsoft Edge is a supported target; anything else is reported as unsupported. */
export function detectBrowser(userAgentData, userAgent = "") {
  const brands = Array.isArray(userAgentData?.brands) ? userAgentData.brands.map((entry) => String(entry?.brand || "")) : [];
  if (brands.some((brand) => brand === "Microsoft Edge") || /\bEdg\//.test(String(userAgent))) return "edge";
  return "other-chromium";
}

/**
 * Status returned to the trusted Arrakis web app during the handshake.
 * Never includes the access token, account subject, queued hostnames or browsing history.
 */
export function buildHandshakeStatus({ manifest = {}, settings = {}, browser = "other-chromium", expectedSubject = "", now = Date.now() } = {}) {
  const subject = getJwtSubject(settings.jwtToken, now);
  const pending = Object.values(settings.activityBuffer || {}).filter((entry) => entry?.pendingSync).length;
  const delivery = settings.lastDeliveryStatus || {};
  return {
    protocol: HANDSHAKE_PROTOCOL,
    version: String(manifest.version || "0.0.0"),
    browser,
    connected: Boolean(subject),
    accountMatches: Boolean(subject && expectedSubject && subject === String(expectedSubject)),
    permissions: [...(manifest.permissions || [])],
    hostAccess: (manifest.host_permissions || []).length > 0 ? "all-http-https-sites" : "none",
    blockedSiteCount: Array.isArray(settings.blockedSites) ? settings.blockedSites.length : 0,
    strictMode: Boolean(settings.strictMode),
    blockingPolicy: BLOCKING_POLICIES.includes(settings.blockingPolicy) ? settings.blockingPolicy : "always",
    trackingPaused: Boolean(settings.trackingPaused),
    policyVersion: Number.isInteger(settings.policyVersion) ? settings.policyVersion : 0,
    policySyncedAt: typeof settings.policySyncedAt === "string" ? settings.policySyncedAt : null,
    pendingEvents: pending,
    lastSync: {
      state: ["idle", "success", "warning", "error"].includes(delivery.state) ? delivery.state : "idle",
      updatedAt: typeof delivery.updatedAt === "string" ? delivery.updatedAt : null
    }
  };
}
