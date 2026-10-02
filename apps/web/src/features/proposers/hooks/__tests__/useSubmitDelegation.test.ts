import { renderHook, act, waitFor } from '@/tests/test-utils'
import { useSubmitDelegation } from '../useSubmitDelegation'
import * as useChainIdModule from '@/hooks/useChainId'
import * as useSafeAddressModule from '@/hooks/useSafeAddress'
import * as useChainsModule from '@/hooks/useChains'
import * as utilsModule from '@/features/proposers/utils/utils'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { PendingDelegation } from '@/features/proposers/types'
import { PROPOSER_LABEL_PLACEHOLDER } from '@/features/proposers/constants'

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/delegates', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/delegates'),
  useDelegatesPostDelegateV2Mutation: jest.fn(),
  useDelegatesPostDelegateV3Mutation: jest.fn(),
  useDelegatesDeleteDelegateV2Mutation: jest.fn(),
  useDelegatesDeleteDelegateV3Mutation: jest.fn(),
}))

const {
  useDelegatesPostDelegateV2Mutation,
  useDelegatesPostDelegateV3Mutation,
  useDelegatesDeleteDelegateV2Mutation,
  useDelegatesDeleteDelegateV3Mutation,
} = jest.requireMock<
  Record<
    | 'useDelegatesPostDelegateV2Mutation'
    | 'useDelegatesPostDelegateV3Mutation'
    | 'useDelegatesDeleteDelegateV2Mutation'
    | 'useDelegatesDeleteDelegateV3Mutation',
    jest.Mock
  >
>('@safe-global/store/gateway/AUTO_GENERATED/delegates')

