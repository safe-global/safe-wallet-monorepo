export interface ILogger {
  info: (message: string, context?: Record<string, unknown>) => void
  warn: (message: string, context?: Record<string, unknown>) => void
  error: (message: string, context?: Record<string, unknown>) => void
  debug: (message: string, context?: Record<string, unknown>) => void
}

export interface IObservabilityProvider {
  readonly name: string
  init: () => void | Promise<void>
  getLogger: () => ILogger
  captureException: (error: Error, context?: Record<string, unknown>) => void
  getErrorBoundary?: () =>
    | React.ComponentType<{
        children: React.ReactNode
        onError?: (error: Error, componentStack?: string) => void
        fallback?: React.ReactNode
        showDialog?: boolean
      }>
    | undefined
}

export interface ObservabilityConfig {
  enabled: boolean
  environment?: string
  version?: string
}
