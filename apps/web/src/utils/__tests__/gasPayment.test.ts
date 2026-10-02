import { faker } from '@faker-js/faker'
import { ExecutionMethod } from '@/components/tx/ExecutionMethodSelector'
import { getGasPayment, selectSponsoredOffer, type GasPaymentInputs, type SponsoredOffer } from '@/utils/gasPayment'

const spaceId = faker.string.uuid()
const meter = { used: 10, quota: 50, resetsAt: '2026-11-01T00:00:00.000Z' }

const freePro = { isEnabled: true, isPro: false, isLoading: false, left: null, meter: null, spaceId: null }
const onPlan = { isEnabled: true, isPro: true, isLoading: false, left: 40, meter, spaceId }

const buildInputs = (overrides: Partial<GasPaymentInputs> = {}): GasPaymentInputs => ({
  chainOptions: ['NO_FEE_CAMPAIGN', 'FREE_DAILY_LIMIT', 'SUBSCRIPTION'],
  isRefundTx: false,
  walletCanRelay: true,
  campaign: { isEligible: true, remaining: 3, limit: 5, isGasTooHigh: false },
  daily: { remaining: 4, limit: 5 },
  pro: freePro,
  excluded: new Set(),
  ...overrides,
})

const campaignOffer: SponsoredOffer = { option: 'NO_FEE_CAMPAIGN', disabledReason: null, remaining: 3, limit: 5 }
const dailyOffer: SponsoredOffer = {
  option: 'FREE_DAILY_LIMIT',
  disabledReason: null,
  relays: { remaining: 4, limit: 5 },
  isPro: false,
}
const subscriptionOffer: SponsoredOffer = {
  option: 'SUBSCRIPTION',
  disabledReason: null,
  spaceId,
  left: 40,
  meter,
}

