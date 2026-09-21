import { render, screen } from '@testing-library/react'
import NetworkLogosTooltip from './index'

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="trigger">{children}</div>,
  TooltipContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="tooltip-content" className={className}>
      {children}
    </div>
  ),
}))
jest.mock('../NetworkLogosList', () => {
  const NetworkLogosList = ({ maxVisible }: { maxVisible?: number }) => (
    <span data-testid="network-logos" data-max-visible={maxVisible} />
  )
  return NetworkLogosList
})
jest.mock('@/components/common/ChainIndicator', () => {
  const ChainIndicator = ({ chainId }: { chainId: string }) => (
    <span data-testid="chain-indicator" data-chain-id={chainId} />
  )
  return ChainIndicator
})

const networks = (ids: string[]) => ids.map((chainId) => ({ chainId }))

describe('NetworkLogosTooltip', () => {
  it('renders NetworkLogosList as the default trigger', () => {
    render(<NetworkLogosTooltip networks={networks(['1', '137'])} maxVisible={3} />)

    const logos = screen.getByTestId('network-logos')
    expect(logos).toBeInTheDocument()
    expect(logos).toHaveAttribute('data-max-visible', '3')
  })

  it('renders one ChainIndicator per network in the tooltip content', () => {
    render(<NetworkLogosTooltip networks={networks(['1', '137', '10'])} />)

    const indicators = screen.getAllByTestId('chain-indicator')
    expect(indicators).toHaveLength(3)
    expect(indicators.map((el) => el.getAttribute('data-chain-id'))).toEqual(['1', '137', '10'])
  })

  it('renders a custom trigger instead of the logos list when provided', () => {
    render(<NetworkLogosTooltip networks={networks(['1'])} trigger={<span data-testid="all-badge">All</span>} />)

    expect(screen.getByTestId('all-badge')).toBeInTheDocument()
    expect(screen.queryByTestId('network-logos')).not.toBeInTheDocument()
  })

  it('applies contentTestId to the tooltip content wrapper', () => {
    render(<NetworkLogosTooltip networks={networks(['1'])} contentTestId="multichain-tooltip" />)

    expect(screen.getByTestId('multichain-tooltip')).toBeInTheDocument()
  })

  it('caps the content height and scrolls internally so long lists do not overflow the viewport', () => {
    render(<NetworkLogosTooltip networks={networks(['1'])} contentTestId="multichain-tooltip" />)

    const content = screen.getByTestId('multichain-tooltip')
    expect(content).toHaveClass('overflow-y-auto', 'overscroll-contain', 'no-scrollbar')
    expect(content).toHaveStyle({ maxHeight: 'calc(var(--available-height) - 0.75rem)' })
  })

  it('uses theme-aware popover colors and elevation so the list separates from the page', () => {
    render(<NetworkLogosTooltip networks={networks(['1'])} />)

    expect(screen.getByTestId('tooltip-content')).toHaveClass(
      'bg-popover',
      'text-popover-foreground',
      'shadow-md',
      'ring-1',
    )
  })
})
