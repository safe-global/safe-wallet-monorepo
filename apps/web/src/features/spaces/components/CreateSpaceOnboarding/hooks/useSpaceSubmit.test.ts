import { renderHook, act } from '@testing-library/react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import useSpaceSubmit from './useSpaceSubmit'

const mockPush = jest.fn()
const mockDispatch = jest.fn()
const mockCreateSpaceWithUser = jest.fn()
const mockUpdateSpace = jest.fn()

let mockRouterQuery: Record<string, string> = {}

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    WORKSPACE_CREATED: { action: 'Workspace created', category: 'spaces' },
  },
}))

jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush, query: mockRouterQuery }),
}))

jest.mock('@/hooks/useSafeAddressFromUrl', () => ({
  useSafeQueryParam: () => {
    const safe = mockRouterQuery.safe
    return typeof safe === 'string' ? safe : ''
  },
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/store/authSlice', () => ({
  setLastUsedSpace: (id: string) => ({ type: 'auth/setLastUsedSpace', payload: id }),
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: unknown) => ({ type: 'notifications/show', payload }),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesCreateV1Mutation: () => [mockCreateSpaceWithUser],
  useSpacesUpdateV1Mutation: () => [mockUpdateSpace],
}))

jest.mock('@/utils/rtkQuery', () => ({
  getRtkQueryErrorMessage: (e: unknown) => String(e),
}))

jest.mock('@/config/routes', () => ({
  AppRoutes: { welcome: { selectSafes: '/welcome' } },
}))

describe('useSpaceSubmit tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouterQuery = {}
  })

  const setupHook = (spaceId?: string, isEditMode = false) => {
    const handleSubmit = (fn: (data: { name: string }) => Promise<void>) => () => fn({ name: 'My Space' })

    const { result } = renderHook(() => useSpaceSubmit(handleSubmit as never, spaceId, isEditMode))
    return result
  }

  it('tracks WORKSPACE_CREATED with spaceId sent to both GA (label) and Mixpanel (additionalParameters) after successful creation', async () => {
    mockCreateSpaceWithUser.mockResolvedValue({ data: { id: 42, name: 'My Space' } })

    const result = setupHook(undefined, false)

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(trackEvent).toHaveBeenCalledWith({ ...SPACE_EVENTS.WORKSPACE_CREATED, label: '42' }, { workspace_id: '42' })
  })

  it('does not track WORKSPACE_CREATED when the API returns an error', async () => {
    mockCreateSpaceWithUser.mockResolvedValue({ error: 'Something went wrong' })

    const result = setupHook(undefined, false)

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(trackEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: SPACE_EVENTS.WORKSPACE_CREATED.action }),
      expect.anything(),
    )
  })
})

describe('useSpaceSubmit routing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouterQuery = {}
  })

  const setupHook = (spaceId?: string, isEditMode = false) => {
    const handleSubmit = (fn: (data: { name: string }) => Promise<void>) => () => fn({ name: 'My Space' })
    const { result } = renderHook(() => useSpaceSubmit(handleSubmit as never, spaceId, isEditMode))
    return result
  }

  it('navigates to selectSafes without ?safe= when not in URL after creating a space', async () => {
    mockCreateSpaceWithUser.mockResolvedValue({ data: { id: 7, name: 'My Space' } })

    const result = setupHook()

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/welcome', query: { spaceId: '7' } })
  })

  it('forwards ?safe= to selectSafes route after creating a space', async () => {
    mockRouterQuery = { safe: '1:0xdeadbeef' }
    mockCreateSpaceWithUser.mockResolvedValue({ data: { id: 7, name: 'My Space' } })

    const result = setupHook()

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/welcome',
      query: { spaceId: '7', safe: '1:0xdeadbeef' },
    })
  })

  it('navigates to selectSafes without ?safe= when not in URL after editing a space', async () => {
    mockUpdateSpace.mockResolvedValue({ data: {} })

    const result = setupHook('42', true)

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/welcome', query: { spaceId: '42' } })
  })

  it('forwards ?safe= to selectSafes route after editing a space', async () => {
    mockRouterQuery = { safe: '5:0xcafe' }
    mockUpdateSpace.mockResolvedValue({ data: {} })

    const result = setupHook('42', true)

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/welcome',
      query: { spaceId: '42', safe: '5:0xcafe' },
    })
  })

  it('forwards a sanitised ?next= to selectSafes after creating a space', async () => {
    mockRouterQuery = { next: '/balances' }
    mockCreateSpaceWithUser.mockResolvedValue({ data: { id: 7, name: 'My Space' } })

    const result = setupHook()

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/welcome',
      query: { spaceId: '7', next: '/balances' },
    })
  })

  it('drops an unsafe (protocol-relative) ?next= after creating a space', async () => {
    mockRouterQuery = { next: '//evil.com/x' }
    mockCreateSpaceWithUser.mockResolvedValue({ data: { id: 7, name: 'My Space' } })

    const result = setupHook()

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/welcome',
      query: { spaceId: '7' },
    })
  })
})
