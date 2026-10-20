const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function assertDestructiveSeedAllowed({ nodeEnv, mongoUri, allowDestructiveSeed }) {
  if (String(nodeEnv || "").trim().toLowerCase() === "production") {
    throw new Error("The demo seed is disabled in production.");
  }
  if (allowDestructiveSeed !== "true") {
    throw new Error("The demo seed deletes local data. Set ARRAKIS_ALLOW_DESTRUCTIVE_SEED=true to confirm.");
  }

  let target;
  try {
    target = new URL(mongoUri);
  } catch {
    throw new Error("The demo seed requires a valid MongoDB URI.");
  }

  if (!["mongodb:", "mongodb+srv:"].includes(target.protocol)) {
    throw new Error("The demo seed requires a MongoDB URI.");
  }
  if (!loopbackHosts.has(target.hostname.toLowerCase())) {
    throw new Error("The demo seed only runs against a loopback MongoDB host.");
  }
}
