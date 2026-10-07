import type { ComponentProps } from 'react'
import { render, screen } from '@/tests/test-utils'
import type { SponsoredOffer } from '@/utils/gasPayment'
import { ExecutionMethod, ExecutionMethodSelector } from '../index'

const mockUseIsSafeProEnabled = jest.fn()
jest.mock('@/hooks/useIsSafeProEnabled', () => ({ useIsSafeProEnabled: () => mockUseIsSafeProEnabled() }))
jest.mock('@/hooks/wallets/useWallet', () => ({ __esModule: true, default: () => ({ label: 'MetaMask' }) }))
jest.mock('@/hooks/useChains', () => ({ useCurrentChain: () => ({ chainId: '1' }) }))
jest.mock('@/features/__core__', () => ({
  useLoadFeature: () => ({ GasTooHighBanner: () => <div data-testid="gas-too-high-banner" /> }),
}))
jest.mock('@/features/no-fee-campaign', () => ({ NoFeeCampaignFeature: {} }))
jest.mock('../../SponsoredBy', () => ({
  __esModule: true,
  default: (props: { option: string; chainId: string }) => (
    <span data-testid="sponsored-by" data-props={JSON.stringify(props)} />
  ),
}))
jest.mock('@/components/common/WalletIcon', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/tx/BalanceInfo', () => ({
  __esModule: true,
  default: () => <div data-testid="balance-info" />,
}))
jest.mock('../../RemainingRelays', () => ({
  __esModule: true,
  default: (props: { relays: { remaining: number; limit: number }; tooltip?: string }) => (
    <div data-testid="remaining-relays" data-props={JSON.stringify(props)} />
  ),
}))
jest.mock('../../SponsoredTxsCounter', () => {
  const { default: SponsoredTxsCounter } = jest.requireActual('../../SponsoredTxsCounter')
  return {
    __esModule: true,
    default: (props: ComponentProps<typeof SponsoredTxsCounter>) => (
      <div data-testid="sponsored-txs-counter-props" data-props={JSON.stringify(props)}>
        <SponsoredTxsCounter {...props} />
      </div>
    ),
  }
})

const daily = (isPro: boolean | null = false): SponsoredOffer => ({
  option: 'FREE_DAILY_LIMIT',
  disabledReason: null,
  relays: { remaining: 5, limit: 5 },
  isPro,
})
const campaign = (overrides: Partial<Extract<SponsoredOffer, { option: 'NO_FEE_CAMPAIGN' }>> = {}): SponsoredOffer => ({
  option: 'NO_FEE_CAMPAIGN',
  disabledReason: null,
  remaining: 3,
  limit: 10,
  ...overrides,
})
const subscription = (left: number): SponsoredOffer => ({
  option: 'SUBSCRIPTION',
  disabledReason: left === 0 ? 'LIMIT_REACHED' : null,
  spaceId: '1',
  left,
  meter: { used: 50 - left, quota: 50, resetsAt: '2026-11-01T00:00:00.000Z' },
})

const renderSelector = (
  offer: SponsoredOffer | null,
  {
    executionMethod = ExecutionMethod.RELAY,
    showsProUpsell = false,
    tooltip,
  }: { executionMethod?: ExecutionMethod; showsProUpsell?: boolean; tooltip?: string } = {},
) =>
  render(
    <ExecutionMethodSelector
      executionMethod={executionMethod}
      setExecutionMethod={jest.fn()}
      offer={offer}
      showsProUpsell={showsProUpsell}
      tooltip={tooltip}
    />,
  )

const getProps = (testId: string) => JSON.parse(screen.getByTestId(testId).getAttribute('data-props') ?? '')
const getRadio = (testId: string) => screen.getByTestId(testId).querySelector('[data-slot=radio-group-item]')

