import { render, screen, fireEvent } from '@/tests/test-utils'
import AddAccountsChooser from '../index'

let mockIsAdmin = true
let mockIsAtSafeLimit = false
jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => '1',
  useIsAdmin: () => mockIsAdmin,
  useIsCurrentSpaceAtSafeLimit: () => mockIsAtSafeLimit,
  useSpaceSafeLimit: () => ({ limit: 40, isLoading: false }),
  useCurrentSpaceSafeCount: () => 40,
}))
jest.mock('../../../hooks/useSeatUpsell', () => ({
  useSeatUpsell: () => ({
    isSafePro: true,
    tierName: 'Business',
    limit: 40,
    upgradePlanName: undefined,
    plansHref: '/spaces/plans?spaceId=1',
  }),
}))

const mockTrackEvent = jest.fn()
jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}))

const mockPush = jest.fn()
jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush, pathname: '/spaces', query: { spaceId: '1' } }),
}))

const mockAddAccountsMount = jest.fn()
jest.mock('@/features/spaces/components/AddAccounts', () => ({
  __esModule: true,
  default: ({ externalOpen }: { externalOpen?: boolean }) => {
    mockAddAccountsMount()
    return externalOpen ? <div data-testid="add-accounts-picker" /> : null
  },
}))

const ADD_ROW = 'add-safe-accounts-to-workspace-button'

