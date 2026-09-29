import { act, mockClipboard, render, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import type { SpendingLimitDrawerState } from '../../../resolveState'
import SpendingLimitActions from '../SpendingLimitActions'

const TRANSACTION_LINK = 'https://app.safe.global/transactions/tx?id=0x9f3c'

const setup = (state: SpendingLimitDrawerState) =>
  render(
    <SpendingLimitActions
      state={state}
      pending={{ transactionLink: TRANSACTION_LINK, onReviewTransaction: jest.fn() }}
      onEdit={jest.fn()}
      onConnectWallet={jest.fn()}
    />,
  )

describe('SpendingLimitActions', () => {
  it('none: renders no footer for a transaction that has left the queue', () => {
    const { container } = setup({
      kind: 'closed',
      operation: 'create',
      action: 'none',
      bannerTitle: 'The transaction was deleted.',
      bannerLine2: 'Close this panel to see the current policies.',
    })

    expect(container).toBeEmptyDOMElement()
  })

  it('review: stays disabled until the transaction has loaded', () => {
    render(
      <SpendingLimitActions
        state={{ kind: 'pending', operation: 'create', action: 'review', bannerTitle: 't', signed: 1, required: 2 }}
        pending={{ transactionLink: TRANSACTION_LINK }}
        onConnectWallet={jest.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Review transaction' })).toBeDisabled()
  })

  it('connect: asks a disconnected viewer to connect and explains why', async () => {
    const onConnectWallet = jest.fn()
    const { user } = renderWithUserEvent(
      <SpendingLimitActions
        state={{ kind: 'active', action: 'connect', disabled: false, helper: 'Connect a signer wallet to edit.' }}
        pending={{ transactionLink: TRANSACTION_LINK, onReviewTransaction: jest.fn() }}
        onEdit={jest.fn()}
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
        onEdit={onEdit}
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

  it('manage: keeps the non-signer reason ahead of the coming-soon line', () => {
    render(
      <SpendingLimitActions
        state={{
          kind: 'active',
          action: 'manage',
          disabled: true,
          helper: 'Only signers of this Safe account can edit this spending limit.',
        }}
        onConnectWallet={jest.fn()}
      />,
    )

    expect(screen.getByText('Only signers of this Safe account can edit this spending limit.')).toBeInTheDocument()
    expect(screen.queryByText('Editing a spending limit is coming soon.')).not.toBeInTheDocument()
  })

  it('manage: keeps an unenforced policy out of the edit flow', () => {
    setup({
      kind: 'unenforced',
      action: 'manage',
      disabled: true,
      helper: 'The allowance module is not enabled on this Safe account, so this limit is not enforced.',
    })

    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
    expect(
      screen.getByText('The allowance module is not enabled on this Safe account, so this limit is not enforced.'),
    ).toBeInTheDocument()
  })

  it('manage: disables editing while no edit flow is supplied', () => {
    render(
      <SpendingLimitActions
        state={{ kind: 'active', action: 'manage', disabled: false }}
        onConnectWallet={jest.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
    expect(screen.getByText('Editing a spending limit is coming soon.')).toBeInTheDocument()
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
