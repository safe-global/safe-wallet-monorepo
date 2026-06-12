import { render, screen, fireEvent } from '@/tests/test-utils'
import AddAccountsChooser from '../index'

let mockIsAdmin = true
let mockIsAtSafeLimit = false
jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => '1',
  useIsAdmin: () => mockIsAdmin,
  useIsCurrentSpaceAtSafeLimit: () => mockIsAtSafeLimit,
  SAFE_ACCOUNTS_LIMIT: jest.requireActual('@/features/spaces/constants').SAFE_ACCOUNTS_LIMIT,
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

const mockAccountsModalMount = jest.fn()
jest.mock('@/components/common/SpaceSafeBar/AccountsModal', () => ({
  __esModule: true,
  default: ({ open, trackingLabel }: { open: boolean; trackingLabel?: string }) => {
    mockAccountsModalMount({ trackingLabel })
    return open ? <div data-testid="accounts-modal-mock" data-tracking-label={trackingLabel} /> : null
  },
}))

describe('AddAccountsChooser', () => {
  beforeEach(() => {
    mockIsAdmin = true
    mockIsAtSafeLimit = false
    mockTrackEvent.mockClear()
    mockPush.mockClear()
    mockAddAccountsMount.mockClear()
    mockAccountsModalMount.mockClear()
  })

  it('renders the trigger button with the default label', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)

    expect(screen.getByTestId('add-space-account-button')).toHaveTextContent('Add accounts')
  })

  it('respects a custom buttonLabel', () => {
    render(<AddAccountsChooser buttonLabel="Manage accounts" entryPoint="dashboard" />)

    expect(screen.getByTestId('add-space-account-button')).toHaveTextContent('Manage accounts')
  })

  it('opens the chooser dialog when the trigger button is clicked', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)

    expect(screen.queryByText('Manage Safe accounts')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('add-space-account-button'))

    expect(screen.getByText('Manage Safe accounts')).toBeInTheDocument()
  })

  it('shows three chooser rows', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))

    expect(screen.getByText('See all Safe accounts')).toBeInTheDocument()
    expect(screen.getByText('Add Safe accounts to this workspace')).toBeInTheDocument()
    expect(screen.getByText('Create new Safe')).toBeInTheDocument()
  })

  it('opens AccountsModal with the owned_safes_modal tracking label when "See all Safe accounts" is clicked', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))
    fireEvent.click(screen.getByText('See all Safe accounts'))

    const modal = screen.getByTestId('accounts-modal-mock')
    expect(modal).toBeInTheDocument()
    expect(modal).toHaveAttribute('data-tracking-label', 'owned_safes_modal')
  })

  it('opens AddAccounts picker when admin clicks "Add Safe accounts to this workspace"', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))
    fireEvent.click(screen.getByText('Add Safe accounts to this workspace'))

    expect(screen.getByTestId('add-accounts-picker')).toBeInTheDocument()
  })

  it('fires WORKSPACE_SAFE_LINK_STARTED with the dashboard entry point when rendered from the dashboard', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))
    fireEvent.click(screen.getByText('Add Safe accounts to this workspace'))

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: expect.any(String) }),
      expect.objectContaining({ workspace_id: '1', entry_point: 'dashboard' }),
    )
  })

  it('fires WORKSPACE_SAFE_LINK_STARTED with the safe_accounts entry point when rendered from the SafeAccounts page', () => {
    render(<AddAccountsChooser entryPoint="safe_accounts" />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))
    fireEvent.click(screen.getByText('Add Safe accounts to this workspace'))

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: expect.any(String) }),
      expect.objectContaining({ workspace_id: '1', entry_point: 'safe_accounts' }),
    )
  })

  it('disables the "Add to Workspace" row for non-admin and shows the tooltip text', () => {
    mockIsAdmin = false
    render(<AddAccountsChooser entryPoint="dashboard" />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))

    const row = screen.getByRole('button', { name: /Add Safe accounts to this workspace/i })
    expect(row).toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(row)
    expect(screen.queryByTestId('add-accounts-picker')).not.toBeInTheDocument()
  })

  it('does not set a native title attribute on the disabled row (Tooltip handles it)', () => {
    mockIsAdmin = false
    render(<AddAccountsChooser entryPoint="dashboard" />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))

    expect(screen.getByRole('button', { name: /Add Safe accounts to this workspace/i })).not.toHaveAttribute('title')
  })

  it('navigates to /new-safe/create with the originating page as `next` when "Create new Safe" is clicked', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))
    fireEvent.click(screen.getByText('Create new Safe'))

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/new-safe/create',
      query: { next: '/spaces?spaceId=1' },
    })
  })

  it('shows a warning on the "Create new Safe" row when the workspace is at the safe limit', () => {
    mockIsAtSafeLimit = true
    render(<AddAccountsChooser entryPoint="dashboard" />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))

    expect(screen.getByText(/already has 40 Safes/i)).toBeInTheDocument()
  })

  it('does not show the safe-limit warning to non-admins even when the workspace is at the limit', () => {
    mockIsAdmin = false
    mockIsAtSafeLimit = true
    render(<AddAccountsChooser entryPoint="dashboard" />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))

    expect(screen.queryByText(/already has 40 Safes/i)).not.toBeInTheDocument()
  })

  it('does not show the safe-limit warning when the workspace is below the limit', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))

    expect(screen.queryByText(/already has 40 Safes/i)).not.toBeInTheDocument()
  })

  it('still navigates to /new-safe/create when at the limit (creation is never blocked)', () => {
    mockIsAtSafeLimit = true
    render(<AddAccountsChooser entryPoint="dashboard" />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))
    fireEvent.click(screen.getByText('Create new Safe'))

    expect(mockPush).toHaveBeenCalledWith('/new-safe/create')
  })

  it('lets non-admin members open AccountsModal from "See all Safe accounts"', () => {
    mockIsAdmin = false
    render(<AddAccountsChooser entryPoint="dashboard" />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))
    fireEvent.click(screen.getByText('See all Safe accounts'))

    expect(screen.getByTestId('accounts-modal-mock')).toBeInTheDocument()
  })

  it('lets non-admin members navigate to /new-safe/create from "Create new Safe"', () => {
    mockIsAdmin = false
    render(<AddAccountsChooser entryPoint="dashboard" />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))
    fireEvent.click(screen.getByText('Create new Safe'))

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/new-safe/create',
      query: { next: '/spaces?spaceId=1' },
    })
  })

  it('does not fire WORKSPACE_SAFE_LINK_STARTED when a non-admin clicks the disabled row', () => {
    mockIsAdmin = false
    render(<AddAccountsChooser entryPoint="dashboard" />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))
    fireEvent.click(screen.getByRole('button', { name: /Add Safe accounts to this workspace/i }))

    expect(mockTrackEvent).not.toHaveBeenCalled()
  })

  it('does not mount AccountsModal or AddAccounts before the chooser is opened', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)

    expect(mockAccountsModalMount).not.toHaveBeenCalled()
    expect(mockAddAccountsMount).not.toHaveBeenCalled()
  })

  it('does not mount AccountsModal or AddAccounts when only the chooser is opened', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)
    fireEvent.click(screen.getByTestId('add-space-account-button'))

    expect(mockAccountsModalMount).not.toHaveBeenCalled()
    expect(mockAddAccountsMount).not.toHaveBeenCalled()
  })

  it('mounts only AccountsModal when "See all Safe accounts" is clicked', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)
    fireEvent.click(screen.getByTestId('add-space-account-button'))
    fireEvent.click(screen.getByText('See all Safe accounts'))

    expect(mockAccountsModalMount).toHaveBeenCalled()
    expect(mockAddAccountsMount).not.toHaveBeenCalled()
  })

  it('mounts only AddAccounts when an admin picks "Add Safe accounts to this workspace"', () => {
    render(<AddAccountsChooser entryPoint="dashboard" />)
    fireEvent.click(screen.getByTestId('add-space-account-button'))
    fireEvent.click(screen.getByText('Add Safe accounts to this workspace'))

    expect(mockAddAccountsMount).toHaveBeenCalled()
    expect(mockAccountsModalMount).not.toHaveBeenCalled()
  })

  it('does not mount AddAccounts when a non-admin clicks the disabled row', () => {
    mockIsAdmin = false
    render(<AddAccountsChooser entryPoint="dashboard" />)
    fireEvent.click(screen.getByTestId('add-space-account-button'))
    fireEvent.click(screen.getByRole('button', { name: /Add Safe accounts to this workspace/i }))

    expect(mockAddAccountsMount).not.toHaveBeenCalled()
  })
})
