import { renderHook, act } from '@testing-library/react'
import { stepUpReturnUrlCleared, stepUpReturnUrlSet } from '@/features/oidc-auth/store'
import { ELEVATION_REQUIRED_ERROR } from '@/features/oidc-auth/utils/elevation'
import { useAddSafeToSpace } from '../useAddSafeToSpace'

const mockAddSafeToSpace = jest.fn()
const mockDispatch = jest.fn()
const mockUseSafeInfo = jest.fn()
const mockUseCurrentChain = jest.fn()
const mockRouter = { pathname: '/home', query: {} as Record<string, string | string[]> }

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}))

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
    mockRouter.pathname = '/home'
    mockRouter.query = { safe: 'sep:0xSafe' }
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
          message: 'Successfully added Safe to Workspace.',
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
          message: 'Failed to add Safe to Workspace. API error',
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
          message: 'Failed to add Safe to Workspace. Network failure',
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
      error: { status: 409, data: { message: 'Safe already exists in this Workspace' } },
    })
    const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

    await act(async () => {
      await result.current.addToSpace('any-uuid')
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          message: 'Failed to add Safe to Workspace. Safe already exists in this Workspace',
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
            "Failed to add Safe to Workspace. Couldn't connect to the server. Please check your connection and try again.",
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
            message: 'Failed to add Safe to Workspace. ',
            variant: 'error',
          }),
        }),
      )
    })
  })

  describe('step-up return URL', () => {
    const alphaUuid = '0b7a1c2e-4f3d-4e5a-9b6c-7d8e9f0a1b2c'
    const alphaReturnUrl = `/home?safe=sep%3A0xSafe&spaceId=${alphaUuid}`

    it('returns to the current Safe page in the chosen Workspace and keeps it when a step-up is required', async () => {
      mockRouter.pathname = '/transactions/history'
      mockAddSafeToSpace.mockResolvedValue({ error: { status: 403, data: { message: ELEVATION_REQUIRED_ERROR } } })
      const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

      await act(async () => {
        await result.current.addToSpace(alphaUuid)
      })

      const expectedUrl = `/transactions/history?safe=sep%3A0xSafe&spaceId=${alphaUuid}`
      expect(mockDispatch).toHaveBeenCalledWith(stepUpReturnUrlSet(expectedUrl))
      expect(mockDispatch).not.toHaveBeenCalledWith(stepUpReturnUrlCleared(expectedUrl))
      expect(mockDispatch.mock.invocationCallOrder[0]).toBeLessThan(mockAddSafeToSpace.mock.invocationCallOrder[0])
    })

    it('replaces a spaceId already in the URL', async () => {
      mockRouter.query = { safe: 'sep:0xSafe', spaceId: '42' }
      const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

      await act(async () => {
        await result.current.addToSpace(alphaUuid)
      })

      expect(mockDispatch).toHaveBeenCalledWith(stepUpReturnUrlSet(alphaReturnUrl))
    })

    it('clears the return URL when the Safe is added', async () => {
      const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

      await act(async () => {
        await result.current.addToSpace(alphaUuid)
      })

      expect(mockDispatch).toHaveBeenCalledWith(stepUpReturnUrlSet(alphaReturnUrl))
      expect(mockDispatch).toHaveBeenCalledWith(stepUpReturnUrlCleared(alphaReturnUrl))
    })

    it('clears the return URL when the API returns an error', async () => {
      mockAddSafeToSpace.mockResolvedValue({ error: { status: 500, data: {} } })
      const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

      await act(async () => {
        await result.current.addToSpace(alphaUuid)
      })

      expect(mockDispatch).toHaveBeenCalledWith(stepUpReturnUrlCleared(alphaReturnUrl))
    })

    it('clears the return URL when the mutation throws', async () => {
      mockAddSafeToSpace.mockRejectedValue(new Error('Network error'))
      const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

      await act(async () => {
        await result.current.addToSpace(alphaUuid)
      })

      expect(mockDispatch).toHaveBeenCalledWith(stepUpReturnUrlCleared(alphaReturnUrl))
    })

    it('does not set a return URL when the Safe cannot be added', async () => {
      mockUseCurrentChain.mockReturnValue(null)
      const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

      await act(async () => {
        await result.current.addToSpace(alphaUuid)
      })

      expect(mockDispatch).not.toHaveBeenCalled()
    })
  })
})
