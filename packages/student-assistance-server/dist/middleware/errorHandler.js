"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (error, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal server error';
    // Log the error
    logger_1.logger.error('Error occurred:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
    });
    // Handle different types of errors
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
    }
    else if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        // Handle Prisma errors
        switch (error.code) {
            case 'P2002':
                statusCode = 409;
                message = 'Duplicate entry. Record already exists.';
                break;
            case 'P2025':
                statusCode = 404;
                message = 'Record not found.';
                break;
            case 'P2003':
                statusCode = 400;
                message = 'Foreign key constraint failed.';
                break;
            default:
                statusCode = 400;
                message = 'Database operation failed.';
        }
    }
    else if (error instanceof client_1.Prisma.PrismaClientValidationError) {
        statusCode = 400;
        message = 'Invalid data provided.';
    }
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token.';
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired.';
    }
    else if (error.name === 'ValidationError') {
        statusCode = 400;
        message = error.message;
    }
    // Send error response
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map