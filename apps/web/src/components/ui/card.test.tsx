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

  it.each([
    { elevated: false, hairline: false, shadow: undefined },
    { elevated: true, hairline: false, shadow: 'shadow-lg' },
    { elevated: false, hairline: true, shadow: 'shadow-hairline' },
    { elevated: true, hairline: true, shadow: 'shadow-hairline-lg' },
  ])('carries one shadow when elevated is $elevated and hairline is $hairline', ({ elevated, hairline, shadow }) => {
    render(
      <Card data-testid="card" elevated={elevated} hairline={hairline}>
        Card
      </Card>,
    )

    const shadows = screen
      .getByTestId('card')
      .className.split(' ')
      .filter((name) => name.startsWith('shadow-'))
    expect(shadows).toEqual(shadow ? [shadow] : [])
  })

  it('lifts to the card surface on hover and focus only when asked to', () => {
    render(
      <>
        <Card data-testid="plain" variant="muted-secondary">
          Plain
        </Card>
        <Card data-testid="lifting" variant="muted-secondary" highlightOnHover>
          Lifting
        </Card>
      </>,
    )

    expect(screen.getByTestId('plain')).not.toHaveClass('hover:bg-card')
    expect(screen.getByTestId('lifting')).toHaveClass('hover:bg-card', 'focus-within:bg-card')
  })
})
