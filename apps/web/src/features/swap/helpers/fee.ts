import type { OnTradeParamsPayload } from '@cowprotocol/events'
import { stableCoinAddresses } from '@/features/swap/helpers/data/stablecoins'
import { EURCV_ADDRESS } from '@/config/eurcv'
import { sameAddress } from '@safe-global/utils/utils/addresses'

const FEE_PERCENTAGE_BPS = {
  REGULAR: {
    TIER_1: 35,
    TIER_2: 35,
    TIER_3: 20,
    TIER_4: 10,
  },
  STABLE: {
    TIER_1: 10,
    TIER_2: 10,
    TIER_3: 7,
    TIER_4: 5,
  },
  V2_REGULAR: {
    TIER_1: 70,
    TIER_2: 35,
    TIER_3: 20,
    TIER_4: 10,
  },
  V2_STABLE: {
    TIER_1: 15,
    TIER_2: 10,
    TIER_3: 7,
    TIER_4: 5,
  },
}

const FEE_TIERS = {
  TIER_1: 50_000, // 0 - 50k
  TIER_2: 100_000, // 50k - 100k
  TIER_3: 1_000_000, // 100k - 1m
}

const getLowerCaseStableCoinAddresses = () => {
  const lowerCaseStableCoinAddresses = Object.keys(stableCoinAddresses).reduce(
    (result, key) => {
      result[key.toLowerCase()] = stableCoinAddresses[key]
      return result
    },
    {} as typeof stableCoinAddresses,
  )

  return lowerCaseStableCoinAddresses
}
/**
 * Function to calculate the fee % in bps to apply for a trade.
 * The fee % should be applied based on the fiat value of the buy or sell token.
 *
 * @param orderParams
 * @param chainId
 */
export const calculateFeePercentageInBps = (
  orderParams: OnTradeParamsPayload,
  nativeCowSwapFeeV2Enabled: boolean = false,
  isEurcvBoostEnabled: boolean = false,
) => {
  const { sellToken, buyToken, buyTokenFiatAmount, sellTokenFiatAmount, orderKind } = orderParams

  // Zero fee when buying EURCV with EURCV_BOOST feature enabled
  if (isEurcvBoostEnabled && sameAddress(buyToken?.address, EURCV_ADDRESS)) {
    return 0
  }

  const stableCoins = getLowerCaseStableCoinAddresses()
  const isStableCoin = stableCoins[sellToken?.address?.toLowerCase()] && stableCoins[buyToken?.address.toLowerCase()]

  const fiatAmount = Number(orderKind == 'sell' ? sellTokenFiatAmount : buyTokenFiatAmount) || 0

  const regularFees = nativeCowSwapFeeV2Enabled ? FEE_PERCENTAGE_BPS.V2_REGULAR : FEE_PERCENTAGE_BPS.REGULAR
  const stableFees = nativeCowSwapFeeV2Enabled ? FEE_PERCENTAGE_BPS.V2_STABLE : FEE_PERCENTAGE_BPS.STABLE

  if (fiatAmount < FEE_TIERS.TIER_1) {
    return isStableCoin ? stableFees.TIER_1 : regularFees.TIER_1
  }

  if (fiatAmount < FEE_TIERS.TIER_2) {
    return isStableCoin ? stableFees.TIER_2 : regularFees.TIER_2
  }

  if (fiatAmount < FEE_TIERS.TIER_3) {
    return isStableCoin ? stableFees.TIER_3 : regularFees.TIER_3
  }

  return isStableCoin ? stableFees.TIER_4 : regularFees.TIER_4
}
