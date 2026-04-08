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
    const spaces = [{ id: 5, name: 'Alpha' }]
    const { result } = renderHook(() => useAddSafeToSpace({ spaces, onSpaceAdded }))

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.addToSpace(5)
    })

    expect(mockAddSafeToSpace).toHaveBeenCalledWith({
      spaceId: 5,
      createSpaceSafesDto: { safes: [{ chainId: '1', address: '0xSafe' }] },
    })
    expect(onSpaceAdded).toHaveBeenCalledWith({ id: 5, name: 'Alpha' })
    expect(success).toBe(true)
  })

  it('dispatches error notification and returns false when API returns an error', async () => {
    mockAddSafeToSpace.mockResolvedValue({ error: new Error('API error') })
    const spaces = [{ id: 5, name: 'Alpha' }]
    const { result } = renderHook(() => useAddSafeToSpace({ spaces }))

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.addToSpace(5)
    })

    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'notifications/add' }))
    expect(success).toBe(false)
  })

  it('returns false without calling the mutation when chain is missing', async () => {
    mockUseCurrentChain.mockReturnValue(null)
    const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.addToSpace(1)
    })

    expect(mockAddSafeToSpace).not.toHaveBeenCalled()
    expect(success).toBe(false)
  })

  it('returns false without calling the mutation when safe address is missing', async () => {
    mockUseSafeInfo.mockReturnValue({ safe: { address: { value: '' } } })
    const { result } = renderHook(() => useAddSafeToSpace({ spaces: [] }))

    let success: boolean | undefined
    await act(async () => {
      success = await result.current.addToSpace(1)
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
      void result.current.addToSpace(7)
    })

    expect(result.current.loadingSpaceId).toBe(7)

    await act(async () => {
      resolveRequest({ data: {} })
    })

    expect(result.current.loadingSpaceId).toBe(null)
  })
})
