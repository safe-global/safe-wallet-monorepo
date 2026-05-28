import { render, screen } from '@/tests/test-utils'
import SecurityEmptyState from '../components/SecurityEmptyState/SecurityEmptyState'

jest.mock('@/features/spaces/components/AddAccounts', () => {
  const MockAddAccounts = ({ buttonLabel }: { buttonLabel?: string }) => (
    <button data-testid="mock-add-accounts">{buttonLabel ?? 'Add Accounts'}</button>
  )
  MockAddAccounts.displayName = 'MockAddAccounts'
  return { __esModule: true, default: MockAddAccounts }
})

jest.mock('@/components/common/Track', () => {
  const Track = ({ children }: { children: React.ReactNode }) => <>{children}</>
  Track.displayName = 'Track'
  return Track
})

describe('SecurityEmptyState', () => {
  it('renders the heading and subtitle copy', () => {
    render(<SecurityEmptyState />)

    expect(screen.getByText('No accounts to check yet')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Add a Safe account to this workspace to start running security checks and see its health here.',
      ),
    ).toBeInTheDocument()
  })

  it('renders the Add account CTA', () => {
    render(<SecurityEmptyState />)

    expect(screen.getByRole('button', { name: 'Add account' })).toBeInTheDocument()
  })

  it('exposes a test id for higher-level assertions', () => {
    render(<SecurityEmptyState />)

    expect(screen.getByTestId('security-empty-state')).toBeInTheDocument()
  })
})
