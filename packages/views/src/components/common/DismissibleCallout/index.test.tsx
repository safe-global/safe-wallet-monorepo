import { fireEvent, render, screen } from '@testing-library/react'
import DismissibleCallout from '.'

describe('DismissibleCallout', () => {
  it('renders a warning by default and calls onDismiss when closed', () => {
    const onDismiss = jest.fn()
    render(
      <DismissibleCallout
        title="Heads up"
        description="Read this first."
        onDismiss={onDismiss}
        data-testid="callout"
      />,
    )

    expect(screen.getByTestId('callout')).toHaveClass('bg-warning-subtle')
    expect(screen.getByText('Read this first.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('passes an action through', () => {
    render(<DismissibleCallout title="Tip" action={<button type="button">Open</button>} onDismiss={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
  })

  it('uses the tone it is given', () => {
    render(<DismissibleCallout tone="info" title="Tip" onDismiss={jest.fn()} data-testid="callout" />)

    expect(screen.getByTestId('callout')).toHaveClass('bg-[var(--color-info-background)]')
  })
})
