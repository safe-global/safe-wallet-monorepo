import { fireEvent, render, screen } from '@/tests/test-utils'
import SafeProModalFrame from '../index'

describe('SafeProModalFrame', () => {
  it('renders the hero above the body and hides the close button by default', () => {
    render(
      <SafeProModalFrame open>
        <p>Body</p>
      </SafeProModalFrame>,
    )

    expect(screen.getByRole('dialog')).toHaveClass('max-w-[640px]')
    expect(screen.getAllByRole('img', { hidden: true }).length).toBeGreaterThan(0)
    expect(screen.getByText('Body')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })

  it('shows the close button when asked and reports the dismissal', () => {
    const onOpenChange = jest.fn()
    render(
      <SafeProModalFrame open onOpenChange={onOpenChange} showCloseButton>
        <p>Body</p>
      </SafeProModalFrame>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onOpenChange.mock.calls[0][0]).toBe(false)
  })
})