describe('useSubmitDelegation', () => {
  const chainId = faker.string.numeric()
  const safeAddress = checksumAddress(faker.finance.ethereumAddress())
  const parentSafeAddress = checksumAddress(faker.finance.ethereumAddress())
  const delegateAddress = checksumAddress(faker.finance.ethereumAddress())
  const preparedSignature = `0x${faker.string.hexadecimal({ length: 130 })}`
  const encodedSignature = `0x${faker.string.hexadecimal({ length: 200 })}`

  const createPendingDelegation = (overrides: Partial<PendingDelegation> = {}): PendingDelegation => ({
    messageHash: `0x${faker.string.hexadecimal({ length: 64 })}`,
    action: 'add',
    delegateAddress,
    nestedSafeAddress: safeAddress,
    parentSafeAddress,
    totp: Math.floor(Date.now() / 1000 / 3600),
    status: 'ready',
    confirmationsSubmitted: 2,
    confirmationsRequired: 2,
    confirmations: [],
    preparedSignature,
    creationTimestamp: Date.now(),
    proposedBy: { value: checksumAddress(faker.finance.ethereumAddress()), name: null, logoUri: null },
    ...overrides,
  })

  let mockAddDelegateV2: jest.Mock
  let mockAddDelegateV3: jest.Mock
  let mockDeleteDelegateV2: jest.Mock
  let mockDeleteDelegateV3: jest.Mock

  const mutationTrigger = () => jest.fn().mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useChainIdModule, 'default').mockReturnValue(chainId)
    jest.spyOn(useSafeAddressModule, 'default').mockReturnValue(safeAddress)
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(true)
    jest.spyOn(utilsModule, 'encodeEIP1271Signature').mockResolvedValue(encodedSignature)

    mockAddDelegateV2 = mutationTrigger()
    mockAddDelegateV3 = mutationTrigger()
    mockDeleteDelegateV2 = mutationTrigger()
    mockDeleteDelegateV3 = mutationTrigger()

    useDelegatesPostDelegateV2Mutation.mockReturnValue([mockAddDelegateV2, { isLoading: false, reset: jest.fn() }])
    useDelegatesPostDelegateV3Mutation.mockReturnValue([mockAddDelegateV3, { isLoading: false, reset: jest.fn() }])
    useDelegatesDeleteDelegateV2Mutation.mockReturnValue([mockDeleteDelegateV2, { isLoading: false, reset: jest.fn() }])
    useDelegatesDeleteDelegateV3Mutation.mockReturnValue([mockDeleteDelegateV3, { isLoading: false, reset: jest.fn() }])
  })

  it('should throw error when preparedSignature is missing', async () => {
    const { result } = renderHook(() => useSubmitDelegation())
    const delegation = createPendingDelegation({ preparedSignature: null })

    await expect(result.current.submitDelegation(delegation)).rejects.toThrow(
      'Cannot submit delegation: preparedSignature is not available',
    )
  })

  it('should call addDelegateV3 for add action with correct params', async () => {
    const { result } = renderHook(() => useSubmitDelegation())
    const delegation = createPendingDelegation({ action: 'add' })

    await act(async () => {
      await result.current.submitDelegation(delegation)
    })

    expect(utilsModule.encodeEIP1271Signature).toHaveBeenCalledWith(parentSafeAddress, preparedSignature)
    expect(mockAddDelegateV3).toHaveBeenCalledWith({
      chainId,
      createDelegateDto: {
        safe: safeAddress,
        delegate: delegateAddress,
        delegator: parentSafeAddress,
        signature: encodedSignature,
        label: PROPOSER_LABEL_PLACEHOLDER,
      },
    })
    expect(mockAddDelegateV2).not.toHaveBeenCalled()
    expect(mockDeleteDelegateV3).not.toHaveBeenCalled()
  })

  it('should call deleteDelegateV3 for remove action with correct params', async () => {
    const { result } = renderHook(() => useSubmitDelegation())
    const delegation = createPendingDelegation({ action: 'remove' })

    await act(async () => {
      await result.current.submitDelegation(delegation)
    })

    expect(utilsModule.encodeEIP1271Signature).toHaveBeenCalledWith(parentSafeAddress, preparedSignature)
    expect(mockDeleteDelegateV3).toHaveBeenCalledWith({
      chainId,
      delegateAddress,
      deleteDelegateV3Dto: {
        delegator: parentSafeAddress,
        safe: safeAddress,
        signature: encodedSignature,
      },
    })
    expect(mockDeleteDelegateV2).not.toHaveBeenCalled()
    expect(mockAddDelegateV3).not.toHaveBeenCalled()
  })

  describe('without QUEUE_SERVICE', () => {
    beforeEach(() => {
      jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(false)
    })

    it('should call addDelegateV2 for add action with correct params', async () => {
      const { result } = renderHook(() => useSubmitDelegation())
      const delegation = createPendingDelegation({ action: 'add' })

      await act(async () => {
        await result.current.submitDelegation(delegation)
      })

      expect(mockAddDelegateV2).toHaveBeenCalledWith({
        chainId,
        createDelegateDto: {
          safe: safeAddress,
          delegate: delegateAddress,
          delegator: parentSafeAddress,
          signature: encodedSignature,
          label: PROPOSER_LABEL_PLACEHOLDER,
        },
      })
      expect(mockAddDelegateV3).not.toHaveBeenCalled()
      expect(mockDeleteDelegateV2).not.toHaveBeenCalled()
    })

    it('should call deleteDelegateV2 for remove action with correct params', async () => {
      const { result } = renderHook(() => useSubmitDelegation())
      const delegation = createPendingDelegation({ action: 'remove' })

      await act(async () => {
        await result.current.submitDelegation(delegation)
      })

      expect(mockDeleteDelegateV2).toHaveBeenCalledWith({
        chainId,
        delegateAddress,
        deleteDelegateV2Dto: {
          delegator: parentSafeAddress,
          safe: safeAddress,
          signature: encodedSignature,
        },
      })
      expect(mockDeleteDelegateV3).not.toHaveBeenCalled()
      expect(mockAddDelegateV2).not.toHaveBeenCalled()
    })

    it('should set submitError when the transaction service rejects', async () => {
      const error = new Error(faker.lorem.sentence())
      mockAddDelegateV2.mockReturnValue({ unwrap: jest.fn().mockRejectedValue(error) })

      const { result } = renderHook(() => useSubmitDelegation())

      await act(async () => {
        await expect(result.current.submitDelegation(createPendingDelegation({ action: 'add' }))).rejects.toBe(error)
      })

      expect(result.current.submitError).toBe(error)
      expect(result.current.isSubmitting).toBe(false)
    })
  })

  it('should set isSubmitting to true during submission', async () => {
    let resolvePromise: () => void
    const pendingPromise = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })

    mockAddDelegateV3.mockReturnValue({ unwrap: () => pendingPromise })

    const { result } = renderHook(() => useSubmitDelegation())
    const delegation = createPendingDelegation({ action: 'add' })

    expect(result.current.isSubmitting).toBe(false)

    let submitPromise: Promise<void>
    act(() => {
      submitPromise = result.current.submitDelegation(delegation)
    })

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(true)
    })

    await act(async () => {
      resolvePromise!()
      await submitPromise
    })

    expect(result.current.isSubmitting).toBe(false)
  })

  it('should set isSubmitting to false after success', async () => {
    const { result } = renderHook(() => useSubmitDelegation())
    const delegation = createPendingDelegation({ action: 'add' })

    await act(async () => {
      await result.current.submitDelegation(delegation)
    })

    expect(result.current.isSubmitting).toBe(false)
  })

  it('should set submitError on failure', async () => {
    const error = new Error('Network error')
    mockAddDelegateV3.mockReturnValue({ unwrap: jest.fn().mockRejectedValue(error) })

    const { result } = renderHook(() => useSubmitDelegation())
    const delegation = createPendingDelegation({ action: 'add' })

    await act(async () => {
      try {
        await result.current.submitDelegation(delegation)
      } catch {
        // Expected
      }
    })

    expect(result.current.submitError).toBe(error)
  })

  it('should re-throw error after setting submitError', async () => {
    const error = new Error('Network error')
    mockAddDelegateV3.mockReturnValue({ unwrap: jest.fn().mockRejectedValue(error) })

    const { result } = renderHook(() => useSubmitDelegation())
    const delegation = createPendingDelegation({ action: 'add' })

    let thrownError: Error | undefined
    await act(async () => {
      try {
        await result.current.submitDelegation(delegation)
      } catch (e) {
        thrownError = e as Error
      }
    })

    expect(thrownError).toBeDefined()
    expect(thrownError?.message).toBe('Network error')
  })

  it('should set isSubmitting to false after failure', async () => {
    const error = new Error('Network error')
    mockAddDelegateV3.mockReturnValue({ unwrap: jest.fn().mockRejectedValue(error) })

    const { result } = renderHook(() => useSubmitDelegation())
    const delegation = createPendingDelegation({ action: 'add' })

    await act(async () => {
      try {
        await result.current.submitDelegation(delegation)
      } catch {
        // Expected
      }
    })

    expect(result.current.isSubmitting).toBe(false)
  })

  it('should clear previous submitError on new submission', async () => {
    const error = new Error('Network error')
    mockAddDelegateV3
      .mockReturnValueOnce({ unwrap: jest.fn().mockRejectedValue(error) })
      .mockReturnValueOnce({ unwrap: jest.fn().mockResolvedValue({}) })

    const { result } = renderHook(() => useSubmitDelegation())
    const delegation = createPendingDelegation({ action: 'add' })

    // First submission fails
    await act(async () => {
      try {
        await result.current.submitDelegation(delegation)
      } catch {
        // Expected
      }
    })

    expect(result.current.submitError).toBe(error)

    // Second submission succeeds and clears the error
    await act(async () => {
      await result.current.submitDelegation(delegation)
    })

    expect(result.current.submitError).toBeUndefined()
  })
})
