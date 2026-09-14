import { fireEvent, render, screen } from '@/tests/test-utils'
import SafeProLockedMemberModal from '../index'

describe('SafeProLockedMemberModal', () => {
  it('explains the lock without a close button and leads back to My accounts', () => {
    const onBack = jest.fn()
    render(
      <SafeProLockedMemberModal
        open
        title="Your free trial ended on Dec 5, 2026"
        body="An admin needs to choose a plan to unlock it."
        onBack={onBack}
      />,
    )

    expect(screen.getByRole('heading')).toHaveTextContent('Your free trial ended on Dec 5, 2026')
    expect(screen.getByText('An admin needs to choose a plan to unlock it.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Back to My accounts' }))
    expect(onBack).toHaveBeenCalled()
  })
})
