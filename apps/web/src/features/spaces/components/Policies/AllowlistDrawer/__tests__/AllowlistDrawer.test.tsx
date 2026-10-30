import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { MOCK_ADDRESSES, MOCK_VIEWERS } from '../../mocks/policies'
import {
  mockActiveAllowlist,
  mockAllowlistPolicy,
  mockExpiredPendingAllowlist,
  mockExpiredRequestAllowlist,
  mockFailedAllowlist,
  mockReadyToApplyAllowlist,
  mockPendingAllowlist,
  mockPendingAllowlistRemoval,
  mockPendingAllowlistUpdate,
  mockUnenforcedAllowlist,
} from '../../mocks/allowlistPolicies'
import type { Viewer } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/resolveState'
import type { AllowlistScheduledChange } from '@safe-global/views/features/spaces/components/Policies/types'
import { asActivePolicy } from '../../mocks/policies'
import type { AllowlistDrawerPolicy } from '../resolveState'
import AllowlistDrawer from '../AllowlistDrawer'

jest.mock('@/components/common/ChainIndicator', () => {
  const Mock = ({ chainId }: { chainId: string }) => <img data-testid="chain-logo-img" alt={`chain-${chainId}`} />
  Mock.displayName = 'ChainIndicator'
  return { __esModule: true, default: Mock }
})

const mockReviewTransaction = jest.fn()

const mockAllowlistPolicyWithChange = (scheduledChange: AllowlistScheduledChange) =>
  asActivePolicy(mockAllowlistPolicy({ scheduledChange }))

const SHARED = {
  open: true,
  onClose: jest.fn(),
  safe: { address: '0x8675B754342754A30A2AeF474D114d8460bca19b', name: 'Treasury' },
  overview: { lastUpdated: 'Oct 12, 2026', enforcedBy: 'Safe policy contract' },
  onConnectWallet: jest.fn(),
}

