import TokenIcon from '@/components/common/TokenIcon'
import { Typography } from '@/components/ui/typography'
import { formatVisualAmount, shortenAddress } from '@safe-global/utils/utils/formatters'
import { tokenOptionLabel, type TokenOption } from '../../utils/tokenOptions'
import { TOKEN_ICON_SIZE } from './constants'

/**
 * One selectable token. Metadata degrades gracefully: a missing logo falls back to TokenIcon's
 * placeholder, missing symbol/name fall back to the shortened address — a token is never hidden.
 */
const TokenOptionRow = ({ option }: { option: TokenOption }) => {
  const primary = tokenOptionLabel(option)
  const secondary =
    option.symbol && option.name ? option.name : option.symbol || option.name ? shortenAddress(option.address) : ''

  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <TokenIcon logoUri={option.logoUri} tokenSymbol={primary} size={TOKEN_ICON_SIZE} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Typography variant="paragraph-small" className="truncate">
          {primary}
        </Typography>
        {secondary && (
          <Typography variant="paragraph-mini" color="muted" className="truncate">
            {secondary}
          </Typography>
        )}
      </div>

      {option.group === 'held' && option.balance !== undefined && (
        <Typography
          variant="paragraph-mini"
          color="muted"
          className="shrink-0 whitespace-nowrap"
          data-testid="token-option-balance"
        >
          {formatVisualAmount(option.balance, option.decimals)} {option.symbol}
        </Typography>
      )}
    </div>
  )
}

export default TokenOptionRow
