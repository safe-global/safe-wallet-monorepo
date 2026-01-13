import type { ILogger, IObservabilityProvider } from '../types'

export class CompositeProvider implements IObservabilityProvider {
  readonly name = 'Composite'
  private providers: IObservabilityProvider[]

  constructor(providers: IObservabilityProvider[]) {
    this.providers = providers
  }

  async init(): Promise<void> {
    await Promise.allSettled(this.providers.map((provider) => provider.init()))
  }

  getLogger(): ILogger {
    const allLoggers = this.providers.map((provider) => provider.getLogger())

    return {
      info: (message: string, context?: Record<string, unknown>) => {
        allLoggers.forEach((logger) => {
          try {
            logger.info(message, context)
          } catch (error) {
            console.error('Logger error:', error)
          }
        })
      },
      warn: (message: string, context?: Record<string, unknown>) => {
        allLoggers.forEach((logger) => {
          try {
            logger.warn(message, context)
          } catch (error) {
            console.error('Logger error:', error)
          }
        })
      },
      error: (message: string, context?: Record<string, unknown>) => {
        allLoggers.forEach((logger) => {
          try {
            logger.error(message, context)
          } catch (error) {
            console.error('Logger error:', error)
          }
        })
      },
      debug: (message: string, context?: Record<string, unknown>) => {
        allLoggers.forEach((logger) => {
          try {
            logger.debug(message, context)
          } catch (error) {
            console.error('Logger error:', error)
          }
        })
      },
    }
  }

  captureException(error: Error, context?: Record<string, unknown>): void {
    this.providers.forEach((provider) => {
      try {
        provider.captureException(error, context)
      } catch (err) {
        console.error('Error capturing exception in provider:', err)
      }
    })
  }
}