const setup = (policy: AllowlistDrawerPolicy, viewer: Viewer = MOCK_VIEWERS.signer) =>
  policy.status !== 'active'
    ? renderWithUserEvent(
        <AllowlistDrawer
          {...SHARED}
          policy={policy}
          viewer={viewer}
          transactionLink="https://app.safe.global/transactions/tx?id=0x4b7e"
          onReviewTransaction={mockReviewTransaction}
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

  it('finds a recipient name whatever the casing of the address book key', async () => {
    const { user } = renderWithUserEvent(
      <AllowlistDrawer
        {...SHARED}
        policy={mockActiveAllowlist()}
        viewer={MOCK_VIEWERS.signer}
        names={{ [MOCK_ADDRESSES.alice.toLowerCase()]: 'Alice Contractor' }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Show recipient details' }))

    expect(screen.getByText('Alice Contractor')).toBeInTheDocument()
  })

  it('names the details toggle by what it will do, and closes the list again', async () => {
    const { user } = setup(mockActiveAllowlist())

    await user.click(screen.getByRole('button', { name: 'Show recipient details' }))

    const toggle = screen.getByRole('button', { name: 'Hide recipient details' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    await user.click(toggle)

    expect(screen.getByRole('button', { name: 'Show recipient details' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('offers a signer Edit and Remove on an active allowlist, without a pending banner', () => {
    setup(mockActiveAllowlist())

    expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Remove' })).toBeEnabled()
    expect(screen.queryByText('Pending signatures')).not.toBeInTheDocument()
  })

  it('shows the pending banner, the signature count and the review action while awaiting signatures', async () => {
    const { user } = setup(mockPendingAllowlist())

    expect(screen.getByText('The allowlist is not active as the transaction is not yet executed.')).toBeInTheDocument()
    expect(screen.getByText('Pending signatures')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Review transaction' }))

    expect(mockReviewTransaction).toHaveBeenCalledTimes(1)
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

  it('disables Review transaction until the transaction link has loaded', () => {
    render(<AllowlistDrawer {...SHARED} policy={mockPendingAllowlist()} viewer={MOCK_VIEWERS.signer} />)

    expect(screen.getByRole('button', { name: 'Review transaction' })).toBeDisabled()
  })

  it('offers the transaction link to a signer who has already signed', () => {
    setup(mockPendingAllowlist(), MOCK_VIEWERS.signerWhoSigned)

    expect(screen.getByRole('button', { name: 'Copy transaction link' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Review transaction' })).not.toBeInTheDocument()
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
    expect(screen.getByText('The allowlist becomes active after a delay of 3 minutes.')).toBeInTheDocument()
    expect(screen.getByTestId('policy-status-pending')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Review transaction' })).not.toBeInTheDocument()
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

  it.each([
    ['replaced', 'Another transaction used this nonce, so this one can no longer be executed.'],
    ['deleted', 'The transaction was deleted.'],
  ] as const)('reports a %s transaction in red and marks the policy as failed', (outcome, title) => {
    render(
      <AllowlistDrawer {...SHARED} policy={mockPendingAllowlist()} viewer={MOCK_VIEWERS.signer} outcome={outcome} />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(title)
    expect(screen.getByText('Close this panel to see the current policies.')).toBeInTheDocument()
    expect(screen.getByTestId('policy-status-failed')).toHaveTextContent('Failed')
    expect(screen.queryByRole('button', { name: 'Review transaction' })).not.toBeInTheDocument()
  })

  it('closes an expired transaction with no chip and no action', () => {
    setup(mockExpiredPendingAllowlist())

    expect(screen.getByText('Transaction expired')).toBeInTheDocument()
    expect(screen.getByText('It can no longer be signed. Set up the allowlist again to retry.')).toBeInTheDocument()
    expect(screen.queryByText('Pending signatures')).not.toBeInTheDocument()
    expect(screen.queryByTestId(/^policy-status-/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Review transaction' })).not.toBeInTheDocument()
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

    expect(screen.getByText('The allowlist is removed after a delay of 3 minutes.')).toBeInTheDocument()
    expect(screen.getAllByText('Removed')).toHaveLength(2)
  })

  describe('after the request executed', () => {
    const NOW = Date.UTC(2026, 9, 27, 12)
    const HOUR = 3_600
    const at = (hoursFromNow: number) => NOW / 1_000 + hoursFromNow * HOUR
    const change = (operation: 'create' | 'update', appliesIn: number, expiresIn: number) =>
      mockAllowlistPolicyWithChange({
        operation,
        appliesAt: at(appliesIn),
        expiresAt: at(expiresIn),
        requestedAt: at(appliesIn - 24),
      })

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(NOW)
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('counts down the waiting period, with the apply button disabled', () => {
      render(<AllowlistDrawer {...SHARED} policy={change('update', 24 - 1 / 60, 192)} viewer={MOCK_VIEWERS.signer} />)

      expect(screen.getByText('Your changes can be applied in 23 hours 59 minutes')).toBeInTheDocument()
      expect(
        screen.getByText(
          'From Oct 28, 2026 · 11:59 UTC, a second transaction will need to be executed to apply them. Until then, the current rules apply.',
        ),
      ).toBeInTheDocument()
      expect(screen.getByText('Waiting period')).toBeInTheDocument()
      expect(screen.getByText('23 hours 59 minutes left')).toBeInTheDocument()
      expect(screen.getByText('Requested')).toBeInTheDocument()
      expect(screen.getByText('Oct 27, 2026 · 11:59 UTC')).toBeInTheDocument()
      expect(screen.getByText('Can be applied from')).toBeInTheDocument()
      expect(screen.getByText('Apply by')).toBeInTheDocument()
      expect(screen.getByTestId('policy-status-change-pending')).toHaveTextContent('Pending')
      expect(screen.getByRole('button', { name: 'Apply in 23 hours 59 minutes' })).toBeDisabled()
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    })

    it('words the waiting period for a first allowlist', () => {
      render(<AllowlistDrawer {...SHARED} policy={change('create', 1 / 6, 168)} viewer={MOCK_VIEWERS.signer} />)

      expect(screen.getByText('Your allowlist can be applied in 10 minutes')).toBeInTheDocument()
      expect(screen.getByText(/Until then, transactions aren't checked against it\.$/)).toBeInTheDocument()
    })

    it('hides the policy overview and the existing policies while the request waits', () => {
      render(
        <AllowlistDrawer
          {...SHARED}
          policy={change('update', 5, 173)}
          viewer={MOCK_VIEWERS.signer}
          uncoveredSpendingLimitCount={2}
        />,
      )

      expect(screen.queryByText('Policy overview')).not.toBeInTheDocument()
      expect(screen.queryByTestId('allowlist-uncovered-spending-limits')).not.toBeInTheDocument()
      expect(screen.getByText('Safe account')).toBeInTheDocument()
    })

    it("names the Safe's signatures and the deadline once the delay is over, and lets a signer apply", async () => {
      const onApply = jest.fn()
      const { user } = renderWithUserEvent(
        <AllowlistDrawer
          {...SHARED}
          policy={change('update', -1, 167)}
          viewer={MOCK_VIEWERS.signer}
          signatures={{ threshold: 2, owners: 3 }}
          onApply={onApply}
        />,
      )

      expect(screen.getByText('Your changes are ready to apply')).toBeInTheDocument()
      expect(
        screen.getByText(
          'They take effect once a second transaction is executed. It needs 2 of 3 signatures and must be executed by Nov 3, 2026 · 11:00 UTC.',
        ),
      ).toBeInTheDocument()
      expect(screen.getByText('Apply window')).toBeInTheDocument()
      expect(screen.getByText('6 days left')).toBeInTheDocument()
      expect(screen.getByText('Ready since')).toBeInTheDocument()
      expect(screen.getByText('Any signer can start this transaction.')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Review transaction' }))

      expect(onApply).toHaveBeenCalledTimes(1)
    })

    it("falls back to the Safe account's signatures until its setup has loaded", () => {
      render(<AllowlistDrawer {...SHARED} policy={change('create', -1, 167)} viewer={MOCK_VIEWERS.signer} />)

      expect(screen.getByText('Your allowlist is ready to apply')).toBeInTheDocument()
      expect(
        screen.getByText(
          /^It takes effect once a second transaction is executed\. It needs the Safe account's signatures/,
        ),
      ).toBeInTheDocument()
    })

    it('keeps apply disabled for a wallet that is not a signer', () => {
      render(
        <AllowlistDrawer
          {...SHARED}
          policy={mockReadyToApplyAllowlist()}
          viewer={MOCK_VIEWERS.nonSigner}
          onApply={jest.fn()}
        />,
      )

      expect(screen.getByRole('button', { name: 'Review transaction' })).toBeDisabled()
      expect(screen.getByText('Only signers of this Safe account can apply this allowlist.')).toBeInTheDocument()
    })

    it('reports an expired request in red with an Expired chip, and offers to discard it', async () => {
      const onDiscard = jest.fn()
      const { user } = renderWithUserEvent(
        <AllowlistDrawer
          {...SHARED}
          policy={change('update', -200, -24)}
          viewer={MOCK_VIEWERS.signer}
          onDiscard={onDiscard}
        />,
      )

      expect(screen.getByRole('alert')).toHaveTextContent('Your changes expired')
      expect(
        screen.getByText(
          "They weren't applied by Oct 26, 2026 · 12:00 UTC, so they can't take effect anymore. The current rules stay in place.",
        ),
      ).toBeInTheDocument()
      expect(screen.getByText('Request')).toBeInTheDocument()
      expect(screen.getAllByText('Expired')).toHaveLength(2)
      expect(screen.getByTestId('policy-status-expired')).toHaveTextContent('Expired')
      expect(screen.getByText('To make these changes, edit the allowlist again.')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Apply|Review transaction/ })).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Discard' }))

      expect(onDiscard).toHaveBeenCalledTimes(1)
    })

    it('disables Discard until a discard flow is passed in', () => {
      render(<AllowlistDrawer {...SHARED} policy={mockExpiredRequestAllowlist()} viewer={MOCK_VIEWERS.signer} />)

      expect(screen.getByRole('alert')).toHaveTextContent('Your allowlist expired')
      expect(screen.getByRole('button', { name: 'Discard' })).toBeDisabled()
    })

    it('leaves the Requested row out when the request time is unknown', () => {
      const policy = mockAllowlistPolicyWithChange({ operation: 'update', appliesAt: at(5), expiresAt: at(173) })
      render(<AllowlistDrawer {...SHARED} policy={policy} viewer={MOCK_VIEWERS.signer} />)

      expect(screen.queryByText('Requested')).not.toBeInTheDocument()
      expect(screen.getByText('Can be applied from')).toBeInTheDocument()
    })
  })

  it('says how long is left to sign a pending transaction', () => {
    setup(mockPendingAllowlist())

    expect(screen.getByText('Time to sign')).toBeInTheDocument()
    expect(screen.getByText(/^6 days left · until /)).toBeInTheDocument()
  })

  it('leaves the time to sign out when the expiry is unknown', () => {
    setup(mockPendingAllowlist({ expiresAt: undefined }))

    expect(screen.getByText('Pending signatures')).toBeInTheDocument()
    expect(screen.queryByText('Time to sign')).not.toBeInTheDocument()
  })

  it('shows a failed row from the table as failed without an outcome passed in', () => {
    render(<AllowlistDrawer {...SHARED} policy={mockFailedAllowlist()} viewer={MOCK_VIEWERS.signer} />)

    expect(screen.getByRole('alert')).toHaveTextContent('The transaction failed and can no longer be executed.')
    expect(screen.getByTestId('policy-status-failed')).toHaveTextContent('Failed')
    expect(screen.queryByText('Pending signatures')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Review transaction' })).not.toBeInTheDocument()
  })

  it('disables the Edit and Remove buttons until their flows are passed in', () => {
    render(<AllowlistDrawer {...SHARED} policy={mockActiveAllowlist()} viewer={MOCK_VIEWERS.signer} />)

    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled()
  })

  it('says the guard is removed on an unenforced allowlist, hides who enforces it and offers no action', () => {
    setup(mockUnenforcedAllowlist())

    expect(screen.getByText('Safe policy guard removed')).toBeInTheDocument()
    expect(screen.getByText('Allowlist not applied as the guard is removed.')).toBeInTheDocument()
    expect(screen.getByTestId('policy-status-unenforced')).toHaveTextContent('Not enforced')
    expect(screen.queryByText('Enforced by')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
  })

  it('confirms a just activated allowlist with a green banner naming the Safe and counting the recipients', () => {
    render(<AllowlistDrawer {...SHARED} policy={mockActiveAllowlist()} viewer={MOCK_VIEWERS.signer} justActivated />)

    expect(screen.getByRole('alert')).toHaveTextContent('Your allowlist is now active')
    expect(
      screen.getByText(
        'Treasury can only send the allowed tokens to the 3 allowed recipients. Further changes will take 3 minutes to apply.',
      ),
    ).toBeInTheDocument()
  })

  it('shows no activation banner unless the allowlist was just activated', () => {
    render(<AllowlistDrawer {...SHARED} policy={mockActiveAllowlist()} viewer={MOCK_VIEWERS.signer} />)

    expect(screen.queryByText('Your allowlist is now active')).not.toBeInTheDocument()
  })

  it('lists the spending limits the allowlist does not cover, keeping the allowlist active', () => {
    render(
      <AllowlistDrawer
        {...SHARED}
        policy={mockActiveAllowlist()}
        viewer={MOCK_VIEWERS.signer}
        uncoveredSpendingLimitCount={2}
      />,
    )

    expect(screen.getByText('2 spending limits')).toBeInTheDocument()
    expect(screen.getByText('Not covered')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('says "1 spending limit" for a single uncovered spending limit', () => {
    render(
      <AllowlistDrawer
        {...SHARED}
        policy={mockActiveAllowlist()}
        viewer={MOCK_VIEWERS.signer}
        uncoveredSpendingLimitCount={1}
      />,
    )

    expect(screen.getByText('1 spending limit')).toBeInTheDocument()
  })

  it('shows no existing policies section when no spending limit is uncovered', () => {
    render(
      <AllowlistDrawer
        {...SHARED}
        policy={mockActiveAllowlist()}
        viewer={MOCK_VIEWERS.signer}
        uncoveredSpendingLimitCount={0}
      />,
    )

    expect(screen.queryByTestId('allowlist-uncovered-spending-limits')).not.toBeInTheDocument()
  })

  it('shows no existing policies section on an unenforced allowlist', () => {
    render(
      <AllowlistDrawer
        {...SHARED}
        policy={mockUnenforcedAllowlist()}
        viewer={MOCK_VIEWERS.signer}
        uncoveredSpendingLimitCount={2}
      />,
    )

    expect(screen.queryByTestId('allowlist-uncovered-spending-limits')).not.toBeInTheDocument()
  })
})
