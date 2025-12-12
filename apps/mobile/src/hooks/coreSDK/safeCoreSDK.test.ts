import { initSafeSDK, setSafeSDK, getSafeSDK, clearSingletonCache } from './safeCoreSDK'
import chains from '@safe-global/utils/config/chains'
import Safe from '@safe-global/protocol-kit'
import type { SafeCoreSDKProps } from '@safe-global/utils/hooks/coreSDK/types'
import { generateChecksummedAddress, createMockProvider } from '@safe-global/test'

const mockGetSafeSingletonDeployments = jest.fn()
const mockGetSafeL2SingletonDeployments = jest.fn()

jest.mock('@safe-global/safe-deployments', () => ({
  getSafeSingletonDeployments: (...args: unknown[]) => mockGetSafeSingletonDeployments(...args),
  getSafeL2SingletonDeployments: (...args: unknown[]) => mockGetSafeL2SingletonDeployments(...args),
}))

jest.mock('@safe-global/protocol-kit', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
  },
}))

jest.mock('@safe-global/utils/types/contracts', () => ({
  Gnosis_safe__factory: {
    connect: jest.fn().mockReturnValue({
      VERSION: jest.fn().mockResolvedValue('1.3.0'),
    }),
  },
}))

const mockIsValidMasterCopy = jest.fn()
jest.mock('@safe-global/utils/services/contracts/safeContracts', () => ({
  isValidMasterCopy: (...args: unknown[]) => mockIsValidMasterCopy(...args),
}))

const mockIsLegacyVersion = jest.fn()
jest.mock('@safe-global/utils/services/contracts/utils', () => ({
  isLegacyVersion: (...args: unknown[]) => mockIsLegacyVersion(...args),
}))

const mockIsInDeployments = jest.fn()
jest.mock('@safe-global/utils/hooks/coreSDK/utils', () => ({
  isInDeployments: (...args: unknown[]) => mockIsInDeployments(...args),
}))

