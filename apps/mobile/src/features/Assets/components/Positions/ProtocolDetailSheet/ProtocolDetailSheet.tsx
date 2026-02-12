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
    <View paddingHorizontal="$4" width="100%">
      <View alignItems="center" paddingVertical="$4" gap="$2">
        <Logo
          logoUri={protocol_metadata.icon.url}
          accessibilityLabel={protocol_metadata.name}
          size="$8"
          fallbackIcon="apps"
        />
        <View flexDirection="row" alignItems="center" gap="$2">
          <Text fontSize="$5" fontWeight={600} color="$color">
            {protocol_metadata.name}
          </Text>
          <View backgroundColor="$backgroundSecondary" paddingHorizontal="$1" paddingVertical="$1" borderRadius="$2">
            <Text fontSize="$3" color="$color" fontWeight={400} lineHeight={16}>
              {formattedPercentage}
            </Text>
          </View>
        </View>
        <View flexDirection="row" alignItems="center" gap="$2">
          <Text fontSize="$8" fontWeight={600} color="$color" lineHeight={28}>
            {formattedFiatTotal}
          </Text>
          {fiatChange !== null && (
            <Text
              fontSize="$3"
              fontWeight={400}
              color={fiatChange > 0 ? '$success' : fiatChange < 0 ? '$error' : '$colorSecondary'}
            >
              {fiatChange > 0 ? '+' : ''}
              {formatPercentage(fiatChange)}
            </Text>
          )}
        </View>
      </View>

      <Text fontSize="$3" fontWeight={600} color="$colorSecondary" marginBottom="$2" marginTop="$2">
        Your positions
      </Text>

      {items.map((group, groupIndex) => (
        <View
          key={`${group.name}-${groupIndex}`}
          backgroundColor="$backgroundPaper"
          borderRadius="$3"
          marginBottom="$3"
          padding="$3"
        >
          <Text fontSize="$4" fontWeight={600} color="$color" marginBottom="$2">
            {group.name}
          </Text>
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
