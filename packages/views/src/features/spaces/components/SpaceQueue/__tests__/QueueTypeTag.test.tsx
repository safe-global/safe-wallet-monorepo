import { renderWithUserEvent, screen } from '@/tests/test-utils'
import QueueTypeTag from '@safe-global/views/features/spaces/components/SpaceQueue/QueueTypeTag'

describe('QueueTypeTag', () => {
  it('opens what the type means on keyboard focus, with no browser title', async () => {
    const { container, user } = renderWithUserEvent(
      <QueueTypeTag title="Batch" hint="Runs several actions together in one transaction.">
        Batch
      </QueueTypeTag>,
    )

    expect(container.querySelector('[title]')).toBeNull()
    await user.tab()
    const tag = screen.getByTestId('queue-type-tag')
    expect(tag).toHaveFocus()
    expect(tag).toHaveAccessibleName('Batch. Runs several actions together in one transaction.')
    expect(tag).toHaveClass('focus-visible:ring-[3px]')

    expect(await screen.findByText('Runs several actions together in one transaction.')).toBeInTheDocument()
    expect(screen.getByText('Batch', { selector: '[data-slot="tooltip-content"] p' })).toHaveClass('font-medium')
  })

  it('shows only the full name for a type the design does not explain', async () => {
    const { user } = renderWithUserEvent(<QueueTypeTag title="Deposit">Deposit</QueueTypeTag>)

    await user.tab()

    expect(await screen.findByText('Deposit', { selector: '[data-slot="tooltip-content"] p' })).toBeInTheDocument()
  })
})
