import test from "node:test";
import assert from "node:assert/strict";
import { readBoundedNumber } from "../src/config/env.js";

test("environment numbers use defaults and reject malformed or unbounded values", () => {
  const previous = process.env.TEST_BOUNDED_NUMBER;
  try {
    delete process.env.TEST_BOUNDED_NUMBER;
    assert.equal(readBoundedNumber("TEST_BOUNDED_NUMBER", 15, { min: 1, max: 30 }), 15);
    process.env.TEST_BOUNDED_NUMBER = "20";
    assert.equal(readBoundedNumber("TEST_BOUNDED_NUMBER", 15, { min: 1, max: 30 }), 20);
    for (const value of ["NaN", "0", "31", "2.5"]) {
      process.env.TEST_BOUNDED_NUMBER = value;
      assert.throws(() => readBoundedNumber("TEST_BOUNDED_NUMBER", 15, { min: 1, max: 30 }));
    }
  } finally {
    if (previous === undefined) delete process.env.TEST_BOUNDED_NUMBER;
    else process.env.TEST_BOUNDED_NUMBER = previous;
  }
});
