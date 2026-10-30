import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import type { BeamerCornerCard } from '@/store/api/beamer'
import local from '@/services/local-storage/local'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { WhatsNewCornerCard } from '../WhatsNewCornerCard'

let mockCornerCard: BeamerCornerCard | undefined
jest.mock('@/hooks/useBeamerUpdates', () => ({
  useBeamerUpdates: () => ({ unreadCount: 0, cornerCard: mockCornerCard, markAsSeen: jest.fn() }),
}))

describe('WhatsNewCornerCard', () => {
  afterEach(() => {
    // Clears the in-memory copy that useLocalStorage keeps per key as well as localStorage itself.
    const { result } = renderHook(() => useLocalStorage<number>('beamerDismissedCornerCard'))
    act(() => result.current[1](() => undefined))
  })

  it('should, when Beamer sends a corner card post, show its title, text and image', () => {
    mockCornerCard = {
      postId: 1,
      title: 'Safenet checks now available in Safe Pro',
      body: 'Independent security checks on every transaction.',
      imageUrl: 'https://app.getbeamer.com/pictures?id=1',
    }

    const { container } = render(<WhatsNewCornerCard onOpen={jest.fn()} />)

    expect(screen.getByTestId('whats-new-corner-card')).toHaveTextContent('Safenet checks now available in Safe Pro')
    expect(screen.getByTestId('whats-new-corner-card')).toHaveTextContent(
      'Independent security checks on every transaction.',
    )
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://app.getbeamer.com/pictures?id=1')
  })

  it('should, when Beamer sends no corner card post, show nothing', () => {
    mockCornerCard = undefined

    render(<WhatsNewCornerCard onOpen={jest.fn()} />)

    expect(screen.queryByTestId('whats-new-corner-card')).not.toBeInTheDocument()
  })

  it("should, when the user clicks the card, open What's new and hide the card", () => {
    mockCornerCard = { postId: 2, title: 'Safenet checks now available in Safe Pro' }
    const onOpen = jest.fn()

    render(<WhatsNewCornerCard onOpen={onOpen} />)
    fireEvent.click(screen.getByText('Safenet checks now available in Safe Pro'))

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('whats-new-corner-card')).not.toBeInTheDocument()
  })

  it('should, when the user closes the card, keep that post hidden after the page loads again', () => {
    mockCornerCard = { postId: 3, title: 'Safenet checks now available in Safe Pro' }
    const onOpen = jest.fn()

    const { unmount } = render(<WhatsNewCornerCard onOpen={onOpen} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    unmount()
    render(<WhatsNewCornerCard onOpen={onOpen} />)

    expect(screen.queryByTestId('whats-new-corner-card')).not.toBeInTheDocument()
    expect(onOpen).not.toHaveBeenCalled()
    expect(local.getItem('beamerDismissedCornerCard')).toBe(3)
  })
})
