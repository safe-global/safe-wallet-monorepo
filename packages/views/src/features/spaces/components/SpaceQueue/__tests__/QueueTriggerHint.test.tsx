import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { QueueTriggerHint } from '@safe-global/views/features/spaces/components/SpaceQueue/QueueHint'

describe('QueueTriggerHint', () => {
  it('makes a label focusable and shows its hint on focus', async () => {
    const { user } = renderWithUserEvent(
      <QueueTriggerHint hint="This order expired. Reject or delete it to free the nonce.">
        <span>Expired</span>
      </QueueTriggerHint>,
    )

    await user.tab()
    expect(screen.getByText('Expired').parentElement).toHaveFocus()

    expect(await screen.findByText('This order expired. Reject or delete it to free the nonce.')).toBeInTheDocument()
  })
})
