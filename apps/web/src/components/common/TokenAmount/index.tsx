import { type ReactElement } from 'react'
import { Tooltip } from '@mui/material'
import { TransferDirection } from '@safe-global/store/gateway/types'
import css from './styles.module.css'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { formatAmount, formatAmountPrecise } from '@safe-global/utils/utils/formatNumber'
import TokenIcon from '../TokenIcon'
import classNames from 'classnames'
import type { TransferTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const PRECISION = 20

const TokenAmount = ({
  value,
  decimals,
  logoUri,
  tokenSymbol,
  direction,
  fallbackSrc,
  preciseAmount,
  iconSize,
  chainId,
}: {
  value: string
  decimals?: number | null
  logoUri?: string | null
  tokenSymbol?: string | null
  direction?: TransferTransactionInfo['direction']
  fallbackSrc?: string
  preciseAmount?: boolean
  iconSize?: number
  chainId?: string
}): ReactElement => {
  const sign = direction === TransferDirection.OUTGOING ? '-' : ''

  // If decimals is provided, it's BigInt format (transactions)
  // If decimals is NOT provided, it's already a decimal string (portfolio balances)
  const amount =
    decimals !== undefined
      ? formatVisualAmount(value, decimals, preciseAmount ? PRECISION : undefined)
      : preciseAmount
        ? formatAmountPrecise(value, PRECISION)
        : formatAmount(value)

  const fullAmount =
    decimals !== undefined
      ? sign + formatVisualAmount(value, decimals, PRECISION) + ' ' + tokenSymbol
      : sign + formatAmountPrecise(value, PRECISION) + ' ' + tokenSymbol

  return (
    <Tooltip title={fullAmount}>
      <span className={classNames(css.container, { [css.verticalAlign]: logoUri })}>
        {logoUri && (
          <TokenIcon
            logoUri={logoUri}
            tokenSymbol={tokenSymbol}
            fallbackSrc={fallbackSrc}
            size={iconSize}
            chainId={chainId}
          />
        )}
        <b className={css.tokenText}>
          {sign}
          {amount} {tokenSymbol}
        </b>
      </span>
    </Tooltip>
  )
}

export default TokenAmount
