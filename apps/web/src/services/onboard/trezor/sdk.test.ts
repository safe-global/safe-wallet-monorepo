import { getTrezorSdk } from './sdk'

jest.mock('@trezor/connect-web', () => ({
  __esModule: true,
  default: {
    init: jest.fn().mockResolvedValue(undefined),
    dispose: jest.fn(),
  },
}))

const mockTrezorConnect = jest.requireMock('@trezor/connect-web').default as {
  init: jest.MockedFunction<(settings: unknown) => Promise<void>>
  dispose: jest.MockedFunction<() => void>
}

describe('getTrezorSdk', () => {
  afterEach(async () => {
    await (await getTrezorSdk()).disconnect()
    jest.clearAllMocks()
  })

  it('initializes Trezor Connect in auto mode so Trezor Safe 7 can connect through Trezor Suite', async () => {
    await getTrezorSdk()

    expect(mockTrezorConnect.init).toHaveBeenCalledTimes(1)
    expect(mockTrezorConnect.init).toHaveBeenCalledWith(expect.objectContaining({ coreMode: 'auto' }))
  })

  it('initializes Trezor Connect only once', async () => {
    await getTrezorSdk()
    await getTrezorSdk()

    expect(mockTrezorConnect.init).toHaveBeenCalledTimes(1)
  })
})
