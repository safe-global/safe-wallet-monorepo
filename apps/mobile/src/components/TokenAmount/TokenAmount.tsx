import { type ReactElement } from 'react'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { TransferDirection } from '@safe-global/store/gateway/types'
import { Text, TextProps } from 'tamagui'
import { TransferTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ellipsis } from '@/src/utils/formatters'

const PRECISION = 20

interface TokenAmountProps {
  value: string
  decimals?: number | null
  tokenSymbol?: string
  direction?: TransferTransactionInfo['direction']
  preciseAmount?: boolean
  textProps?: TextProps
  displayPositiveSign?: boolean
  testID?: string
}

export const TokenAmount = ({
  value,
  decimals,
  tokenSymbol,
  direction,
  preciseAmount,
  textProps,
  displayPositiveSign,
  testID,
}: TokenAmountProps): ReactElement => {
  const getSign = (): string => {
    if (direction === TransferDirection.OUTGOING) {
      return '-'
    }
    return displayPositiveSign ? '+' : ''
  }

  const formatAmount = (): string => {
    if (decimals === undefined || decimals === null) {
      return ellipsis(value, 10)
    }

    const formattedAmount = formatVisualAmount(value, decimals, preciseAmount ? PRECISION : undefined)

    return ellipsis(formattedAmount, 10)
  }

  return (
    <Text fontWeight={700} {...textProps} testID={testID}>
      {getSign()}
      {formatAmount()} {tokenSymbol}
    </Text>
  )
}

export default TokenAmount
