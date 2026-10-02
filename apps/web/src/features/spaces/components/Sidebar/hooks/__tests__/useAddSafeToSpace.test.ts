import { renderHook, act } from '@testing-library/react'
import { ELEVATION_REQUIRED_ERROR } from '@/features/oidc-auth/utils/elevation'
import { Errors } from '@/services/exceptions'
import { useAddSafeToSpace } from '../useAddSafeToSpace'

const mockAddSafeToSpace = jest.fn()
const mockDispatch = jest.fn()
const mockUseSafeInfo = jest.fn()
const mockUseCurrentChain = jest.fn()
const mockLogError = jest.fn()
const mockRouter = { pathname: '/home', query: {} as Record<string, string | string[]>, replace: jest.fn() }

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesCreateV1Mutation: () => [mockAddSafeToSpace],
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/entitlements', () => ({
  cgwApi: { util: { invalidateTags: (tags: string[]) => ({ type: 'cgwApi/invalidateTags', payload: tags }) } },
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

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: (...args: unknown[]) => mockLogError(...args),
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
    const { result } = renderHook(() => useAddSafeToSpace())

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
    expect(success).toBe(true)
  })

  it('refreshes the entitlements of all Workspaces when the seats of the plan are spent', async () => {
    mockAddSafeToSpace.mockResolvedValue({
      error: { status: 402, data: { code: 'QUOTA_EXCEEDED', feature: 'safe_seats', quota: 3, used: 3 } },
    })
    const { result } = renderHook(() => useAddSafeToSpace())

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.addToSpace('alpha-uuid')
    })

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'cgwApi/invalidateTags', payload: ['entitlements'] })
    expect(success).toBe(false)
  })

  it('does not refresh the entitlements for an error that is not about seats', async () => {
    mockAddSafeToSpace.mockResolvedValue({ error: { status: 500, data: { message: 'Server error' } } })
    const { result } = renderHook(() => useAddSafeToSpace())

    await act(async () => {
      await result.current.addToSpace('alpha-uuid')
    })

    expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'cgwApi/invalidateTags' }))
  })

  it('dispatches error notification and returns false when API returns an error', async () => {
    mockAddSafeToSpace.mockResolvedValue({ error: new Error('API error') })
    const { result } = renderHook(() => useAddSafeToSpace())

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.addToSpace('alpha-uuid')
    })

    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'notifications/add' }))
    expect(success).toBe(false)
  })

  it('dispatches an error notification with the correct message content when API fails', async () => {
    mockAddSafeToSpace.mockResolvedValue({ error: new Error('API error') })
    const { result } = renderHook(() => useAddSafeToSpace())

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
    const { result } = renderHook(() => useAddSafeToSpace())

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.addToSpace('any-uuid')
    })

    expect(mockAddSafeToSpace).not.toHaveBeenCalled()
    expect(success).toBe(false)
  })

  it('returns false without calling the mutation when safe address is missing', async () => {
    mockUseSafeInfo.mockReturnValue({ safe: { address: { value: '' } } })
    const { result } = renderHook(() => useAddSafeToSpace())

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
    const { result } = renderHook(() => useAddSafeToSpace())

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

  it('logs an exception thrown by the mutation', async () => {
    const error = new Error('Network failure')
    mockAddSafeToSpace.mockRejectedValue(error)
    const { result } = renderHook(() => useAddSafeToSpace())

    await act(async () => {
      await result.current.addToSpace('any-uuid')
    })

    expect(mockLogError).toHaveBeenCalledWith(Errors._651, error)
  })

  it('catches exceptions thrown by the mutation and shows error notification', async () => {
    const error = new Error('Network failure')
    mockAddSafeToSpace.mockRejectedValue(error)
    const { result } = renderHook(() => useAddSafeToSpace())

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
    const { result } = renderHook(() => useAddSafeToSpace())

    await act(async () => {
      await result.current.addToSpace('any-uuid')
    })

    expect(result.current.loadingSpaceId).toBe(null)
  })

  it('extracts the message from a FetchBaseQueryError data payload', async () => {
    mockAddSafeToSpace.mockResolvedValue({
      error: { status: 409, data: { message: 'Safe already exists in this Workspace' } },
    })
    const { result } = renderHook(() => useAddSafeToSpace())

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
    const { result } = renderHook(() => useAddSafeToSpace())

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

  describe('error path testing', () => {
    it('returns false when chainId is empty string', async () => {
      mockUseCurrentChain.mockReturnValue({ chainId: '' })
      const { result } = renderHook(() => useAddSafeToSpace())

      let success: boolean | undefined
      await act(async () => {
        success = await result.current.addToSpace('any-uuid')
      })

      expect(mockAddSafeToSpace).not.toHaveBeenCalled()
      expect(success).toBe(false)
    })

    it('returns false when safe.address.value is null', async () => {
      mockUseSafeInfo.mockReturnValue({ safe: { address: { value: null } } })
      const { result } = renderHook(() => useAddSafeToSpace())

      let success: boolean | undefined
      await act(async () => {
        success = await result.current.addToSpace('any-uuid')
      })

      expect(mockAddSafeToSpace).not.toHaveBeenCalled()
      expect(success).toBe(false)
    })

    it('handles unknown error type without message', async () => {
      mockAddSafeToSpace.mockRejectedValue({ notAnError: true })
      const { result } = renderHook(() => useAddSafeToSpace())

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

  it('returns false without an error notification when the user cancels the verification', async () => {
    mockAddSafeToSpace.mockResolvedValue({ error: { status: 403, data: { message: ELEVATION_REQUIRED_ERROR } } })
    const { result } = renderHook(() => useAddSafeToSpace())

    let added: boolean | undefined
    await act(async () => {
      added = await result.current.addToSpace('space-1')
    })

    expect(added).toBe(false)
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  describe('Workspace in the URL', () => {
    const alphaUuid = '0b7a1c2e-4f3d-4e5a-9b6c-7d8e9f0a1b2c'

    const addToAlpha = async () => {
      const { result } = renderHook(() => useAddSafeToSpace())
      await act(async () => {
        await result.current.addToSpace(alphaUuid)
      })
    }

    it('opens the current Safe page in the Workspace once the Safe is added', async () => {
      mockRouter.pathname = '/transactions/history'

      await addToAlpha()

      expect(mockRouter.replace).toHaveBeenCalledWith(
        { pathname: '/transactions/history', query: { safe: 'sep:0xSafe', spaceId: alphaUuid } },
        undefined,
        { shallow: true },
      )
    })

    it('replaces a spaceId already in the URL', async () => {
      mockRouter.query = { safe: 'sep:0xSafe', spaceId: '42' }

      await addToAlpha()

      expect(mockRouter.replace).toHaveBeenCalledWith(
        { pathname: '/home', query: { safe: 'sep:0xSafe', spaceId: alphaUuid } },
        undefined,
        { shallow: true },
      )
    })

    it.each([
      ['the API returns an error', () => mockAddSafeToSpace.mockResolvedValue({ error: { status: 500, data: {} } })],
      ['the mutation throws', () => mockAddSafeToSpace.mockRejectedValue(new Error('Network error'))],
      [
        'the user cancels the verification',
        () =>
          mockAddSafeToSpace.mockResolvedValue({ error: { status: 403, data: { message: ELEVATION_REQUIRED_ERROR } } }),
      ],
    ])('keeps the URL when %s', async (_, arrange) => {
      arrange()

      await addToAlpha()

      expect(mockRouter.replace).not.toHaveBeenCalled()
    })
  })
})
