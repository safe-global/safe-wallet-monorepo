import TokenIcon from '@/components/common/TokenIcon'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getPolicyTokens } from '../../utils/policyTokens'
import type { Policy } from '../../types'

const MAX_VISIBLE_TOKENS = 3

const PolicyTokens = ({ policy }: { policy: Policy }) => {
  const tokens = getPolicyTokens(policy)

  if (tokens.length === 0) return null

  const visible = tokens.slice(0, MAX_VISIBLE_TOKENS)
  const overflow = tokens.length - visible.length

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex w-fit" />}>
        <span className="flex items-center" data-testid="policy-tokens">
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
        </span>
      </TooltipTrigger>

      <TooltipContent className="bg-popover text-popover-foreground ring-foreground/10 shadow-md ring-1 [&>[data-side]]:hidden">
        <div
          data-testid="policy-tokens-tooltip"
          className="no-scrollbar flex flex-col gap-1 overflow-y-auto overscroll-contain"
          style={{ maxHeight: 'calc(var(--available-height) - 0.75rem)' }}
        >
          {tokens.map((token) => (
            <div key={token.address} className="flex items-center gap-2">
              <TokenIcon logoUri={token.logoUri ?? undefined} tokenSymbol={token.symbol} size={16} />
              <Typography variant="paragraph-small">{token.symbol}</Typography>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export default PolicyTokens
