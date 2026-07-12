import { logger } from '../utils/logger.js'

/** App error with an HTTP status. Throw new ApiError(400, 'message'). */
export class ApiError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500
  if (status >= 500) {
    logger.error({ err: err.message, stack: err.stack, url: req.originalUrl }, 'Unhandled error')
  }
  res.status(status).json({
    error: {
      message: status >= 500 ? 'Internal server error' : err.message,
      code: err.code,
    },
  })
}
