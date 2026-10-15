import { fireEvent, render, screen } from '@/tests/test-utils'
import { CommentFab } from './CommentFab'

describe('CommentFab', () => {
  it('toggles comment mode without the click reaching an open drawer', () => {
    const onToggle = jest.fn()
    const outsidePress = jest.fn()
    document.addEventListener('pointerdown', outsidePress, true)
    document.addEventListener('click', outsidePress, true)
    render(<CommentFab active={false} onToggle={onToggle} />)

    const button = screen.getByRole('button', { name: 'Add a comment' })
    fireEvent.pointerDown(button)
    fireEvent.click(button)

    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(outsidePress).not.toHaveBeenCalled()
    document.removeEventListener('pointerdown', outsidePress, true)
    document.removeEventListener('click', outsidePress, true)
  })

  it('shows a cancel state while commenting', () => {
    render(<CommentFab active onToggle={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Cancel comment' })).toHaveAttribute('aria-pressed', 'true')
  })
})
