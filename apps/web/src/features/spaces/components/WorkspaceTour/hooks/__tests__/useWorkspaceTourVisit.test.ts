import { faker } from '@faker-js/faker'
import local from '@/services/local-storage/local'
import { act, renderHook } from '@/tests/test-utils'
import { WORKSPACE_TOUR_SEEN_KEY, useWorkspaceTourVisit } from '../useWorkspaceTourVisit'

const renderVisit = ({ spaceId, canShowTour = true }: { spaceId: string; canShowTour?: boolean }) => {
  const onFirstVisit = jest.fn()
  const { result } = renderHook(() => useWorkspaceTourVisit(canShowTour, onFirstVisit), {
    routerProps: { query: { spaceId } },
  })
  return { onFirstVisit, markSeen: () => act(() => result.current.markSeen()) }
}

describe('useWorkspaceTourVisit', () => {
  const spaceId = faker.string.numeric(3)

  beforeEach(() => {
    window.localStorage.clear()
  })

  it('opens the tour the first time a member opens a workspace, and records the visit only once it is shown', () => {
    const { onFirstVisit, markSeen } = renderVisit({ spaceId })

    expect(onFirstVisit).toHaveBeenCalledTimes(1)
    expect(local.getItem(WORKSPACE_TOUR_SEEN_KEY)).toBeNull()

    markSeen()

    expect(local.getItem(WORKSPACE_TOUR_SEEN_KEY)).toBe(true)
  })

  it('does not open the tour again in the same browser', () => {
    local.setItem(WORKSPACE_TOUR_SEEN_KEY, true)

    const { onFirstVisit } = renderVisit({ spaceId })

    expect(onFirstVisit).not.toHaveBeenCalled()
  })

  it('does not open the tour again when the member opens another workspace', () => {
    local.setItem(WORKSPACE_TOUR_SEEN_KEY, true)

    const { onFirstVisit } = renderVisit({ spaceId: `${spaceId}1` })

    expect(onFirstVisit).not.toHaveBeenCalled()
  })

  it('leaves the visit unrecorded while the tour cannot be shown', () => {
    const { onFirstVisit } = renderVisit({ spaceId, canShowTour: false })

    expect(onFirstVisit).not.toHaveBeenCalled()
    expect(local.getItem(WORKSPACE_TOUR_SEEN_KEY)).toBeNull()
  })
})
