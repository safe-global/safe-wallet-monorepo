import { act, render, screen, waitFor } from '@/tests/test-utils'
import { MOCK_SAFE_NAME, MOCK_VIEWERS, mockActiveSpendingLimit, mockPendingPolicy } from '../../mocks/policies'
import type { DrawerPolicy, Viewer } from '../resolveState'
import SpendingLimitDrawer from '../SpendingLimitDrawer'

const OVERVIEW = {
  appliesTo: { address: '0x8675B754342754A30A2AeF474D114d8460bca19b', name: 'Treasury' },
  initiatedBy: { address: '0x0000000000000000000000000000000000000A11', name: 'Alice' },
  lastUpdated: 'Sep 22, 2026',
  enforcedBy: 'Safe module',
}

const TRANSACTION_LINK = 'https://app.safe.global/transactions/tx?id=0x9f3c'

const setup = (policy: DrawerPolicy = mockActiveSpendingLimit(), viewer: Viewer = MOCK_VIEWERS.signer) =>
  render(
    <SpendingLimitDrawer
      open
      onClose={jest.fn()}
      policy={policy}
      viewer={viewer}
      safe={{ address: OVERVIEW.appliesTo.address, name: MOCK_SAFE_NAME }}
      overview={OVERVIEW}
      transactionLink={TRANSACTION_LINK}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
      onReviewTransaction={jest.fn()}
      onConnectWallet={jest.fn()}
    />,
  )

class FakeClipboard {
  private text = ''
  readText() {
    return Promise.resolve(this.text)
  }

  writeText(text: string) {
    this.text = text
    return Promise.resolve()
  }
}

describe('SpendingLimitDrawer', () => {
  it('titles itself from the policy type rather than a stored name', () => {
    setup()

    expect(screen.getByText('Spending limit')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('offers delete and edit to a connected signer', () => {
    setup()

    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled()
  })

  it('shows a usage bar per allowance for an active policy', () => {
    setup()

    expect(screen.getAllByRole('progressbar')).toHaveLength(2)
  })

  // The helper explains a disabled control, so hiding it behind hover would hide the explanation.
  it('disables both actions for a non-signer and explains why without hover', () => {
    setup(mockActiveSpendingLimit(), MOCK_VIEWERS.nonSigner)

    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
    expect(
      screen.getByText('Only signers of this Safe account can delete or edit this spending limit.'),
    ).toBeInTheDocument()
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

  describe('a signer who has already signed', () => {
    const originalClipboard = { ...global.navigator.clipboard }

    beforeAll(() => {
      // @ts-expect-error read-only in the lib types, but jsdom lets a test replace it
      navigator.clipboard = new FakeClipboard()
    })

    beforeEach(() => {
      navigator.clipboard.writeText('')
    })

    afterAll(() => {
      // @ts-expect-error see above
      navigator.clipboard = originalClipboard
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

      await waitFor(async () => {
        expect(await navigator.clipboard.readText()).toEqual(TRANSACTION_LINK)
      })
    })
  })
})
