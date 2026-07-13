/**
 * Global Error Handling Middleware for Express
 * Catches any errors passed to next() or thrown in routes
 */
export const errorHandler = (err, req, res, next) => {
  console.error(' [Error Handler] Captured an uncaught error:');
  console.error(err.stack || err);

  // Set response status code (default to 500 Server Error if not specified)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    message: err.message || 'An unexpected server error occurred',
    // Only return the stack trace in development mode
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
