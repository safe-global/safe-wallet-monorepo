import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { TokenApproval } from '@safe-global/utils/features/token-approvals/allowances'
import { formatVisualAmount, shortenAddress } from '@safe-global/utils/utils/formatters'
import type { TokenApprovalItem } from '@safe-global/views/features/token-approvals/components/TokenApprovalsList'
import { getBlockExplorerLink } from '@/utils/chains'

export const toApprovalItem = (approval: TokenApproval, chain: Chain | undefined): TokenApprovalItem => {
  const symbol = approval.token.symbol || shortenAddress(approval.token.value)
  return {
    key: approval.key,
    tokenAddress: approval.token.value,
    tokenSymbol: symbol,
    tokenLogoUri: approval.token.logoUri,
    spenderAddress: approval.spender.value,
    spenderLabel: approval.spender.name || shortenAddress(approval.spender.value),
    spenderHref: chain ? getBlockExplorerLink(chain, approval.spender.value)?.href : undefined,
    amountLabel: approval.isUnlimited
      ? 'Unlimited'
      : `${formatVisualAmount(approval.allowance, approval.token.decimals)} ${symbol}`,
    isUnlimited: approval.isUnlimited,
  }
}
