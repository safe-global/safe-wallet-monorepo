import type { OnTradeParamsPayload } from '@cowprotocol/events'
import { stableCoinAddresses } from '@/features/swap/helpers/data/stablecoins'

// TODO: remove after experiment is evaluated
// We test this fee on base only, so we store the Base Chain Id here
export const BASE_CHAIN_ID = '8453'

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
  BASE_REGULAR: {
    TIER_1: 70,
    TIER_2: 20,
    TIER_3: 10,
  },
  BASE_STABLE: {
    TIER_1: 20,
    TIER_2: 7,
    TIER_3: 5,
  },
}

const FEE_TIERS = {
  TIER_1: 100_000, // 0 - 100k
  TIER_2: 1_000_000, // 100k - 1m
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
export const calculateFeePercentageInBps = (orderParams: OnTradeParamsPayload, chainId?: string) => {
  const { sellToken, buyToken, buyTokenFiatAmount, sellTokenFiatAmount, orderKind } = orderParams
  const stableCoins = getLowerCaseStableCoinAddresses()
  const isStableCoin = stableCoins[sellToken?.address?.toLowerCase()] && stableCoins[buyToken?.address.toLowerCase()]

  const fiatAmount = Number(orderKind == 'sell' ? sellTokenFiatAmount : buyTokenFiatAmount) || 0

  // Determine which fee structure to use based on chain
  // We increase swap fees on Base as an experimental feature
  const isBaseNetwork = chainId === BASE_CHAIN_ID
  const regularFees = isBaseNetwork ? FEE_PERCENTAGE_BPS.BASE_REGULAR : FEE_PERCENTAGE_BPS.REGULAR
  const stableFees = isBaseNetwork ? FEE_PERCENTAGE_BPS.BASE_STABLE : FEE_PERCENTAGE_BPS.STABLE

  if (fiatAmount < FEE_TIERS.TIER_1) {
    return isStableCoin ? stableFees.TIER_1 : regularFees.TIER_1
  }

  if (fiatAmount < FEE_TIERS.TIER_2) {
    return isStableCoin ? stableFees.TIER_2 : regularFees.TIER_2
  }

  return isStableCoin ? stableFees.TIER_3 : regularFees.TIER_3
}
