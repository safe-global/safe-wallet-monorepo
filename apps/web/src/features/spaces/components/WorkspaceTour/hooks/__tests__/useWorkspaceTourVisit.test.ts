import { faker } from '@faker-js/faker'
import local from '@/services/local-storage/local'
import { act, renderHook } from '@/tests/test-utils'
import { getWorkspaceTourSeenKey, useWorkspaceTourVisit } from '../useWorkspaceTourVisit'

const mockCurrentUser = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/users'),
  useUsersGetWithWalletsV1Query: () => ({ currentData: mockCurrentUser() }),
}))

const renderVisit = ({ spaceId, canShowTour = true }: { spaceId: string; canShowTour?: boolean }) => {
  const onFirstVisit = jest.fn()
  const { result } = renderHook(() => useWorkspaceTourVisit(canShowTour, onFirstVisit), {
    routerProps: { query: { spaceId } },
  })
  return { onFirstVisit, markSeen: () => act(() => result.current.markSeen()) }
}

describe('useWorkspaceTourVisit', () => {
  const userId = faker.number.int({ min: 1, max: 1000 })
  const spaceId = faker.string.numeric(3)

  beforeEach(() => {
    window.localStorage.clear()
    mockCurrentUser.mockReturnValue({ id: userId })
  })

  it('opens the tour the first time a member opens a workspace, and records the visit only once it is shown', () => {
    const { onFirstVisit, markSeen } = renderVisit({ spaceId })

    expect(onFirstVisit).toHaveBeenCalledTimes(1)
    expect(local.getItem(getWorkspaceTourSeenKey(userId))).toBeNull()

    markSeen()

    expect(local.getItem(getWorkspaceTourSeenKey(userId))).toBe(true)
  })

  it('does not open the tour again for the same member', () => {
    local.setItem(getWorkspaceTourSeenKey(userId), true)

    const { onFirstVisit } = renderVisit({ spaceId })

    expect(onFirstVisit).not.toHaveBeenCalled()
  })

  it('does not open the tour again when the member opens another workspace', () => {
    local.setItem(getWorkspaceTourSeenKey(userId), true)

    const { onFirstVisit } = renderVisit({ spaceId: `${spaceId}1` })

    expect(onFirstVisit).not.toHaveBeenCalled()
  })

  it('opens the tour for another member signed in on the same browser', () => {
    local.setItem(getWorkspaceTourSeenKey(userId), true)
    mockCurrentUser.mockReturnValue({ id: userId + 1 })

    const { onFirstVisit } = renderVisit({ spaceId })

    expect(onFirstVisit).toHaveBeenCalledTimes(1)
  })

  it('waits until the signed-in member is known', () => {
    mockCurrentUser.mockReturnValue(undefined)

    const { onFirstVisit } = renderVisit({ spaceId })

    expect(onFirstVisit).not.toHaveBeenCalled()
  })

  it('leaves the visit unrecorded while the tour cannot be shown', () => {
    const { onFirstVisit } = renderVisit({ spaceId, canShowTour: false })

    expect(onFirstVisit).not.toHaveBeenCalled()
    expect(local.getItem(getWorkspaceTourSeenKey(userId))).toBeNull()
  })
})
