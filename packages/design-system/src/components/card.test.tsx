import { render, screen } from '@testing-library/react'
import { Card } from './card'

describe('Card', () => {
  it('renders a div by default', () => {
    render(<Card data-testid="card">Default card</Card>)

    expect(screen.getByTestId('card').tagName).toBe('DIV')
  })

  it('can render a semantic section', () => {
    render(
      <Card as="section" aria-label="Workspace settings">
        Settings content
      </Card>,
    )

    const section = screen.getByRole('region', { name: 'Workspace settings' })
    expect(section.tagName).toBe('SECTION')
    expect(section).toHaveAttribute('data-slot', 'card')
  })

  it('renders outlined and muted variants through props', () => {
    render(
      <>
        <Card data-testid="outlined-card" variant="outlined">
          Outlined card
        </Card>
        <Card data-testid="muted-card" variant="muted">
          Muted card
        </Card>
      </>,
    )

    expect(screen.getByTestId('outlined-card')).toHaveAttribute('data-variant', 'outlined')
    expect(screen.getByTestId('muted-card')).toHaveAttribute('data-variant', 'muted')
  })

  it('supports explicit radius choices without className drift', () => {
    render(
      <>
        <Card data-testid="lg-card" radius="lg">
          Large radius card
        </Card>
        <Card data-testid="square-card" radius="none">
          Square card
        </Card>
      </>,
    )

    expect(screen.getByTestId('lg-card')).toHaveAttribute('data-radius', 'lg')
    expect(screen.getByTestId('square-card')).toHaveAttribute('data-radius', 'none')
  })

  it('supports the xl radius choice', () => {
    render(
      <Card data-testid="xl-card" radius="xl">
        Extra large radius card
      </Card>,
    )

    expect(screen.getByTestId('xl-card')).toHaveAttribute('data-radius', 'xl')
  })
})
