export const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";

  if (error?.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed for the submitted data.";
  }

  if (error?.code === 11000) {
    statusCode = 409;
    message = "A record with this unique value already exists.";
  }

  const production = process.env.NODE_ENV === "production";
  if (process.env.NODE_ENV !== "test") {
    console.error(production ? { statusCode, errorName: error?.name || "Error" } : error);
  }

  if (production && statusCode >= 500) message = "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    details: production ? null : error.details || null,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined
  });
};
