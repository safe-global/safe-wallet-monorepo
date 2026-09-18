import TokenIcon from '@/components/common/TokenIcon'
import { Typography } from '@/components/ui/typography'
import { hasSpendingLimitData, type Policy, type PolicyTokenInfo } from '../../types'

const MAX_VISIBLE_TOKENS = 3

/** The distinct tokens across every spender. A proposer grant governs no tokens. */
export const getPolicyTokens = (policy: Policy): PolicyTokenInfo[] => {
  if (!hasSpendingLimitData(policy)) return []

  const byAddress = new Map<string, PolicyTokenInfo>()
  for (const spender of policy.data.spenders) {
    for (const { token } of spender.allowances) {
      byAddress.set(token.address.toLowerCase(), token)
    }
  }

  return [...byAddress.values()]
}

/** The TOKENS cell. Renders nothing at all for a policy that governs no tokens. */
const PolicyTokens = ({ policy }: { policy: Policy }) => {
  const tokens = getPolicyTokens(policy)

  if (tokens.length === 0) return null

  const visible = tokens.slice(0, MAX_VISIBLE_TOKENS)
  const overflow = tokens.length - visible.length

  return (
    <div className="flex items-center" data-testid="policy-tokens">
      {visible.map((token, index) => (
        <span key={token.address} className={index > 0 ? '-ml-2' : undefined}>
          <TokenIcon logoUri={token.logoUri ?? undefined} tokenSymbol={token.symbol} size={24} />
        </span>
      ))}

      {overflow > 0 && (
        <Typography variant="paragraph-small" className="ml-1 text-muted-foreground">
          +{overflow}
        </Typography>
      )}
    </div>
  )
}

export default PolicyTokens
