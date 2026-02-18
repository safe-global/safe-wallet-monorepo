import type { ILogger, IObservabilityProvider } from '../types'

const noopLogger: ILogger = {
  // eslint-disable-next-line unused-imports/no-unused-vars
  info: (_message: string, _context?: Record<string, unknown>) => {},
  // eslint-disable-next-line unused-imports/no-unused-vars
  warn: (_message: string, _context?: Record<string, unknown>) => {},
  // eslint-disable-next-line unused-imports/no-unused-vars
  error: (_message: string, _context?: Record<string, unknown>) => {},
  // eslint-disable-next-line unused-imports/no-unused-vars
  debug: (_message: string, _context?: Record<string, unknown>) => {},
}

export class NoOpProvider implements IObservabilityProvider {
  readonly name = 'NoOp'

  init(): void {}

  getLogger(): ILogger {
    return noopLogger
  }

  // eslint-disable-next-line unused-imports/no-unused-vars
  captureException(_error: Error, _context?: Record<string, unknown>): void {}
}
