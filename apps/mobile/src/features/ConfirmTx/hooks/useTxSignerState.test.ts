import { renderHook } from '@/src/tests/test-utils'
import { useTxSignerState } from './useTxSignerState'
import { faker } from '@faker-js/faker'
import type { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SignerInfo } from '@/src/types/address'
import type { RootState } from '@/src/tests/test-utils'

jest.mock('@/src/store/hooks/activeSafe', () => ({
  useDefinedActiveSafe: jest.fn(),
}))

jest.mock('../utils', () => ({
  extractAppSigners: jest.fn(),
}))

const mockUseDefinedActiveSafe = require('@/src/store/hooks/activeSafe').useDefinedActiveSafe
const mockExtractAppSigners = require('../utils').extractAppSigners

// Define types for our mock data
interface MockActiveSafe {
  address: string
  chainId: string
  threshold: number
  owners: string[]
}

const createMockSigner = (overrides: Partial<SignerInfo> = {}): SignerInfo => ({
  value: faker.finance.ethereumAddress(),
  name: faker.person.fullName(),
  logoUri: faker.image.avatar(),
  ...overrides,
})

const createMockActiveSafe = (): MockActiveSafe => ({
  address: faker.finance.ethereumAddress(),
  chainId: faker.helpers.arrayElement(['1', '137', '10', '42161']),
  threshold: faker.number.int({ min: 1, max: 3 }),
  owners: faker.helpers.multiple(() => faker.finance.ethereumAddress(), { count: { min: 1, max: 5 } }),
})

const createMockConfirmation = (signerAddress?: string) => ({
  signer: {
    value: signerAddress || faker.finance.ethereumAddress(),
    name: null,
    logoUri: null,
  },
  signature: faker.string.hexadecimal({ length: 130, prefix: '0x' }),
  submittedAt: faker.date.past().getTime(),
})

