(function initializeArrakisTracker() {
  const HEARTBEAT_MS = 10000;
  let heartbeatId = null;

  function getPayload() {
    return {
      url: window.location.href,
      title: document.title || window.location.hostname,
      host: window.location.hostname,
      durationSeconds: 10
    };
  }

  function pageIsTrackable() {
    return document.visibilityState === "visible" && document.hasFocus();
  }

  function sendHeartbeat() {
    if (!pageIsTrackable()) {
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

  document.addEventListener("visibilitychange", syncHeartbeatState);
  window.addEventListener("focus", syncHeartbeatState);
  window.addEventListener("blur", syncHeartbeatState);

  checkForStormZone();
  syncHeartbeatState();
})();
