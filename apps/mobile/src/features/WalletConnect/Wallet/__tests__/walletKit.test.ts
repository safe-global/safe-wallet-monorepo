// Module-level singleton — reset module registry between tests so each gets a fresh one.
const mockInit = jest.fn()
const mockCoreCtor = jest.fn()

jest.mock('@reown/walletkit', () => ({
  WalletKit: { init: (...args: unknown[]) => mockInit(...args) },
}))

jest.mock('@walletconnect/core', () => ({
  Core: function Core(this: unknown, opts: unknown) {
    mockCoreCtor(opts)
    return { opts }
  },
}))

jest.mock('@walletconnect/utils', () => ({ getSdkError: jest.fn() }))

// Spy on the MMKV factory the storage adapter uses.
const mockCreateMMKV = jest.fn((_opts: { id: string }) => ({
  getAllKeys: () => [],
  getString: () => undefined,
  set: jest.fn(),
  remove: jest.fn(),
}))
jest.mock('react-native-mmkv', () => ({ createMMKV: (opts: { id: string }) => mockCreateMMKV(opts) }))

describe('getWalletKit', () => {
  beforeEach(() => {
    jest.resetModules()
    mockInit.mockReset()
    mockCoreCtor.mockReset()
    mockCreateMMKV.mockClear()
  })

  it('returns the same instance and only initialises once', async () => {
    const instance = { id: 'wk' }
    mockInit.mockResolvedValue(instance)
    const { getWalletKit } = require('../walletKit')

    const a = await getWalletKit()
    const b = await getWalletKit()

    expect(a).toBe(instance)
    expect(b).toBe(instance)
    expect(mockInit).toHaveBeenCalledTimes(1)
  })

  it('shares one init across concurrent callers', async () => {
    mockInit.mockResolvedValue({ id: 'wk' })
    const { getWalletKit } = require('../walletKit')

    await Promise.all([getWalletKit(), getWalletKit(), getWalletKit()])

    expect(mockInit).toHaveBeenCalledTimes(1)
  })

  it('binds storage to MMKV id safe_wc_dapp and namespaces the Core under wc_dapp_', async () => {
    mockInit.mockResolvedValue({ id: 'wk' })
    const { getWalletKit } = require('../walletKit')

    await getWalletKit()

    expect(mockCreateMMKV).toHaveBeenCalledWith({ id: 'safe_wc_dapp' })
    expect(mockCoreCtor).toHaveBeenCalledWith(expect.objectContaining({ customStoragePrefix: 'wc_dapp_' }))
  })

  it('retries after a failed initialisation', async () => {
    mockInit.mockRejectedValueOnce(new Error('init boom')).mockResolvedValue({ id: 'wk' })
    const { getWalletKit } = require('../walletKit')

    await expect(getWalletKit()).rejects.toThrow('init boom')
    const second = await getWalletKit()

    expect(second).toEqual({ id: 'wk' })
    expect(mockInit).toHaveBeenCalledTimes(2)
  })
})
