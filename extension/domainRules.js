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
