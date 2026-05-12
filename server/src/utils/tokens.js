import crypto from "crypto";

export const hashOpaqueToken = (token) =>
  crypto.createHash("sha256").update(String(token), "utf8").digest("hex");
