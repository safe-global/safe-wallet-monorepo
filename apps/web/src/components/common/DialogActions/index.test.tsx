import { render, screen } from '@testing-library/react'
import DialogActions from '.'

describe('DialogActions', () => {
  it('renders a confirm and cancel button at the submit size', () => {
    render(<DialogActions confirmLabel="Confirm" onCancel={jest.fn()} />)

    const confirm = screen.getByRole('button', { name: 'Confirm' })
    const cancel = screen.getByRole('button', { name: 'Cancel' })
    // confirm is the primary default variant, cancel the outline variant, both size="submit"
    expect(confirm).toHaveClass('bg-primary', 'min-w-[7rem]')
    expect(cancel).toHaveClass('bg-background', 'min-w-[7rem]')
  })

  it('renders a confirm-only footer when no onCancel is given', () => {
    render(<DialogActions confirmLabel="Confirm" />)

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
  })

  it('renders the confirm as a destructive action', () => {
    render(<DialogActions confirmLabel="Delete" confirmDestructive />)

    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('text-destructive')
  })

  it('forwards test ids and the disabled state', () => {
    render(
      <DialogActions
        confirmLabel="Confirm"
        confirmTestId="confirm"
        confirmDisabled
        onCancel={jest.fn()}
        cancelTestId="cancel"
      />,
    )

    expect(screen.getByTestId('confirm')).toBeDisabled()
    expect(screen.getByTestId('cancel')).not.toBeDisabled()
  })

  it('swaps the confirm label for a spinner and disables both buttons while loading', () => {
    render(<DialogActions confirmLabel="Confirm" confirmLoading onCancel={jest.fn()} />)

    expect(screen.queryByText('Confirm')).not.toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })
})
