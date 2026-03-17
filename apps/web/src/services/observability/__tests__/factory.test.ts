describe('createObservabilityProvider', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('should return NoOpProvider when no providers are configured', () => {
    jest.isolateModules(() => {
      jest.doMock('@/config/constants', () => ({
        DATADOG_RUM_APPLICATION_ID: '',
        DATADOG_RUM_CLIENT_TOKEN: '',
      }))

      const { createObservabilityProvider } = require('../factory')
      const provider = createObservabilityProvider()

      expect(provider.name).toBe('NoOp')
    })
  })

  it('should return DatadogProvider when Datadog RUM tokens are configured', () => {
    jest.isolateModules(() => {
      jest.doMock('@/config/constants', () => ({
        DATADOG_RUM_APPLICATION_ID: 'abc123',
        DATADOG_RUM_CLIENT_TOKEN: 'pub123',
      }))

      const { createObservabilityProvider } = require('../factory')
      const provider = createObservabilityProvider()

      expect(provider.name).toBe('Datadog')
    })
  })
})
