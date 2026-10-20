import { ApiError } from "../utils/ApiError.js";

export const createCorsOptions = (allowedOrigins) => ({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new ApiError(403, "Origin is not allowed by CORS."));
  },
  credentials: true
});
