import { render, screen, fireEvent } from '@/tests/test-utils'
import AddAccountsChooser from '../index'

let mockIsAdmin = true
jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => '1',
  useIsAdmin: () => mockIsAdmin,
}))

const mockTrackEvent = jest.fn()
jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}))

const mockPush = jest.fn()
jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/features/spaces/components/AddAccounts', () => ({
  __esModule: true,
  default: ({ externalOpen }: { externalOpen?: boolean }) =>
    externalOpen ? <div data-testid="add-accounts-picker" /> : null,
}))

jest.mock('@/features/spaces/components/OwnedSafesModal', () => ({
  __esModule: true,
  default: ({ open }: { open: boolean }) => (open ? <div data-testid="owned-safes-modal" /> : null),
}))

describe('AddAccountsChooser', () => {
  beforeEach(() => {
    mockIsAdmin = true
    mockTrackEvent.mockClear()
    mockPush.mockClear()
  })

  it('renders the trigger button with the default label', () => {
    render(<AddAccountsChooser />)

    expect(screen.getByTestId('add-space-account-button')).toHaveTextContent('Add Accounts')
  })

  it('respects a custom buttonLabel', () => {
    render(<AddAccountsChooser buttonLabel="Add account" />)

    expect(screen.getByTestId('add-space-account-button')).toHaveTextContent('Add account')
  })

  it('opens the chooser dialog when the trigger button is clicked', () => {
    render(<AddAccountsChooser />)

    expect(screen.queryByText('Add a Safe Account')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('add-space-account-button'))

    expect(screen.getByText('Add a Safe Account')).toBeInTheDocument()
  })

  it('shows three chooser rows', () => {
    render(<AddAccountsChooser />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))

    expect(screen.getByText('See owned Safe accounts')).toBeInTheDocument()
    expect(screen.getByText('Add Safe accounts to the Workspace')).toBeInTheDocument()
    expect(screen.getByText('Create new Safe')).toBeInTheDocument()
  })

  it('opens OwnedSafesModal when "See owned Safe accounts" is clicked', () => {
    render(<AddAccountsChooser />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))
    fireEvent.click(screen.getByText('See owned Safe accounts'))

    expect(screen.getByTestId('owned-safes-modal')).toBeInTheDocument()
  })

  it('opens AddAccounts picker when admin clicks "Add Safe accounts to the Workspace"', () => {
    render(<AddAccountsChooser />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))
    fireEvent.click(screen.getByText('Add Safe accounts to the Workspace'))

    expect(screen.getByTestId('add-accounts-picker')).toBeInTheDocument()
  })

  it('fires WORKSPACE_SAFE_LINK_STARTED when admin opens the picker', () => {
    render(<AddAccountsChooser />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))
    fireEvent.click(screen.getByText('Add Safe accounts to the Workspace'))

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: expect.any(String) }),
      expect.objectContaining({ workspace_id: '1' }),
    )
  })

  it('disables the "Add to Workspace" row for non-admin and shows the tooltip text', () => {
    mockIsAdmin = false
    render(<AddAccountsChooser />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))

    const row = screen.getByRole('button', { name: /Add Safe accounts to the Workspace/i })
    expect(row).toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(row)
    expect(screen.queryByTestId('add-accounts-picker')).not.toBeInTheDocument()
  })

  it('renders the admin-only tooltip text in the DOM for non-admins', () => {
    mockIsAdmin = false
    render(<AddAccountsChooser />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))

    expect(screen.getByRole('button', { name: /Add Safe accounts to the Workspace/i })).toHaveAttribute(
      'title',
      'You need to be an Admin to add accounts',
    )
  })

  it('navigates to /new-safe/create when "Create new Safe" is clicked', () => {
    render(<AddAccountsChooser />)

    fireEvent.click(screen.getByTestId('add-space-account-button'))
    fireEvent.click(screen.getByText('Create new Safe'))

    expect(mockPush).toHaveBeenCalledWith('/new-safe/create')
  })
})
