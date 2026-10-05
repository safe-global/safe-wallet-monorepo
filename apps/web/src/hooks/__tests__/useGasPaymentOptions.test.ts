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

const freeSponsoredTxs: SafeSponsoredTxs = {
  isEnabled: true,
  isPro: false,
  meter: null,
  left: null,
  spaceId: null,
  canSponsor: false,
  isLoading: false,
  isError: false,
}

const proSponsoredTxs: SafeSponsoredTxs = {
  isEnabled: true,
  isPro: true,
  meter: { used: 10, quota: 50, resetsAt: null },
  left: 40,
  spaceId: faker.string.uuid(),
  canSponsor: true,
  isLoading: false,
  isError: false,
}

const proLoading: SafeSponsoredTxs = {
  isEnabled: true,
  isPro: false,
  meter: null,
  left: null,
  spaceId: null,
  canSponsor: false,
  isLoading: true,
  isError: false,
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
    mockUseSafeSponsoredTxs.mockReturnValue(freeSponsoredTxs)
    walletCanRelaySpy = jest.spyOn(useWalletCanRelay, 'default').mockReturnValue([true, undefined, false])
  })

  it('offers a Safe without a plan the campaign, then the daily limit, then the Pro upsell', () => {
    const { result, rerender } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx() }))
    expect(result.current.offer?.option).toBe('NO_FEE_CAMPAIGN')

    mockUseIsNoFeeCampaignEnabled.mockReturnValue(false)
    rerender()
    expect(result.current.offer?.option).toBe('FREE_DAILY_LIMIT')

    mockRelays({ remaining: 0, limit: 5 })
    rerender()
    expect(result.current).toMatchObject({ offer: null, showsProUpsell: true })
  })

  it('offers a Safe on a plan only the plan, even with the campaign and daily relays available', () => {
    mockUseSafeSponsoredTxs.mockReturnValue(proSponsoredTxs)

    const { result } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx() }))

    expect(result.current.offer).toMatchObject({ option: 'SUBSCRIPTION', spaceId: proSponsoredTxs.spaceId })
  })

  it('treats a campaign-eligible but blocked Safe as not eligible', () => {
    mockCampaign({ blockedAddress: faker.finance.ethereumAddress() })

    const { result } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx() }))

    expect(result.current.offer?.option).toBe('FREE_DAILY_LIMIT')
  })

  it.each<[string, GasPaymentOption[], () => void, boolean]>([
    ['the campaign', ['NO_FEE_CAMPAIGN'], () => mockCampaign({ isLoading: true }), true],
    ['the daily limit', ['FREE_DAILY_LIMIT'], () => mockRelays({ remaining: 4, limit: 5 }, true), true],
    [
      'the plan',
      ['NO_FEE_CAMPAIGN', 'FREE_DAILY_LIMIT', 'SUBSCRIPTION'],
      () => mockUseSafeSponsoredTxs.mockReturnValue(proLoading),
      true,
    ],
    ['an unlisted campaign', ['FREE_DAILY_LIMIT'], () => mockCampaign({ isLoading: true }), false],
    [
      'an unlisted daily limit',
      ['SUBSCRIPTION'],
      () => {
        mockRelays(undefined, true)
        mockUseSafeSponsoredTxs.mockReturnValue(proSponsoredTxs)
      },
      false,
    ],
    [
      'an unlisted subscription',
      ['FREE_DAILY_LIMIT'],
      () => mockUseSafeSponsoredTxs.mockReturnValue(proLoading),
      false,
    ],
  ])('holds the offer back while %s loads: %s', (_label, options, mockLoading, holdsBack) => {
    mockChain(options)
    mockLoading()

    const { result } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx() }))

    expect(result.current).not.toHaveProperty('isLoading')
    expect(result.current.showsProUpsell).toBe(false)
    expect(result.current.offer === null).toBe(holdsBack)
  })

  it('holds the campaign and the daily limit back while the plan loads on a chain that lists it', () => {
    mockUseSafeSponsoredTxs.mockReturnValue(proLoading)

    const { result, rerender } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx() }))
    expect(result.current).toMatchObject({ offer: null, showsProUpsell: false })

    mockUseSafeSponsoredTxs.mockReturnValue(proSponsoredTxs)
    rerender()
    expect(result.current.offer?.option).toBe('SUBSCRIPTION')
  })

  it('offers the daily limit with the plan unknown until it loads', () => {
    mockChain(['FREE_DAILY_LIMIT'])
    mockUseSafeSponsoredTxs.mockReturnValue(proLoading)

    const { result, rerender } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx() }))
    expect(result.current.offer).toMatchObject({ option: 'FREE_DAILY_LIMIT', isPro: null })

    mockUseSafeSponsoredTxs.mockReturnValue(proSponsoredTxs)
    rerender()
    expect(result.current.offer).toMatchObject({ option: 'FREE_DAILY_LIMIT', isPro: true })
  })

  it('offers the daily limit with the plan unknown and no upsell after its lookup failed', () => {
    mockChain(['FREE_DAILY_LIMIT', 'SUBSCRIPTION'])
    mockUseSafeSponsoredTxs.mockReturnValue({ ...freeSponsoredTxs, isError: true })

    const { result, rerender } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx() }))
    expect(result.current.offer).toMatchObject({ option: 'FREE_DAILY_LIMIT', isPro: null })

    mockRelays({ remaining: 0, limit: 5 })
    rerender()
    expect(result.current).toMatchObject({ offer: null, showsProUpsell: false })
  })

  it('shows no Pro upsell while the plan loads with the daily relays spent', () => {
    mockChain(['FREE_DAILY_LIMIT', 'SUBSCRIPTION'])
    mockRelays({ remaining: 0, limit: 5 })
    mockUseSafeSponsoredTxs.mockReturnValue(proLoading)

    const { result } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx() }))

    expect(result.current).toMatchObject({ offer: null, showsProUpsell: false })
  })

  it('holds the offer back while the wallet check loads for a single transaction', () => {
    walletCanRelaySpy.mockReturnValue([undefined, undefined, true])

    const { result } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx() }))

    expect(result.current).toMatchObject({ offer: null, showsProUpsell: false })
  })

  it('advances a Safe without a plan from the campaign to the daily limit to nothing', () => {
    const { result } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx() }))

    act(() => result.current.exclude(['NO_FEE_CAMPAIGN']))
    expect(result.current.offer?.option).toBe('FREE_DAILY_LIMIT')

    act(() => result.current.exclude(['FREE_DAILY_LIMIT']))
    expect(result.current.offer).toBeNull()
  })

  it('offers a Safe on a plan nothing once the plan is excluded', () => {
    mockUseSafeSponsoredTxs.mockReturnValue(proSponsoredTxs)

    const { result } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx() }))
    expect(result.current.offer?.option).toBe('SUBSCRIPTION')

    act(() => result.current.exclude(['SUBSCRIPTION']))
    expect(result.current).toMatchObject({ offer: null, showsProUpsell: false })
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
    expect(result.current.offer?.option).toBe('FREE_DAILY_LIMIT')
  })

  it('never offers the campaign to a batch', () => {
    mockChain(['NO_FEE_CAMPAIGN', 'FREE_DAILY_LIMIT'])

    const { result } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx(), isBatch: true }))

    expect(result.current.offer?.option).toBe('FREE_DAILY_LIMIT')
  })

  it('does not wait on the campaign for a batch', () => {
    mockChain(['NO_FEE_CAMPAIGN', 'FREE_DAILY_LIMIT'])
    mockCampaign({ isLoading: true })

    const { result } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx(), isBatch: true }))

    expect(result.current.offer?.option).toBe('FREE_DAILY_LIMIT')
  })

  it('offers a Safe on a plan the plan for a batch', () => {
    walletCanRelaySpy.mockReturnValue([undefined, undefined, false])
    mockUseSafeSponsoredTxs.mockReturnValue(proSponsoredTxs)

    const { result } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx(), isBatch: true }))

    expect(result.current.offer).toMatchObject({ option: 'SUBSCRIPTION', spaceId: proSponsoredTxs.spaceId })
  })

  it('offers nothing when the wallet cannot relay a single transaction', () => {
    walletCanRelaySpy.mockReturnValue([false, undefined, false])

    const { result } = renderHook(() => useGasPaymentOptions({ safeTx: safeTx() }))

    expect(result.current).toMatchObject({ offer: null, showsProUpsell: false })
  })

  it('offers nothing for a refund transaction', () => {
    const refundTx = safeTx()
    refundTx.data.gasPrice = '1'
    refundTx.data.baseGas = '21000'
    refundTx.data.refundReceiver = faker.finance.ethereumAddress()

    const { result } = renderHook(() => useGasPaymentOptions({ safeTx: refundTx }))

    expect(result.current).toMatchObject({ offer: null, showsProUpsell: false })
  })
})
