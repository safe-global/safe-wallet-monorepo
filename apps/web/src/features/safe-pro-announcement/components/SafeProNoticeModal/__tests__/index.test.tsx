import { fireEvent, render, screen } from '@/tests/test-utils'
import SafeProNoticeModal from '../index'

describe('SafeProNoticeModal', () => {
  it('explains the lock without a close button and leads back to My accounts', () => {
    const onAction = jest.fn()
    render(
      <SafeProNoticeModal
        open
        title="Your free trial ended on Dec 5, 2026"
        body="An admin needs to choose a plan to unlock it."
        onAction={onAction}
      />,
    )

    expect(screen.getByRole('heading')).toHaveTextContent('Your free trial ended on Dec 5, 2026')
    expect(screen.getByText('An admin needs to choose a plan to unlock it.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Back to My accounts' }))
    expect(onAction).toHaveBeenCalled()
  })

  it('becomes a dismissible notice with its own action label when given onOpenChange', () => {
    const onOpenChange = jest.fn()
    const onAction = jest.fn()
    render(
      <SafeProNoticeModal
        open
        title="Your free trial will end in 7 days"
        body="Acme Inc will be locked on Dec 5, 2026."
        actionLabel="Got it"
        onAction={onAction}
        onOpenChange={onOpenChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(onAction).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })
})
