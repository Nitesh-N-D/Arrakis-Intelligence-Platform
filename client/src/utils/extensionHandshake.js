// Handshake with the Arrakis Edge extension over window.postMessage on the trusted app origin.
// The extension only answers when its content script is installed and its background worker replies,
// so "detected" is never inferred from the browser alone.

export const HANDSHAKE_TIMEOUT_MS = 1500;
export const SUPPORTED_PROTOCOL = 1;
export const TRUSTED_APP_ORIGINS = Object.freeze(["https://arrakis-intelligence-platform.vercel.app", "http://localhost:5173"]);

export function createNonce(random = () => Math.random()) {
  return `${Date.now().toString(36)}-${Math.floor(random() * 1e12).toString(36)}`;
}

export function createPing(nonce, userId = "") {
  return { source: "arrakis-platform", type: "EXTENSION_PING", nonce, userId: typeof userId === "string" ? userId : "" };
}

const asCount = (value) => (Number.isInteger(value) && value >= 0 && value < 1e6 ? value : 0);

/** Accepts only a same-window, same-origin reply that echoes our nonce; returns a sanitised status or null. */
export function parseHello(event, { nonce, origin }) {
  if (!event || event.origin !== origin) return null;
  const data = event.data;
  if (data?.source !== "arrakis-extension" || data?.type !== "EXTENSION_HELLO" || data.nonce !== nonce) return null;
  const status = data.status || {};
  if (status.protocol !== SUPPORTED_PROTOCOL) return { state: "incompatible", protocol: status.protocol ?? null };
  const lastSync = status.lastSync || {};
  return {
    state: "detected",
    version: /^\d+(\.\d+){0,3}$/.test(String(status.version)) ? String(status.version) : "unknown",
    browser: status.browser === "edge" ? "edge" : "other-chromium",
    connected: status.connected === true,
    accountMatches: status.accountMatches === true,
    permissions: Array.isArray(status.permissions) ? status.permissions.filter((item) => typeof item === "string").slice(0, 10) : [],
    hostAccess: status.hostAccess === "all-http-https-sites" ? "all-http-https-sites" : "none",
    blockedSiteCount: asCount(status.blockedSiteCount),
    strictMode: status.strictMode === true,
    pendingEvents: asCount(status.pendingEvents),
    lastSync: {
      state: ["idle", "success", "warning", "error"].includes(lastSync.state) ? lastSync.state : "idle",
      updatedAt: typeof lastSync.updatedAt === "string" && !Number.isNaN(Date.parse(lastSync.updatedAt)) ? lastSync.updatedAt : null
    }
  };
}

/** Is the current browser Edge, by its own report? Used for guidance only, never as proof the extension exists. */
export function browserIsEdge(navigatorLike) {
  const brands = navigatorLike?.userAgentData?.brands || [];
  return brands.some((entry) => entry?.brand === "Microsoft Edge") || /\bEdg\//.test(String(navigatorLike?.userAgent || ""));
}

/** Plain-language summary for the status card. */
export function describeStatus(status) {
  if (!status || status.state === "checking") return { tone: "neutral", title: "Checking for the extension…" };
  if (status.state === "unsupported-origin") return { tone: "neutral", title: "Extension status is only available on the Arrakis app" };
  if (status.state === "not-detected") return { tone: "warning", title: "Extension not detected" };
  if (status.state === "incompatible") return { tone: "warning", title: "Extension needs an update" };
  if (!status.connected) return { tone: "warning", title: "Extension installed, not signed in" };
  if (!status.accountMatches) return { tone: "warning", title: "Extension signed in to a different account" };
  return { tone: "success", title: "Extension connected" };
}

/** Sends one ping and resolves with a parsed status, or "not-detected" after the timeout. */
export function runHandshake({ win = window, userId = "", timeoutMs = HANDSHAKE_TIMEOUT_MS } = {}) {
  const origin = win.location.origin;
  if (!TRUSTED_APP_ORIGINS.includes(origin)) return Promise.resolve({ state: "unsupported-origin" });
  const nonce = createNonce();
  return new Promise((resolve) => {
    const finish = (value) => {
      win.removeEventListener("message", onMessage);
      clearTimeout(timer);
      resolve(value);
    };
    const onMessage = (event) => {
      if (event.source !== win) return;
      const parsed = parseHello(event, { nonce, origin });
      if (parsed) finish(parsed);
    };
    const timer = setTimeout(() => finish({ state: "not-detected" }), timeoutMs);
    win.addEventListener("message", onMessage);
    win.postMessage(createPing(nonce, userId), origin);
  });
}
