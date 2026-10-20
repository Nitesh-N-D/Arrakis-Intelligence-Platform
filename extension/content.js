(function initializeArrakisTracker() {
  const HEARTBEAT_MS = 10000;
  let heartbeatId = null;

  function getPayload() {
    return {
      host: window.location.hostname,
      durationSeconds: 10
    };
  }

  function isTrustedArrakisOrigin() {
    return ["https://arrakis-intelligence-platform.vercel.app", "http://localhost:5173"].includes(window.location.origin);
  }

  function pageIsTrackable() {
    return document.visibilityState === "visible" && document.hasFocus();
  }

  function sendHeartbeat() {
    if (!pageIsTrackable() || isTrustedArrakisOrigin()) {
      return;
    }

    chrome.runtime.sendMessage({
      type: "TRACK_SITE_ACTIVITY",
      payload: getPayload()
    });
  }

  function ensureHeartbeat() {
    if (heartbeatId !== null) {
      return;
    }

    heartbeatId = window.setInterval(sendHeartbeat, HEARTBEAT_MS);
  }

  function stopHeartbeat() {
    if (heartbeatId === null) {
      return;
    }

    window.clearInterval(heartbeatId);
    heartbeatId = null;
  }

  function syncHeartbeatState() {
    if (pageIsTrackable()) {
      ensureHeartbeat();
    } else {
      stopHeartbeat();
    }
  }

  function checkForStormZone() {
    chrome.runtime.sendMessage({
      type: "CHECK_BLOCK_STATUS",
      payload: {
        url: window.location.href
      }
    });
  }

  if (isTrustedArrakisOrigin()) {
    window.addEventListener("message", (event) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      if (event.data?.source !== "arrakis-platform" || event.data?.type !== "ACCESS_TOKEN_UPDATE") return;
      chrome.runtime.sendMessage({
        type: "SYNC_ACCESS_TOKEN",
        payload: { accessToken: event.data.accessToken || "" }
      });
    });
    window.postMessage({ source: "arrakis-extension", type: "ACCESS_TOKEN_REQUEST" }, window.location.origin);
  }

  document.addEventListener("visibilitychange", syncHeartbeatState);
  window.addEventListener("focus", syncHeartbeatState);
  window.addEventListener("blur", syncHeartbeatState);

  checkForStormZone();
  syncHeartbeatState();
})();
