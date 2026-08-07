import { renderHook } from '@/tests/test-utils'
import { useSafeShieldAssessmentUrl } from '../useSafeShieldAssessmentUrl'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as protocolKit from '@safe-global/protocol-kit'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import type { SafeTransaction } from '@safe-global/types-kit'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@safe-global/protocol-kit', () => ({
  ...jest.requireActual('@safe-global/protocol-kit'),
  calculateSafeTransactionHash: jest.fn(),
}))

const mockUseSafeInfo = useSafeInfoHook.default as jest.MockedFunction<typeof useSafeInfoHook.default>
const mockCalculateSafeTransactionHash = protocolKit.calculateSafeTransactionHash as jest.MockedFunction<
  typeof protocolKit.calculateSafeTransactionHash
>

const MOCK_SAFE_ADDRESS = '0x1234567890123456789012345678901234567890'
const MOCK_CHAIN_ID = '1'
const MOCK_VERSION = '1.3.0'
const MOCK_TX_HASH = '0xComputedTxHash'

const buildMockSafeTx = (): SafeTransaction => ({
  addSignature: jest.fn(),
  encodedSignatures: jest.fn(),
  getSignature: jest.fn(),
  signatures: new Map(),
  data: {
    to: '0xRecipient',
    value: '0',
    data: '0x',
    operation: 0,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: '0x0000000000000000000000000000000000000000',
    refundReceiver: '0x0000000000000000000000000000000000000000',
    nonce: 1,
  },
})

const mockSafe = extendedSafeInfoBuilder().with({ chainId: MOCK_CHAIN_ID }).build()

const setupSafeInfoMock = (overrides: Partial<ReturnType<typeof useSafeInfoHook.default>> = {}) => {
  mockUseSafeInfo.mockReturnValue({
    safe: { ...mockSafe, version: MOCK_VERSION },
    safeAddress: MOCK_SAFE_ADDRESS,
    safeLoaded: true,
    safeLoading: false,
    safeError: undefined,
    ...overrides,
  })
}

jest.mock('@/components/tx-flow/SafeTxProvider', () => ({
  SafeTxContext: {
    _currentValue: {
      safeTx: undefined,
      safeMessage: undefined,
      safeMessageHash: undefined,
      txOrigin: undefined,
    },
  },
}))

describe('useSafeShieldAssessmentUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupSafeInfoMock()
  })

  describe('when safeTx is undefined', () => {
    it('should return null', () => {
      const { result } = renderHook(() => useSafeShieldAssessmentUrl())
      expect(result.current).toBeNull()
    })
  })

  describe('when safeTx is set', () => {
    beforeEach(() => {
      const SafeTxProvider = jest.requireMock('@/components/tx-flow/SafeTxProvider')
      SafeTxProvider.SafeTxContext._currentValue.safeTx = buildMockSafeTx()
      mockCalculateSafeTransactionHash.mockReturnValue(MOCK_TX_HASH)
    })

    afterEach(() => {
      const SafeTxProvider = jest.requireMock('@/components/tx-flow/SafeTxProvider')
      SafeTxProvider.SafeTxContext._currentValue.safeTx = undefined
    })

    it('should return a URL string containing the computed safeTxHash', () => {
      const { result } = renderHook(() => useSafeShieldAssessmentUrl())
      expect(result.current).not.toBeNull()
      expect(result.current).toContain(MOCK_TX_HASH)
    })

    it('should return a URL containing the safe address', () => {
      const { result } = renderHook(() => useSafeShieldAssessmentUrl())
      expect(result.current).toContain(MOCK_SAFE_ADDRESS)
    })

    it('should return a URL containing the chainId', () => {
      const { result } = renderHook(() => useSafeShieldAssessmentUrl())
      expect(result.current).toContain(MOCK_CHAIN_ID)
    })

    it('should return a valid URL string starting with https', () => {
      const { result } = renderHook(() => useSafeShieldAssessmentUrl())
      expect(result.current).toMatch(/^https:\/\//)
    })

    it('should call calculateSafeTransactionHash with correct arguments', () => {
      renderHook(() => useSafeShieldAssessmentUrl())
      expect(mockCalculateSafeTransactionHash).toHaveBeenCalledWith(
        MOCK_SAFE_ADDRESS,
        expect.objectContaining({ nonce: 1 }),
        MOCK_VERSION,
        BigInt(MOCK_CHAIN_ID),
      )
    })
  })

  describe('when calculateSafeTransactionHash throws', () => {
    beforeEach(() => {
      const SafeTxProvider = jest.requireMock('@/components/tx-flow/SafeTxProvider')
      SafeTxProvider.SafeTxContext._currentValue.safeTx = buildMockSafeTx()
      mockCalculateSafeTransactionHash.mockImplementation(() => {
        throw new Error('Invalid transaction data')
      })
    })

    afterEach(() => {
      const SafeTxProvider = jest.requireMock('@/components/tx-flow/SafeTxProvider')
      SafeTxProvider.SafeTxContext._currentValue.safeTx = undefined
    })

    it('should return null', () => {
      const { result } = renderHook(() => useSafeShieldAssessmentUrl())
      expect(result.current).toBeNull()
    })
  })

  describe('when safe version is missing', () => {
    beforeEach(() => {
      setupSafeInfoMock({
        safe: { ...mockSafe, version: '' },
      })
      const SafeTxProvider = jest.requireMock('@/components/tx-flow/SafeTxProvider')
      SafeTxProvider.SafeTxContext._currentValue.safeTx = buildMockSafeTx()
    })

    afterEach(() => {
      const SafeTxProvider = jest.requireMock('@/components/tx-flow/SafeTxProvider')
      SafeTxProvider.SafeTxContext._currentValue.safeTx = undefined
    })

    it('should return null', () => {
      const { result } = renderHook(() => useSafeShieldAssessmentUrl())
      expect(result.current).toBeNull()
    })
  })
})
