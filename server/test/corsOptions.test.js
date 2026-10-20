import test from "node:test";
import assert from "node:assert/strict";
import { createCorsOptions } from "../src/config/corsOptions.js";

test("CORS allows requests without an Origin header and configured origins", () => {
  const options = createCorsOptions(["https://arrakis.example"]);
  for (const origin of [undefined, "https://arrakis.example"]) {
    let result;
    options.origin(origin, (error, allowed) => { result = { error, allowed }; });
    assert.deepEqual(result, { error: null, allowed: true });
  }
});

test("CORS rejects unknown origins as a forbidden request without echoing the origin", () => {
  const options = createCorsOptions(["https://arrakis.example"]);
  let error;
  options.origin("https://untrusted.example", (callbackError) => { error = callbackError; });
  assert.equal(error.statusCode, 403);
  assert.equal(error.message, "Origin is not allowed by CORS.");
  assert.doesNotMatch(error.message, /untrusted\.example/);
});
