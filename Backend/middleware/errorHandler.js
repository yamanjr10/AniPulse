function errorHandler(err, req, res, next) {
  console.error('Error:', err.stack);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
}

class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = 'AppError';
  }
}

module.exports = { errorHandler, AppError };
