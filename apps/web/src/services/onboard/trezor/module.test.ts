import type { WalletHelpers, WalletModule } from '@web3-onboard/common'
import { trezorModule } from './module'

/* -------------------------------------------------------------------------- */
/*                                    Mocks                                   */
/* -------------------------------------------------------------------------- */

const MOCK_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const MOCK_DERIVATION_PATH = "m/44'/60'/0'/0/0"
const MOCK_CHAIN_ID = '0x1'
// jest.mock is hoisted before const declarations, so the factory must be self-contained.
// __esModule: true prevents Jest's CJS interop from double-wrapping the default export.
// We retrieve references below via jest.requireMock.
jest.mock('@trezor/connect-web', () => ({
  __esModule: true,
  default: {
    init: jest.fn().mockResolvedValue(undefined),
    dispose: jest.fn(),
    ethereumGetAddress: jest.fn().mockResolvedValue({
      success: true,
      payload: [{ address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', serializedPath: "m/44'/60'/0'/0/0" }],
    }),
    ethereumSignMessage: jest.fn().mockResolvedValue({
      success: true,
      payload: {
        // Valid 65-byte secp256k1 signature: r=1, s=1 (< n/2), v=27 (0x1b)
        // 130 hex chars = r (64) + s (64) + v (2)
        signature: '0'.repeat(63) + '1' + '0'.repeat(63) + '1' + '1b',
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      },
    }),
    ethereumSignTransaction: jest.fn().mockResolvedValue({
      success: true,
      payload: {
        v: '0x25',
        r: '0x' + '0'.repeat(63) + '1',
        s: '0x' + '0'.repeat(63) + '1',
        serializedTx: '0xf86c80deadbeef',
      },
    }),
    ethereumSignTypedData: jest.fn().mockResolvedValue({
      success: true,
      payload: {
        // Valid 65-byte secp256k1 signature: r=1, s=1 (< n/2), v=27 (0x1b)
        signature: '0'.repeat(63) + '1' + '0'.repeat(63) + '1' + '1b',
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      },
    }),
  },
}))

// Retrieve the mock object after jest.mock registration
const mockTrezorConnect = jest.requireMock('@trezor/connect-web').default as {
  init: jest.MockedFunction<() => Promise<void>>
  dispose: jest.MockedFunction<() => void>
  ethereumGetAddress: jest.MockedFunction<(params: unknown) => Promise<unknown>>
  ethereumSignMessage: jest.MockedFunction<(params: unknown) => Promise<unknown>>
  ethereumSignTransaction: jest.MockedFunction<(params: unknown) => Promise<unknown>>
  ethereumSignTypedData: jest.MockedFunction<(params: unknown) => Promise<unknown>>
}

jest.mock('@/config/constants', () => ({
  TREZOR_APP_URL: 'app.safe.global',
  TREZOR_EMAIL: 'support@safe.global',
}))

jest.mock('@/features/trezor', () => ({
  showTrezorHashComparison: jest.fn(),
  hideTrezorHashComparison: jest.fn(),
}))

// Mock account selection — returns the first account automatically
jest.mock('@web3-onboard/hw-common', () => ({
  getHardwareWalletProvider: jest.fn().mockReturnValue({
    request: jest.fn().mockImplementation(({ method }: { method: string }) => {
      if (method === 'eth_getTransactionCount') return Promise.resolve('0x0')
      if (method === 'eth_sendRawTransaction') return Promise.resolve('0xtxhash')
      return Promise.resolve(null)
    }),
  }),
  accountSelect: jest.fn().mockResolvedValue([
    {
      address: MOCK_ADDRESS,
      derivationPath: MOCK_DERIVATION_PATH,
      balance: { asset: 'ETH', value: { isZero: () => false } },
    },
  ]),
}))

/* -------------------------------------------------------------------------- */
/*                              Test helpers                                   */
/* -------------------------------------------------------------------------- */

const MOCK_CHAIN = {
  id: MOCK_CHAIN_ID,
  rpcUrl: 'https://rpc.ankr.com/eth',
  label: 'Ethereum',
  token: 'ETH',
  namespace: 'evm' as const,
}

class MockEventEmitter {
  private listeners: Record<string, Array<(...args: unknown[]) => void>> = {}
  emit = jest.fn((event: string, ...args: unknown[]) => {
    this.listeners[event]?.forEach((fn) => fn(...args))
  })
  on = jest.fn((event: string, listener: (...args: unknown[]) => void) => {
    this.listeners[event] = [...(this.listeners[event] ?? []), listener]
    return this
  })
  removeListener = jest.fn()
}

// WalletInit requires WalletHelpers but our implementation ignores the argument
const MOCK_WALLET_HELPERS = {} as WalletHelpers

async function createProvider() {
  const walletInit = trezorModule()
  const walletDef = walletInit(MOCK_WALLET_HELPERS) as WalletModule
  const { provider } = await walletDef.getInterface!({
    chains: [MOCK_CHAIN],
    EventEmitter: MockEventEmitter as unknown as Parameters<
      NonNullable<typeof walletDef.getInterface>
    >[0]['EventEmitter'],
    appMetadata: null,
  })
  return provider
}

/* -------------------------------------------------------------------------- */
/*                                   Tests                                    */
/* -------------------------------------------------------------------------- */

describe('trezorModule', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTrezorConnect.init.mockResolvedValue(undefined)
  })

  describe('wallet definition', () => {
    it('returns the Trezor wallet label', () => {
      const walletDef = trezorModule()(MOCK_WALLET_HELPERS) as WalletModule
      expect(walletDef.label).toBe('Trezor')
    })

    it('returns an SVG icon', async () => {
      const walletDef = trezorModule()(MOCK_WALLET_HELPERS) as WalletModule
      const icon = await walletDef.getIcon!()
      expect(icon).toContain('<svg')
      expect(icon.length).toBeGreaterThan(0)
    })
  })

  describe('eth_accounts', () => {
    it('returns empty array when no account connected', async () => {
      const provider = await createProvider()
      const accounts = await provider.request({ method: 'eth_accounts', params: [] })
      expect(accounts).toEqual([])
    })

    it('returns current account address after connecting', async () => {
      const provider = await createProvider()
      await provider.request({ method: 'eth_requestAccounts', params: [] })
      const accounts = await provider.request({ method: 'eth_accounts', params: [] })
      expect(accounts).toEqual([MOCK_ADDRESS])
    })
  })

  describe('eth_requestAccounts', () => {
    it('returns the first account address', async () => {
      const provider = await createProvider()
      const accounts = await provider.request({ method: 'eth_requestAccounts', params: [] })
      expect(accounts).toEqual([MOCK_ADDRESS])
    })
  })

  describe('eth_chainId', () => {
    it('returns the current chain id', async () => {
      const provider = await createProvider()
      const chainId = await provider.request({ method: 'eth_chainId', params: [] })
      expect(chainId).toBe(MOCK_CHAIN_ID)
    })
  })

  describe('wallet_switchEthereumChain', () => {
    it('switches to a known chain', async () => {
      const walletDef = trezorModule()(MOCK_WALLET_HELPERS) as WalletModule
      const { provider } = await walletDef.getInterface!({
        chains: [MOCK_CHAIN, { ...MOCK_CHAIN, id: '0x89', label: 'Polygon' }],
        EventEmitter: MockEventEmitter as unknown as Parameters<
          NonNullable<typeof walletDef.getInterface>
        >[0]['EventEmitter'],
        appMetadata: null,
      })

      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x89' }] })
      const chainId = await provider.request({ method: 'eth_chainId', params: [] })
      expect(chainId).toBe('0x89')
    })

    it('throws ProviderRpcError for unknown chain', async () => {
      const provider = await createProvider()
      await expect(
        provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xdead' }] }),
      ).rejects.toThrow()
    })
  })

  describe('eth_sign', () => {
    it('signs a message and returns serialized signature', async () => {
      const provider = await createProvider()
      await provider.request({ method: 'eth_requestAccounts', params: [] })

      const result = await provider.request({
        method: 'eth_sign',
        params: [MOCK_ADDRESS, '0xdeadbeef'],
      })

      expect(mockTrezorConnect.ethereumSignMessage).toHaveBeenCalledWith({
        path: MOCK_DERIVATION_PATH,
        message: 'deadbeef', // 0x prefix stripped
        hex: true,
      })
      expect(result).toBeTruthy()
    })

    it('strips 0x prefix before passing message to Trezor', async () => {
      const provider = await createProvider()
      await provider.request({ method: 'eth_requestAccounts', params: [] })

      await provider.request({ method: 'eth_sign', params: [MOCK_ADDRESS, '0xabcd'] })

      expect(mockTrezorConnect.ethereumSignMessage).toHaveBeenCalledWith(expect.objectContaining({ message: 'abcd' }))
    })
  })

  describe('eth_signTypedData', () => {
    const typedData = {
      types: {
        EIP712Domain: [{ name: 'name', type: 'string' }],
        Mail: [{ name: 'from', type: 'address' }],
      },
      primaryType: 'Mail',
      domain: { name: 'Ether Mail' },
      message: { from: MOCK_ADDRESS },
    }

    it('signs typed data with metamask_v4_compat: true', async () => {
      const provider = await createProvider()
      await provider.request({ method: 'eth_requestAccounts', params: [] })

      await provider.request({
        method: 'eth_signTypedData',
        params: [MOCK_ADDRESS, JSON.stringify(typedData)],
      })

      expect(mockTrezorConnect.ethereumSignTypedData).toHaveBeenCalledWith(
        expect.objectContaining({
          path: MOCK_DERIVATION_PATH,
          data: typedData,
          metamask_v4_compat: true,
        }),
      )
    })

    it('eth_signTypedData_v3 delegates to eth_signTypedData', async () => {
      const provider = await createProvider()
      await provider.request({ method: 'eth_requestAccounts', params: [] })

      await provider.request({
        method: 'eth_signTypedData_v3',
        params: [MOCK_ADDRESS, JSON.stringify(typedData)],
      })

      expect(mockTrezorConnect.ethereumSignTypedData).toHaveBeenCalledWith(
        expect.objectContaining({ metamask_v4_compat: true }),
      )
    })

    it('eth_signTypedData_v4 delegates to eth_signTypedData', async () => {
      const provider = await createProvider()
      await provider.request({ method: 'eth_requestAccounts', params: [] })

      await provider.request({
        method: 'eth_signTypedData_v4',
        params: [MOCK_ADDRESS, JSON.stringify(typedData)],
      })

      expect(mockTrezorConnect.ethereumSignTypedData).toHaveBeenCalledWith(
        expect.objectContaining({ metamask_v4_compat: true }),
      )
    })
  })

  describe('eth_signTransaction', () => {
    const legacyTxParams = {
      from: MOCK_ADDRESS,
      to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      value: '0xde0b6b3a7640000',
      gas: '0x5208',
      gasPrice: '0x4a817c800',
      nonce: '0x1',
    }

    it('signs a legacy transaction and returns serialized tx', async () => {
      const provider = await createProvider()
      await provider.request({ method: 'eth_requestAccounts', params: [] })

      const result = await provider.request({ method: 'eth_signTransaction', params: [legacyTxParams] })

      expect(mockTrezorConnect.ethereumSignTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          path: MOCK_DERIVATION_PATH,
          transaction: expect.objectContaining({
            chainId: 1,
            nonce: '0x1',
            gasPrice: expect.stringMatching(/^0x/),
            gasLimit: expect.stringMatching(/^0x/),
          }),
        }),
      )
      expect(result).toBe('0xf86c80deadbeef')
    })

    it('signs an EIP-1559 transaction', async () => {
      const eip1559TxParams = {
        from: MOCK_ADDRESS,
        to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        value: '0xde0b6b3a7640000',
        gas: '0x5208',
        maxFeePerGas: '0x77359400',
        maxPriorityFeePerGas: '0x3b9aca00',
        nonce: '0x2',
      }

      const provider = await createProvider()
      await provider.request({ method: 'eth_requestAccounts', params: [] })

      await provider.request({ method: 'eth_signTransaction', params: [eip1559TxParams] })

      expect(mockTrezorConnect.ethereumSignTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          transaction: expect.objectContaining({
            maxFeePerGas: expect.stringMatching(/^0x/),
            maxPriorityFeePerGas: expect.stringMatching(/^0x/),
          }),
        }),
      )
    })

    /*
    it('shows hash comparison dialog before signing', async () => {
      const { showTrezorHashComparison } = jest.requireMock('@/features/trezor')
      const provider = await createProvider()
      await provider.request({ method: 'eth_requestAccounts', params: [] })

      await provider.request({ method: 'eth_signTransaction', params: [legacyTxParams] })

      expect(showTrezorHashComparison).toHaveBeenCalledWith(expect.stringMatching(/^0x/))
    })

    it('hides hash comparison dialog after successful signing', async () => {
      const { hideTrezorHashComparison } = jest.requireMock('@/features/trezor')
      const provider = await createProvider()
      await provider.request({ method: 'eth_requestAccounts', params: [] })

      await provider.request({ method: 'eth_signTransaction', params: [legacyTxParams] })

      expect(hideTrezorHashComparison).toHaveBeenCalled()
    })

    it('hides hash comparison dialog on signing error', async () => {
      const { hideTrezorHashComparison } = jest.requireMock('@/features/trezor')
      mockTrezorConnect.ethereumSignTransaction.mockResolvedValueOnce({
        success: false,
        payload: { error: 'Device disconnected', code: 'Device_NotFound' },
      })

      const provider = await createProvider()
      await provider.request({ method: 'eth_requestAccounts', params: [] })

      await expect(provider.request({ method: 'eth_signTransaction', params: [legacyTxParams] })).rejects.toThrow()

      expect(hideTrezorHashComparison).toHaveBeenCalled()
    })
    */

    it('prepends 0x to serialized tx if missing', async () => {
      mockTrezorConnect.ethereumSignTransaction.mockResolvedValueOnce({
        success: true,
        payload: {
          v: '0x25',
          r: '0x' + 'a'.repeat(64),
          s: '0x' + 'b'.repeat(64),
          serializedTx: 'f86cdeadbeef',
        },
      })

      const provider = await createProvider()
      await provider.request({ method: 'eth_requestAccounts', params: [] })

      const result = await provider.request({ method: 'eth_signTransaction', params: [legacyTxParams] })
      expect((result as string).startsWith('0x')).toBe(true)
    })
  })

  describe('disconnect', () => {
    it('calls TrezorConnect.dispose and clears account', async () => {
      const provider = await createProvider()
      await provider.request({ method: 'eth_requestAccounts', params: [] })

      await Promise.resolve(provider.disconnect?.())

      expect(mockTrezorConnect.dispose).toHaveBeenCalled()
      const accounts = await provider.request({ method: 'eth_accounts', params: [] })
      expect(accounts).toEqual([])
    })
  })
})

