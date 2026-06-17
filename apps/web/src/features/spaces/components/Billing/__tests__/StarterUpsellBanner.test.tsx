import { render, screen, fireEvent } from '@/tests/test-utils'
import StarterUpsellBanner from '../StarterUpsellBanner'
import { BillingDataProvider } from '../BillingDataContext'
import { createStarterBillingState } from '../mocks'

const renderBanner = (onUpgrade?: () => void) =>
  render(
    <BillingDataProvider
      value={createStarterBillingState({ usage: { movedUsd: 128_500, transactionCount: 42, periodDays: 30 } })}
    >
      <StarterUpsellBanner onUpgrade={onUpgrade} />
    </BillingDataProvider>,
  )

describe('StarterUpsellBanner', () => {
  it('renders the recent-usage summary and Upgrade CTA', () => {
    renderBanner()

    expect(screen.getByText(/In the past 30 days/)).toBeInTheDocument()
    expect(screen.getByText(/42 transactions/)).toBeInTheDocument()
    expect(screen.getByTestId('billing-upsell-upgrade')).toBeInTheDocument()
  })

  it('calls onUpgrade when the CTA is clicked', () => {
    const onUpgrade = jest.fn()
    renderBanner(onUpgrade)

    fireEvent.click(screen.getByTestId('billing-upsell-upgrade'))

    expect(onUpgrade).toHaveBeenCalledTimes(1)
  })
})
