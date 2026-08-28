// Both transport packages ship ESM-only entry points, which jest's CommonJS resolver cannot
// load. The app only ever reaches them through a dynamic import, so a virtual mock is enough.
jest.mock(
  '@ledgerhq/device-transport-kit-web-hid',
  () => ({
    webHidTransportFactory: jest.fn(),
    webHidIdentifier: 'mock-web-hid-identifier',
  }),
  { virtual: true },
)

jest.mock(
  '@ledgerhq/device-transport-kit-speculos',
  () => ({
    speculosTransportFactory: jest.fn(() => 'mock-speculos-factory'),
    speculosIdentifier: 'mock-speculos-identifier',
  }),
  { virtual: true },
)

describe('getLedgerTransport', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('should, when LEDGER_SPECULOS_URL is empty, return the WebHID transport', async () => {
    jest.doMock('@/config/constants', () => ({ LEDGER_SPECULOS_URL: '' }))

    const { webHidTransportFactory } = await import('@ledgerhq/device-transport-kit-web-hid')
    const { getLedgerTransport } = await import('./ledger-module')

    const { factory, identifier } = await getLedgerTransport()

    expect(identifier).toBe('mock-web-hid-identifier')
    expect(factory).toBe(webHidTransportFactory)
  })

  it('should, when LEDGER_SPECULOS_URL is empty, not load the Speculos transport', async () => {
    jest.doMock('@/config/constants', () => ({ LEDGER_SPECULOS_URL: '' }))

    const { speculosTransportFactory } = await import('@ledgerhq/device-transport-kit-speculos')
    const { getLedgerTransport } = await import('./ledger-module')

    await getLedgerTransport()

    expect(speculosTransportFactory).not.toHaveBeenCalled()
  })

  it('should, when LEDGER_SPECULOS_URL names an emulator, return a Speculos transport built for that URL', async () => {
    jest.doMock('@/config/constants', () => ({ LEDGER_SPECULOS_URL: 'http://localhost:5000' }))

    const { speculosTransportFactory } = await import('@ledgerhq/device-transport-kit-speculos')
    const { getLedgerTransport } = await import('./ledger-module')

    const { factory, identifier } = await getLedgerTransport()

    expect(identifier).toBe('mock-speculos-identifier')
    expect(factory).toBe('mock-speculos-factory')
    expect(speculosTransportFactory).toHaveBeenCalledWith('http://localhost:5000')
  })

  it('should, when LEDGER_SPECULOS_URL names an emulator, not load the WebHID transport', async () => {
    jest.doMock('@/config/constants', () => ({ LEDGER_SPECULOS_URL: 'http://localhost:5000' }))

    const { getLedgerTransport } = await import('./ledger-module')

    const { identifier } = await getLedgerTransport()

    expect(identifier).not.toBe('mock-web-hid-identifier')
  })
})