describe('ExecutionMethodSelector', () => {
  beforeEach(() => {
    mockUseIsSafeProEnabled.mockReturnValue(false)
  })

  describe('no-fee campaign', () => {
    it('counts the free transactions left while the campaign is selected', () => {
      renderSelector(campaign())

      expect(screen.getByText('Sponsored gas')).toBeInTheDocument()
      expect(screen.getByText('free transactions left')).toHaveTextContent('3 free transactions left')
      expect(getRadio('relay-execution-method')).not.toHaveAttribute('data-disabled')
      expect(screen.queryByTestId('balance-info')).not.toBeInTheDocument()
    })

    it('shows the wallet balance when the connected wallet is selected', () => {
      renderSelector(campaign(), { executionMethod: ExecutionMethod.WALLET })

      expect(screen.getByTestId('balance-info')).toBeInTheDocument()
      expect(screen.queryByText('free transactions left')).not.toBeInTheDocument()
    })

    it('disables the campaign and shows the gas banner while gas is too high', () => {
      renderSelector(campaign({ disabledReason: 'GAS_TOO_HIGH' }))

      expect(getRadio('relay-execution-method')).toHaveAttribute('data-disabled')
      expect(getRadio('connected-wallet-execution-method')).toHaveAttribute('data-checked')
      expect(screen.getByText('Not available')).toBeInTheDocument()
      expect(screen.getByTestId('gas-too-high-banner')).toBeInTheDocument()
      expect(screen.getByTestId('balance-info')).toBeInTheDocument()
    })

    it('disables the campaign once its limit is reached', () => {
      renderSelector(campaign({ disabledReason: 'LIMIT_REACHED', remaining: 0 }))

      expect(getRadio('relay-execution-method')).toHaveAttribute('data-disabled')
      expect(getRadio('connected-wallet-execution-method')).toHaveAttribute('data-checked')
      expect(screen.getByText('0/10 available')).toBeInTheDocument()
      expect(screen.queryByTestId('gas-too-high-banner')).not.toBeInTheDocument()
      expect(screen.getByTestId('balance-info')).toBeInTheDocument()
    })
  })

  describe('daily relays', () => {
    it('names the chain sponsor', () => {
      renderSelector(daily())

      expect(getProps('sponsored-by')).toEqual({ option: 'FREE_DAILY_LIMIT', chainId: '1' })
    })

    it('keeps the daily relay counter while SAFE_PRO is off', () => {
      renderSelector(daily(), { tooltip: 'Free creation' })

      expect(getProps('remaining-relays')).toEqual({ relays: { remaining: 5, limit: 5 }, tooltip: 'Free creation' })
      expect(screen.queryByTestId('sponsored-txs-counter')).not.toBeInTheDocument()
    })

    it('shows the wallet balance when the connected wallet is selected while SAFE_PRO is off', () => {
      renderSelector(daily(), { executionMethod: ExecutionMethod.WALLET })

      expect(screen.getByTestId('balance-info')).toBeInTheDocument()
      expect(screen.queryByTestId('remaining-relays')).not.toBeInTheDocument()
    })

    it('shows the free allowance with the upgrade nudge under SAFE_PRO, whichever method is picked', () => {
      mockUseIsSafeProEnabled.mockReturnValue(true)
      renderSelector(daily(), { executionMethod: ExecutionMethod.WALLET })

      expect(getProps('sponsored-txs-counter-props')).toEqual({
        left: 5,
        quota: 5,
        resetsAt: null,
        isSubscription: false,
        isPro: false,
      })
      expect(screen.getByTestId('sponsored-txs-upgrade')).toBeInTheDocument()
      expect(screen.queryByTestId('balance-info')).not.toBeInTheDocument()
      expect(getRadio('relay-execution-method')).not.toHaveAttribute('data-disabled')
    })

    it('keeps the daily counter with the Pro chip on a Safe Pro Safe under SAFE_PRO', () => {
      mockUseIsSafeProEnabled.mockReturnValue(true)
      renderSelector(daily(true))

      expect(getProps('sponsored-by')).toEqual({ option: 'FREE_DAILY_LIMIT', chainId: '1' })
      expect(getProps('sponsored-txs-counter-props')).toEqual({
        left: 5,
        quota: 5,
        resetsAt: null,
        isSubscription: false,
        isPro: true,
      })
      expect(screen.getByTestId('sponsored-txs-left')).toHaveTextContent('5 free transactions left today')
      expect(screen.queryByText(/sponsored transactions left/)).not.toBeInTheDocument()
      expect(screen.queryByTestId('sponsored-txs-upgrade')).not.toBeInTheDocument()
      expect(screen.getByRole('img', { name: 'Safe Pro' })).toBeInTheDocument()
    })

    it('keeps the daily counter without the upgrade nudge while the plan loads under SAFE_PRO', () => {
      mockUseIsSafeProEnabled.mockReturnValue(true)
      renderSelector(daily(null))

      expect(getProps('sponsored-txs-counter-props')).toMatchObject({ isSubscription: false, isPro: null })
      expect(screen.getByTestId('sponsored-txs-left')).toHaveTextContent('5 free transactions left today')
      expect(screen.queryByTestId('sponsored-txs-upgrade')).not.toBeInTheDocument()
      expect(screen.queryByRole('img', { name: 'Safe Pro' })).not.toBeInTheDocument()
    })
  })

  describe('subscription', () => {
    it("counts the Workspace's allowance on a Safe Pro Safe", () => {
      renderSelector(subscription(30))

      expect(getProps('sponsored-by')).toEqual({ option: 'SUBSCRIPTION', chainId: '1' })
      expect(getProps('sponsored-txs-counter-props')).toEqual({
        left: 30,
        quota: 50,
        resetsAt: '2026-11-01T00:00:00.000Z',
        isSubscription: true,
        isPro: true,
      })
      expect(getRadio('relay-execution-method')).toHaveAttribute('data-checked')
    })

    it('disables sponsoring and falls back to the wallet once the allowance is spent', () => {
      renderSelector(subscription(0))

      expect(getRadio('relay-execution-method')).toHaveAttribute('data-disabled')
      expect(getRadio('connected-wallet-execution-method')).toHaveAttribute('data-checked')
      expect(getProps('sponsored-txs-counter-props')).toEqual({
        left: 0,
        quota: 50,
        resetsAt: '2026-11-01T00:00:00.000Z',
        isSubscription: true,
        isPro: true,
      })
    })
  })

  it('shows only the upgrade nudge when no sponsored option is left but a plan would sponsor', () => {
    renderSelector(null, { showsProUpsell: true })

    expect(screen.queryByTestId('relay-execution-method')).not.toBeInTheDocument()
    expect(screen.queryByTestId('connected-wallet-execution-method')).not.toBeInTheDocument()
    expect(getProps('sponsored-txs-counter-props')).toEqual({
      left: 0,
      quota: null,
      resetsAt: null,
      isSubscription: false,
      isPro: false,
    })
  })

  it('renders nothing without an offer or an upgrade nudge', () => {
    const { container } = renderSelector(null)

    expect(container).toBeEmptyDOMElement()
  })
})