describe('selectSponsoredOffer', () => {
  it.each<[string, Partial<GasPaymentInputs>, SponsoredOffer | null]>([
    ['the campaign first', {}, campaignOffer],
    [
      'the daily limit when the campaign is not listed',
      { chainOptions: ['FREE_DAILY_LIMIT', 'SUBSCRIPTION'] },
      dailyOffer,
    ],
    ['the daily limit when the campaign is excluded', { excluded: new Set(['NO_FEE_CAMPAIGN']) }, dailyOffer],
    [
      'the daily limit when the Safe is not eligible for the campaign',
      { campaign: { isEligible: false, remaining: 0, limit: 0, isGasTooHigh: false } },
      dailyOffer,
    ],
    [
      'the daily limit with the plan unknown while it loads',
      { chainOptions: ['FREE_DAILY_LIMIT'], pro: { ...freePro, isLoading: true } },
      { ...dailyOffer, isPro: null },
    ],
    [
      'nothing to a Safe without a plan once the campaign and the daily limit are excluded',
      { excluded: new Set(['NO_FEE_CAMPAIGN', 'FREE_DAILY_LIMIT']) },
      null,
    ],
    ['the plan before the campaign and the daily limit to a Safe on a plan', { pro: onPlan }, subscriptionOffer],
    [
      'the plan to a Safe on a plan when the daily relays are unknown',
      { pro: onPlan, daily: undefined },
      subscriptionOffer,
    ],
    [
      'the plan disabled once spent, with daily relays left',
      { pro: { ...onPlan, left: 0 } },
      { ...subscriptionOffer, left: 0, disabledReason: 'LIMIT_REACHED' },
    ],
    [
      'nothing to a Safe on a plan once the plan is excluded',
      { pro: onPlan, excluded: new Set(['SUBSCRIPTION']) },
      null,
    ],
    [
      'the campaign to a Safe on a plan where the chain does not list the plan',
      { pro: onPlan, chainOptions: ['NO_FEE_CAMPAIGN', 'FREE_DAILY_LIMIT'] },
      campaignOffer,
    ],
    [
      'the daily limit marked Pro where the chain does not list the plan',
      { pro: onPlan, chainOptions: ['FREE_DAILY_LIMIT'] },
      { ...dailyOffer, isPro: true },
    ],
    ['nothing when the chain lists no option', { chainOptions: [] }, null],
    ['nothing when the chain only lists paying from the Safe', { chainOptions: ['PAY_FROM_SAFE'] }, null],
    ['nothing for a refund transaction', { isRefundTx: true }, null],
    ['nothing when the wallet cannot relay', { walletCanRelay: false }, null],
    ['no subscription without a plan', { chainOptions: ['SUBSCRIPTION'] }, null],
  ])('offers %s', (_label, overrides, expected) => {
    expect(selectSponsoredOffer(buildInputs(overrides)).offer).toEqual(expected)
  })

  it.each<[string, GasPaymentInputs['campaign'], SponsoredOffer]>([
    [
      'the gas is too high',
      { isEligible: true, remaining: 3, limit: 5, isGasTooHigh: true },
      { ...campaignOffer, disabledReason: 'GAS_TOO_HIGH' },
    ],
    [
      'the gas is too high and the limit is reached',
      { isEligible: true, remaining: 0, limit: 5, isGasTooHigh: true },
      { ...campaignOffer, remaining: 0, disabledReason: 'GAS_TOO_HIGH' },
    ],
    [
      'the limit is reached',
      { isEligible: true, remaining: 0, limit: 5, isGasTooHigh: false },
      { ...campaignOffer, remaining: 0, disabledReason: 'LIMIT_REACHED' },
    ],
  ])('offers the campaign disabled when %s', (_label, campaign, expected) => {
    expect(selectSponsoredOffer(buildInputs({ campaign })).offer).toEqual(expected)
  })

  const spentDaily = { remaining: 0, limit: 5 }

  it.each<[string, Partial<GasPaymentInputs>, boolean]>([
    [
      'the daily relays are spent on a chain that lists the subscription',
      { chainOptions: ['FREE_DAILY_LIMIT', 'SUBSCRIPTION'], daily: spentDaily },
      true,
    ],
    [
      'Safe Pro is off',
      { chainOptions: ['FREE_DAILY_LIMIT', 'SUBSCRIPTION'], pro: { ...freePro, isEnabled: false }, daily: spentDaily },
      false,
    ],
    [
      'the Safe is on a plan',
      { chainOptions: ['FREE_DAILY_LIMIT', 'SUBSCRIPTION'], daily: spentDaily, pro: onPlan },
      false,
    ],
    [
      'the Safe is on a plan and the plan is excluded',
      {
        chainOptions: ['FREE_DAILY_LIMIT', 'SUBSCRIPTION'],
        daily: spentDaily,
        pro: onPlan,
        excluded: new Set(['SUBSCRIPTION']),
      },
      false,
    ],
    ['the chain does not list the subscription', { chainOptions: ['FREE_DAILY_LIMIT'], daily: spentDaily }, false],
    ['the chain does not list the daily limit', { chainOptions: ['SUBSCRIPTION'], daily: spentDaily }, false],
    ['the daily relays are unknown', { chainOptions: ['FREE_DAILY_LIMIT', 'SUBSCRIPTION'], daily: undefined }, false],
    ['a daily relay is left', { chainOptions: ['FREE_DAILY_LIMIT', 'SUBSCRIPTION'] }, false],
    [
      'it is a refund transaction',
      { chainOptions: ['FREE_DAILY_LIMIT', 'SUBSCRIPTION'], daily: spentDaily, isRefundTx: true },
      false,
    ],
    [
      'the wallet cannot relay',
      { chainOptions: ['FREE_DAILY_LIMIT', 'SUBSCRIPTION'], daily: spentDaily, walletCanRelay: false },
      false,
    ],
  ])('shows the Pro upsell only when %s', (_label, overrides, expected) => {
    expect(selectSponsoredOffer(buildInputs(overrides)).showsProUpsell).toBe(expected)
  })
})

describe('getGasPayment', () => {
  it.each<[string, SponsoredOffer | null, ExecutionMethod, ReturnType<typeof getGasPayment>]>([
    ['no offer', null, ExecutionMethod.RELAY, { gasPayer: 'WALLET', sponsorSpaceId: null }],
    [
      'a disabled offer',
      { ...campaignOffer, disabledReason: 'GAS_TOO_HIGH' },
      ExecutionMethod.RELAY,
      { gasPayer: 'WALLET', sponsorSpaceId: null },
    ],
    ['the wallet method', subscriptionOffer, ExecutionMethod.WALLET, { gasPayer: 'WALLET', sponsorSpaceId: null }],
    ['the campaign', campaignOffer, ExecutionMethod.RELAY, { gasPayer: 'NO_FEE_CAMPAIGN', sponsorSpaceId: null }],
    ['the daily limit', dailyOffer, ExecutionMethod.RELAY, { gasPayer: 'FREE_DAILY_LIMIT', sponsorSpaceId: null }],
    [
      'the subscription',
      subscriptionOffer,
      ExecutionMethod.RELAY,
      { gasPayer: 'SUBSCRIPTION', sponsorSpaceId: spaceId },
    ],
  ])('pays for %s', (_label, offer, method, expected) => {
    expect(getGasPayment(offer, method)).toEqual(expected)
  })
})
