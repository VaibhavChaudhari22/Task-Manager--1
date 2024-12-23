const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Logs error stack for debugging

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong!';

  // Send a response with the error message
  if (process.env.NODE_ENV === 'development') {
    // Include stack trace only in development environment
    return res.status(statusCode).json({
      success: false,
      message,
      stack: err.stack
    });
  }

  // For production, avoid exposing stack trace
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Server error' : message
  });
};

module.exports = errorHandler;
