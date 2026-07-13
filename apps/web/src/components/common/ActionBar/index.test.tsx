import { render, screen } from '@testing-library/react'
import { ActionBar, ActionButton } from '.'

describe('ActionBar', () => {
  it('lays out its children in a wrapping flex row', () => {
    render(
      <ActionBar data-testid="bar">
        <ActionButton>Send</ActionButton>
      </ActionBar>,
    )

    expect(screen.getByTestId('bar')).toHaveClass('flex', 'flex-wrap', 'items-center', 'gap-2')
  })
})

describe('ActionButton', () => {
  it('renders its label locked to the action CTA pill scale', () => {
    render(<ActionButton>Send</ActionButton>)

    const button = screen.getByRole('button', { name: 'Send' })
    expect(button).toHaveClass('h-10', 'px-6', 'gap-2')
  })

  it('stretches to the container width when fullWidth', () => {
    render(<ActionButton fullWidth>Send</ActionButton>)

    expect(screen.getByRole('button', { name: 'Send' })).toHaveClass('w-full')
  })
})
