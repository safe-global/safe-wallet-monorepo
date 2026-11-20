import { render, screen } from '@testing-library/react'
import { WhatsNewDrawer } from '../WhatsNewDrawer'

describe('WhatsNewDrawer', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

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

  it("closes when Beamer's feed asks to hide", () => {
    const onClose = jest.fn()
    render(<WhatsNewDrawer productId="product-id" open onClose={onClose} />)

    window.dispatchEvent(new MessageEvent('message', { origin: 'https://app.getbeamer.com', data: 'hide' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ignores hide messages from other origins', () => {
    const onClose = jest.fn()
    render(<WhatsNewDrawer productId="product-id" open onClose={onClose} />)

    window.dispatchEvent(new MessageEvent('message', { origin: 'https://evil.example', data: 'hide' }))

    expect(onClose).not.toHaveBeenCalled()
  })

  it("should, when Beamer's feed asks to open an https link, open it in a new tab", () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null)
    render(<WhatsNewDrawer productId="product-id" open onClose={jest.fn()} />)

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://app.getbeamer.com',
        data: 'openUrl:{"url":"https://safenet.xyz/","openInNewWindow":true,"postTitle":"Safenet"}',
      }),
    )

    expect(open).toHaveBeenCalledWith('https://safenet.xyz/', '_blank', 'noopener,noreferrer')
  })

  it("should, when Beamer's feed asks to open a link in the same window, still open it in a new tab", () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null)
    render(<WhatsNewDrawer productId="product-id" open onClose={jest.fn()} />)

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://app.getbeamer.com',
        data: 'openUrl:{"url":"https://safe.global/","openInNewWindow":false}',
      }),
    )

    expect(open).toHaveBeenCalledWith('https://safe.global/', '_blank', 'noopener,noreferrer')
  })

  it("should, when Beamer's feed asks to open a link that is not https, not open it", () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null)
    render(<WhatsNewDrawer productId="product-id" open onClose={jest.fn()} />)

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://app.getbeamer.com',
        data: 'openUrl:{"url":"javascript:alert(1)","openInNewWindow":true}',
      }),
    )

    expect(open).not.toHaveBeenCalled()
  })

  it('should, when a link request comes from another origin, not open it', () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null)
    render(<WhatsNewDrawer productId="product-id" open onClose={jest.fn()} />)

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://evil.example',
        data: 'openUrl:{"url":"https://evil.example/","openInNewWindow":true}',
      }),
    )

    expect(open).not.toHaveBeenCalled()
  })

  it('does not load the feed while closed', () => {
    render(<WhatsNewDrawer productId="product-id" open={false} onClose={jest.fn()} />)

    expect(screen.queryByTitle("What's new")).not.toBeInTheDocument()
  })
})
