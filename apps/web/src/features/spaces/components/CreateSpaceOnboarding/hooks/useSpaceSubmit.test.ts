import { renderHook, act } from '@testing-library/react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import useSpaceSubmit from './useSpaceSubmit'

const mockPush = jest.fn()
const mockDispatch = jest.fn()
const mockCreateSpaceWithUser = jest.fn()
const mockUpdateSpace = jest.fn()

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    CREATE_SPACE: { action: 'Submit space creation', category: 'spaces' },
  },
}))

jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush }),
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
  useSpacesCreateWithUserV1Mutation: () => [mockCreateSpaceWithUser],
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
  })

  const setupHook = () => {
    const handleSubmit = (fn: (data: { name: string }) => Promise<void>) => () => fn({ name: 'My Space' })

    const { result } = renderHook(() => useSpaceSubmit(handleSubmit as never, undefined, false))
    return result
  }

  it('tracks CREATE_SPACE with spaceId sent to both GA (label) and Mixpanel (additionalParameters) after successful creation', async () => {
    mockCreateSpaceWithUser.mockResolvedValue({ data: { id: 42, name: 'My Space' } })

    const result = setupHook()

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(trackEvent).toHaveBeenCalledWith(
      { ...SPACE_EVENTS.CREATE_SPACE, label: '42' }, // GA receives spaceId as label
      { spaceId: '42' }, // Mixpanel receives spaceId as additionalParameters
    )
  })

  it('does not track CREATE_SPACE when the API returns an error', async () => {
    mockCreateSpaceWithUser.mockResolvedValue({ error: 'Something went wrong' })

    const result = setupHook()

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(trackEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: SPACE_EVENTS.CREATE_SPACE.action }),
      expect.anything(),
    )
  })
})
