import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SafeRowStats from '../SafeRowStats'
import type { SafeItemDataChain } from '../../types'

jest.mock('../ChainLogo', () => {
  const Mock = ({ chainId }: { chainId: string }) => <div data-testid={`chain-logo-${chainId}`} />
  Mock.displayName = 'ChainLogo'
  return { __esModule: true, default: Mock }
})

const chain = (chainId: string, chainName: string): SafeItemDataChain => ({
  chainId,
  chainName,
  chainLogoUri: null,
  shortName: chainId,
})

const tooltipTriggerOf = (el: HTMLElement) => el.closest('[data-slot="tooltip-trigger"]')

describe('SafeRowStats tooltips', () => {
  it('wraps the threshold badge in a tooltip and explains the setup on hover', async () => {
    render(<SafeRowStats threshold={2} owners={3} chains={[chain('1', 'Ethereum')]} pending={0} />)

    const trigger = tooltipTriggerOf(screen.getByTestId('account-threshold'))
    expect(trigger).toBeInTheDocument()

    await userEvent.hover(trigger as HTMLElement)
    expect(await screen.findByText('2 out of 3 signers required')).toBeInTheDocument()
  })

  it('labels the threshold generically when the setup differs per chain', () => {
    render(<SafeRowStats threshold={2} owners={3} chains={[chain('1', 'Ethereum')]} pending={0} thresholdIconOnly />)
    // Icon-only badge (no "2/3" text); the tooltip trigger is still present.
    expect(tooltipTriggerOf(screen.getByTestId('account-threshold'))).toBeInTheDocument()
  })

  it('wraps each network logo in a tooltip and lists the overflow chains', () => {
    render(
      <SafeRowStats
        threshold={1}
        owners={2}
        pending={0}
        chains={[chain('1', 'Ethereum'), chain('137', 'Polygon'), chain('10', 'Optimism'), chain('42161', 'Arbitrum')]}
      />,
    )

    expect(tooltipTriggerOf(screen.getByTestId('chain-logo-1'))).toBeInTheDocument()
    // Only the first three logos render; the rest collapse into a tooltipped overflow badge.
    expect(screen.queryByTestId('chain-logo-42161')).not.toBeInTheDocument()
    expect(tooltipTriggerOf(screen.getByText('+1'))).toBeInTheDocument()
  })

  it('wraps the pending badge only when there are queued transactions', () => {
    const { rerender } = render(<SafeRowStats threshold={1} owners={2} chains={[chain('1', 'Ethereum')]} pending={3} />)
    expect(tooltipTriggerOf(screen.getByTestId('account-pending'))).toBeInTheDocument()

    rerender(<SafeRowStats threshold={1} owners={2} chains={[chain('1', 'Ethereum')]} pending={0} />)
    expect(screen.queryByTestId('account-pending')).not.toBeInTheDocument()
    expect(screen.getByTestId('row-pending-column')).toBeInTheDocument()
  })
})
