import test from "node:test";
import assert from "node:assert/strict";
import { getSafeApplicationErrorMessage } from "../src/utils/errorMessages.js";

test("application recovery message is generic and does not expose exception data", () => {
  const sensitiveError = new Error("https://api.example/?access_token=secret");
  const message = getSafeApplicationErrorMessage(sensitiveError);

  assert.equal(message, "The application encountered an unexpected error. Reload the page to continue.");
  assert.equal(message.includes("secret"), false);
  assert.equal(message.includes("api.example"), false);
});
