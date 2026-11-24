import { act, fireEvent, render, renderWithUserEvent, screen } from '@/tests/test-utils'
import SafeBandTitle, { SafeBandCard } from '@safe-global/views/features/spaces/components/SpaceQueue/SafeBandTitle'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'

const SAFE = '0x1234567890123456789012345678901234567890'
const ETHEREUM: ChainInfo = { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }
const BASE: ChainInfo = { chainId: '8453', chainName: 'Base', chainLogoUri: null, shortName: 'base' }

const card = (
  <SafeBandCard
    name="Treasury"
    address={SAFE}
    details={[
      { label: 'Threshold', value: '2 of 3 signers' },
      { label: 'Next nonce', value: '#42', mono: true },
    ]}
  />
)

describe('SafeBandTitle', () => {
  it('opens the Safe card on focus, with the name, full address and facts', async () => {
    const { container } = render(<SafeBandTitle safeAddress={SAFE} name="Treasury" card={card} chains={[]} />)

    expect(container.querySelector('[title]')).toBeNull()
    act(() => screen.getByTestId('safe-band-identity').focus())

    expect(await screen.findByText(SAFE)).toHaveClass('font-mono', 'break-all')
    expect(screen.getByText('Treasury', { selector: 'p' })).toHaveClass('font-medium')
    expect(screen.getByText('2 of 3 signers')).toBeInTheDocument()
    expect(screen.getByText('#42')).toHaveClass('font-mono')
  })

  it('gives each network a button with its own tooltip, greyed while collapsed', async () => {
    const onClick = jest.fn()
    const onRowClick = jest.fn()
    const { user } = renderWithUserEvent(
      <div onClick={onRowClick}>
        <SafeBandTitle
          safeAddress={SAFE}
          name="Treasury"
          card={card}
          chains={[
            { chain: ETHEREUM, collapsed: false, label: 'Show Ethereum', onClick },
            { chain: BASE, collapsed: true, label: 'Show Base', onClick: jest.fn() },
          ]}
        />
      </div>,
    )

    const base = screen.getByRole('button', { name: 'Show Base' })
    expect(base).toHaveAttribute('aria-expanded', 'false')
    expect(base.firstElementChild).toHaveClass('opacity-50', 'grayscale')

    await user.hover(base)
    expect(await screen.findByText('Base', { selector: '[data-slot="tooltip-content"]' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Show Ethereum' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onRowClick).not.toHaveBeenCalled()
  })
})
