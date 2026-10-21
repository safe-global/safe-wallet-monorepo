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

  it('shows a dismiss button only when onDismiss is passed', () => {
    const onDismiss = jest.fn()
    const { rerender } = render(<StatusAlert tone="info" title="Heads up" />)

    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument()

    rerender(<StatusAlert tone="info" title="Heads up" onDismiss={onDismiss} />)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
