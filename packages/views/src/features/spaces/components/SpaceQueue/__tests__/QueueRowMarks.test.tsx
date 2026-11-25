import { renderWithUserEvent, screen } from '@/tests/test-utils'
import {
  QueueProposerMark,
  QueueWarningMarker,
} from '@safe-global/views/features/spaces/components/SpaceQueue/QueueRowMarks'

describe('QueueProposerMark', () => {
  it('says a proposer created it on keyboard focus', async () => {
    const { container, user } = renderWithUserEvent(<QueueProposerMark threshold={2} />)

    expect(container.querySelector('[title]')).toBeNull()
    await user.tab()
    expect(screen.getByRole('img', { name: 'Created by a proposer' })).toHaveFocus()

    expect(
      await screen.findByText('No owner has signed yet, 2 needed. Sign or reject it to proceed.'),
    ).toBeInTheDocument()
  })
})

describe('QueueWarningMarker', () => {
  it('lists each warning on keyboard focus', async () => {
    const { user } = renderWithUserEvent(<QueueWarningMarker warnings={['Order expired', 'Sends to this Safe']} />)

    await user.tab()
    expect(screen.getByRole('button', { name: 'Warnings: Order expired, Sends to this Safe' })).toHaveFocus()

    expect(await screen.findByText('Order expired', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('Sends to this Safe', { selector: 'p' })).toBeInTheDocument()
  })
})
