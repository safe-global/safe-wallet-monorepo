import { advanceClock, fireEvent, render, renderOnFakeClock, screen } from '@/tests/test-utils'
import QueueSafeTag from '@safe-global/views/features/spaces/components/SpaceQueue/QueueSafeTag'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'

const address = '0x1234567890123456789012345678901234567890'
const chain: ChainInfo = { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }
const card = <span data-testid="party-card">Card</span>

describe('QueueSafeTag', () => {
  afterEach(() => jest.useRealTimers())

  it('has no browser title', () => {
    const { container } = render(<QueueSafeTag address={address} name="Treasury" chain={chain} card={card} />)

    expect(container.querySelector('[title]')).toBeNull()
  })

  it('mounts the party card only while it is open', () => {
    render(<QueueSafeTag address={address} name="Treasury" chain={chain} card={card} />)

    expect(screen.queryByTestId('party-card')).not.toBeInTheDocument()
  })

  it.each(['hover', 'Enter'])('shows the party card in a wide popover on %s', async (how) => {
    jest.useFakeTimers()
    const { user } = renderOnFakeClock(<QueueSafeTag address={address} name="Treasury" chain={chain} card={card} />)

    const tag = screen.getByTestId('queue-safe-tag')
    if (how === 'hover') {
      await user.hover(tag)
    } else {
      await user.tab()
      expect(tag).toHaveFocus()
      expect(tag).toHaveClass('outline-hidden', 'focus-visible:ring-[3px]', 'focus-visible:ring-ring/50')
      await user.keyboard('{Enter}')
    }
    await advanceClock(200)

    expect(await screen.findByTestId('party-card')).toBeInTheDocument()
    expect(screen.getByTestId('party-card').closest('[data-slot="popover-content"]')).toHaveClass('max-w-none')
  })

  it('stays a plain tag without a link', () => {
    render(<QueueSafeTag address={address} name="Treasury" chain={chain} card={card} />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  const href = '/home?safe=eth:0x1'
  const renderLink = () => {
    jest.useFakeTimers()
    const push = jest.fn(() => Promise.resolve(true))
    const view = renderOnFakeClock(
      <QueueSafeTag address={address} name="Treasury" chain={chain} card={card} href={href} />,
      {
        routerProps: { push },
      },
    )
    return { ...view, push }
  }

  it('links to the Safe', () => {
    render(<QueueSafeTag address={address} name="Treasury" chain={chain} card={card} href={href} />)

    expect(screen.getByRole('link', { name: /Treasury/ })).toHaveAttribute('href', href)
  })

  it('opens the Safe in place and keeps the party card closed on a mouse click', async () => {
    const { push } = renderLink()
    const link = screen.getByRole('link', { name: /Treasury/ })

    fireEvent.pointerDown(link, { pointerType: 'mouse' })
    fireEvent.click(link, { detail: 1 })
    await advanceClock(200)

    expect(push).toHaveBeenCalledWith(href, expect.anything(), expect.anything())
    expect(screen.queryByTestId('party-card')).not.toBeInTheDocument()
  })

  it('leaves a modified mouse click to the browser and keeps the party card closed', async () => {
    const { push } = renderLink()
    const link = screen.getByRole('link', { name: /Treasury/ })
    // jsdom can't open a new tab, so stop the browser default once the component has seen the click
    const stopDefault = (event: Event) => event.preventDefault()
    window.addEventListener('click', stopDefault)

    fireEvent.pointerDown(link, { pointerType: 'mouse' })
    fireEvent.click(link, { detail: 1, metaKey: true })
    await advanceClock(200)
    window.removeEventListener('click', stopDefault)

    expect(push).not.toHaveBeenCalled()
    expect(screen.queryByTestId('party-card')).not.toBeInTheDocument()
  })

  it('opens the party card instead of the Safe on a tap', async () => {
    const { push } = renderLink()
    const link = screen.getByRole('link', { name: /Treasury/ })

    fireEvent.pointerDown(link, { pointerType: 'touch' })
    fireEvent.click(link, { detail: 1 })
    await advanceClock(200)

    expect(push).not.toHaveBeenCalled()
    expect(await screen.findByTestId('party-card')).toBeInTheDocument()
  })

  it('opens the party card instead of the Safe on Enter', async () => {
    const { user, push } = renderLink()

    await user.tab()
    await user.keyboard('{Enter}')
    await advanceClock(200)

    expect(push).not.toHaveBeenCalled()
    expect(await screen.findByTestId('party-card')).toBeInTheDocument()
  })

  it('still shows the party card on hover when it links to the Safe', async () => {
    jest.useFakeTimers()
    const { user } = renderOnFakeClock(
      <QueueSafeTag address={address} name="Treasury" chain={chain} card={card} href={href} />,
    )

    await user.hover(screen.getByRole('link', { name: /Treasury/ }))
    await advanceClock(200)

    expect(await screen.findByTestId('party-card')).toBeInTheDocument()
  })
})
