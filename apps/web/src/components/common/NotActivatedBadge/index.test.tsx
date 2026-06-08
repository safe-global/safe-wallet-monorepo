import { render, screen } from '@testing-library/react'
import NotActivatedBadge from '.'

describe('NotActivatedBadge', () => {
  it('renders the Inactive label by default', () => {
    render(<NotActivatedBadge />)

    expect(screen.getByLabelText('Inactive')).toBeInTheDocument()
    expect(screen.getByTestId('not-activated-badge')).toBeInTheDocument()
  })

  it('renders the Activating label when activating', () => {
    render(<NotActivatedBadge isActivating />)

    expect(screen.getByLabelText('Activating')).toBeInTheDocument()
  })

  it('uses a custom data-testid when provided', () => {
    render(<NotActivatedBadge data-testid="pending-activation-icon" />)

    expect(screen.getByTestId('pending-activation-icon')).toBeInTheDocument()
  })

  it('forwards a custom className to the trigger', () => {
    render(<NotActivatedBadge className="shrink-0" />)

    expect(screen.getByTestId('not-activated-badge')).toHaveClass('shrink-0')
  })
})
