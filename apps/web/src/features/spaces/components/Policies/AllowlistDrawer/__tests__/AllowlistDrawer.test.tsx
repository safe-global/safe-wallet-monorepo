import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { MOCK_ADDRESSES, MOCK_VIEWERS } from '../../mocks/policies'
import {
  mockActivatingAllowlist,
  mockActiveAllowlist,
  mockAllowlistChangePending,
  mockPendingAllowlist,
  mockPendingAllowlistRemoval,
  mockPendingAllowlistUpdate,
} from '../../mocks/allowlistPolicies'
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

  it('lists each token once expanded', async () => {
    const { user } = setup(mockActiveAllowlist())

    await user.click(screen.getByRole('button', { name: 'Show token details' }))

    expect(screen.getAllByTestId('allowlist-token').map((token) => token.textContent)).toEqual(['USDC', 'USDT'])
  })

  it('asks a viewer without a wallet to connect one', async () => {
    const onConnectWallet = jest.fn()
    const { user } = renderWithUserEvent(
      <AllowlistDrawer
        {...SHARED}
        policy={mockActiveAllowlist()}
        viewer={MOCK_VIEWERS.disconnected}
        onConnectWallet={onConnectWallet}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Connect wallet' }))

    expect(onConnectWallet).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Connect a signer wallet to edit.')).toBeInTheDocument()
  })

  it('disables Edit and explains why for a wallet that is not a signer', () => {
    setup(mockActiveAllowlist(), MOCK_VIEWERS.nonSigner)

    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
    expect(screen.getByText('Only signers of this Safe account can edit this allowlist.')).toBeInTheDocument()
  })

  it('offers the transaction link to a signer who has already signed', () => {
    setup(mockPendingAllowlist(), MOCK_VIEWERS.signerWhoSigned)

    expect(screen.getByRole('button', { name: 'Copy transaction link' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Review transaction' })).not.toBeInTheDocument()
  })

  it('renders no footer when the transaction link is not known yet', () => {
    render(<AllowlistDrawer {...SHARED} policy={mockPendingAllowlist()} viewer={MOCK_VIEWERS.signerWhoSigned} />)

    expect(screen.queryByRole('button', { name: 'Copy transaction link' })).not.toBeInTheDocument()
  })

  it('marks every recipient and token as removed while a removal is pending', async () => {
    const { user } = setup(mockPendingAllowlistRemoval())

    expect(screen.getByText('This allowlist is still active until the removal is executed.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show recipient details' }))
    await user.click(screen.getByRole('button', { name: 'Show token details' }))

    expect(screen.getAllByText('Removed')).toHaveLength(7)
  })

  it('keeps the current recipients unmarked while an update is pending', () => {
    setup(mockPendingAllowlistUpdate())

    expect(screen.getByText('The current recipients still apply until the change is executed.')).toBeInTheDocument()
    expect(screen.queryByText('Removed')).not.toBeInTheDocument()
  })

  it('says an executed transaction applies after the delay and offers no action', () => {
    render(
      <AllowlistDrawer {...SHARED} policy={mockPendingAllowlist()} viewer={MOCK_VIEWERS.signer} outcome="executed" />,
    )

    expect(screen.getByText('The transaction was executed.')).toBeInTheDocument()
    expect(screen.getByText('The allowlist applies after the 24-hour delay.')).toBeInTheDocument()
    expect(screen.getByTestId('policy-status-pending')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Review transaction' })).not.toBeInTheDocument()
  })

  it('reports a failed transaction in red and marks the policy as failed', () => {
    render(
      <AllowlistDrawer {...SHARED} policy={mockPendingAllowlist()} viewer={MOCK_VIEWERS.signer} outcome="failed" />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('The transaction failed and can no longer be executed.')
    expect(screen.getByText('Close this panel to see the current policies.')).toBeInTheDocument()
    expect(screen.getByTestId('policy-status-failed')).toHaveTextContent('Failed')
    expect(screen.queryByText('Pending signatures')).not.toBeInTheDocument()
  })

  it('keeps the removed badges once a removal has executed', () => {
    render(
      <AllowlistDrawer
        {...SHARED}
        policy={mockPendingAllowlistRemoval()}
        viewer={MOCK_VIEWERS.signer}
        outcome="executed"
      />,
    )

    expect(screen.getByText('The allowlist is removed after the 24-hour delay.')).toBeInTheDocument()
    expect(screen.getAllByText('Removed')).toHaveLength(2)
  })

  it('says a new allowlist is not checked yet while it waits out the delay, with no action', () => {
    render(<AllowlistDrawer {...SHARED} policy={mockActivatingAllowlist()} viewer={MOCK_VIEWERS.signer} />)

    expect(screen.getByText('Change pending')).toBeInTheDocument()
    expect(screen.getByText("Until then, transactions aren't checked against it.")).toBeInTheDocument()
    expect(screen.getByTestId('scheduled-applies-at')).toHaveTextContent(/^Applies in 24h · /)
    expect(screen.getByTestId('policy-status-change-pending')).toHaveTextContent('Pending')
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('lets a signer cancel a change that waits out the delay', async () => {
    const onCancelChange = jest.fn()
    const { user } = renderWithUserEvent(
      <AllowlistDrawer
        {...SHARED}
        policy={mockAllowlistChangePending()}
        viewer={MOCK_VIEWERS.signer}
        onCancelChange={onCancelChange}
      />,
    )

    expect(screen.getByText('Any signer can cancel it before then.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel change' }))

    expect(onCancelChange).toHaveBeenCalledTimes(1)
  })

  it('disables Cancel change for a wallet that is not a signer', () => {
    render(
      <AllowlistDrawer
        {...SHARED}
        policy={mockAllowlistChangePending()}
        viewer={MOCK_VIEWERS.nonSigner}
        onCancelChange={jest.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Cancel change' })).toBeDisabled()
    expect(screen.getByText('Only signers of this Safe account can cancel this change.')).toBeInTheDocument()
  })

  it('disables the Edit and Remove buttons until their flows are passed in', () => {
    render(<AllowlistDrawer {...SHARED} policy={mockActiveAllowlist()} viewer={MOCK_VIEWERS.signer} />)

    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled()
  })
})
