describe('createObservabilityProvider', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('should return NoOpProvider when no providers are configured', () => {
    jest.mock('@/config/constants', () => ({
      SENTRY_DSN: '',
      DATADOG_CLIENT_TOKEN: '',
      DATADOG_RUM_APPLICATION_ID: '',
      DATADOG_RUM_CLIENT_TOKEN: '',
      DATADOG_FORCE_ENABLE: false,
      IS_PRODUCTION: false,
      COMMIT_HASH: '',
      DATADOG_RUM_SITE: 'datadoghq.eu',
      DATADOG_RUM_SERVICE: '',
      DATADOG_RUM_ENV: '',
      DATADOG_RUM_SESSION_SAMPLE_RATE: 10,
      DATADOG_RUM_TRACING_ENABLED: false,
      GATEWAY_URL_PRODUCTION: '',
      GATEWAY_URL_STAGING: '',
    }))

    const { createObservabilityProvider } = require('../factory')
    const provider = createObservabilityProvider()

    expect(provider.name).toBe('NoOp')
  })

  it('should create provider with correct configuration', () => {
    const { createObservabilityProvider } = require('../factory')
    const provider = createObservabilityProvider()

    expect(provider).toBeDefined()
    expect(provider.name).toBeDefined()
    expect(provider.init).toBeDefined()
    expect(provider.getLogger).toBeDefined()
    expect(provider.captureException).toBeDefined()
  })
})
