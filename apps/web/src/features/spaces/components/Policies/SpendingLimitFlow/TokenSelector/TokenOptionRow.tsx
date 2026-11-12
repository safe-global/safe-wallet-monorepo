import { TriangleAlert } from 'lucide-react'
import TokenIcon from '@/components/common/TokenIcon'
import { Typography } from '@safe-global/views/components/ui/typography'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { tokenOptionLabel, type TokenOption } from '../utils/tokenOptions'
import {
  TOKEN_ICON_SIZE,
  UNTRUSTED_TOKEN_WARNING,
} from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/TokenSelector/constants'

/** Shown under the symbol: the name when both exist, the address when only one does. */
const secondaryLine = (option: TokenOption): string => {
  if (option.symbol && option.name) return option.name
  if (option.symbol || option.name) return shortenAddress(option.address)
  return ''
}

/** A missing logo falls back to TokenIcon's placeholder and a missing symbol/name to the shortened address, so a token is never hidden. */
const TokenOptionRow = ({ option }: { option: TokenOption }) => {
  const primary = tokenOptionLabel(option)
  const secondary = secondaryLine(option)

  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <TokenIcon logoUri={option.logoUri} tokenSymbol={primary} size={TOKEN_ICON_SIZE} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Typography variant="paragraph-small-medium" className="truncate" title={primary}>
          {primary}
        </Typography>
        {secondary && (
          <Typography variant="paragraph-mini" color="muted" className="truncate" title={secondary}>
            {secondary}
          </Typography>
        )}
      </div>

      {option.untrusted && (
        <TriangleAlert
          className="text-warning-strong size-4 shrink-0"
          aria-label={UNTRUSTED_TOKEN_WARNING}
          data-testid="token-untrusted-icon"
        />
      )}
    </div>
  )
}

export default TokenOptionRow
