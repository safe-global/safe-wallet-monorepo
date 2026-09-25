import { act, mockClipboard, render, screen, waitFor } from '@/tests/test-utils'
import {
  MOCK_SAFE_NAME,
  MOCK_VIEWERS,
  asActivePolicy,
  mockActiveSpendingLimit,
  mockPendingPolicy,
  mockUnenforcedPolicy,
} from '../../mocks/policies'
import type { DrawerPolicy, Viewer } from '../resolveState'
import SpendingLimitDrawer from '../SpendingLimitDrawer'

const SAFE_ADDRESS = '0x8675B754342754A30A2AeF474D114d8460bca19b'

const OVERVIEW = {
  lastUpdated: 'Sep 22, 2026',
  enforcedBy: 'Safe allowance module',
}

const TRANSACTION_LINK = 'https://app.safe.global/transactions/tx?id=0x9f3c'

const setup = (policy: DrawerPolicy = mockActiveSpendingLimit(), viewer: Viewer = MOCK_VIEWERS.signer) =>
  render(
    <SpendingLimitDrawer
      open
      onClose={jest.fn()}
      policy={policy}
      viewer={viewer}
      safe={{ address: SAFE_ADDRESS, name: MOCK_SAFE_NAME }}
      overview={OVERVIEW}
      transactionLink={TRANSACTION_LINK}
      onEdit={jest.fn()}
      onReviewTransaction={jest.fn()}
      onConnectWallet={jest.fn()}
    />,
  )

describe('SpendingLimitDrawer', () => {
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
