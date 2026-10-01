import type { RelaysRemaining } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import type { GasPaymentOption } from '@safe-global/utils/utils/gasPaymentOptions'
import type { ExecutionMethod } from '@/components/tx/ExecutionMethodSelector'
import type { SafeSponsoredTxs } from '@/features/spaces'

export type SponsoredOption = Exclude<GasPaymentOption, 'PAY_FROM_SAFE'>

export const SPONSORED_OPTIONS: SponsoredOption[] = ['NO_FEE_CAMPAIGN', 'FREE_DAILY_LIMIT', 'SUBSCRIPTION']

export type GasPayer = SponsoredOption | 'WALLET'

export type SponsoredOffer =
  | {
      option: 'NO_FEE_CAMPAIGN'
      disabledReason: 'GAS_TOO_HIGH' | 'LIMIT_REACHED' | null
      remaining: number
      limit: number
    }
  | {
      option: 'FREE_DAILY_LIMIT'
      disabledReason: null
      relays: RelaysRemaining | undefined
      /** The Safe is on a Pro plan but this chain sponsors it through the free daily limit. */
      isPro: boolean
    }
  | {
      option: 'SUBSCRIPTION'
      disabledReason: 'LIMIT_REACHED' | null
      spaceId: string
      left: number | null
      meter: SafeSponsoredTxs['meter']
    }

export type GasPaymentInputs = {
  chainOptions: GasPaymentOption[]
  isRefundTx: boolean
  walletCanRelay: boolean
  campaign: { isEligible: boolean; remaining: number; limit: number; isGasTooHigh: boolean }
  daily: RelaysRemaining | undefined
  pro: Pick<SafeSponsoredTxs, 'isEnabled' | 'isPro' | 'left' | 'meter' | 'spaceId'>
  excluded: ReadonlySet<SponsoredOption>
}

const isOffered = (option: SponsoredOption, { chainOptions, excluded }: GasPaymentInputs): boolean =>
  chainOptions.includes(option) && !excluded.has(option)

const getCampaignOffer = (inputs: GasPaymentInputs): SponsoredOffer | null => {
  const { campaign } = inputs
  if (!isOffered('NO_FEE_CAMPAIGN', inputs) || !campaign.isEligible) return null
  const disabledReason = campaign.isGasTooHigh ? 'GAS_TOO_HIGH' : campaign.remaining === 0 ? 'LIMIT_REACHED' : null
  return { option: 'NO_FEE_CAMPAIGN', disabledReason, remaining: campaign.remaining, limit: campaign.limit }
}

const getDailyOffer = (inputs: GasPaymentInputs): SponsoredOffer | null => {
  if (!isOffered('FREE_DAILY_LIMIT', inputs) || !(inputs.daily && inputs.daily.remaining > 0)) return null
  return { option: 'FREE_DAILY_LIMIT', disabledReason: null, relays: inputs.daily, isPro: inputs.pro.isPro }
}

const getSubscriptionOffer = (inputs: GasPaymentInputs): SponsoredOffer | null => {
  const { pro } = inputs
  if (!isOffered('SUBSCRIPTION', inputs) || !pro.isPro || !pro.spaceId) return null
  return {
    option: 'SUBSCRIPTION',
    disabledReason: pro.left === 0 ? 'LIMIT_REACHED' : null,
    spaceId: pro.spaceId,
    left: pro.left,
    meter: pro.meter,
  }
}

export const selectSponsoredOffer = (
  inputs: GasPaymentInputs,
): { offer: SponsoredOffer | null; showsProUpsell: boolean } => {
  if (inputs.isRefundTx || !inputs.walletCanRelay) return { offer: null, showsProUpsell: false }

  const offer = getCampaignOffer(inputs) ?? getDailyOffer(inputs) ?? getSubscriptionOffer(inputs)
  const { pro, chainOptions, daily } = inputs
  const showsProUpsell =
    !offer &&
    pro.isEnabled &&
    !pro.isPro &&
    chainOptions.includes('FREE_DAILY_LIMIT') &&
    chainOptions.includes('SUBSCRIPTION') &&
    daily?.remaining === 0

  return { offer, showsProUpsell }
}

export const getGasPayment = (
  offer: SponsoredOffer | null,
  method: ExecutionMethod,
): { gasPayer: GasPayer; sponsorSpaceId: string | null } => {
  if (!offer || offer.disabledReason || method === 'WALLET') return { gasPayer: 'WALLET', sponsorSpaceId: null }
  return { gasPayer: offer.option, sponsorSpaceId: offer.option === 'SUBSCRIPTION' ? offer.spaceId : null }
}
