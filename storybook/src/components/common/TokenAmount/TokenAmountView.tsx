import { type ReactElement, type ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import css from './styles.module.css'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import classNames from 'classnames'

const PRECISION = 20

export type TokenIconSlotProps = {
  logoUri: string
  tokenSymbol?: string | null
  fallbackSrc?: string
  size?: number
  chainId?: string
  noRadius: boolean
}

export type TokenAmountViewProps = {
  value: string
  decimals?: number | null
  logoUri?: string | null
  tokenSymbol?: string | null
  isOutgoing: boolean
  fallbackSrc?: string
  preciseAmount?: boolean
  iconSize?: number
  chainId?: string
  /** Renders the TokenIcon container */
  renderTokenIcon: (props: TokenIconSlotProps) => ReactNode
}

export function TokenAmountView({
  value,
  decimals,
  logoUri,
  tokenSymbol,
  isOutgoing,
  fallbackSrc,
  preciseAmount,
  iconSize,
  chainId,
  renderTokenIcon,
}: TokenAmountViewProps): ReactElement {
  const sign = isOutgoing ? '-' : ''
  const amount =
    decimals !== undefined ? formatVisualAmount(value, decimals, preciseAmount ? PRECISION : undefined) : value

  const fullAmount =
    decimals !== undefined
      ? sign + formatVisualAmount(value, decimals, PRECISION) + (tokenSymbol ? ' ' + tokenSymbol : '')
      : value

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className={classNames(css.container, { [css.verticalAlign]: logoUri })}>
            {logoUri &&
              renderTokenIcon({
                logoUri,
                tokenSymbol,
                fallbackSrc,
                size: iconSize,
                chainId,
                noRadius: true,
              })}
            <b className={css.tokenText}>
              {sign}
              {amount} {tokenSymbol && tokenSymbol}
            </b>
          </span>
        }
      />
      <TooltipContent>{fullAmount}</TooltipContent>
    </Tooltip>
  )
}
