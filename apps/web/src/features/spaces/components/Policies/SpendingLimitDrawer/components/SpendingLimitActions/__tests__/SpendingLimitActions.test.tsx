import { act, mockClipboard, render, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import type { SpendingLimitDrawerState } from '../../../resolveState'
import SpendingLimitActions from '../SpendingLimitActions'

const TRANSACTION_LINK = 'https://app.safe.global/transactions/tx?id=0x9f3c'

const setup = (state: SpendingLimitDrawerState) =>
  render(
    <SpendingLimitActions
      state={state}
      transactionLink={TRANSACTION_LINK}
      onEdit={jest.fn()}
      onReviewTransaction={jest.fn()}
      onConnectWallet={jest.fn()}
    />,
  )

describe('SpendingLimitActions', () => {
  it('connect: asks a disconnected viewer to connect and explains why', async () => {
    const onConnectWallet = jest.fn()
    const { user } = renderWithUserEvent(
      <SpendingLimitActions
        state={{ kind: 'active', action: 'connect', disabled: false, helper: 'Connect a signer wallet to edit.' }}
        transactionLink={TRANSACTION_LINK}
        onEdit={jest.fn()}
        onReviewTransaction={jest.fn()}
        onConnectWallet={onConnectWallet}
      />,
    )

    expect(screen.getByText('Connect a signer wallet to edit.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Connect wallet' }))

    expect(onConnectWallet).toHaveBeenCalledTimes(1)
  })

  it('review: offers to review the pending transaction and drops a helper even if one were set', () => {
    setup({
      kind: 'pending',
      operation: 'create',
      action: 'review',
      bannerTitle: 'The spending limit is not active as the transaction is not yet executed.',
      bannerLine2: 'Sign and execute the transaction to activate.',
      // resolvePending never actually sets `helper` on a review state, but the review branch
      // must not render it even if it did — it has no matching copy for that action.
      helper: 'should never render',
      signed: 1,
      required: 2,
    })

    expect(screen.getByRole('button', { name: 'Review transaction' })).toBeInTheDocument()
    expect(screen.queryByText('should never render')).not.toBeInTheDocument()
  })

  it('manage: offers a connected signer edit, and no delete', async () => {
    const onEdit = jest.fn()
    const { user } = renderWithUserEvent(
      <SpendingLimitActions
        state={{ kind: 'active', action: 'manage', disabled: false }}
        transactionLink={TRANSACTION_LINK}
        onEdit={onEdit}
        onReviewTransaction={jest.fn()}
        onConnectWallet={jest.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('manage: disables editing for a non-signer and explains why', () => {
    setup({
      kind: 'active',
      action: 'manage',
      disabled: true,
      helper: 'Only signers of this Safe account can edit this spending limit.',
    })

    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
    expect(screen.getByText('Only signers of this Safe account can edit this spending limit.')).toBeInTheDocument()
  })

  describe('copy-link', () => {
    it('copies the transaction link for a signer who already signed', async () => {
      const writeText = mockClipboard()
      setup({
        kind: 'pending',
        operation: 'create',
        action: 'copy-link',
        bannerTitle: 'The spending limit is not active as the transaction is not yet executed.',
        signed: 1,
        required: 2,
      })

      act(() => {
        screen.getByRole('button', { name: /Copy transaction link/ }).click()
      })

      await waitFor(() => expect(writeText).toHaveBeenCalledWith(TRANSACTION_LINK))
    })
  })
})
