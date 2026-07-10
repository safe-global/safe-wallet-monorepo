import { render, screen } from '@testing-library/react'
import { Card, CardContent } from './card'

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
    expect(section).toHaveClass('rounded-lg')
  })

  it('applies the lg size padding scale', () => {
    render(
      <Card data-testid="lg-card" size="lg">
        <CardContent data-testid="lg-content">Roomy content</CardContent>
      </Card>,
    )

    expect(screen.getByTestId('lg-card')).toHaveAttribute('data-size', 'lg')
    expect(screen.getByTestId('lg-card')).toHaveClass('gap-8', 'py-8')
    expect(screen.getByTestId('lg-content')).toHaveClass('group-data-[size=lg]/card:px-8')
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
    expect(screen.getByTestId('outlined-card')).toHaveClass('border', 'border-border')
    expect(screen.getByTestId('muted-card')).toHaveAttribute('data-variant', 'muted')
    expect(screen.getByTestId('muted-card')).toHaveClass('bg-muted')
  })

  it('supports flush spacing while removing slot padding', () => {
    render(
      <Card data-testid="flush-card" size="none">
        <CardContent data-testid="flush-content">Flush content</CardContent>
      </Card>,
    )

    expect(screen.getByTestId('flush-card')).toHaveAttribute('data-size', 'none')
    expect(screen.getByTestId('flush-card')).toHaveClass('gap-0', 'py-0')
    expect(screen.getByTestId('flush-content')).toHaveClass('group-data-[size=none]/card:px-0')
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
    expect(screen.getByTestId('lg-card')).toHaveClass('rounded-lg')
    expect(screen.getByTestId('square-card')).toHaveAttribute('data-radius', 'none')
    expect(screen.getByTestId('square-card')).toHaveClass('rounded-none')
  })
})
