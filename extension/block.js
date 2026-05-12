const params = new URLSearchParams(window.location.search);
const host = params.get("host") || "unknown site";
const originalUrl = params.get("original") || "";
const overrideButton = document.getElementById("override-button");
const policyChip = document.getElementById("storm-policy");
const policyCopy = document.getElementById("storm-policy-copy");

document.getElementById("storm-host").textContent = `Blocked: ${host}`;
document.getElementById("storm-copy").textContent = `${host} is currently designated as a high-risk distraction surface. Re-enter only if you intentionally want to override discipline safeguards for a short window.`;

chrome.runtime.sendMessage({ type: "GET_SETTINGS" }).then((response) => {
  const settings = response?.settings || {};
  const overrideMinutes = Math.max(1, Number(settings.overrideMinutes) || 5);

  if (settings.strictMode) {
    overrideButton.hidden = true;
    policyChip.textContent = "Policy: Strict hard block";
    policyCopy.textContent =
      "Strict mode is active. Temporary bypass is disabled until you reduce distraction pressure inside the extension controls.";
  } else {
    overrideButton.textContent = `Override For ${overrideMinutes} Minute${overrideMinutes === 1 ? "" : "s"}`;
    policyChip.textContent = "Policy: Timed override";
    policyCopy.textContent =
      "You can request a short override window, but the storm alarm will continue until you leave the distraction surface.";
  }
});

overrideButton.addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({
    type: "OVERRIDE_BLOCK",
    payload: {
      host,
      originalUrl
    }
  });

  if (!response?.ok) {
    window.alert(response?.error || "Override failed.");
  }
});

document.getElementById("go-back-button").addEventListener("click", () => {
  window.history.back();
});
