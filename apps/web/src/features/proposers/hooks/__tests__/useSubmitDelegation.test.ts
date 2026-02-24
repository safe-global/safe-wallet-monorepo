import { renderHook, act, waitFor } from '@/tests/test-utils'
import { useSubmitDelegation } from '../useSubmitDelegation'
import * as useChainIdModule from '@/hooks/useChainId'
import * as useSafeAddressModule from '@/hooks/useSafeAddress'
import * as delegatesQueries from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import * as utilsModule from '@/features/proposers/utils/utils'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { PendingDelegation } from '@/features/proposers/types'

describe('useSubmitDelegation', () => {
  const chainId = '1'
  const safeAddress = checksumAddress(faker.finance.ethereumAddress())
  const parentSafeAddress = checksumAddress(faker.finance.ethereumAddress())
  const delegateAddress = checksumAddress(faker.finance.ethereumAddress())
  const preparedSignature = `0x${faker.string.hexadecimal({ length: 130 })}`
  const encodedSignature = `0x${faker.string.hexadecimal({ length: 200 })}`

  const createPendingDelegation = (overrides: Partial<PendingDelegation> = {}): PendingDelegation => ({
    messageHash: `0x${faker.string.hexadecimal({ length: 64 })}`,
    action: 'add',
    delegateAddress,
    delegateLabel: 'Test Proposer',
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
  let mockDeleteDelegateV2: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useChainIdModule, 'default').mockReturnValue(chainId)
    jest.spyOn(useSafeAddressModule, 'default').mockReturnValue(safeAddress)
    jest.spyOn(utilsModule, 'encodeEIP1271Signature').mockResolvedValue(encodedSignature)

    mockAddDelegateV2 = jest.fn().mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) })
    mockDeleteDelegateV2 = jest.fn().mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) })

    jest
      .spyOn(delegatesQueries, 'useDelegatesPostDelegateV2Mutation')
      .mockReturnValue([mockAddDelegateV2, { isLoading: false, reset: jest.fn() }] as unknown as ReturnType<
        typeof delegatesQueries.useDelegatesPostDelegateV2Mutation
      >)

    jest
      .spyOn(delegatesQueries, 'useDelegatesDeleteDelegateV2Mutation')
      .mockReturnValue([mockDeleteDelegateV2, { isLoading: false, reset: jest.fn() }] as unknown as ReturnType<
        typeof delegatesQueries.useDelegatesDeleteDelegateV2Mutation
      >)
  })

  it('should throw error when preparedSignature is missing', async () => {
    const { result } = renderHook(() => useSubmitDelegation())
    const delegation = createPendingDelegation({ preparedSignature: null })

    await expect(result.current.submitDelegation(delegation)).rejects.toThrow(
      'Cannot submit delegation: preparedSignature is not available',
    )
  })

  it('should call addDelegateV2 for add action with correct params', async () => {
    const { result } = renderHook(() => useSubmitDelegation())
    const delegation = createPendingDelegation({ action: 'add' })

    await act(async () => {
      await result.current.submitDelegation(delegation)
    })

    expect(utilsModule.encodeEIP1271Signature).toHaveBeenCalledWith(parentSafeAddress, preparedSignature)
    expect(mockAddDelegateV2).toHaveBeenCalledWith({
      chainId,
      createDelegateDto: {
        safe: safeAddress,
        delegate: delegateAddress,
        delegator: parentSafeAddress,
        signature: encodedSignature,
        label: 'Test Proposer',
      },
    })
    expect(mockDeleteDelegateV2).not.toHaveBeenCalled()
  })

  it('should call deleteDelegateV2 for remove action with correct params', async () => {
    const { result } = renderHook(() => useSubmitDelegation())
    const delegation = createPendingDelegation({ action: 'remove' })

    await act(async () => {
      await result.current.submitDelegation(delegation)
    })

    expect(utilsModule.encodeEIP1271Signature).toHaveBeenCalledWith(parentSafeAddress, preparedSignature)
    expect(mockDeleteDelegateV2).toHaveBeenCalledWith({
      chainId,
      delegateAddress,
      deleteDelegateV2Dto: {
        delegator: parentSafeAddress,
        safe: safeAddress,
        signature: encodedSignature,
      },
    })
    expect(mockAddDelegateV2).not.toHaveBeenCalled()
  })

  it('should set isSubmitting to true during submission', async () => {
    let resolvePromise: () => void
    const pendingPromise = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })

    mockAddDelegateV2.mockReturnValue({ unwrap: () => pendingPromise })

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
    mockAddDelegateV2.mockReturnValue({ unwrap: jest.fn().mockRejectedValue(error) })

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
    mockAddDelegateV2.mockReturnValue({ unwrap: jest.fn().mockRejectedValue(error) })

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
    mockAddDelegateV2.mockReturnValue({ unwrap: jest.fn().mockRejectedValue(error) })

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
    mockAddDelegateV2
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
