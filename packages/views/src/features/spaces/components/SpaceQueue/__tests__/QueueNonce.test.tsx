import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import ConflictHeaderRow from '@safe-global/views/features/spaces/components/SpaceQueue/ConflictHeaderRow'
import QueueNonce from '@safe-global/views/features/spaces/components/SpaceQueue/QueueNonce'

describe('QueueNonce', () => {
  it('opens its hint on keyboard focus, with the state and the nonce order', async () => {
    const { container, user } = renderWithUserEvent(
      <QueueNonce nonce={12} state="Ready to sign" hint="Next in line. Needs your signature." />,
    )

    expect(container.querySelector('[title]')).toBeNull()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Nonce 12. Next in line. Needs your signature.' })).toHaveFocus()

    expect(await screen.findByText('Nonce 12 · Ready to sign')).toHaveClass('font-medium')
    expect(
      screen.getByText('Next in line. Needs your signature. Each Safe runs its nonces in order, one at a time.'),
    ).toBeInTheDocument()
  })
})

describe('ConflictHeaderRow', () => {
  it("explains the conflict in the nonce's tooltip", async () => {
    const { user } = renderWithUserEvent(
      <table>
        <tbody>
          <ConflictHeaderRow nonce={8} size={3} />
        </tbody>
      </table>,
    )

    await user.tab()

    expect(await screen.findByText('Nonce 8 · Conflicting transaction')).toBeInTheDocument()
    expect(
      screen.getByText(
        '3 conflicting transactions share this nonce; only one can execute. Each Safe runs its nonces in order, one at a time.',
      ),
    ).toBeInTheDocument()
  })

  it('still shows the nonce as text', () => {
    render(
      <table>
        <tbody>
          <ConflictHeaderRow nonce={8} size={2} />
        </tbody>
      </table>,
    )

    expect(screen.getByRole('button', { name: /^Nonce 8\./ })).toHaveTextContent('8')
  })
})