/* -------------------------------------------------------------------------- */
/*                         mapTrezorError (via SDK rejection)                 */
/* -------------------------------------------------------------------------- */

describe('mapTrezorError (via SDK rejection)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTrezorConnect.init.mockResolvedValue(undefined)
  })

  it('maps Failure_ActionCancelled to ACTION_REJECTED', async () => {
    mockTrezorConnect.ethereumSignMessage.mockResolvedValueOnce({
      success: false,
      payload: { error: 'Action cancelled', code: 'Failure_ActionCancelled' },
    })

    const provider = await createProvider()
    await provider.request({ method: 'eth_requestAccounts', params: [] })

    await expect(provider.request({ method: 'eth_sign', params: [MOCK_ADDRESS, '0xtest'] })).rejects.toMatchObject({
      code: 'ACTION_REJECTED',
    })
  })

  it('maps other errors to UNKNOWN_ERROR', async () => {
    mockTrezorConnect.ethereumSignMessage.mockResolvedValueOnce({
      success: false,
      payload: { error: 'Firmware too old', code: 'Failure_DataError' },
    })

    const provider = await createProvider()
    await provider.request({ method: 'eth_requestAccounts', params: [] })

    await expect(provider.request({ method: 'eth_sign', params: [MOCK_ADDRESS, '0xtest'] })).rejects.toMatchObject({
      code: 'UNKNOWN_ERROR',
    })
  })
})

/* -------------------------------------------------------------------------- */
/*                         TrezorConnect.init() guard                         */
/* -------------------------------------------------------------------------- */

describe('TrezorConnect.init() idempotency guard', () => {
  // Reset the module-level trezorConnectInitialized flag before each test.
  // Create-then-disconnect ensures the flag is false and call counts are clean.
  beforeEach(async () => {
    const provider = await createProvider()
    await Promise.resolve(provider.disconnect?.())
    jest.clearAllMocks()
  })

  it('only calls init() once across multiple getInterface invocations', async () => {
    await createProvider()
    await createProvider()

    expect(mockTrezorConnect.init).toHaveBeenCalledTimes(1)
  })

  it('calls init() again after disconnect (dispose resets the guard)', async () => {
    const provider = await createProvider()
    await Promise.resolve(provider.disconnect?.())

    await createProvider()

    expect(mockTrezorConnect.init).toHaveBeenCalledTimes(2)
  })
})
