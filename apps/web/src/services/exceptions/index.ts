import { sentryCaptureException } from '@/services/sentry'
import { IS_PRODUCTION } from '@/config/constants'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { asError } from '@safe-global/utils/services/exceptions/utils'

export class CodedException extends Error {
  public readonly code: number
  public readonly content: string

  private getCode(content: ErrorCodes): number {
    const codePrefix = content.split(':')[0]
    const code = Number(codePrefix)
    if (isNaN(code)) {
      throw new CodedException(ErrorCodes.___0, codePrefix)
    }
    return code
  }

  constructor(content: ErrorCodes, thrown?: unknown) {
    super()

    const extraInfo = thrown ? ` (${asError(thrown).message})` : ''
    this.message = `Code ${content}${extraInfo}`
    this.code = this.getCode(content)
    this.content = content
  }

  public log(): void {
    // Filter out the logError fn from the stack trace
    if (this.stack) {
      const newStack = this.stack
        .split('\n')
        .filter((line) => !line.includes(logError.name))
        .join('\n')
      try {
        this.stack = newStack
      } catch (e) {}
    }

    // Log only the message on prod, and the full error on dev
    console.error(IS_PRODUCTION ? this.message : this)
  }

  public track(): void {
    this.log()

    if (IS_PRODUCTION) {
      sentryCaptureException(this)
    }
  }
}

type ErrorHandler = (content: ErrorCodes, thrown?: unknown) => CodedException

export const logError: ErrorHandler = function logError(...args) {
  const error = new CodedException(...args)
  error.log()
  return error
}

export const trackError: ErrorHandler = function trackError(...args) {
  const error = new CodedException(...args)
  error.track()
  return error
}

export const Errors = ErrorCodes
