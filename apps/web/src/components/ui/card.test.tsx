import { render, screen } from '@testing-library/react'
import { Card } from './card'

describe('Card', () => {
  it('renders a div by default', () => {
    render(<Card data-testid="card">Default card</Card>)

    expect(screen.getByTestId('card').tagName).toBe('DIV')
  })

  it('can render a semantic section while keeping card styling', () => {
    render(
      <Card as="section" aria-label="Workspace settings">
        Settings content
      </Card>,
    )

    const section = screen.getByRole('region', { name: 'Workspace settings' })
    expect(section.tagName).toBe('SECTION')
    expect(section).toHaveAttribute('data-slot', 'card')
    expect(section).toHaveClass('bg-card')
    expect(section).toHaveClass('rounded-xl')
  })
})
