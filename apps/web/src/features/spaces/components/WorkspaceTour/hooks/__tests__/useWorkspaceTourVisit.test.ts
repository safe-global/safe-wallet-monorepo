import { faker } from '@faker-js/faker'
import local from '@/services/local-storage/local'
import { renderHook } from '@/tests/test-utils'
import { getWorkspaceTourSeenKey, useWorkspaceTourVisit } from '../useWorkspaceTourVisit'

const mockCurrentUser = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/users'),
  useUsersGetWithWalletsV1Query: () => ({ currentData: mockCurrentUser() }),
}))

const renderVisit = ({ spaceId, canShowTour = true }: { spaceId: string; canShowTour?: boolean }) => {
  const onFirstVisit = jest.fn()
  renderHook(() => useWorkspaceTourVisit(canShowTour, onFirstVisit), {
    routerProps: { query: { spaceId } },
  })
  return onFirstVisit
}

describe('useWorkspaceTourVisit', () => {
  const userId = faker.number.int({ min: 1, max: 1000 })
  const spaceId = faker.string.numeric(3)

  beforeEach(() => {
    window.localStorage.clear()
    mockCurrentUser.mockReturnValue({ id: userId })
  })

  it('opens the tour the first time a member opens a workspace and remembers it', () => {
    const onFirstVisit = renderVisit({ spaceId })

    expect(onFirstVisit).toHaveBeenCalledTimes(1)
    expect(local.getItem(getWorkspaceTourSeenKey(userId, spaceId))).toBe(true)
  })

  it('does not open the tour again for the same member and workspace', () => {
    local.setItem(getWorkspaceTourSeenKey(userId, spaceId), true)

    const onFirstVisit = renderVisit({ spaceId })

    expect(onFirstVisit).not.toHaveBeenCalled()
  })

  it('opens the tour for the same member in another workspace', () => {
    local.setItem(getWorkspaceTourSeenKey(userId, spaceId), true)

    const onFirstVisit = renderVisit({ spaceId: `${spaceId}1` })

    expect(onFirstVisit).toHaveBeenCalledTimes(1)
  })

  it('opens the tour for another member of the same workspace', () => {
    local.setItem(getWorkspaceTourSeenKey(userId, spaceId), true)
    mockCurrentUser.mockReturnValue({ id: userId + 1 })

    const onFirstVisit = renderVisit({ spaceId })

    expect(onFirstVisit).toHaveBeenCalledTimes(1)
  })

  it('waits until the signed-in member is known', () => {
    mockCurrentUser.mockReturnValue(undefined)

    const onFirstVisit = renderVisit({ spaceId })

    expect(onFirstVisit).not.toHaveBeenCalled()
  })

  it('leaves the visit unrecorded while the tour cannot be shown', () => {
    const onFirstVisit = renderVisit({ spaceId, canShowTour: false })

    expect(onFirstVisit).not.toHaveBeenCalled()
    expect(local.getItem(getWorkspaceTourSeenKey(userId, spaceId))).toBeNull()
  })
})
