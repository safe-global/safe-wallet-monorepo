import { act, mockClipboard, render, screen, waitFor } from '@/tests/test-utils'
import {
  MOCK_SAFE_NAME,
  MOCK_VIEWERS,
  asActivePolicy,
  mockActiveSpendingLimit,
  mockPendingPolicy,
  mockUnenforcedPolicy,
} from '../../mocks/policies'
import * as useChains from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import type { DrawerPolicy, PendingTxOutcome, Viewer } from '../resolveState'
import SpendingLimitDrawer from '../SpendingLimitDrawer'

const SAFE_ADDRESS = '0x8675B754342754A30A2AeF474D114d8460bca19b'

const OVERVIEW = {
  lastUpdated: 'Sep 22, 2026',
  enforcedBy: 'Safe allowance module',
}

const TRANSACTION_LINK = 'https://app.safe.global/transactions/tx?id=0x9f3c'

const setup = (
  policy: DrawerPolicy = mockActiveSpendingLimit(),
  viewer: Viewer = MOCK_VIEWERS.signer,
  { onEdit, outcome }: { onEdit?: () => void; outcome?: PendingTxOutcome } = { onEdit: jest.fn() },
) => {
  const shared = {
    open: true,
    onClose: jest.fn(),
    viewer,
    safe: { address: SAFE_ADDRESS, name: MOCK_SAFE_NAME },
    overview: OVERVIEW,
    onConnectWallet: jest.fn(),
  }

  return render(
    policy.status === 'pending' ? (
      <SpendingLimitDrawer
        {...shared}
        policy={policy}
        transactionLink={TRANSACTION_LINK}
        onReviewTransaction={jest.fn()}
        outcome={outcome}
      />
    ) : (
      <SpendingLimitDrawer {...shared} policy={policy} onEdit={onEdit} />
    ),
  )
}

describe('SpendingLimitDrawer', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('calls an executed transaction activating in the header, not pending', () => {
    setup(mockPendingPolicy(), MOCK_VIEWERS.signer, { outcome: 'executed' })

    expect(screen.getByText('Activating')).toBeInTheDocument()
    expect(screen.queryByText('Pending')).not.toBeInTheDocument()
  })

  it('shows no status chip for a transaction that will never execute', () => {
    setup(mockPendingPolicy(), MOCK_VIEWERS.signer, { outcome: 'deleted' })

    expect(screen.queryByText('Pending')).not.toBeInTheDocument()
    expect(screen.queryByTestId('policy-status-skeleton')).not.toBeInTheDocument()
  })

  it('drops the signatures and the footer once the transaction has left the queue', () => {
    setup(mockPendingPolicy(), MOCK_VIEWERS.signer, { outcome: 'replaced' })

    expect(
      screen.getByText('Another transaction used this nonce, so this one can no longer be executed.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Pending signatures')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /review transaction|copy transaction link|connect wallet/i }),
    ).not.toBeInTheDocument()
  })

  it('titles itself from the policy type rather than a stored name', () => {
    setup()

    expect(screen.getByText('Spending limit')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  // Editing covers removal, so Edit is the only action an active policy offers.
  it('offers edit, and only edit, to a connected signer', () => {
    setup()

    expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  it('shows a usage bar per allowance for an active policy', () => {
    setup()

    expect(screen.getAllByRole('progressbar')).toHaveLength(2)
  })

  // The helper explains a disabled control, so hiding it behind hover would hide the explanation.
  it('disables editing for a non-signer and explains why without hover', () => {
    setup(mockActiveSpendingLimit(), MOCK_VIEWERS.nonSigner)

    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
    expect(screen.getByText('Only signers of this Safe account can edit this spending limit.')).toBeInTheDocument()
  })

  it('asks a disconnected viewer to connect instead of showing dead controls', () => {
    setup(mockActiveSpendingLimit(), MOCK_VIEWERS.disconnected)

    expect(screen.getByRole('button', { name: 'Connect wallet' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('shows the pending banner, the signature count, a review action and no usage bars', () => {
    setup(mockPendingPolicy(), MOCK_VIEWERS.signer)

    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(
      screen.getByText('The spending limit is not active as the transaction is not yet executed.'),
    ).toBeInTheDocument()
    expect(screen.getByText('1 of 2 signed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review transaction' })).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  // A module that is configured but not enabled protects nothing, so calling it Active would be a lie.
  it('calls a policy whose module is disabled not enforced, never active', () => {
    setup(asActivePolicy(mockUnenforcedPolicy()))

    expect(screen.getByText('Not enforced')).toBeInTheDocument()
    expect(screen.queryByText('Active')).not.toBeInTheDocument()
  })

  it('keeps editing out of reach for an unenforced policy, and explains why', () => {
    setup(asActivePolicy(mockUnenforcedPolicy()))

    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
    expect(
      screen.getByText('The allowance module is not enabled on this Safe account, so this limit is not enforced.'),
    ).toBeInTheDocument()
  })

  it('shows no usage bars for an unenforced policy, whose spending nothing measures', () => {
    setup(asActivePolicy(mockUnenforcedPolicy()))

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('disables editing until an edit flow is supplied', () => {
    setup(mockActiveSpendingLimit(), MOCK_VIEWERS.signer, {})

    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
    expect(screen.getByText('Editing a spending limit is coming soon.')).toBeInTheDocument()
  })

  it('leaves out the last updated row while the payload carries no timestamp', () => {
    render(
      <SpendingLimitDrawer
        open
        onClose={jest.fn()}
        policy={mockActiveSpendingLimit()}
        viewer={MOCK_VIEWERS.signer}
        safe={{ address: SAFE_ADDRESS, name: MOCK_SAFE_NAME }}
        overview={{ enforcedBy: 'Safe allowance module' }}
        onConnectWallet={jest.fn()}
      />,
    )

    expect(screen.queryByText('Last updated')).not.toBeInTheDocument()
    expect(screen.getByText('Enforced by')).toBeInTheDocument()
  })

  it("links the Safe account to that Safe's settings page", () => {
    jest.spyOn(useChains, 'useChain').mockReturnValue(chainBuilder().with({ chainId: '1', shortName: 'eth' }).build())

    setup()

    expect(screen.getByRole('link', { name: MOCK_SAFE_NAME })).toHaveAttribute(
      'href',
      `/settings/setup?safe=eth%3A${SAFE_ADDRESS}`,
    )
  })

  it('leaves the Safe account unlinked when its chain is unknown', () => {
    jest.spyOn(useChains, 'useChain').mockReturnValue(undefined)

    setup()

    expect(screen.queryByRole('link', { name: MOCK_SAFE_NAME })).not.toBeInTheDocument()
  })

  describe('a signer who has already signed', () => {
    let writeText: jest.Mock

    beforeEach(() => {
      writeText = mockClipboard()
    })

    it('offers a copy-link button', () => {
      setup(mockPendingPolicy(), MOCK_VIEWERS.signerWhoSigned)

      expect(screen.getByRole('button', { name: /Copy transaction link/ })).toBeInTheDocument()
    })

    it('copies the transaction link when clicked', async () => {
      setup(mockPendingPolicy(), MOCK_VIEWERS.signerWhoSigned)

      act(() => {
        screen.getByRole('button', { name: /Copy transaction link/ }).click()
      })

      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith(TRANSACTION_LINK)
      })
    })
  })
})
