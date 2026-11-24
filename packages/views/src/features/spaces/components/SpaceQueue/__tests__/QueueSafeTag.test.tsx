import { advanceClock, render, renderOnFakeClock, screen } from '@/tests/test-utils'
import QueueSafeTag from '@safe-global/views/features/spaces/components/SpaceQueue/QueueSafeTag'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'

const address = '0x1234567890123456789012345678901234567890'
const chain: ChainInfo = { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }

describe('QueueSafeTag', () => {
  afterEach(() => jest.useRealTimers())

  it('has no browser title', () => {
    const { container } = render(<QueueSafeTag address={address} name="Treasury" chain={chain} />)

    expect(container.querySelector('[title]')).toBeNull()
  })

  it.each([
    ['hover', 'Treasury on Ethereum', chain],
    ['focus', 'Treasury', undefined],
  ])('shows the name and network in a tooltip on %s', async (how, text, tagChain) => {
    jest.useFakeTimers()
    const { user } = renderOnFakeClock(<QueueSafeTag address={address} name="Treasury" chain={tagChain} />)

    const tag = screen.getByTestId('queue-safe-tag')
    if (how === 'hover') {
      await user.hover(tag)
    } else {
      await user.tab()
      expect(tag).toHaveFocus()
      expect(tag).toHaveClass('outline-hidden', 'focus-visible:ring-[3px]', 'focus-visible:ring-ring/50')
    }
    await advanceClock(200)

    expect(await screen.findByText(text, { selector: '[data-slot="tooltip-content"]' })).toBeInTheDocument()
  })
})
