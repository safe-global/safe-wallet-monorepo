export interface ILogger {
  info: (message: string, context?: Record<string, unknown>) => void
  warn: (message: string, context?: Record<string, unknown>) => void
  error: (message: string, context?: Record<string, unknown>) => void
  debug: (message: string, context?: Record<string, unknown>) => void
}

export interface IObservabilityProvider {
  readonly name: string
  init: () => void
  getLogger: () => ILogger
  captureException: (error: Error, context?: Record<string, unknown>) => void
}

export interface ObservabilityConfig {
  enabled: boolean
  environment?: string
  version?: string
}
