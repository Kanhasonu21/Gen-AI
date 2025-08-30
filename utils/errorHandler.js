/**
 * Error handling utilities for consistent error management
 */

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        this.timestamp = new Date().toISOString();

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Async wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Validation error handler
 */
export const handleValidationError = (error) => {
    const message = Object.values(error.errors).map(val => val.message).join(', ');
    return new AppError(`Validation Error: ${message}`, 400, 'VALIDATION_ERROR');
};

/**
 * MongoDB duplicate key error handler
 */
export const handleDuplicateKeyError = (error) => {
    const field = Object.keys(error.keyValue)[0];
    const message = `${field} already exists`;
    return new AppError(message, 409, 'DUPLICATE_ERROR');
};

/**
 * JWT error handler
 */
export const handleJWTError = () => {
    return new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN');
};

/**
 * JWT expired error handler
 */
export const handleJWTExpiredError = () => {
    return new AppError('Your token has expired. Please log in again.', 401, 'EXPIRED_TOKEN');
};

/**
 * Development error response
 */
export const sendErrorDev = (error, res) => {
    res.status(error.statusCode).json({
        status: 'error',
        error: error,
        message: error.message,
        stack: error.stack,
        timestamp: error.timestamp || new Date().toISOString()
    });
};

/**
 * Production error response
 */
export const sendErrorProd = (error, res) => {
    // Operational, trusted error: send message to client
    if (error.isOperational) {
        res.status(error.statusCode).json({
            status: 'error',
            message: error.message,
            code: error.code,
            timestamp: error.timestamp || new Date().toISOString()
        });
    } else {
        // Programming or other unknown error: don't leak error details
        console.error('ERROR 💥', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Global error handling middleware
 */
export const globalErrorHandler = (error, req, res, next) => {
    error.statusCode = error.statusCode || 500;
    error.status = error.status || 'error';

    let transformedError = { ...error };
    transformedError.message = error.message;

    // Handle different types of errors
    if (error.name === 'ValidationError') transformedError = handleValidationError(transformedError);
    if (error.code === 11000) transformedError = handleDuplicateKeyError(transformedError);
    if (error.name === 'JsonWebTokenError') transformedError = handleJWTError();
    if (error.name === 'TokenExpiredError') transformedError = handleJWTExpiredError();

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(transformedError, res);
    } else {
        sendErrorProd(transformedError, res);
    }
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res, next) => {
    const error = new AppError(`Can't find ${req.originalUrl} on this server!`, 404, 'NOT_FOUND');
    next(error);
};

/**
 * Rate limiting error handler
 */
export const rateLimitHandler = (req, res) => {
    res.status(429).json({
        status: 'error',
        message: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString()
    });
};

export default {
    AppError,
    asyncHandler,
    globalErrorHandler,
    notFoundHandler,
    rateLimitHandler
};
