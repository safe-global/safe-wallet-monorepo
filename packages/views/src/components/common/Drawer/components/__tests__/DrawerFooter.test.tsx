import { render, screen } from '@/tests/test-utils'
import { DrawerFooter } from '../DrawerFooter'

describe('DrawerFooter', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <DrawerFooter>
        <button>Footer action</button>
      </DrawerFooter>,
    )

    expect(container.firstChild).toMatchSnapshot()
  })

  it('shows a hint above the actions', () => {
    render(
      <DrawerFooter hint="Any signer can start this transaction.">
        <button>Review transaction</button>
      </DrawerFooter>,
    )

    const hint = screen.getByText('Any signer can start this transaction.')

    expect(hint.compareDocumentPosition(screen.getByRole('button'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('puts the summary above the hint and the actions', () => {
    render(
      <DrawerFooter summary={<span>Signatures</span>} hint="Any signer can execute.">
        <button>Execute</button>
      </DrawerFooter>,
    )

    const summary = screen.getByText('Signatures')

    expect(summary.compareDocumentPosition(screen.getByText('Any signer can execute.'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(summary.compareDocumentPosition(screen.getByRole('button'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })
})
