const isUnauthorized = (error) => error?.message === "Unauthorized socket connection";

export const installSocketRecovery = ({ socket, refreshSession, updateAccessToken, onResync }) => {
  let active = true;
  let hasConnected = false;
  let needsResync = false;
  let refreshInFlight = null;

  const onConnect = () => {
    if (hasConnected && needsResync) onResync?.();
    needsResync = false;
    hasConnected = true;
  };

  const refreshSocketToken = () => {
    if (!active || refreshInFlight) return refreshInFlight;
    needsResync = hasConnected;
    refreshInFlight = refreshSession()
      .then((response) => {
        const token = response?.data?.accessToken;
        if (!token) throw new Error("Session refresh returned no access token");
        if (active) updateAccessToken(token);
      })
      .catch(() => {
        if (active) {
          updateAccessToken(null);
          socket.disconnect();
        }
      })
      .finally(() => {
        refreshInFlight = null;
      });
    return refreshInFlight;
  };

  const onDisconnect = (reason) => {
    if (reason === "io client disconnect") return;
    if (hasConnected) needsResync = true;
    if (reason === "io server disconnect") void refreshSocketToken();
  };

  const onConnectError = (error) => {
    if (hasConnected) needsResync = true;
    if (isUnauthorized(error)) void refreshSocketToken();
  };

  socket.on("connect", onConnect);
  socket.on("disconnect", onDisconnect);
  socket.on("connect_error", onConnectError);

  return () => {
    active = false;
    socket.off("connect", onConnect);
    socket.off("disconnect", onDisconnect);
    socket.off("connect_error", onConnectError);
  };
};
