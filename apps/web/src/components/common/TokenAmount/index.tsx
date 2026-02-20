import { type ReactElement } from 'react'
import { Tooltip } from '@mui/material'
import { TransferDirection } from '@safe-global/store/gateway/types'
import css from './styles.module.css'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
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
  const amount =
    decimals !== undefined ? formatVisualAmount(value, decimals, preciseAmount ? PRECISION : undefined) : value

  const fullAmount =
    decimals !== undefined
      ? sign + formatVisualAmount(value, decimals, PRECISION) + (tokenSymbol ? ' ' + tokenSymbol : '')
      : value

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
            noRadius
          />
        )}
        <b className={css.tokenText}>
          {sign}
          {amount} {tokenSymbol && tokenSymbol}
        </b>
      </span>
    </Tooltip>
  )
}

export default TokenAmount
