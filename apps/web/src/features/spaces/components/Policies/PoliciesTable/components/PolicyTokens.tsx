import TokenIcon from '@/components/common/TokenIcon'
import { Typography } from '@/components/ui/typography'
import { getPolicyTokens } from '../../utils/policyTokens'
import type { Policy } from '../../types'

const MAX_VISIBLE_TOKENS = 3

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
