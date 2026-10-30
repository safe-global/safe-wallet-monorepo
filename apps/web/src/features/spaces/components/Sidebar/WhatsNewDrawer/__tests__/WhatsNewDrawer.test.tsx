import { render, screen } from '@testing-library/react'
import { WhatsNewDrawer } from '../WhatsNewDrawer'

describe('WhatsNewDrawer', () => {
  it('loads the Beamer feed for the product and the current host when open', () => {
    render(<WhatsNewDrawer productId="product-id" open onClose={jest.fn()} />)

    const feedUrl = new URL(screen.getByTitle("What's new").getAttribute('src') ?? '')
    expect(feedUrl.origin + feedUrl.pathname).toBe('https://app.getbeamer.com/news')
    expect(feedUrl.searchParams.get('app_id')).toBe('product-id')
    expect(feedUrl.searchParams.get('url')).toBe(window.location.host)
  })

  it('sandboxes the feed without top navigation', () => {
    render(<WhatsNewDrawer productId="product-id" open onClose={jest.fn()} />)

    expect(screen.getByTitle("What's new")).toHaveAttribute(
      'sandbox',
      'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox',
    )
  })

  it('does not load the feed while closed', () => {
    render(<WhatsNewDrawer productId="product-id" open={false} onClose={jest.fn()} />)

    expect(screen.queryByTitle("What's new")).not.toBeInTheDocument()
  })
})
