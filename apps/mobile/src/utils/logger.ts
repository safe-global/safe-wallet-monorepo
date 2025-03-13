import { format } from 'date-fns'

export enum LogLevel {
  TRACE = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const style = (color: string, bold = true): string => {
  return `color:${color};font-weight:${bold ? '600' : '300'};font-size:11px`
}

const now = (): string => format(new Date(), '[HH:mm:ss.SS]')

const formatMessage = (
  message: string,
  color?: string,
): [string, string, string, string] | [string, string, string] => {
  if (color) {
    return ['%c%s %s', style(color), now(), message]
  }

  return ['%s %s', now(), message]
}

class Logger {
  private level: LogLevel = LogLevel.ERROR
  private shouldLogErrorToSentry = false

  setLevel = (level: LogLevel): void => {
    this.level = level
  }

  shouldLog = (level: LogLevel): boolean => {
    return level >= this.level
  }

  trace = (message: string, value?: unknown): void => {
    if (this.shouldLog(LogLevel.TRACE)) {
      console.groupCollapsed(...formatMessage(message, 'grey'))
      if (value) {
        console.trace(value)
      }
      console.groupEnd()
    }
  }

  info = (message: string, value?: unknown): void => {
    if (this.shouldLog(LogLevel.INFO)) {
      if (message) {
        console.info(...formatMessage(message))
      }
      if (value) {
        console.info(value)
      }
    }
  }

  warn = (message: string, value?: unknown): void => {
    if (this.shouldLog(LogLevel.WARN)) {
      console.groupCollapsed(...formatMessage(message, 'yellow'))
      if (value) {
        console.warn(value)
      }
      console.groupEnd()
    }
  }

  error = (message: string, value?: unknown): void => {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.groupCollapsed(...formatMessage(message, 'red'))
      if (value) {
        console.error(value)
      }
      console.groupEnd()

      if (this.shouldLogErrorToSentry) {
        // TODO: implement Sentry error logging
      }
    }
  }

  setShouldLogErrorToSentry = (shouldLogErrorToSentry: boolean): void => {
    this.shouldLogErrorToSentry = shouldLogErrorToSentry
  }
}

export default new Logger()
