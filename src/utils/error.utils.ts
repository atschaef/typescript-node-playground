import { AnyObject } from '../types/app.types'
import { ErrorType } from '../types/app.enums'
import { config, Environment } from '../../config'
import { log } from '../utils/log.utils'

/* istanbul ignore next */
export const logError = (error: Error) => {
  if (config.ENV !== Environment.Test) {
    log.error(error, '[Caught Error]:')
  }
}

export class AppError extends Error {
  constructor(message: string, name: ErrorType, code: number, context: AnyObject = {}) {
    super()

    this.message = message
    this.name = name
    this.code = code
    this.context = context
  }

  code: number
  context: any
  msg: string

  get message() {
    return this.msg
  }

  set message(value) {
    this.msg = value
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, context?: AnyObject) {
    super(message, ErrorType.BadRequest, 400, context)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, context?: AnyObject) {
    super(message, ErrorType.Unauthorized, 401, context)
  }
}

/* istanbul ignore next */
export class ForbiddenError extends AppError {
  constructor(message: string, context?: AnyObject) {
    super(message, ErrorType.Forbidden, 403, context)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, context?: AnyObject) {
    super(message, ErrorType.NotFound, 404, context)
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: AnyObject) {
    super(message, ErrorType.Conflict, 409, context)
  }
}

export class InternalError extends AppError {
  constructor(message: string, context?: AnyObject) {
    super(message, ErrorType.InternalError, 500, context)
  }
}

export class ExternalError extends AppError {
  constructor(message: string, context?: AnyObject) {
    super(message, ErrorType.ExternalError, 502, context)
  }
}

export class UnavailableForLegalReasons extends AppError {
  constructor(message: string) {
    super(message, ErrorType.UnavailableForLegalReasons, 451, {})
  }
}
