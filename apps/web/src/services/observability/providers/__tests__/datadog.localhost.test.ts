/**
 * E2E runs (`yarn serve` on :8080) and dev servers must never reach RUM, even
 * when the credentials are present in the bundle.
 *
 * @jest-environment-options {"url": "http://localhost:8080/balances?safe=eth:0xb3b83bf204C458B461de9B0CD2739DB152b4fa5A"}
 */

import type * as ConstantsModule from '@/config/constants'

const mockInit = jest.fn()
const mockAddError = jest.fn()
const mockGetInitConfiguration = jest.fn()

jest.mock('@datadog/browser-rum', () => ({
  datadogRum: {
    init: (...args: unknown[]) => mockInit(...args),
    addAction: jest.fn(),
    addError: (...args: unknown[]) => mockAddError(...args),
    getInitConfiguration: (...args: unknown[]) => mockGetInitConfiguration(...args),
  },
}))

interface DatadogProviderInstance {
  init: () => Promise<void>
  captureError: (error: { error: Error; isUserFacing: boolean }) => void
}

type DatadogProviderConstructor = new () => DatadogProviderInstance

describe('DatadogProvider on a local hostname', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    jest.doMock('@/config/constants', () => ({
      ...jest.requireActual<typeof ConstantsModule>('@/config/constants'),
      DATADOG_RUM_APPLICATION_ID: 'test-app-id',
      DATADOG_RUM_CLIENT_TOKEN: 'test-client-token',
    }))

    mockGetInitConfiguration.mockReturnValue(undefined)
  })

  const createProvider = async (): Promise<DatadogProviderInstance> => {
    const { DatadogProvider } = await import('../datadog')
    return new (DatadogProvider as unknown as DatadogProviderConstructor)()
  }

  it('does not initialize the RUM SDK even though the credentials are present', async () => {
    const provider = await createProvider()

    await provider.init()

    expect(mockInit).not.toHaveBeenCalled()
  })

  it('reports no errors after a skipped initialization', async () => {
    const provider = await createProvider()
    await provider.init()

    provider.captureError({ error: new Error('local failure'), isUserFacing: true })

    expect(mockAddError).not.toHaveBeenCalled()
  })
})
