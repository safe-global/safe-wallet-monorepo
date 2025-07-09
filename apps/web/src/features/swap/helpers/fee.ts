import type { OnTradeParamsPayload } from '@cowprotocol/events'
import { stableCoinAddresses } from '@/features/swap/helpers/data/stablecoins'

const FEE_PERCENTAGE_BPS = {
  REGULAR: {
    TIER_1: 35,
    TIER_2: 20,
    TIER_3: 10,
  },
  STABLE: {
    TIER_1: 10,
    TIER_2: 7,
    TIER_3: 5,
  },
}

const FEE_TIERS = {
  TIER_1: 100_000, // 0 - 100k
  TIER_2: 1_000_000, // 100k - 1m
}

const getLowerCaseStableCoinAddresses = () => {
  const lowerCaseStableCoinAddresses = Object.keys(stableCoinAddresses).reduce((result, key) => {
    result[key.toLowerCase()] = stableCoinAddresses[key]
    return result
  }, {} as typeof stableCoinAddresses)

  return lowerCaseStableCoinAddresses
}
/**
 * Function to calculate the fee % in bps to apply for a trade.
 * The fee % should be applied based on the fiat value of the buy or sell token.
 *
 * @param orderParams
 */
export const calculateFeePercentageInBps = (orderParams: OnTradeParamsPayload) => {
  const { sellToken, buyToken, buyTokenFiatAmount, sellTokenFiatAmount, orderKind } = orderParams
  const stableCoins = getLowerCaseStableCoinAddresses()
  const isStableCoin = stableCoins[sellToken?.address?.toLowerCase()] && stableCoins[buyToken?.address.toLowerCase()]

  const fiatAmount = Number(orderKind == 'sell' ? sellTokenFiatAmount : buyTokenFiatAmount) || 0

  if (fiatAmount < FEE_TIERS.TIER_1) {
    return isStableCoin ? FEE_PERCENTAGE_BPS.STABLE.TIER_1 : FEE_PERCENTAGE_BPS.REGULAR.TIER_1
  }

  if (fiatAmount < FEE_TIERS.TIER_2) {
    return isStableCoin ? FEE_PERCENTAGE_BPS.STABLE.TIER_2 : FEE_PERCENTAGE_BPS.REGULAR.TIER_2
  }

  return isStableCoin ? FEE_PERCENTAGE_BPS.STABLE.TIER_3 : FEE_PERCENTAGE_BPS.REGULAR.TIER_3
}
