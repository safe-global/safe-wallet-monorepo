import { act, renderHook } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/store'
import { useUpdateSpace } from '../useUpdateSpace'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const mockUnwrap = jest.fn()
const mockUpdateSpace = jest.fn(() => ({ unwrap: mockUnwrap }))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesUpdateV1Mutation: jest.fn(() => [mockUpdateSpace]),
}))

const mockSpace: GetSpaceResponse = { id: 42, name: 'My Workspace', members: [], safeCount: 0 }

const renderWithStore = () => {
  const store = makeStore(undefined, { skipBroadcast: true })
  const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>
  return { store, ...renderHook(() => useUpdateSpace(mockSpace), { wrapper }) }
}

describe('useUpdateSpace', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUnwrap.mockReset()
  })

  it('returns handleUpdate and no initial error', () => {
    const { result } = renderWithStore()
    expect(typeof result.current.handleUpdate).toBe('function')
    expect(result.current.error).toBeUndefined()
  })

  it('calls the mutation with the space id and new name', async () => {
    mockUnwrap.mockResolvedValue({})
    const { result } = renderWithStore()

    await act(async () => {
      await result.current.handleUpdate({ name: 'Renamed' })
    })

    expect(mockUpdateSpace).toHaveBeenCalledWith({ id: 42, updateSpaceDto: { name: 'Renamed' } })
  })

  it('dispatches a success notification after a successful update', async () => {
    mockUnwrap.mockResolvedValue({})
    const { result, store } = renderWithStore()

    await act(async () => {
      await result.current.handleUpdate({ name: 'Renamed' })
    })

    const notifications = store.getState().notifications
    expect(notifications.length).toBeGreaterThan(0)
    const last = notifications[notifications.length - 1]
    expect(last.message).toBe('Updated workspace name')
    expect(last.variant).toBe('success')
    expect(last.groupKey).toBe('space-update-name')
  })

  it('sets an error message when the mutation rejects', async () => {
    mockUnwrap.mockRejectedValue(new Error('network'))
    const { result } = renderWithStore()

    await act(async () => {
      await result.current.handleUpdate({ name: 'Renamed' })
    })

    expect(result.current.error).toBe('Error updating the workspace. Please try again.')
  })

  it('clears a previous error before a new attempt', async () => {
    mockUnwrap.mockRejectedValueOnce(new Error('first')).mockResolvedValueOnce({})
    const { result } = renderWithStore()

    await act(async () => {
      await result.current.handleUpdate({ name: 'A' })
    })
    expect(result.current.error).toBeDefined()

    await act(async () => {
      await result.current.handleUpdate({ name: 'B' })
    })
    expect(result.current.error).toBeUndefined()
  })

  it('does nothing when space is undefined', async () => {
    const store = makeStore(undefined, { skipBroadcast: true })
    const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>
    const { result } = renderHook(() => useUpdateSpace(undefined), { wrapper })

    await act(async () => {
      await result.current.handleUpdate({ name: 'X' })
    })

    expect(mockUpdateSpace).not.toHaveBeenCalled()
  })
})
