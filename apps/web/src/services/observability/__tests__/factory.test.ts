describe('createObservabilityProvider', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('should return NoOpProvider when no providers are configured', () => {
    jest.isolateModules(() => {
      jest.doMock('@/config/constants', () => ({
        SENTRY_DSN: '',
        DATADOG_CLIENT_TOKEN: '',
        DATADOG_RUM_APPLICATION_ID: '',
        DATADOG_RUM_CLIENT_TOKEN: '',
        DATADOG_FORCE_ENABLE: false,
        IS_PRODUCTION: false,
      }))

      const { createObservabilityProvider } = require('../factory')
      const provider = createObservabilityProvider()

      expect(provider.name).toBe('NoOp')
    })
  })

  it('should return SentryProvider when only Sentry is configured', () => {
    jest.isolateModules(() => {
      jest.doMock('@/config/constants', () => ({
        SENTRY_DSN: 'https://example@sentry.io/123',
        DATADOG_CLIENT_TOKEN: '',
        DATADOG_RUM_APPLICATION_ID: '',
        DATADOG_RUM_CLIENT_TOKEN: '',
        DATADOG_FORCE_ENABLE: false,
        IS_PRODUCTION: false,
      }))

      const { createObservabilityProvider } = require('../factory')
      const provider = createObservabilityProvider()

      expect(provider.name).toBe('Sentry')
    })
  })

  it('should return DatadogProvider when only Datadog is configured and enabled', () => {
    jest.isolateModules(() => {
      jest.doMock('@/config/constants', () => ({
        SENTRY_DSN: '',
        DATADOG_CLIENT_TOKEN: '',
        DATADOG_RUM_APPLICATION_ID: 'abc123',
        DATADOG_RUM_CLIENT_TOKEN: 'pub123',
        DATADOG_FORCE_ENABLE: true,
        IS_PRODUCTION: false,
      }))

      const { createObservabilityProvider } = require('../factory')
      const provider = createObservabilityProvider()

      expect(provider.name).toBe('Datadog')
    })
  })

  it('should return DatadogProvider in production when configured', () => {
    jest.isolateModules(() => {
      jest.doMock('@/config/constants', () => ({
        SENTRY_DSN: '',
        DATADOG_CLIENT_TOKEN: '',
        DATADOG_RUM_APPLICATION_ID: 'abc123',
        DATADOG_RUM_CLIENT_TOKEN: 'pub123',
        DATADOG_FORCE_ENABLE: false,
        IS_PRODUCTION: true,
      }))

      const { createObservabilityProvider } = require('../factory')
      const provider = createObservabilityProvider()

      expect(provider.name).toBe('Datadog')
    })
  })

  it('should return NoOpProvider when Datadog is configured but not enabled', () => {
    jest.isolateModules(() => {
      jest.doMock('@/config/constants', () => ({
        SENTRY_DSN: '',
        DATADOG_CLIENT_TOKEN: '',
        DATADOG_RUM_APPLICATION_ID: 'abc123',
        DATADOG_RUM_CLIENT_TOKEN: 'pub123',
        DATADOG_FORCE_ENABLE: false,
        IS_PRODUCTION: false,
      }))

      const { createObservabilityProvider } = require('../factory')
      const provider = createObservabilityProvider()

      expect(provider.name).toBe('NoOp')
    })
  })

  it('should return CompositeProvider when both Sentry and Datadog are configured', () => {
    jest.isolateModules(() => {
      jest.doMock('@/config/constants', () => ({
        SENTRY_DSN: 'https://example@sentry.io/123',
        DATADOG_CLIENT_TOKEN: '',
        DATADOG_RUM_APPLICATION_ID: 'abc123',
        DATADOG_RUM_CLIENT_TOKEN: 'pub123',
        DATADOG_FORCE_ENABLE: false,
        IS_PRODUCTION: true,
      }))

      const { createObservabilityProvider } = require('../factory')
      const provider = createObservabilityProvider()

      expect(provider.name).toBe('Composite')
    })
  })
})
