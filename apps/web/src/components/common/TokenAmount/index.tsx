import { formatVisualAmount } from '@/utils/formatters'
import { Tooltip } from '@mui/material'
import { TransferDirection } from '@safe-global/safe-gateway-typescript-sdk'
import classNames from 'classnames'
import { type ReactElement } from 'react'
import TokenIcon from '../TokenIcon'
import css from './styles.module.css'

const PRECISION = 20

const TokenAmount = ({
  value,
  decimals,
  logoUri,
  tokenSymbol,
  direction,
  fallbackSrc,
  preciseAmount,
  hasTooltip = true,
}: {
  value: string
  decimals?: number | null
  logoUri?: string
  tokenSymbol?: string
  direction?: TransferDirection
  fallbackSrc?: string
  preciseAmount?: boolean
  hasTooltip?: boolean
}): ReactElement => {
  const sign = direction === TransferDirection.OUTGOING ? '-' : ''
  const amount =
    decimals !== undefined ? formatVisualAmount(value, decimals, preciseAmount ? PRECISION : undefined) : value
  const fullAmount =
    decimals !== undefined ? sign + formatVisualAmount(value, decimals, PRECISION) + ' ' + tokenSymbol : value

  const tokenAmount = (
    <span className={classNames(css.container, { [css.verticalAlign]: logoUri })}>
      {logoUri && <TokenIcon logoUri={logoUri} tokenSymbol={tokenSymbol} fallbackSrc={fallbackSrc} />}
      <b>
        {sign}
        {amount} {tokenSymbol}
      </b>
    </span>
  )
  return hasTooltip ? <Tooltip title={fullAmount}>{tokenAmount}</Tooltip> : tokenAmount
}

export default TokenAmount
