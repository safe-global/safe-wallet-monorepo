import React, { useState } from 'react'
import { Pressable } from 'react-native'
import { Text, View } from 'tamagui'
import { Logo } from '@/src/components/Logo'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { calculateProtocolPercentage } from '@safe-global/utils/features/positions'
import { PositionItem } from '../PositionItem'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'

interface ProtocolSectionProps {
  protocol: Protocol
  totalFiatValue: number
  currency: string
}

export const ProtocolSection = ({ protocol, totalFiatValue, currency }: ProtocolSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true)

  const { protocol_metadata, fiatTotal, items } = protocol
  const percentageRatio = calculateProtocolPercentage(fiatTotal, totalFiatValue)
  const formattedPercentage = formatPercentage(percentageRatio)
  const formattedFiatTotal = formatCurrency(fiatTotal, currency)

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev)
  }

  return (
    <View
      backgroundColor="$backgroundPaper"
      borderRadius="$3"
      marginBottom="$3"
      overflow="hidden"
      testID={`protocol-section-${protocol.protocol}`}
    >
      <Pressable onPress={toggleExpanded} testID="protocol-section-header">
        <View paddingVertical="$3" paddingHorizontal="$3" gap="$2">
          <View flexDirection="row" alignItems="center" gap="$2">
            <Logo
              logoUri={protocol_metadata.icon.url}
              accessibilityLabel={protocol_metadata.name}
              size="$5"
              fallbackIcon="apps"
            />
            <Text fontSize="$4" fontWeight={600} color="$color" numberOfLines={1} lineHeight={20}>
              {protocol_metadata.name}
            </Text>
          </View>
          <View flexDirection="row" alignItems="center" gap="$2">
            <Text fontSize="$8" fontWeight={600} color="$color" lineHeight={28}>
              {formattedFiatTotal}
            </Text>
            <View backgroundColor="$backgroundSecondary" paddingHorizontal="$1" paddingVertical="$1" borderRadius="$2">
              <Text fontSize="$3" color="$color" fontWeight={400} lineHeight={16}>
                {formattedPercentage}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>

      {isExpanded && (
        <View>
          <View height={1} backgroundColor="$borderLight" marginHorizontal="$3" />
          <View paddingTop="$4" paddingHorizontal="$3" paddingBottom="$3">
            {items.map((group, groupIndex) => (
              <View key={`${group.name}-${groupIndex}`} marginBottom={groupIndex < items.length - 1 ? '$4' : 0}>
                <Text fontSize="$4" fontWeight={600} color="$color" marginBottom="$2" paddingVertical="$2">
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
        </View>
      )}
    </View>
  )
}
