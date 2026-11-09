import { useCallback, useEffect, useState } from "react";
import { runHandshake } from "../utils/extensionHandshake.js";

export function useExtensionStatus(userId) {
  const [status, setStatus] = useState({ state: "checking" });
  const [checkedAt, setCheckedAt] = useState(null);

  const check = useCallback(async () => {
    setStatus({ state: "checking" });
    const result = await runHandshake({ userId: userId || "" });
    setStatus(result);
    setCheckedAt(new Date());
    return result;
  }, [userId]);

  useEffect(() => { void check(); }, [check]);

  return { status, checkedAt, recheck: check };
}
