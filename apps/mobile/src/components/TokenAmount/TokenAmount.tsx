import { type ReactElement } from 'react'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { TransferDirection } from '@safe-global/store/gateway/types'
import { Text, TextProps } from 'tamagui'
import { TransferTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const PRECISION = 20

interface TokenAmountProps {
  value: string
  decimals?: number | null
  tokenSymbol?: string
  direction?: TransferTransactionInfo['direction']
  preciseAmount?: boolean
  textProps?: TextProps
  displayPositiveSign?: boolean
}

export const TokenAmount = ({
  value,
  decimals,
  tokenSymbol,
  direction,
  preciseAmount,
  textProps,
  displayPositiveSign,
}: TokenAmountProps): ReactElement => {
  const getSign = (): string => {
    if (direction === TransferDirection.OUTGOING) {
      return '-'
    }
    return displayPositiveSign ? '+' : ''
  }

  const formatAmount = (): string => {
    if (decimals === undefined || decimals === null) {
      return value
    }
    return formatVisualAmount(value, decimals, preciseAmount ? PRECISION : undefined)
  }

  return (
    <Text fontWeight={700} {...textProps}>
      {getSign()}
      {formatAmount()} {tokenSymbol}
    </Text>
  )
}

export default TokenAmount
