import type { ReactElement, ReactNode } from 'react'
import { ChevronDown, Lock } from 'lucide-react'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import type { GasTokenOption } from '@safe-global/views/features/fee-payment/types'
import css from './styles.module.css'

const SIGNER_FEE_TOOLTIP = 'Fees will be paid from the connected signer wallet when executing this transaction.'

export type TokenIconRenderer = (token: { logoUri?: string; symbol?: string }) => ReactNode

export const GasTokenSelector = ({
  availableGasTokens,
  selectedGasToken,
  onGasTokenChange,
  locked,
  forcedDisplay,
  lockedTooltip,
  currency,
  renderTokenIcon,
}: {
  availableGasTokens?: GasTokenOption[]
  selectedGasToken: string
  onGasTokenChange?: (address: string) => void
  locked?: boolean
  forcedDisplay?: { symbol: string; logoUri: string }
  lockedTooltip?: string
  currency: string
  renderTokenIcon: TokenIconRenderer
}): ReactElement => {
  const selected =
    forcedDisplay ??
    availableGasTokens?.find((t) => sameAddress(t.address, selectedGasToken)) ??
    availableGasTokens?.[0]

  const display = (
    <>
      {renderTokenIcon({ logoUri: selected?.logoUri, symbol: selected?.symbol })}
      <Typography variant="paragraph-small-bold" className="tracking-[0.1px]">
        {selected?.symbol}
      </Typography>
    </>
  )

  if (locked) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <div className={cn(css.gasTokenSelector, css.gasTokenSelectorLocked)} data-testid="gas-token-selector" />
          }
        >
          {display}
          <Lock className={css.tokenLockIcon} aria-label={lockedTooltip ?? SIGNER_FEE_TOOLTIP} />
        </TooltipTrigger>
        <TooltipContent side="top">{lockedTooltip ?? SIGNER_FEE_TOOLTIP}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid="gas-token-selector"
        nativeButton={false}
        render={<div className={css.gasTokenSelector} />}
      >
        {display}
        <ChevronDown className={css.selectorCaret} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="center" className={css.selectorPopoverPaperGasToken}>
        {availableGasTokens?.map((token) => (
          <DropdownMenuItem
            key={token.address}
            onClick={() => onGasTokenChange?.(token.address)}
            className={cn(css.selectorMenuItem, css.gasTokenMenuItem)}
          >
            {renderTokenIcon({ logoUri: token.logoUri, symbol: token.symbol })}
            <div className={css.gasTokenMenuItemText}>
              <Typography variant="paragraph-small-bold">{token.symbol}</Typography>
              {token.fiatBalance && (
                <Typography variant="paragraph-mini" color="muted">
                  {formatCurrency(token.fiatBalance, currency)}
                </Typography>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
