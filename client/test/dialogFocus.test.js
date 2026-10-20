import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import * as React from "react";
import useDialogFocus from "../src/hooks/useDialogFocus.js";

test("dialog focus starts inside, stays trapped, closes on Escape, and returns to its trigger", async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost"
  });
  const previousGlobals = new Map();
  for (const key of ["window", "document", "HTMLElement", "Node", "MutationObserver", "navigator"]) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value: key === "window" ? dom.window : key === "document" ? dom.window.document : dom.window[key]
    });
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  const rootElement = dom.window.document.getElementById("root");
  const root = (await import("react-dom/client")).createRoot(rootElement);
  let closeCount = 0;

  function DialogFixture() {
    const [open, setOpen] = React.useState(false);
    const dialogRef = useDialogFocus(open, () => {
      closeCount += 1;
      setOpen(false);
    });

    return React.createElement(React.Fragment, null,
      React.createElement("button", { id: "trigger", onClick: () => setOpen(true) }, "Open dialog"),
      open ? React.createElement("section", { ref: dialogRef, role: "dialog", tabIndex: -1 },
        React.createElement("button", { id: "first" }, "Cancel"),
        React.createElement("button", { id: "last" }, "Confirm")) : null
    );
  }

  try {
    await React.act(async () => root.render(React.createElement(DialogFixture)));
    const trigger = dom.window.document.getElementById("trigger");
    trigger.focus();
    await React.act(async () => trigger.click());

    const first = dom.window.document.getElementById("first");
    const last = dom.window.document.getElementById("last");
    assert.equal(dom.window.document.activeElement, first);

    last.focus();
    await React.act(async () => last.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Tab", bubbles: true })));
    assert.equal(dom.window.document.activeElement, first);

    first.focus();
    await React.act(async () => first.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true })));
    assert.equal(dom.window.document.activeElement, last);

    await React.act(async () => last.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    assert.equal(dom.window.document.querySelector('[role="dialog"]'), null);
    assert.equal(dom.window.document.activeElement, trigger);
    assert.equal(closeCount, 1);
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});
