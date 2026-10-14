import type { ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Typography } from '@safe-global/views/components/ui/typography'

export type BadgeToken = { address: string; symbol: string; logoUri?: string | null }

/**
 * The token a policy is scoped to — the quickest way to tell sibling rows apart when they
 * all belong to the same policy type.
 *
 * Falls back to the shortened address, not a generic word: the allowlist sends bare token
 * addresses with no metadata, so every row would otherwise read the same "Token".
 */
export const TokenBadge = ({ token }: { token: BadgeToken }): ReactElement => {
  const label = token.symbol || shortenAddress(token.address)

  return (
    <div className="flex min-w-0 flex-row items-center gap-1.5">
      {token.logoUri ? (
        <img src={token.logoUri} alt="" className="size-[18px] shrink-0 rounded-full" />
      ) : (
        <div
          aria-hidden
          className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--color-background-main)] text-[9px] font-bold text-muted-foreground"
        >
          {/* An initial, not the symbol — the symbol is already spelled out next to it. */}
          {(token.symbol || '?').slice(0, 1).toUpperCase()}
        </div>
      )}
      <Typography variant="paragraph-small-bold" className="truncate">
        {label}
      </Typography>
    </div>
  )
}

export default TokenBadge
