import { logger } from '../utils/logger.js';

const createError = (message, status, details) => {
    const error = new Error(message);
    error.status = status;

    if (details) {
        error.details = details;
    }

    return error;
};

export const InvalidParams = (message) => createError(message, 401);
export const InternalError = (message) => createError(message);
export const NotFound = (message) => createError(message, 404);

/**
 * @param {*} err
 * @param {*} req
 * @param {*} res
 * @param {*} next THIS IS NECESSARY, even if it's unused, otherwise the error handler does not trigger.
 */
// eslint-disable-next-line unused-imports/no-unused-vars
export const catchError = (err, req, res, next) => {
    logger.error('request failure', req.requestId);

    logger.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        error: err.message,
        ...(global.isDev && { stack: err.stack }),
        ...err.details,
    });
};

export const routeNotFound = (_, __, next) => next(NotFound('Route not found'));

export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
