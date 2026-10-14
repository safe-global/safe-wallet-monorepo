import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { SpendingLimitAllowanceDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { PolicyTokenInfo } from '@safe-global/views/features/spaces/components/Policies/types'

/** A token the gateway does not know still has to render its amount, so it shows base units. */
const unknownToken = (address: string): PolicyTokenInfo => ({
  address,
  symbol: shortenAddress(address),
  decimals: 0,
  logoUri: null,
})

export const toPolicyToken = (
  tokenAddress: string,
  tokenMetadata: SpendingLimitAllowanceDto['tokenMetadata'],
): PolicyTokenInfo =>
  tokenMetadata
    ? {
        address: tokenAddress,
        symbol: tokenMetadata.symbol,
        decimals: tokenMetadata.decimals,
        logoUri: tokenMetadata.logoUri,
      }
    : unknownToken(tokenAddress)
