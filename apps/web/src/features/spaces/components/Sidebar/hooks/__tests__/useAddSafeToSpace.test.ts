import { renderHook, act } from '@testing-library/react'
import { useAddSafeToSpace } from '../useAddSafeToSpace'

const mockAddSafeToSpace = jest.fn()
const mockDispatch = jest.fn()
const mockUseSafeInfo = jest.fn()
const mockUseCurrentChain = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesCreateV1Mutation: () => [mockAddSafeToSpace],
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => mockUseSafeInfo(),
}))

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => mockUseCurrentChain(),
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: unknown) => ({ type: 'notifications/add', payload }),
}))

describe('useAddSafeToSpace', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeInfo.mockReturnValue({ safe: { address: { value: '0xSafe' } } })
    mockUseCurrentChain.mockReturnValue({ chainId: '1' })
    mockAddSafeToSpace.mockResolvedValue({ data: {} })
  })

  it('calls the mutation with correct args and returns true on success', async () => {
    const onSpaceAdded = jest.fn()
    const spaces = [{ id: 5, uuid: 'alpha-uuid', name: 'Alpha', safeCount: 0 }]
    const { result } = renderHook(() => useAddSafeToSpace({ spaces, onSpaceAdded }))

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.addToSpace('alpha-uuid')
    })

    expect(mockAddSafeToSpace).toHaveBeenCalledWith({
      spaceId: 'alpha-uuid',
      createSpaceSafesDto: { safes: [{ chainId: '1', address: '0xSafe' }] },
    })
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'notifications/add',
        payload: {
          message: 'Successfully added Safe to workspace.',
          variant: 'success',
          groupKey: 'add-safe-to-workspace-success',
        },
      }),
    )
    expect(onSpaceAdded).toHaveBeenCalledWith({ id: 5, uuid: 'alpha-uuid', name: 'Alpha', safeCount: 0 })
    expect(success).toBe(true)
  })

  it('dispatches error notification and returns false when API returns an error', async () => {
    mockAddSafeToSpace.mockResolvedValue({ error: new Error('API error') })
    const spaces = [{ id: 5, uuid: 'alpha-uuid', name: 'Alpha', safeCount: 0 }]
    const { result } = renderHook(() => useAddSafeToSpace({ spaces }))

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.addToSpace('alpha-uuid')
    })

    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'notifications/add' }))
    expect(success).toBe(false)
  })

  it('dispatches an error notification with the correct message content when API fails', async () => {
    mockAddSafeToSpace.mockResolvedValue({ error: new Error('API error') })
    const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

    await act(async () => {
      await result.current.addToSpace('any-uuid')
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'notifications/add',
        payload: expect.objectContaining({
          message: 'Failed to add Safe to workspace. API error',
          variant: 'error',
          groupKey: 'add-safe-to-workspace-error',
        }),
      }),
    )
  })

  it('returns false without calling the mutation when chain is missing', async () => {
    mockUseCurrentChain.mockReturnValue(null)
    const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.addToSpace('any-uuid')
    })

    expect(mockAddSafeToSpace).not.toHaveBeenCalled()
    expect(success).toBe(false)
  })

  it('returns false without calling the mutation when safe address is missing', async () => {
    mockUseSafeInfo.mockReturnValue({ safe: { address: { value: '' } } })
    const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.addToSpace('any-uuid')
    })

    expect(mockAddSafeToSpace).not.toHaveBeenCalled()
    expect(success).toBe(false)
  })

  it('sets loadingSpaceId during the request and clears it on completion', async () => {
    let resolveRequest!: (value: { data: object }) => void
    mockAddSafeToSpace.mockImplementation(
      () =>
        new Promise<{ data: object }>((resolve) => {
          resolveRequest = resolve
        }),
    )
    const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

    act(() => {
      void result.current.addToSpace('loading-uuid')
    })

    expect(result.current.loadingSpaceId).toBe('loading-uuid')

    await act(async () => {
      resolveRequest({ data: {} })
      await Promise.resolve()
    })

    expect(result.current.loadingSpaceId).toBe(null)
  })

  it('catches exceptions thrown by the mutation and shows error notification', async () => {
    const error = new Error('Network failure')
    mockAddSafeToSpace.mockRejectedValue(error)
    const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.addToSpace('any-uuid')
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'notifications/add',
        payload: expect.objectContaining({
          message: 'Failed to add Safe to workspace. Network failure',
          variant: 'error',
          groupKey: 'add-safe-to-workspace-error',
        }),
      }),
    )
    expect(success).toBe(false)
  })

  it('clears loadingSpaceId even when mutation throws an exception', async () => {
    mockAddSafeToSpace.mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

    await act(async () => {
      await result.current.addToSpace('any-uuid')
    })

    expect(result.current.loadingSpaceId).toBe(null)
  })

  it('extracts the message from a FetchBaseQueryError data payload', async () => {
    mockAddSafeToSpace.mockResolvedValue({
      error: { status: 409, data: { message: 'Safe already exists in this workspace' } },
    })
    const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

    await act(async () => {
      await result.current.addToSpace('any-uuid')
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          message: 'Failed to add Safe to workspace. Safe already exists in this workspace',
          variant: 'error',
        }),
      }),
    )
  })

  it('shows a friendly network message instead of the raw fetch error', async () => {
    mockAddSafeToSpace.mockResolvedValue({
      error: { status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' },
    })
    const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

    await act(async () => {
      await result.current.addToSpace('any-uuid')
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          message:
            "Failed to add Safe to workspace. Couldn't connect to the server. Please check your connection and try again.",
          variant: 'error',
        }),
      }),
    )
  })

  it('does not call onSpaceAdded when the spaceId is not in the spaces list', async () => {
    const onSpaceAdded = jest.fn()
    const spaces = [{ id: 10, uuid: 'other-uuid', name: 'Other', safeCount: 0 }]
    const { result } = renderHook(() => useAddSafeToSpace({ spaces, onSpaceAdded }))

    await act(async () => {
      await result.current.addToSpace('missing-uuid')
    })

    expect(onSpaceAdded).not.toHaveBeenCalled()
  })

  it('does not call onSpaceAdded when the API returns an error', async () => {
    mockAddSafeToSpace.mockResolvedValue({ error: { status: 500, data: {} } })
    const onSpaceAdded = jest.fn()
    const spaces = [{ id: 5, uuid: 'alpha-uuid', name: 'Alpha', safeCount: 0 }]
    const { result } = renderHook(() => useAddSafeToSpace({ spaces, onSpaceAdded }))

    await act(async () => {
      await result.current.addToSpace('alpha-uuid')
    })

    expect(onSpaceAdded).not.toHaveBeenCalled()
  })

  describe('error path testing', () => {
    it('returns false when chainId is empty string', async () => {
      mockUseCurrentChain.mockReturnValue({ chainId: '' })
      const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

      let success: boolean | undefined
      await act(async () => {
        success = await result.current.addToSpace('any-uuid')
      })

      expect(mockAddSafeToSpace).not.toHaveBeenCalled()
      expect(success).toBe(false)
    })

    it('returns false when safe.address.value is null', async () => {
      mockUseSafeInfo.mockReturnValue({ safe: { address: { value: null } } })
      const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

      let success: boolean | undefined
      await act(async () => {
        success = await result.current.addToSpace('any-uuid')
      })

      expect(mockAddSafeToSpace).not.toHaveBeenCalled()
      expect(success).toBe(false)
    })

    it('handles unknown error type without message', async () => {
      mockAddSafeToSpace.mockRejectedValue({ notAnError: true })
      const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

      await act(async () => {
        await result.current.addToSpace('any-uuid')
      })

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'notifications/add',
          payload: expect.objectContaining({
            message: 'Failed to add Safe to workspace. ',
            variant: 'error',
          }),
        }),
      )
    })
  })
})
