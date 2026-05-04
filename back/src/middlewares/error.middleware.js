/**
 * Global error handling middleware.
 */
export const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  const statusCode = err.statusCode || 400; // Par défaut 400 pour les erreurs métier
  const message = err.message || 'Erreur serveur';

  res.status(statusCode).json({
    message: message
  });
};

/**
 * Custom Error class for operational errors.
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
