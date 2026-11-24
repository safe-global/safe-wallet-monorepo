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

  it('links to the Safe and hands the click to the app', () => {
    const onNavigate = jest.fn((event: { preventDefault: () => void }) => event.preventDefault())
    render(
      <QueueSafeTag
        address={address}
        name="Treasury"
        chain={chain}
        card={card}
        href="/home?safe=eth:0x1"
        onNavigate={onNavigate}
      />,
    )

    const link = screen.getByRole('link', { name: /Treasury/ })
    expect(link).toHaveAttribute('href', '/home?safe=eth:0x1')

    fireEvent.click(link)

    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('still shows the party card on hover when it links to the Safe', async () => {
    jest.useFakeTimers()
    const { user } = renderOnFakeClock(
      <QueueSafeTag address={address} name="Treasury" chain={chain} card={card} href="/home?safe=eth:0x1" />,
    )

    await user.hover(screen.getByRole('link', { name: /Treasury/ }))
    await advanceClock(200)

    expect(await screen.findByTestId('party-card')).toBeInTheDocument()
  })
})
