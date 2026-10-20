import test from "node:test";
import assert from "node:assert/strict";
import { notFoundHandler } from "../src/middleware/notFoundHandler.js";

test("404 response does not reflect requested path or query parameters", () => {
  let response;
  const res = {
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      response = { statusCode: this.statusCode, body };
      return this;
    }
  };

  notFoundHandler({ method: "GET", originalUrl: "/unknown?access_token=secret&code=private" }, res);

  assert.deepEqual(response, {
    statusCode: 404,
    body: { success: false, message: "Route not found." }
  });
  assert.equal(JSON.stringify(response).includes("secret"), false);
  assert.equal(JSON.stringify(response).includes("private"), false);
});
