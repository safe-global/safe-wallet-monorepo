import { render, screen } from '@testing-library/react'
import TxCard, { TxCardDivider, TxCardFooter } from './index'

describe('TxCardDivider', () => {
  it('bleeds through the card padding so the rule spans the full card width', () => {
    render(<TxCardDivider />)

    // The bleed and the rule are the whole point of the component: a rule that only spans the
    // padded content box stops short of the card's edges, which is what the hand-rolled
    // `<Separator className="-mx-6" />` dividers used to do on their right-hand side.
    expect(screen.getByTestId('tx-card-divider')).toHaveClass('bleed', 'ruled')
  })

  it('takes a className for call-site spacing', () => {
    render(<TxCardDivider className="my-4" />)

    expect(screen.getByTestId('tx-card-divider')).toHaveClass('my-4')
  })

  it('is exposed on the compound component', () => {
    expect(TxCard.Divider).toBe(TxCardDivider)
    expect(TxCard.Footer).toBe(TxCardFooter)
  })
})

describe('TxCardFooter', () => {
  const submit = <button type="button">Continue</button>

  it('renders its own rule by default, so call sites need no separator', () => {
    const { container } = render(<TxCardFooter>{submit}</TxCardFooter>)

    expect(container.firstChild).toHaveClass('slot', 'ruled', 'footer')
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
  })

  /**
   * `divided={false}` is for the steps whose rule sits above other content — errors, warnings —
   * rather than directly above the buttons. Mirrors DialogFooter's `divided`.
   */
  it('omits the rule and its spacing when divided is false', () => {
    const { container } = render(<TxCardFooter divided={false}>{submit}</TxCardFooter>)

    expect(container.firstChild).toHaveClass('slot')
    expect(container.firstChild).not.toHaveClass('ruled')
    expect(container.firstChild).not.toHaveClass('footer')
  })

  /**
   * TxLayoutBase reserves room below the footer for the Back button it centres underneath, and
   * reaches it through this global class. Renaming it silently reintroduces that collision.
   */
  it('keeps the global hook TxLayoutBase targets for back-button clearance', () => {
    const { container } = render(<TxCardFooter>{submit}</TxCardFooter>)

    expect(container.firstChild).toHaveClass('txCardFooter')
  })

  it('accepts a className for call-site spacing', () => {
    const { container } = render(<TxCardFooter className="mt-6">{submit}</TxCardFooter>)

    expect(container.firstChild).toHaveClass('mt-6')
  })
})
