import { renderHook, act } from '@testing-library/react'
import { useAddSafeToSpace } from '../useAddSafeToSpace'

const mockAddSafeToSpace = jest.fn()
const mockDispatch = jest.fn()
const mockRefreshSpaceEntitlements = jest.fn()
const mockGetSeatLimitMessage = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesCreateV1Mutation: () => [mockAddSafeToSpace],
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safe: { address: { value: '0xSafe' } } }),
}))

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => ({ chainId: '1' }),
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: unknown) => ({ type: 'notifications/add', payload }),
}))

jest.mock('@/services/entitlements/refreshSpaceEntitlements', () => ({
  refreshSpaceEntitlements: (...args: unknown[]) => mockRefreshSpaceEntitlements(...args),
}))

jest.mock('../../../../utils/seatLimitError', () => ({
  getSeatLimitMessage: (error: unknown) => mockGetSeatLimitMessage(error),
}))

describe('useAddSafeToSpace seat limit', () => {
  const seatError = { status: 403, data: { message: 'Quota exceeded' } }

  beforeEach(() => {
    jest.clearAllMocks()
    mockAddSafeToSpace.mockResolvedValue({ error: seatError })
  })

  it('words a spent seat allowance as such and re-reads the Workspace entitlements', async () => {
    mockGetSeatLimitMessage.mockReturnValue('Your plan covers 2 Safe accounts.')
    const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.addToSpace('alpha-uuid')
    })

    expect(mockGetSeatLimitMessage).toHaveBeenCalledWith(seatError)
    expect(mockRefreshSpaceEntitlements).toHaveBeenCalledWith(mockDispatch, 'alpha-uuid')
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          message: 'Failed to add Safe to Workspace. Your plan covers 2 Safe accounts.',
          variant: 'error',
        }),
      }),
    )
    expect(success).toBe(false)
  })

  it('leaves the entitlements alone and shows the API message for any other error', async () => {
    mockGetSeatLimitMessage.mockReturnValue(undefined)
    const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

    await act(async () => {
      await result.current.addToSpace('alpha-uuid')
    })

    expect(mockRefreshSpaceEntitlements).not.toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ message: 'Failed to add Safe to Workspace. Quota exceeded' }),
      }),
    )
  })
})