describe('initSafeSDK', () => {
  const mockAddress = generateChecksummedAddress()
  const mockImplementation = generateChecksummedAddress()
  const mockChainId = '1'

  beforeEach(() => {
    jest.clearAllMocks()
    clearSingletonCache()
    mockIsValidMasterCopy.mockReturnValue(true)
    mockIsLegacyVersion.mockReturnValue(false)
    mockIsInDeployments.mockReturnValue(true)
    mockGetSafeSingletonDeployments.mockReturnValue({
      networkAddresses: { [mockChainId]: [mockImplementation] },
    })
    mockGetSafeL2SingletonDeployments.mockReturnValue({
      networkAddresses: { [mockChainId]: [mockImplementation] },
    })
  })

  const createDefaultProps = (overrides?: Partial<SafeCoreSDKProps>): SafeCoreSDKProps => ({
    provider: createMockProvider({ chainId: mockChainId }) as unknown as SafeCoreSDKProps['provider'],
    chainId: mockChainId,
    address: mockAddress,
    version: '1.3.0',
    implementationVersionState: 'UP_TO_DATE',
    implementation: mockImplementation,
    ...overrides,
  })

  it('returns undefined when provider network does not match chainId', async () => {
    const props = createDefaultProps({
      provider: createMockProvider({ chainId: '137' }) as unknown as SafeCoreSDKProps['provider'],
    })

    const result = await initSafeSDK(props)

    expect(result).toBeUndefined()
    expect(Safe.init).not.toHaveBeenCalled()
  })

  it('initializes Safe SDK with correct parameters for valid master copy', async () => {
    const mockSafe = { address: mockAddress }
    ;(Safe.init as jest.Mock).mockResolvedValue(mockSafe)
    const props = createDefaultProps()

    const result = await initSafeSDK(props)

    expect(Safe.init).toHaveBeenCalledWith({
      provider: 'https://rpc.example.com',
      safeAddress: mockAddress,
      isL1SafeSingleton: true,
    })
    expect(result).toBe(mockSafe)
  })

  it('uses isL1SafeSingleton=true for Ethereum mainnet', async () => {
    const mockSafe = { address: mockAddress }
    ;(Safe.init as jest.Mock).mockResolvedValue(mockSafe)
    const props = createDefaultProps({ chainId: chains.eth })

    await initSafeSDK(props)

    expect(Safe.init).toHaveBeenCalledWith(
      expect.objectContaining({
        isL1SafeSingleton: true,
      }),
    )
  })

  it('uses isL1SafeSingleton=false for L2 chains when master copy is L2', async () => {
    const mockSafe = { address: mockAddress }
    ;(Safe.init as jest.Mock).mockResolvedValue(mockSafe)
    mockIsValidMasterCopy.mockReturnValue(false)
    mockIsInDeployments.mockImplementation((_, deployments) => {
      return deployments === mockImplementation
    })
    mockGetSafeSingletonDeployments.mockReturnValue({
      networkAddresses: { '137': ['0xDifferentAddress'] },
    })
    mockGetSafeL2SingletonDeployments.mockReturnValue({
      networkAddresses: { '137': mockImplementation },
    })

    const props = createDefaultProps({
      chainId: '137',
      provider: createMockProvider({ chainId: '137' }) as unknown as SafeCoreSDKProps['provider'],
    })

    await initSafeSDK(props)

    expect(Safe.init).toHaveBeenCalledWith(
      expect.objectContaining({
        isL1SafeSingleton: false,
      }),
    )
  })

  it('returns undefined for unknown deployment when master copy is invalid', async () => {
    mockIsValidMasterCopy.mockReturnValue(false)
    mockIsInDeployments.mockReturnValue(false)

    const props = createDefaultProps({ implementationVersionState: 'UNKNOWN' })

    const result = await initSafeSDK(props)

    expect(result).toBeUndefined()
    expect(Safe.init).not.toHaveBeenCalled()
  })

  it('sets isL1SafeSingleton=true for legacy versions', async () => {
    const mockSafe = { address: mockAddress }
    ;(Safe.init as jest.Mock).mockResolvedValue(mockSafe)
    mockIsLegacyVersion.mockReturnValue(true)

    const props = createDefaultProps({
      version: '1.1.1',
      chainId: '137',
      provider: createMockProvider({ chainId: '137' }) as unknown as SafeCoreSDKProps['provider'],
    })

    await initSafeSDK(props)

    expect(Safe.init).toHaveBeenCalledWith(
      expect.objectContaining({
        isL1SafeSingleton: true,
      }),
    )
  })

  it('fetches version from contract when version is not provided', async () => {
    const mockSafe = { address: mockAddress }
    ;(Safe.init as jest.Mock).mockResolvedValue(mockSafe)

    const props = createDefaultProps({ version: undefined })

    await initSafeSDK(props)

    expect(Safe.init).toHaveBeenCalled()
  })

  it('checks L1 deployment first when master copy is invalid', async () => {
    mockIsValidMasterCopy.mockReturnValue(false)
    mockIsInDeployments.mockReturnValueOnce(true).mockReturnValueOnce(false)

    const props = createDefaultProps({ implementationVersionState: 'UNKNOWN' })

    await initSafeSDK(props)

    expect(mockGetSafeSingletonDeployments).toHaveBeenCalledWith({
      network: mockChainId,
      version: '1.3.0',
    })
    expect(mockGetSafeL2SingletonDeployments).toHaveBeenCalledWith({
      network: mockChainId,
      version: '1.3.0',
    })
  })

  it('returns cached SDK instance when called with same parameters', async () => {
    const mockSafe = { address: mockAddress }
    ;(Safe.init as jest.Mock).mockResolvedValue(mockSafe)
    const props = createDefaultProps()

    const result1 = await initSafeSDK(props)
    const result2 = await initSafeSDK(props)

    expect(Safe.init).toHaveBeenCalledTimes(1)
    expect(result1).toBe(mockSafe)
    expect(result2).toBe(mockSafe)
    expect(result1).toBe(result2)
  })

  it('creates new SDK instance when key parameters differ', async () => {
    const mockSafe1 = { address: mockAddress }
    const mockSafe2 = { address: generateChecksummedAddress() }
    ;(Safe.init as jest.Mock).mockResolvedValueOnce(mockSafe1).mockResolvedValueOnce(mockSafe2)

    const props1 = createDefaultProps({
      chainId: '1',
      provider: createMockProvider({ chainId: '1' }) as unknown as SafeCoreSDKProps['provider'],
    })
    const props2 = createDefaultProps({
      chainId: '137',
      provider: createMockProvider({ chainId: '137' }) as unknown as SafeCoreSDKProps['provider'],
    })

    const result1 = await initSafeSDK(props1)
    const result2 = await initSafeSDK(props2)

    expect(Safe.init).toHaveBeenCalledTimes(2)
    expect(result1).toBe(mockSafe1)
    expect(result2).toBe(mockSafe2)
  })
})

describe('ExternalStore exports', () => {
  beforeEach(() => {
    setSafeSDK(undefined)
  })

  it('getSafeSDK returns undefined initially', () => {
    expect(getSafeSDK()).toBeUndefined()
  })

  it('setSafeSDK updates the store value', () => {
    const mockSafe = { address: '0x123' } as unknown as Safe
    setSafeSDK(mockSafe)
    expect(getSafeSDK()).toBe(mockSafe)
  })

  it('setSafeSDK can reset to undefined', () => {
    const mockSafe = { address: '0x123' } as unknown as Safe
    setSafeSDK(mockSafe)
    setSafeSDK(undefined)
    expect(getSafeSDK()).toBeUndefined()
  })
})
