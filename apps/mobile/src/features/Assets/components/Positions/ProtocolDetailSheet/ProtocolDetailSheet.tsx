import React from 'react'
import { Text, View } from 'tamagui'
import { Logo } from '@/src/components/Logo'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { PositionItem } from '../PositionItem'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { calculateProtocolFiatChange } from './utils'

interface ProtocolDetailSheetProps {
  protocol: Protocol
  percentageRatio: number
  currency: string
}

export const ProtocolDetailSheet = ({ protocol, percentageRatio, currency }: ProtocolDetailSheetProps) => {
  const { protocol_metadata, fiatTotal, items } = protocol
  const formattedPercentage = formatPercentage(percentageRatio)
  const formattedFiatTotal = formatCurrency(fiatTotal, currency)
  const fiatChange = calculateProtocolFiatChange(protocol)

  return (
    <View paddingHorizontal="$2" width="100%">
      {/* Protocol header row */}
      <View
        backgroundColor="$backgroundPaper"
        borderRadius="$3"
        height={72}
        padding="$3"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <View flexDirection="row" alignItems="center" gap="$2" flex={1}>
          <Logo
            logoUri={protocol_metadata.icon.url}
            accessibilityLabel={protocol_metadata.name}
            size="$10"
            fallbackIcon="apps"
          />
          <Text fontSize={24} fontWeight={600} color="$color" lineHeight={28}>
            {protocol_metadata.name}
          </Text>
          <View backgroundColor="$backgroundSecondary" paddingHorizontal="$2" paddingVertical={2} borderRadius="$2">
            <Text fontSize={11} color="$color" fontWeight={400} lineHeight={16} letterSpacing={1}>
              {formattedPercentage}
            </Text>
          </View>
        </View>
        <View alignItems="flex-end">
          <Text fontSize={24} fontWeight={600} color="$color" lineHeight={28}>
            {formattedFiatTotal}
          </Text>
          {fiatChange !== null && (
            <Text
              fontSize="$4"
              fontWeight={400}
              color={fiatChange > 0 ? '$success' : fiatChange < 0 ? '$error' : '$colorSecondary'}
              lineHeight={20}
            >
              {fiatChange > 0 ? '+' : ''}
              {formatPercentage(fiatChange)}
            </Text>
          )}
        </View>
      </View>

      <Text fontSize={16} fontWeight={700} color="$colorSecondary" marginTop="$4" marginBottom="$3" lineHeight={22}>
        Your positions
      </Text>

      {items.map((group, groupIndex) => (
        <View
          key={`${group.name}-${groupIndex}`}
          backgroundColor="$backgroundPaper"
          borderRadius="$3"
          marginBottom="$2"
          padding="$3"
        >
          <Text fontSize={20} fontWeight={600} color="$color" lineHeight={26}>
            {group.name}
          </Text>
          <View height={1} backgroundColor="$borderLight" marginVertical="$3" />
          {group.items.map((position, positionIndex) => (
            <PositionItem
              key={`${position.tokenInfo.address}-${positionIndex}`}
              position={position}
              currency={currency}
            />
          ))}
        </View>
      ))}
    </View>
  )
}
