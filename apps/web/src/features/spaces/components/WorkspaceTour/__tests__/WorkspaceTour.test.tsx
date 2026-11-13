import { faker } from '@faker-js/faker'
import local from '@/services/local-storage/local'
import { act, fireEvent, render, renderHook, screen } from '@/tests/test-utils'
import WorkspaceTour from '../index'
import WorkspaceTourSection from '../WorkspaceTourSection'
import { useWorkspaceTourOpen } from '../hooks/useWorkspaceTourOpen'
import { getWorkspaceTourSeenKey } from '../hooks/useWorkspaceTourVisit'

const mockIsTourFlagOn = jest.fn()
const mockIsBelowMd = jest.fn()
const mockIsSpaceRoute = jest.fn()
const mockIsActiveMember = jest.fn()

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [] })),
  useHasFeature: () => mockIsTourFlagOn(),
}))

jest.mock('@/hooks/useMediaQuery', () => ({
  ...jest.requireActual('@/hooks/useMediaQuery'),
  useIsBelowMd: () => mockIsBelowMd(),
}))

jest.mock('@/hooks/useIsSpaceRoute', () => ({ useIsSpaceRoute: () => mockIsSpaceRoute() }))

const mockUserId = faker.number.int({ min: 1, max: 1000 })
const mockSpaceId = faker.string.numeric(3)

jest.mock('@/features/spaces', () => ({
  useIsActiveMember: () => mockIsActiveMember(),
  useCurrentSpaceId: () => mockSpaceId,
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/users'),
  useUsersGetWithWalletsV1Query: () => ({ currentData: { id: mockUserId } }),
}))

const tourWithSettingsSection = (
  <>
    <WorkspaceTour />
    <WorkspaceTourSection />
  </>
)

const renderTour = () =>
  render(tourWithSettingsSection, { routerProps: { pathname: '/spaces', query: { spaceId: mockSpaceId } } })

const markTourSeen = () => local.setItem(getWorkspaceTourSeenKey(mockUserId, mockSpaceId), true)

const addSpaceSelector = () => {
  const button = document.createElement('button')
  button.dataset.testid = 'space-selector-button'
  document.body.appendChild(button)
}

describe('WorkspaceTour', () => {
  beforeEach(() => {
    window.localStorage.clear()
    mockIsTourFlagOn.mockReturnValue(true)
    mockIsBelowMd.mockReturnValue(false)
    mockIsSpaceRoute.mockReturnValue(true)
    mockIsActiveMember.mockReturnValue(true)
    const { result } = renderHook(() => useWorkspaceTourOpen())
    act(() => result.current.close())
  })

  it('welcomes a member on their first visit to the workspace', () => {
    renderTour()

    expect(screen.getByText('Welcome to your workspace')).toBeInTheDocument()
  })

  it('stays hidden on a return visit', () => {
    markTourSeen()

    renderTour()

    expect(screen.queryByText('Welcome to your workspace')).not.toBeInTheDocument()
  })

  it('stays hidden and leaves the visit unrecorded while the flag is off', () => {
    mockIsTourFlagOn.mockReturnValue(false)

    renderTour()

    expect(screen.queryByText('Welcome to your workspace')).not.toBeInTheDocument()
    expect(screen.queryByText('Take the tour')).not.toBeInTheDocument()
    expect(local.getItem(getWorkspaceTourSeenKey(mockUserId, mockSpaceId))).toBeNull()
  })

  it('stays hidden and leaves the visit unrecorded for a member who is not active', () => {
    mockIsActiveMember.mockReturnValue(false)

    renderTour()

    expect(screen.queryByText('Welcome to your workspace')).not.toBeInTheDocument()
    expect(local.getItem(getWorkspaceTourSeenKey(mockUserId, mockSpaceId))).toBeNull()
  })

  it('stays hidden and leaves the visit unrecorded outside workspace pages', () => {
    mockIsSpaceRoute.mockReturnValue(false)

    renderTour()

    expect(screen.queryByText('Welcome to your workspace')).not.toBeInTheDocument()
    expect(local.getItem(getWorkspaceTourSeenKey(mockUserId, mockSpaceId))).toBeNull()
  })

  it('hides the tour and its Settings button below the breakpoint where the sidebar becomes a drawer', () => {
    mockIsBelowMd.mockReturnValue(true)

    renderTour()

    expect(screen.queryByText('Welcome to your workspace')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Take the tour' })).not.toBeInTheDocument()
  })

  it('does not reappear after the window narrows mid-tour and widens again', () => {
    const { rerender } = renderTour()

    mockIsBelowMd.mockReturnValue(true)
    rerender(tourWithSettingsSection)
    mockIsBelowMd.mockReturnValue(false)
    rerender(tourWithSettingsSection)

    expect(screen.queryByText('Welcome to your workspace')).not.toBeInTheDocument()
  })

  it('closes when the member skips it', () => {
    renderTour()

    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }))

    expect(screen.queryByText('Welcome to your workspace')).not.toBeInTheDocument()
  })

  it('spotlights the workspace switcher as the first stop', async () => {
    addSpaceSelector()
    renderTour()

    fireEvent.click(screen.getByRole('button', { name: 'Show me around' }))

    expect(await screen.findByText('Switch between workspaces here.')).toBeInTheDocument()
    expect(screen.getByText('1 of 7')).toBeInTheDocument()
    expect(screen.getByTestId('workspace-tour-spotlight')).toBeInTheDocument()
  })

  it('reopens from the Settings section after it was seen', () => {
    markTourSeen()
    renderTour()

    fireEvent.click(screen.getByRole('button', { name: 'Take the tour' }))

    expect(screen.getByText('Welcome to your workspace')).toBeInTheDocument()
  })
})
