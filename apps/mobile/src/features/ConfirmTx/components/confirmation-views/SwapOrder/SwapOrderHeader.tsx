import React from 'react'
import { Text, View, H5 } from 'tamagui'
import { Container } from '@/src/components/Container'
import { TokenIcon } from '@/src/components/TokenIcon'
import { ellipsis, formatValue } from '@/src/utils/formatters'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { formatWithSchema } from '@/src/utils/date'

interface SwapOrderHeaderProps {
  txInfo: OrderTransactionInfo
  executionInfo: MultisigExecutionDetails
}

export function SwapOrderHeader({ txInfo, executionInfo }: SwapOrderHeaderProps) {
  const { sellToken, buyToken, sellAmount, buyAmount } = txInfo
  const date = formatWithSchema(executionInfo.submittedAt, 'MMM d yyyy')
  const time = formatWithSchema(executionInfo.submittedAt, 'hh:mm a')

  const sellTokenValue = formatValue(sellAmount, sellToken.decimals)
  const buyTokenValue = formatValue(buyAmount, buyToken.decimals)

  return (
    <>
      <View alignItems="center" justifyContent="center" gap="$2">
        <Text color="$textSecondaryLight">
          {date} at {time}
        </Text>
      </View>

      <View flexDirection="row" gap="$2" position="relative">
        <Container flex={1} padding="$4" borderRadius="$3">
          <View alignItems="center" gap="$2">
            <TokenIcon logoUri={sellToken.logoUri} size="$10" accessibilityLabel={sellToken.symbol} />
            <Text color="$textSecondaryLight">Sell</Text>
            <H5 fontWeight={600}>
              {ellipsis(sellTokenValue, 9)} {sellToken.symbol}
            </H5>
          </View>
        </Container>

        <View
          position="absolute"
          left={'50%'}
          marginLeft={-15}
          top={0}
          bottom={0}
          justifyContent="center"
          alignItems="center"
          zIndex={1}
        >
          <Badge
            circular={false}
            circleProps={{
              width: 30,
              height: 30,
              padding: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            content={<SafeFontIcon name="chevron-right" />}
            themeName="badge_background"
          />
        </View>

        <Container flex={1} padding="$4" borderRadius="$3">
          <View alignItems="center" gap="$2">
            <TokenIcon logoUri={buyToken.logoUri} size="$10" accessibilityLabel={buyToken.symbol} />
            <Text color="$textSecondaryLight">For at least</Text>
            <H5 fontWeight={600}>
              {ellipsis(buyTokenValue, 9)} {buyToken.symbol}
            </H5>
          </View>
        </Container>
      </View>
    </>
  )
}