describe('AddAccountsChooser', () => {
  beforeEach(() => {
    mockIsAdmin = true
    mockIsAtSafeLimit = false
    mockTrackEvent.mockClear()
    mockPush.mockClear()
    mockAddAccountsMount.mockClear()
  })

  const openChooser = () => fireEvent.click(screen.getByTestId('open-add-accounts-chooser-button'))

  it('renders the trigger button with the default label', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)

    expect(screen.getByTestId('open-add-accounts-chooser-button')).toHaveTextContent('Add accounts')
  })

  it('respects a custom buttonLabel', () => {
    render(<AddAccountsChooser buttonLabel="Manage accounts" entryPoint="dashboard" />)

    expect(screen.getByTestId('open-add-accounts-chooser-button')).toHaveTextContent('Manage accounts')
  })

  it('opens the chooser dialog when the trigger button is clicked', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)

    expect(screen.queryByRole('heading', { name: 'Add Safe accounts' })).not.toBeInTheDocument()

    openChooser()

    expect(screen.getByRole('heading', { name: 'Add Safe accounts' })).toBeInTheDocument()
  })

  it('shows the two chooser rows and no "See all Safe accounts" row', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)

    openChooser()

    expect(screen.getByTestId(ADD_ROW)).toBeInTheDocument()
    expect(screen.getByText('Create new Safe')).toBeInTheDocument()
    expect(screen.queryByText('See all Safe accounts')).not.toBeInTheDocument()
  })

  it('opens AddAccounts picker when admin clicks the add row', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)

    openChooser()
    fireEvent.click(screen.getByTestId(ADD_ROW))

    expect(screen.getByTestId('add-accounts-picker')).toBeInTheDocument()
  })

  it('fires WORKSPACE_SAFE_LINK_STARTED with the dashboard entry point when rendered from the dashboard', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)

    openChooser()
    fireEvent.click(screen.getByTestId(ADD_ROW))

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: expect.any(String) }),
      expect.objectContaining({ workspace_id: '1', entry_point: 'dashboard' }),
    )
  })

  it('fires WORKSPACE_SAFE_LINK_STARTED with the safe_accounts entry point when rendered from the SafeAccounts page', () => {
    render(<AddAccountsChooser entryPoint="safe_accounts" />)

    openChooser()
    fireEvent.click(screen.getByTestId(ADD_ROW))

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: expect.any(String) }),
      expect.objectContaining({ workspace_id: '1', entry_point: 'safe_accounts' }),
    )
  })

  it('disables the add row for non-admin and shows the tooltip text', () => {
    mockIsAdmin = false
    render(<AddAccountsChooser entryPoint="dashboard" />)

    openChooser()

    const row = screen.getByTestId(ADD_ROW)
    expect(row).toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(row)
    expect(screen.queryByTestId('add-accounts-picker')).not.toBeInTheDocument()
  })

  it('does not set a native title attribute on the disabled row (Tooltip handles it)', () => {
    mockIsAdmin = false
    render(<AddAccountsChooser entryPoint="dashboard" />)

    openChooser()

    expect(screen.getByTestId(ADD_ROW)).not.toHaveAttribute('title')
  })

  it('navigates to /new-safe/create with the originating page as `next` when "Create new Safe" is clicked', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)

    openChooser()
    fireEvent.click(screen.getByText('Create new Safe'))

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/new-safe/create',
      query: { next: '/spaces?spaceId=1' },
    })
  })

  it('explains the seat limit and reframes both rows when an admin hits it', () => {
    mockIsAtSafeLimit = true
    render(<AddAccountsChooser entryPoint="dashboard" />)

    openChooser()

    expect(screen.getByTestId('seat-limit-banner')).toHaveTextContent('Business includes 40 Safe accounts')
    expect(screen.getByText('Manage accounts')).toBeInTheDocument()
    expect(screen.getByText('Swap one out to add another · 40 of 40')).toBeInTheDocument()
    expect(screen.getByText('Create new')).toBeInTheDocument()
    expect(screen.getByText('Created outside the Workspace, in My accounts')).toBeInTheDocument()
  })

  it('does not show the seat limit to non-admins even when the workspace is at the limit', () => {
    mockIsAdmin = false
    mockIsAtSafeLimit = true
    render(<AddAccountsChooser entryPoint="dashboard" />)

    openChooser()

    expect(screen.queryByTestId('seat-limit-banner')).not.toBeInTheDocument()
    expect(screen.getByText('Select from my accounts')).toBeInTheDocument()
  })

  it('does not show the seat limit when the workspace is below it', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)

    openChooser()

    expect(screen.queryByTestId('seat-limit-banner')).not.toBeInTheDocument()
    expect(screen.getByText('Create new Safe')).toBeInTheDocument()
  })

  it('still navigates to /new-safe/create when at the limit (creation is never blocked)', () => {
    mockIsAtSafeLimit = true
    render(<AddAccountsChooser entryPoint="dashboard" />)

    openChooser()
    fireEvent.click(screen.getByText('Create new'))

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/new-safe/create',
      query: { next: '/spaces?spaceId=1' },
    })
  })

  it('lets non-admin members navigate to /new-safe/create from "Create new Safe"', () => {
    mockIsAdmin = false
    render(<AddAccountsChooser entryPoint="dashboard" />)

    openChooser()
    fireEvent.click(screen.getByText('Create new Safe'))

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/new-safe/create',
      query: { next: '/spaces?spaceId=1' },
    })
  })

  it('does not fire WORKSPACE_SAFE_LINK_STARTED when a non-admin clicks the disabled row', () => {
    mockIsAdmin = false
    render(<AddAccountsChooser entryPoint="dashboard" />)

    openChooser()
    fireEvent.click(screen.getByTestId(ADD_ROW))

    expect(mockTrackEvent).not.toHaveBeenCalled()
  })

  it('does not mount AddAccounts before the chooser is opened', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)

    expect(mockAddAccountsMount).not.toHaveBeenCalled()
  })

  it('does not mount AddAccounts when only the chooser is opened', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)
    openChooser()

    expect(mockAddAccountsMount).not.toHaveBeenCalled()
  })

  it('mounts AddAccounts when an admin picks the add row', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)
    openChooser()
    fireEvent.click(screen.getByTestId(ADD_ROW))

    expect(mockAddAccountsMount).toHaveBeenCalled()
  })

  it('does not mount AddAccounts when a non-admin clicks the disabled row', () => {
    mockIsAdmin = false
    render(<AddAccountsChooser entryPoint="dashboard" />)
    openChooser()
    fireEvent.click(screen.getByTestId(ADD_ROW))

    expect(mockAddAccountsMount).not.toHaveBeenCalled()
  })
})
