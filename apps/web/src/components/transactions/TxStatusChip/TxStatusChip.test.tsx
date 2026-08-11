import { render, screen } from '@testing-library/react'
import TxStatusChip from './index'

describe('TxStatusChip', () => {
  it('renders a successful status as a success Badge', () => {
    render(<TxStatusChip color="success">Executed</TxStatusChip>)

    const badge = screen.getByText('Executed')
    expect(badge).toHaveAttribute('data-slot', 'badge')
    expect(badge).toHaveAttribute('data-variant', 'success')
  })

  it('renders a failed status as a destructive Badge', () => {
    render(<TxStatusChip color="error">Failed</TxStatusChip>)

    const badge = screen.getByText('Failed')
    expect(badge).toHaveAttribute('data-slot', 'badge')
    expect(badge).toHaveAttribute('data-variant', 'destructive')
  })

  it('renders a pending status as a warning Badge', () => {
    render(<TxStatusChip color="warning">Pending</TxStatusChip>)

    const badge = screen.getByText('Pending')
    expect(badge).toHaveAttribute('data-slot', 'badge')
    expect(badge).toHaveAttribute('data-variant', 'warning')
  })

  it('defaults to the primary Badge variant', () => {
    render(<TxStatusChip>Processing</TxStatusChip>)

    const badge = screen.getByText('Processing')
    expect(badge).toHaveAttribute('data-variant', 'default')
  })
})