const createMockExecutionDetails = (overrides: Partial<MultisigExecutionDetails> = {}): MultisigExecutionDetails => ({
  type: 'MULTISIG',
  submittedAt: faker.date.past().getTime(),
  nonce: faker.number.int({ min: 1, max: 100 }),
  safeTxGas: faker.number.int({ min: 0, max: 100000 }).toString(),
  baseGas: faker.number.int({ min: 21000, max: 50000 }).toString(),
  gasPrice: faker.number.bigInt({ min: 1000000000n, max: 50000000000n }).toString(),
  gasToken: '0x0000000000000000000000000000000000000000',
  refundReceiver: { value: '0x0000000000000000000000000000000000000000', name: null, logoUri: null },
  safeTxHash: faker.string.hexadecimal({ length: 64, prefix: '0x' }),
  executor: { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
  signers: [
    { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
    { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
  ],
  confirmationsRequired: faker.number.int({ min: 1, max: 5 }),
  confirmations: [],
  rejectors: [],
  gasTokenInfo: null,
  trusted: faker.datatype.boolean(),
  proposer: { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
  ...overrides,
})

describe('useTxSignerState', () => {
  let mockActiveSafe: MockActiveSafe
  let mockSignerA: SignerInfo
  let mockSignerB: SignerInfo
  let mockSignerC: SignerInfo

  beforeEach(() => {
    jest.clearAllMocks()

    mockActiveSafe = createMockActiveSafe()
    mockSignerA = createMockSigner()
    mockSignerB = createMockSigner()
    mockSignerC = createMockSigner()

    mockUseDefinedActiveSafe.mockReturnValue(mockActiveSafe)
    mockExtractAppSigners.mockReturnValue([])
  })

  describe('basic state reading', () => {
    it('should return activeSigner from Redux store', () => {
      const initialStore: Partial<RootState> = {
        activeSigner: { [mockActiveSafe.address]: mockSignerA },
        signers: {},
      }

      const { result } = renderHook(() => useTxSignerState(), initialStore)

      expect(result.current.activeSigner).toEqual(mockSignerA)
    })

    it('should return empty arrays when no execution details provided', () => {
      const { result } = renderHook(() => useTxSignerState())

      expect(result.current.appSigners).toEqual([])
      expect(result.current.availableSigners).toEqual([])
      expect(result.current.activeTxSigner).toBeUndefined()
      expect(result.current.proposedSigner).toBeUndefined()
      expect(result.current.hasSigned).toBeFalsy()
      expect(result.current.canSign).toBe(false)
    })
  })

  describe('appSigners calculation', () => {
    it('should return signers from extractAppSigners utility', () => {
      const mockAppSigners = [mockSignerA, mockSignerB]
      const mockExecutionDetails = createMockExecutionDetails()
      mockExtractAppSigners.mockReturnValue(mockAppSigners)

      const initialStore: Partial<RootState> = {
        activeSigner: { [mockActiveSafe.address]: mockSignerA },
        signers: {},
      }

      const { result } = renderHook(() => useTxSignerState(mockExecutionDetails), initialStore)

      expect(mockExtractAppSigners).toHaveBeenCalledWith({}, mockExecutionDetails)
      expect(result.current.appSigners).toEqual(mockAppSigners)
    })
  })

  describe('activeTxSigner calculation', () => {
    it('should find activeTxSigner when activeSigner is in appSigners', () => {
      const mockAppSigners = [mockSignerA, mockSignerB]
      mockExtractAppSigners.mockReturnValue(mockAppSigners)

      const initialStore: Partial<RootState> = {
        activeSigner: { [mockActiveSafe.address]: mockSignerA },
        signers: {},
      }

      const { result } = renderHook(() => useTxSignerState(createMockExecutionDetails()), initialStore)

      expect(result.current.activeTxSigner).toEqual(mockSignerA)
    })

    it('should return undefined when activeSigner is not in appSigners', () => {
      const mockAppSigners = [mockSignerB, mockSignerC]
      mockExtractAppSigners.mockReturnValue(mockAppSigners)

      const initialStore: Partial<RootState> = {
        activeSigner: { [mockActiveSafe.address]: mockSignerA },
        signers: {},
      }

      const { result } = renderHook(() => useTxSignerState(createMockExecutionDetails()), initialStore)

      expect(result.current.activeTxSigner).toBeUndefined()
    })

    it('should return undefined when no activeSigner', () => {
      const mockAppSigners = [mockSignerA, mockSignerB]
      mockExtractAppSigners.mockReturnValue(mockAppSigners)

      const { result } = renderHook(() => useTxSignerState(createMockExecutionDetails()))

      expect(result.current.activeTxSigner).toBeUndefined()
    })
  })

  describe('hasSigned calculation', () => {
    it('should return true when activeSigner has already signed', () => {
      const mockExecutionDetails = createMockExecutionDetails({
        confirmations: [createMockConfirmation(mockSignerA.value), createMockConfirmation(mockSignerB.value)],
      })

      const initialStore: Partial<RootState> = {
        activeSigner: { [mockActiveSafe.address]: mockSignerA },
        signers: {},
      }

      const { result } = renderHook(() => useTxSignerState(mockExecutionDetails), initialStore)

      expect(result.current.hasSigned).toBe(true)
    })

    it('should return false when activeSigner has not signed', () => {
      const mockExecutionDetails = createMockExecutionDetails({
        confirmations: [createMockConfirmation(mockSignerB.value)],
      })

      const initialStore: Partial<RootState> = {
        activeSigner: { [mockActiveSafe.address]: mockSignerA },
        signers: {},
      }

      const { result } = renderHook(() => useTxSignerState(mockExecutionDetails), initialStore)

      expect(result.current.hasSigned).toBe(false)
    })

    it('should return false when no confirmations exist', () => {
      const mockExecutionDetails = createMockExecutionDetails({
        confirmations: [],
      })

      const initialStore: Partial<RootState> = {
        activeSigner: { [mockActiveSafe.address]: mockSignerA },
        signers: {},
      }

      const { result } = renderHook(() => useTxSignerState(mockExecutionDetails), initialStore)

      expect(result.current.hasSigned).toBe(false)
    })

    it('should return false when no activeSigner', () => {
      const mockExecutionDetails = createMockExecutionDetails({
        confirmations: [createMockConfirmation(mockSignerA.value)],
      })

      const { result } = renderHook(() => useTxSignerState(mockExecutionDetails))

      expect(result.current.hasSigned).toBe(false)
    })
  })

  describe('availableSigners calculation', () => {
    it('should return signers who have not signed yet', () => {
      const mockAppSigners = [mockSignerA, mockSignerB, mockSignerC]
      const mockExecutionDetails = createMockExecutionDetails({
        confirmations: [createMockConfirmation(mockSignerA.value)], // Only A has signed
      })
      mockExtractAppSigners.mockReturnValue(mockAppSigners)

      const initialStore: Partial<RootState> = {
        activeSigner: { [mockActiveSafe.address]: mockSignerA },
        signers: {},
      }

      const { result } = renderHook(() => useTxSignerState(mockExecutionDetails), initialStore)

      expect(result.current.availableSigners).toEqual([mockSignerB, mockSignerC])
    })

    it('should return all signers when no confirmations exist', () => {
      const mockAppSigners = [mockSignerA, mockSignerB, mockSignerC]
      const mockExecutionDetails = createMockExecutionDetails({
        confirmations: [],
      })
      mockExtractAppSigners.mockReturnValue(mockAppSigners)

      const initialStore: Partial<RootState> = {
        activeSigner: { [mockActiveSafe.address]: mockSignerA },
        signers: {},
      }

      const { result } = renderHook(() => useTxSignerState(mockExecutionDetails), initialStore)

      expect(result.current.availableSigners).toEqual(mockAppSigners)
    })

    it('should return empty array when all signers have signed', () => {
      const mockAppSigners = [mockSignerA, mockSignerB]
      const mockExecutionDetails = createMockExecutionDetails({
        confirmations: [createMockConfirmation(mockSignerA.value), createMockConfirmation(mockSignerB.value)],
      })
      mockExtractAppSigners.mockReturnValue(mockAppSigners)

      const initialStore: Partial<RootState> = {
        activeSigner: { [mockActiveSafe.address]: mockSignerA },
        signers: {},
      }

      const { result } = renderHook(() => useTxSignerState(mockExecutionDetails), initialStore)

      expect(result.current.availableSigners).toEqual([])
    })
  })

  describe('proposedSigner calculation', () => {
    it('should return signer who is both available and in execution signers list', () => {
      const mockAppSigners = [mockSignerA, mockSignerB, mockSignerC]
      const mockExecutionDetails = createMockExecutionDetails({
        signers: [
          { value: mockSignerB.value, name: null, logoUri: null },
          { value: mockSignerC.value, name: null, logoUri: null },
        ],
        confirmations: [createMockConfirmation(mockSignerA.value)], // A has signed, so available = [B, C]
      })
      mockExtractAppSigners.mockReturnValue(mockAppSigners)

      const initialStore: Partial<RootState> = {
        activeSigner: { [mockActiveSafe.address]: mockSignerA },
        signers: {},
      }

      const { result } = renderHook(() => useTxSignerState(mockExecutionDetails), initialStore)

      // Should find first available signer who is also in execution signers
      expect(result.current.proposedSigner).toEqual(mockSignerB)
    })

    it('should return undefined when no available signers match execution signers', () => {
      const mockAppSigners = [mockSignerA, mockSignerB]
      const mockExecutionDetails = createMockExecutionDetails({
        signers: [
          { value: mockSignerC.value, name: null, logoUri: null }, // C is not in appSigners
        ],
        confirmations: [],
      })
      mockExtractAppSigners.mockReturnValue(mockAppSigners)

      const initialStore: Partial<RootState> = {
        activeSigner: { [mockActiveSafe.address]: mockSignerA },
        signers: {},
      }

      const { result } = renderHook(() => useTxSignerState(mockExecutionDetails), initialStore)

      expect(result.current.proposedSigner).toBeUndefined()
    })

    it('should return undefined when no available signers exist', () => {
      const mockAppSigners = [mockSignerA, mockSignerB]
      const mockExecutionDetails = createMockExecutionDetails({
        signers: [
          { value: mockSignerA.value, name: null, logoUri: null },
          { value: mockSignerB.value, name: null, logoUri: null },
        ],
        confirmations: [createMockConfirmation(mockSignerA.value), createMockConfirmation(mockSignerB.value)], // All have signed
      })
      mockExtractAppSigners.mockReturnValue(mockAppSigners)

      const initialStore: Partial<RootState> = {
        activeSigner: { [mockActiveSafe.address]: mockSignerA },
        signers: {},
      }

      const { result } = renderHook(() => useTxSignerState(mockExecutionDetails), initialStore)

      expect(result.current.proposedSigner).toBeUndefined()
    })
  })

  describe('canSign calculation', () => {
    it('should return true when proposedSigner exists and user has not signed', () => {
      const mockAppSigners = [mockSignerA, mockSignerB]
      const mockExecutionDetails = createMockExecutionDetails({
        signers: [
          { value: mockSignerA.value, name: null, logoUri: null },
          { value: mockSignerB.value, name: null, logoUri: null },
        ],
        confirmations: [], // No one has signed yet
      })
      mockExtractAppSigners.mockReturnValue(mockAppSigners)

      const initialStore: Partial<RootState> = {
        activeSigner: { [mockActiveSafe.address]: mockSignerA },
        signers: {},
      }

      const { result } = renderHook(() => useTxSignerState(mockExecutionDetails), initialStore)

      expect(result.current.proposedSigner).toEqual(mockSignerA)
      expect(result.current.hasSigned).toBe(false)
      expect(result.current.canSign).toBe(true)
    })

    it('should return false when user has already signed', () => {
      const mockAppSigners = [mockSignerA, mockSignerB]
      const mockExecutionDetails = createMockExecutionDetails({
        signers: [
          { value: mockSignerA.value, name: null, logoUri: null },
          { value: mockSignerB.value, name: null, logoUri: null },
        ],
        confirmations: [createMockConfirmation(mockSignerA.value)], // A has signed
      })
      mockExtractAppSigners.mockReturnValue(mockAppSigners)

      const initialStore: Partial<RootState> = {
        activeSigner: { [mockActiveSafe.address]: mockSignerA },
        signers: {},
      }

      const { result } = renderHook(() => useTxSignerState(mockExecutionDetails), initialStore)

      expect(result.current.hasSigned).toBe(true)
      expect(result.current.canSign).toBe(false)
    })

    it('should return false when no proposedSigner exists', () => {
      const mockAppSigners = [mockSignerA, mockSignerB]
      const mockExecutionDetails = createMockExecutionDetails({
        signers: [
          { value: mockSignerC.value, name: null, logoUri: null }, // C is not in appSigners
        ],
        confirmations: [],
      })
      mockExtractAppSigners.mockReturnValue(mockAppSigners)

      const initialStore: Partial<RootState> = {
        activeSigner: { [mockActiveSafe.address]: mockSignerA },
        signers: {},
      }

      const { result } = renderHook(() => useTxSignerState(mockExecutionDetails), initialStore)

      expect(result.current.proposedSigner).toBeUndefined()
      expect(result.current.canSign).toBe(false)
    })
  })

  describe('complex scenarios', () => {
    it('should handle complete multisig transaction workflow', () => {
      const mockAppSigners = [mockSignerA, mockSignerB, mockSignerC]
      const mockExecutionDetails = createMockExecutionDetails({
        signers: [
          { value: mockSignerA.value, name: null, logoUri: null },
          { value: mockSignerB.value, name: null, logoUri: null },
          { value: mockSignerC.value, name: null, logoUri: null },
        ],
        confirmations: [
          createMockConfirmation(mockSignerB.value), // B has signed
        ],
        confirmationsRequired: 2,
      })
      mockExtractAppSigners.mockReturnValue(mockAppSigners)

      const initialStore: Partial<RootState> = {
        activeSigner: { [mockActiveSafe.address]: mockSignerA },
        signers: {},
      }

      const { result } = renderHook(() => useTxSignerState(mockExecutionDetails), initialStore)

      expect(result.current.activeSigner).toEqual(mockSignerA)
      expect(result.current.activeTxSigner).toEqual(mockSignerA)
      expect(result.current.appSigners).toEqual(mockAppSigners)
      expect(result.current.availableSigners).toEqual([mockSignerA, mockSignerC]) // B has signed
      expect(result.current.proposedSigner).toEqual(mockSignerA) // First available signer in execution list
      expect(result.current.hasSigned).toBe(false)
      expect(result.current.canSign).toBe(true)
    })

    it('should handle transaction where active signer is not eligible', () => {
      const mockAppSigners = [mockSignerA, mockSignerB, mockSignerC]
      const mockExecutionDetails = createMockExecutionDetails({
        signers: [
          { value: mockSignerB.value, name: null, logoUri: null },
          { value: mockSignerC.value, name: null, logoUri: null },
        ], // A is not in execution signers list
        confirmations: [],
      })
      mockExtractAppSigners.mockReturnValue(mockAppSigners)

      const initialStore: Partial<RootState> = {
        activeSigner: { [mockActiveSafe.address]: mockSignerA },
        signers: {},
      }

      const { result } = renderHook(() => useTxSignerState(mockExecutionDetails), initialStore)

      expect(result.current.activeSigner).toEqual(mockSignerA)
      expect(result.current.activeTxSigner).toEqual(mockSignerA)
      expect(result.current.proposedSigner).toEqual(mockSignerB) // First eligible signer
      expect(result.current.canSign).toBe(true) // A hasn't signed and proposed signer exists
    })
  })
})
