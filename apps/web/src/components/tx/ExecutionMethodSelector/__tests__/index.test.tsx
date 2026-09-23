import { render, screen } from '@/tests/test-utils'
import { ExecutionMethod, ExecutionMethodSelector } from '../index'

const mockUseSafeSponsoredTxs = jest.fn()
jest.mock('@/features/spaces', () => ({ useSafeSponsoredTxs: () => mockUseSafeSponsoredTxs() }))
jest.mock('@/hooks/wallets/useWallet', () => ({ __esModule: true, default: () => null }))
jest.mock('@/hooks/useChains', () => ({ useCurrentChain: () => ({ chainId: '1', features: ['RELAYING'] }) }))
jest.mock('@/features/__core__', () => ({ useLoadFeature: () => ({ GasTooHighBanner: () => null }) }))
jest.mock('@/features/no-fee-campaign', () => ({ NoFeeCampaignFeature: {} }))
jest.mock('../../SponsoredBy', () => ({ __esModule: true, default: () => <span>Safe</span> }))
jest.mock('@/components/common/WalletIcon', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/tx/BalanceInfo', () => ({
  __esModule: true,
  default: () => <div data-testid="balance-info" />,
}))
jest.mock('../../RemainingRelays', () => ({
  __esModule: true,
  default: ({ relays }: { relays: { remaining: number } }) => (
    <div data-testid="remaining-relays">{relays.remaining} free transactions left today</div>
  ),
}))
jest.mock('../../SponsoredTxsCounter', () => ({
  __esModule: true,
  default: (props: { left: number | null; quota: number | null; resetsAt: string | null; isPro: boolean }) => (
    <div data-testid="sponsored-txs-counter" data-props={JSON.stringify(props)} />
  ),
}))

const off = { isEnabled: false, isPro: false, meter: null, left: null, isLoading: false }
const free = { ...off, isEnabled: true }
const pro = (left: number) => ({
  isEnabled: true,
  isPro: true,
  meter: { used: 50 - left, quota: 50, resetsAt: '2026-11-01T00:00:00.000Z' },
  left,
  isLoading: false,
})
const relays = { remaining: 5, limit: 5 }

const renderSelector = (executionMethod = ExecutionMethod.RELAY, setExecutionMethod = jest.fn()) =>
  render(
    <ExecutionMethodSelector
      executionMethod={executionMethod}
      setExecutionMethod={setExecutionMethod}
      relays={relays}
    />,
  )

describe('ExecutionMethodSelector', () => {
  it('keeps the daily relay counter while SAFE_PRO is off', () => {
    mockUseSafeSponsoredTxs.mockReturnValue(off)
    renderSelector()

    expect(screen.getByTestId('remaining-relays')).toHaveTextContent('5 free transactions left today')
    expect(screen.queryByTestId('sponsored-txs-counter')).not.toBeInTheDocument()
  })

  it('shows the free allowance with the upgrade nudge for a Safe outside a plan, whichever method is picked', () => {
    mockUseSafeSponsoredTxs.mockReturnValue(free)
    renderSelector(ExecutionMethod.WALLET)

    expect(JSON.parse(screen.getByTestId('sponsored-txs-counter').getAttribute('data-props') ?? '')).toEqual({
      left: 5,
      quota: null,
      resetsAt: null,
      isPro: false,
    })
    expect(screen.queryByTestId('balance-info')).not.toBeInTheDocument()
    expect(
      screen.getByTestId('relay-execution-method').querySelector('[data-slot=radio-group-item]'),
    ).not.toHaveAttribute('data-disabled')
  })

  it("counts the Workspace's allowance on a Safe Pro Safe", () => {
    mockUseSafeSponsoredTxs.mockReturnValue(pro(30))
    renderSelector()

    expect(JSON.parse(screen.getByTestId('sponsored-txs-counter').getAttribute('data-props') ?? '')).toEqual({
      left: 30,
      quota: 50,
      resetsAt: '2026-11-01T00:00:00.000Z',
      isPro: true,
    })
  })

  it('disables sponsoring on a spent allowance even before the chain relay info has loaded', () => {
    mockUseSafeSponsoredTxs.mockReturnValue(pro(0))
    const setExecutionMethod = jest.fn()
    render(<ExecutionMethodSelector executionMethod={ExecutionMethod.RELAY} setExecutionMethod={setExecutionMethod} />)

    expect(screen.getByTestId('relay-execution-method').querySelector('[data-slot=radio-group-item]')).toHaveAttribute(
      'data-disabled',
    )
    expect(setExecutionMethod).toHaveBeenCalledWith(ExecutionMethod.WALLET)
  })

  it('disables sponsoring and falls back to the wallet once the allowance is spent', () => {
    mockUseSafeSponsoredTxs.mockReturnValue(pro(0))
    const setExecutionMethod = jest.fn()
    renderSelector(ExecutionMethod.RELAY, setExecutionMethod)

    expect(screen.getByTestId('relay-execution-method').querySelector('[data-slot=radio-group-item]')).toHaveAttribute(
      'data-disabled',
    )
    expect(setExecutionMethod).toHaveBeenCalledWith(ExecutionMethod.WALLET)
  })
})
