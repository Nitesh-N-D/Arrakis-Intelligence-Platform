const params = new URLSearchParams(window.location.search);
const host = params.get("host") || "unknown site";
const originalUrl = params.get("original") || "";

document.getElementById("storm-host").textContent = `Blocked: ${host}`;
document.getElementById("storm-copy").textContent = `${host} is currently designated as a high-risk distraction surface. Re-enter only if you intentionally want to override discipline safeguards for a short window.`;

document.getElementById("override-button").addEventListener("click", async () => {
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
