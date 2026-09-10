import { act, renderHook } from '@testing-library/react'
import { useCreateTrialWorkspace } from '../useCreateTrialWorkspace'

const mockCreateSpace = jest.fn()
const mockDispatch = jest.fn()
const mockTrackEvent = jest.fn()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesCreateV1Mutation: () => [mockCreateSpace, { isLoading: false }],
}))
jest.mock('@/store', () => ({ useAppDispatch: () => mockDispatch }))
jest.mock('@/store/authSlice', () => ({
  setLastUsedSpace: (id: string) => ({ type: 'setLastUsedSpace', payload: id }),
}))
jest.mock('@/services/analytics', () => ({ trackEvent: (...args: unknown[]) => mockTrackEvent(...args) }))
jest.mock('../../utils/randomWorkspaceName', () => ({ randomWorkspaceName: () => 'Brave Workspace' }))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'

describe('useCreateTrialWorkspace', () => {
  beforeEach(() => jest.clearAllMocks())

  it('creates a placeholder Workspace, remembers it and exposes its id for the trial modal', async () => {
    mockCreateSpace.mockResolvedValue({ data: { uuid: SPACE_ID } })
    const { result } = renderHook(() => useCreateTrialWorkspace())

    await act(() => result.current.createTrialWorkspace())

    expect(mockCreateSpace).toHaveBeenCalledWith({ createSpaceDto: { name: 'Brave Workspace' } })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'setLastUsedSpace', payload: SPACE_ID })
    expect(mockTrackEvent).toHaveBeenCalledWith(expect.objectContaining({ label: SPACE_ID }), {
      workspace_id: SPACE_ID,
    })
    expect(result.current.spaceId).toBe(SPACE_ID)
    expect(result.current.error).toBeUndefined()

    act(() => result.current.reset())
    expect(result.current.spaceId).toBeUndefined()
  })

  it('surfaces a creation error and keeps no Workspace id', async () => {
    mockCreateSpace.mockResolvedValue({ error: { status: 500, data: { message: 'boom' } } })
    const { result } = renderHook(() => useCreateTrialWorkspace())

    await act(() => result.current.createTrialWorkspace())

    expect(result.current.spaceId).toBeUndefined()
    expect(result.current.error).toBeTruthy()
    expect(mockDispatch).not.toHaveBeenCalled()
  })
})
