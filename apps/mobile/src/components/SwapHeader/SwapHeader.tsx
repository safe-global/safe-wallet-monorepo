import React from 'react'
import { Text, View, H5 } from 'tamagui'
import { Container } from '@/src/components/Container'
import { TokenIcon } from '@/src/components/TokenIcon'
import { ellipsis } from '@/src/utils/formatters'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

interface TokenInfo {
  logoUri?: string | null
  symbol: string
}

interface SwapHeaderProps {
  date?: string
  time?: string
  fromToken: TokenInfo
  toToken: TokenInfo
  fromAmount: string
  toAmount: string
  fromLabel?: string
  toLabel?: string
}

export function SwapHeader({
  date,
  time,
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  fromLabel = 'Sell',
  toLabel = 'For',
}: SwapHeaderProps) {
  return (
    <>
      {date && time && (
        <View alignItems="center" justifyContent="center" gap="$2">
          <Text color="$textSecondaryLight">
            {date} at {time}
          </Text>
        </View>
      )}

      <View flexDirection="row" gap="$2" position="relative">
        <Container flex={1} padding="$4" borderRadius="$3">
          <View alignItems="center" gap="$2">
            <TokenIcon logoUri={fromToken.logoUri} size="$10" accessibilityLabel={fromToken.symbol} />
            <Text color="$textSecondaryLight">{fromLabel}</Text>
            <H5 fontWeight={600}>
              {ellipsis(fromAmount, 9)} {fromToken.symbol}
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
            <TokenIcon logoUri={toToken.logoUri} size="$10" accessibilityLabel={toToken.symbol} />
            <Text color="$textSecondaryLight">{toLabel}</Text>
            <H5 fontWeight={600}>
              {ellipsis(toAmount, 9)} {toToken.symbol}
            </H5>
          </View>
        </Container>
      </View>
    </>
  )
}
