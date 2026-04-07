export function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, req, res, next) {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }
  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || "Internal server error";
  if (error.code === 11000) {
    statusCode = 409; // Conflict
    const field = Object.keys(error.keyValue || {})[0];
    message = `this ${field} already exists, please use another value!`;
  }
  if (error.name === "ValidationError") {
    statusCode = 400; // Bad Request
    message = Object.values(error.errors)
      .map((el) => el.message)
      .join(". ");
  }
  if (error.name === "CastError") {
    statusCode = 400;
    message = `Invalid resource ID format: ${error.value}`;
  }
  return res.status(statusCode).json({
    success: false,
    message: message,
    // Only include stack trace in development mode for security reasons
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
}
