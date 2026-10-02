import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import SponsoredTxsCounter, { _formatResetsAt } from '../index'

describe('SponsoredTxsCounter', () => {
  it('formats the reset moment in UTC and tolerates missing or broken dates', () => {
    expect(_formatResetsAt('2026-11-01T00:00:00.000Z')).toBe('Nov 1, 00:00 UTC')
    expect(_formatResetsAt('2026-10-17T15:52:37.000Z')).toBe('Oct 17, 15:52 UTC')
    expect(_formatResetsAt(null)).toBeNull()
    expect(_formatResetsAt('nope')).toBeNull()
  })

  it('counts the plan allowance with the PRO chip on a Safe Pro Safe', () => {
    render(<SponsoredTxsCounter left={30} quota={50} resetsAt="2026-11-01T00:00:00.000Z" isSubscription isPro />)

    expect(screen.getByTestId('sponsored-txs-counter')).toHaveTextContent(
      '30 of 50 sponsored transactions left· Resets Nov 1, 00:00 UTC',
    )
    expect(screen.getByRole('img', { name: 'Safe Pro' })).toBeInTheDocument()
    expect(screen.queryByTestId('sponsored-txs-upgrade')).not.toBeInTheDocument()
  })

  it('shows the free daily allowance with its per-day limit in a tooltip otherwise', async () => {
    const { user } = renderWithUserEvent(
      <SponsoredTxsCounter left={3} quota={5} resetsAt={null} isSubscription={false} isPro={false} />,
    )

    expect(screen.getByTestId('sponsored-txs-left')).toHaveTextContent('3 free transactions left today')
    expect(screen.queryByText(/Resets/)).not.toBeInTheDocument()

    await user.hover(screen.getByTestId('sponsored-txs-info'))
    expect(
      await screen.findByText('5 transactions per day for free', { selector: '[data-slot="tooltip-content"]' }),
    ).toBeInTheDocument()
  })

  it('keeps the daily copy with the PRO chip on a Safe Pro Safe sponsored by the free daily limit', () => {
    render(<SponsoredTxsCounter left={3} quota={5} resetsAt={null} isSubscription={false} isPro />)

    expect(screen.getByTestId('sponsored-txs-left')).toHaveTextContent('3 free transactions left today')
    expect(screen.queryByText(/sponsored transactions left/)).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Safe Pro' })).toBeInTheDocument()
    expect(screen.queryByTestId('sponsored-txs-upgrade')).not.toBeInTheDocument()
  })

  it('keeps the upgrade nudge and drops the tooltip when the free daily limit is unknown', () => {
    render(<SponsoredTxsCounter left={0} quota={null} resetsAt={null} isSubscription={false} isPro={false} />)

    expect(screen.getByTestId('sponsored-txs-left')).toHaveTextContent('0 free transactions left today')
    expect(screen.queryByTestId('sponsored-txs-info')).not.toBeInTheDocument()
    expect(screen.getByTestId('sponsored-txs-upgrade')).toHaveAttribute('href', '/welcome/spaces')
    expect(screen.getByTestId('sponsored-txs-upgrade')).toHaveTextContent('Upgrade to')
  })

  it('shows neither the PRO chip nor the upgrade nudge while the plan is unknown', () => {
    render(<SponsoredTxsCounter left={3} quota={5} resetsAt={null} isSubscription={false} isPro={null} />)

    expect(screen.getByTestId('sponsored-txs-left')).toHaveTextContent('3 free transactions left today')
    expect(screen.queryByRole('img', { name: 'Safe Pro' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('sponsored-txs-upgrade')).not.toBeInTheDocument()
  })

  it('reads an uncapped plan as unlimited', () => {
    render(<SponsoredTxsCounter left={null} quota={null} resetsAt={null} isSubscription isPro />)

    expect(screen.getByText('Unlimited sponsored transactions')).toBeInTheDocument()
  })
})
