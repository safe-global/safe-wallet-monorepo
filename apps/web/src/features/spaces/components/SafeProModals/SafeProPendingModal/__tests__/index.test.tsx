import { render, screen } from '@/tests/test-utils'
import SafeProPendingModal from '../index'

describe('SafeProPendingModal', () => {
  it('blocks the screen with the hero, a spinner and the wait copy, and cannot be closed', () => {
    render(<SafeProPendingModal title="Confirming your subscription" body="This usually takes a few seconds." />)

    expect(screen.getByRole('heading')).toHaveTextContent('Confirming your subscription')
    expect(screen.getByText('This usually takes a few seconds.')).toBeInTheDocument()
    expect(screen.getByTestId('safe-pro-pending')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })
})
