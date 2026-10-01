import { act, renderHook } from '@/tests/test-utils'
import { chainBuilder, gasPaymentRelayer } from '@/tests/builders/chains'
import { createMockSafeTransaction } from '@/tests/transactions'
import { faker } from '@faker-js/faker'
import type { GasPaymentOption } from '@safe-global/utils/utils/gasPaymentOptions'
import type { RelaysRemaining } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import type { SafeSponsoredTxs } from '@/features/spaces'
import * as useChains from '@/hooks/useChains'
import * as useRemainingRelays from '@/hooks/useRemainingRelays'
import * as useWalletCanRelay from '@/hooks/useWalletCanRelay'
import { useGasPaymentOptions } from '@/hooks/useGasPaymentOptions'

const mockUseSafeSponsoredTxs = jest.fn<SafeSponsoredTxs, []>()
const mockUseNoFeeCampaignEligibility = jest.fn()
const mockUseIsNoFeeCampaignEnabled = jest.fn<boolean, []>()
const mockUseGasTooHigh = jest.fn<boolean, []>()

jest.mock('@/features/spaces', () => ({ useSafeSponsoredTxs: () => mockUseSafeSponsoredTxs() }))
jest.mock('@/features/no-fee-campaign', () => ({
  useNoFeeCampaignEligibility: () => mockUseNoFeeCampaignEligibility(),
  useIsNoFeeCampaignEnabled: () => mockUseIsNoFeeCampaignEnabled(),
  useGasTooHigh: () => mockUseGasTooHigh(),
}))

const proSponsoredTxs: SafeSponsoredTxs = {
  isEnabled: true,
  isPro: true,
  meter: { used: 10, quota: 50, resetsAt: null },
  left: 40,
  spaceId: 'space-1',
  canSponsor: true,
  isLoading: false,
}

const mockChain = (options: GasPaymentOption[]) =>
  jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(
    chainBuilder()
      .with({ relayer: gasPaymentRelayer(options) })
      .build(),
  )

const mockRelays = (relays: RelaysRemaining | undefined, isLoading = false) =>
  jest.spyOn(useRemainingRelays, 'useRelaysBySafe').mockReturnValue([relays, undefined, isLoading])

const mockCampaign = (overrides: Record<string, unknown> = {}) =>
  mockUseNoFeeCampaignEligibility.mockReturnValue({
    isEligible: true,
    remaining: 3,
    limit: 5,
    isLoading: false,
    error: undefined,
    blockedAddress: undefined,
    ...overrides,
  })

const safeTx = () => createMockSafeTransaction({ to: faker.finance.ethereumAddress(), data: '0x' })

describe('useGasPaymentOptions', () => {
  let walletCanRelaySpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockChain(['NO_FEE_CAMPAIGN', 'FREE_DAILY_LIMIT', 'SUBSCRIPTION'])
    mockRelays({ remaining: 4, limit: 5 })
    mockCampaign()
    mockUseIsNoFeeCampaignEnabled.mockReturnValue(true)
    mockUseGasTooHigh.mockReturnValue(false)
    mockUseSafeSponsoredTxs.mockReturnValue(proSponsoredTxs)
    walletCanRelaySpy = jest.spyOn(useWalletCanRelay, 'default').mockReturnValue([true, undefined, false])
  })

  it('offers the campaign, then the daily limit, then the subscription', () => {
    const { result, rerender } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx() }))
    expect(result.current.offer?.option).toBe('NO_FEE_CAMPAIGN')

    mockUseIsNoFeeCampaignEnabled.mockReturnValue(false)
    rerender()
    expect(result.current.offer?.option).toBe('FREE_DAILY_LIMIT')

    mockRelays({ remaining: 0, limit: 5 })
    rerender()
    expect(result.current.offer).toMatchObject({ option: 'SUBSCRIPTION', spaceId: 'space-1' })
  })

  it('treats a campaign-eligible but blocked Safe as not eligible', () => {
    mockCampaign({ blockedAddress: faker.finance.ethereumAddress() })

    const { result } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx() }))

    expect(result.current.offer?.option).toBe('FREE_DAILY_LIMIT')
  })

  it.each<[string, GasPaymentOption[], () => void, boolean]>([
    ['the campaign', ['NO_FEE_CAMPAIGN'], () => mockCampaign({ isLoading: true }), true],
    ['the daily limit', ['FREE_DAILY_LIMIT'], () => mockRelays(undefined, true), true],
    [
      'the subscription',
      ['SUBSCRIPTION'],
      () => mockUseSafeSponsoredTxs.mockReturnValue({ ...proSponsoredTxs, isLoading: true }),
      true,
    ],
    ['an unlisted campaign', ['FREE_DAILY_LIMIT'], () => mockCampaign({ isLoading: true }), false],
    ['unlisted daily limit', ['SUBSCRIPTION'], () => mockRelays(undefined, true), false],
    [
      'an unlisted subscription',
      ['FREE_DAILY_LIMIT'],
      () => mockUseSafeSponsoredTxs.mockReturnValue({ ...proSponsoredTxs, isLoading: true }),
      false,
    ],
  ])('reports loading while %s loads: %s', (_label, options, mockLoading, expected) => {
    mockChain(options)
    mockLoading()

    const { result } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx() }))

    expect(result.current.isLoading).toBe(expected)
  })

  it('reports loading while the wallet check loads for a single transaction', () => {
    walletCanRelaySpy.mockReturnValue([undefined, undefined, true])

    const { result } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx() }))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.offer).toBeNull()
  })

  it('advances to the next option once one is excluded', () => {
    const { result } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx() }))

    act(() => result.current.exclude(['NO_FEE_CAMPAIGN']))
    expect(result.current.offer?.option).toBe('FREE_DAILY_LIMIT')

    act(() => result.current.exclude(['FREE_DAILY_LIMIT']))
    expect(result.current.offer?.option).toBe('SUBSCRIPTION')

    act(() => result.current.exclude(['SUBSCRIPTION']))
    expect(result.current.offer).toBeNull()
  })

  it('keeps exclude stable across renders', () => {
    const { result, rerender } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx() }))
    const { exclude } = result.current

    rerender()

    expect(result.current.exclude).toBe(exclude)
  })

  it('skips the wallet check for a batch', () => {
    walletCanRelaySpy.mockReturnValue([undefined, undefined, false])

    const { result } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx(), isBatch: true }))

    expect(walletCanRelaySpy).toHaveBeenCalledWith(undefined)
    expect(result.current.offer?.option).toBe('NO_FEE_CAMPAIGN')
    expect(result.current.isLoading).toBe(false)
  })

  it('offers nothing when the wallet cannot relay a single transaction', () => {
    walletCanRelaySpy.mockReturnValue([false, undefined, false])

    const { result } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx() }))

    expect(result.current).toMatchObject({ offer: null, showsProUpsell: false, isLoading: false })
  })

  it('offers nothing for a refund transaction', () => {
    const refundTx = safeTx()
    refundTx.data.gasPrice = '1'
    refundTx.data.baseGas = '21000'
    refundTx.data.refundReceiver = faker.finance.ethereumAddress()

    const { result } = renderHook(() => useGasPaymentOptions({ safeTx: refundTx }))

    expect(result.current).toMatchObject({ offer: null, showsProUpsell: false })
  })

  it('offers nothing when the chain lists no option', () => {
    mockChain([])

    const { result } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx() }))

    expect(result.current).toMatchObject({ offer: null, showsProUpsell: false, isLoading: false })
  })
})
