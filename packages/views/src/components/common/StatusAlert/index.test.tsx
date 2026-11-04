import { fireEvent, render, screen } from '@testing-library/react'
import StatusAlert from '.'

describe('StatusAlert', () => {
  it('renders the title, description and action', () => {
    render(
      <StatusAlert
        tone="error"
        title="Something failed"
        description="Try again later."
        action={<button type="button">Retry</button>}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Something failed')
    expect(screen.getByText('Try again later.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('interrupts screen readers only for errors', () => {
    const { rerender } = render(<StatusAlert tone="error" title="Failed" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Failed')

    rerender(<StatusAlert tone="info" title="Tip" />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Tip')
  })

  it('draws a tone border instead of the borderless Alert surface', () => {
    render(<StatusAlert tone="info" title="Tip" data-testid="status" />)

    expect(screen.getByTestId('status')).toHaveClass('border-info-strong/30')
    expect(screen.getByTestId('status')).not.toHaveClass('border-transparent')
  })

  it('shows a dismiss button only when onDismiss is passed', () => {
    const onDismiss = jest.fn()
    const { rerender } = render(<StatusAlert tone="info" title="Heads up" />)

    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument()

    rerender(<StatusAlert tone="info" title="Heads up" onDismiss={onDismiss} />)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
