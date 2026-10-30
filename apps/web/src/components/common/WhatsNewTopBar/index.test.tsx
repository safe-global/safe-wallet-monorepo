import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import type { BeamerTopBar } from '@/store/api/beamer'
import local from '@/services/local-storage/local'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import WhatsNewTopBar from './index'

let mockTopBar: BeamerTopBar | undefined
jest.mock('@/hooks/useBeamerUpdates', () => ({
  useBeamerUpdates: () => ({ unreadCount: 0, topBar: mockTopBar, markAsSeen: jest.fn() }),
}))

describe('WhatsNewTopBar', () => {
  afterEach(() => {
    // Clears the in-memory copy that useLocalStorage keeps per key as well as localStorage itself.
    const { result } = renderHook(() => useLocalStorage<number>('beamerDismissedTopBar'))
    act(() => result.current[1](() => undefined))
  })

  it('should, when Beamer sends a top bar post, show its category, text and link', () => {
    mockTopBar = {
      postId: 1,
      title: 'Some transactions are delayed.',
      category: 'Incident',
      link: { text: 'Status page', url: 'https://status.safe.global/' },
    }

    render(<WhatsNewTopBar />)

    expect(screen.getByTestId('whats-new-top-bar')).toHaveTextContent('Incident')
    expect(screen.getByTestId('whats-new-top-bar')).toHaveTextContent('Some transactions are delayed.')
    expect(screen.getByRole('link', { name: 'Status page' })).toHaveAttribute('href', 'https://status.safe.global/')
  })

  it('should, when Beamer sends no top bar post, show nothing', () => {
    mockTopBar = undefined

    render(<WhatsNewTopBar />)

    expect(screen.queryByTestId('whats-new-top-bar')).not.toBeInTheDocument()
  })

  it('should, when the user closes the bar, keep that post hidden after the page loads again', () => {
    mockTopBar = { postId: 2, title: 'Maintenance tonight.' }

    const { unmount } = render(<WhatsNewTopBar />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    unmount()
    render(<WhatsNewTopBar />)

    expect(screen.queryByTestId('whats-new-top-bar')).not.toBeInTheDocument()
    expect(local.getItem('beamerDismissedTopBar')).toBe(2)
  })

  it('should, when a new top bar post arrives after the old one was closed, show the new post', () => {
    mockTopBar = { postId: 3, title: 'Maintenance tonight.' }
    const { rerender } = render(<WhatsNewTopBar />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    mockTopBar = { postId: 4, title: 'Maintenance is over.' }
    rerender(<WhatsNewTopBar />)

    expect(screen.getByTestId('whats-new-top-bar')).toHaveTextContent('Maintenance is over.')
  })
})
