import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { MOCK_ADDRESSES, MOCK_VIEWERS } from '../../mocks/policies'
import { mockActiveAllowlist, mockPendingAllowlist } from '../../mocks/allowlistPolicies'
import type { Viewer } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/resolveState'
import type { AllowlistDrawerPolicy } from '@safe-global/views/features/spaces/components/Policies/AllowlistDrawer/resolveState'
import AllowlistDrawer from '../AllowlistDrawer'

jest.mock('@/components/common/ChainIndicator', () => {
  const Mock = ({ chainId }: { chainId: string }) => <img data-testid="chain-logo-img" alt={`chain-${chainId}`} />
  Mock.displayName = 'ChainIndicator'
  return { __esModule: true, default: Mock }
})

const SHARED = {
  open: true,
  onClose: jest.fn(),
  safe: { address: '0x8675B754342754A30A2AeF474D114d8460bca19b', name: 'Treasury' },
  overview: { lastUpdated: 'Oct 12, 2026', enforcedBy: 'Safe policy contract' },
  onConnectWallet: jest.fn(),
}

const setup = (policy: AllowlistDrawerPolicy, viewer: Viewer = MOCK_VIEWERS.signer) =>
  policy.status === 'pending'
    ? renderWithUserEvent(
        <AllowlistDrawer
          {...SHARED}
          policy={policy}
          viewer={viewer}
          transactionLink="https://app.safe.global/transactions/tx?id=0x4b7e"
          reviewTransactionHref="/transactions/tx?id=0x4b7e"
        />,
      )
    : renderWithUserEvent(
        <AllowlistDrawer
          {...SHARED}
          policy={policy}
          viewer={viewer}
          names={{ [MOCK_ADDRESSES.alice]: 'Alice Contractor' }}
          onEdit={jest.fn()}
          onRemove={jest.fn()}
        />,
      )

describe('AllowlistDrawer', () => {
  it('summarises the distinct recipients and tokens', () => {
    setup(mockActiveAllowlist())

    expect(screen.getByText('3 recipients')).toBeInTheDocument()
    expect(screen.getByText('2 tokens')).toBeInTheDocument()
  })

  it('lists each recipient with its address book name once expanded', async () => {
    const { user } = setup(mockActiveAllowlist())

    await user.click(screen.getByRole('button', { name: 'Show recipient details' }))

    expect(screen.getAllByTestId('allowlist-recipient')).toHaveLength(3)
    expect(screen.getByText('Alice Contractor')).toBeInTheDocument()
  })

  it('offers a signer Edit and Remove on an active allowlist, without a pending banner', () => {
    setup(mockActiveAllowlist())

    expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Remove' })).toBeEnabled()
    expect(screen.queryByText('Pending signatures')).not.toBeInTheDocument()
  })

  it('shows the pending banner, the signature count and the review action while awaiting signatures', () => {
    setup(mockPendingAllowlist())

    expect(screen.getByText('The allowlist is not active as the transaction is not yet executed.')).toBeInTheDocument()
    expect(screen.getByText('Pending signatures')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review transaction' })).toHaveAttribute(
      'href',
      '/transactions/tx?id=0x4b7e',
    )
  })

  it('disables the Edit and Remove buttons until their flows are passed in', () => {
    render(<AllowlistDrawer {...SHARED} policy={mockActiveAllowlist()} viewer={MOCK_VIEWERS.signer} />)

    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled()
  })
})
