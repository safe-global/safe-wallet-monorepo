import { type ReactElement } from 'react'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { TransferDirection } from '@safe-global/store/gateway/types'
import { Text } from 'tamagui'
import { TransferTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const PRECISION = 20

export const TokenAmount = ({
  value,
  decimals,
  tokenSymbol,
  direction,
  preciseAmount,
}: {
  value: string
  decimals?: number | null
  tokenSymbol?: string
  direction?: TransferTransactionInfo['direction']
  preciseAmount?: boolean
}): ReactElement => {
  const sign = direction === TransferDirection.OUTGOING ? '-' : ''
  const amount =
    decimals !== undefined && decimals !== null
      ? formatVisualAmount(value, decimals, preciseAmount ? PRECISION : undefined)
      : value

  return (
    <Text fontWeight={700}>
      {sign}
      {amount} {tokenSymbol}
    </Text>
  )
}

export default TokenAmount
