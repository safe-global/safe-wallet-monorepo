import { loadLedgerTransport } from './ledger-transport'

const mockWebHidFactory = jest.fn()
const mockSpeculosFactory = jest.fn()
const mockSpeculosTransportFactory = jest.fn(() => mockSpeculosFactory)

// Its exports map is ESM-only, which Jest's CommonJS resolver cannot read.
jest.mock(
  '@ledgerhq/device-transport-kit-web-hid',
  () => ({ webHidTransportFactory: mockWebHidFactory, webHidIdentifier: 'WEB-HID' }),
  { virtual: true },
)
jest.mock('@ledgerhq/device-transport-kit-speculos', () => ({
  speculosTransportFactory: mockSpeculosTransportFactory,
  speculosIdentifier: 'SPECULOS',
}))

describe('loadLedgerTransport', () => {
  beforeEach(() => {
    mockSpeculosTransportFactory.mockClear()
  })

  it('uses WebHID when no emulator URL is set', async () => {
    const transport = await loadLedgerTransport('')

    expect(transport).toEqual({ factory: mockWebHidFactory, identifier: 'WEB-HID' })
    expect(mockSpeculosTransportFactory).not.toHaveBeenCalled()
  })

  it('uses the Speculos emulator at the given URL when an emulator URL is set', async () => {
    const transport = await loadLedgerTransport('http://localhost:5000')

    expect(transport).toEqual({ factory: mockSpeculosFactory, identifier: 'SPECULOS' })
    expect(mockSpeculosTransportFactory).toHaveBeenCalledWith('http://localhost:5000')
  })
})
