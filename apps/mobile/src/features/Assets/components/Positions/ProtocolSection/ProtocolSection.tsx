import React from 'react'
import { Pressable } from 'react-native'
import { Text, View } from 'tamagui'
import { useRouter } from 'expo-router'
import { Logo } from '@/src/components/Logo'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { calculateProtocolPercentage } from '@safe-global/utils/features/positions'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { calculateProtocolFiatChange } from '../ProtocolDetailSheet/utils'

interface ProtocolSectionProps {
  protocol: Protocol
  totalFiatValue: number
  currency: string
}

export const ProtocolSection = ({ protocol, totalFiatValue, currency }: ProtocolSectionProps) => {
  const router = useRouter()
  const { protocol_metadata, fiatTotal } = protocol
  const percentageRatio = calculateProtocolPercentage(fiatTotal, totalFiatValue)
  const formattedPercentage = formatPercentage(percentageRatio)
  const formattedFiatTotal = formatCurrency(fiatTotal, currency)
  const fiatChange = calculateProtocolFiatChange(protocol)

  const handlePress = () => {
    router.push({ pathname: '/protocol-detail-sheet', params: { protocolId: protocol.protocol } })
  }

  return (
    <Pressable onPress={handlePress} testID={`protocol-section-${protocol.protocol}`}>
      <View
        backgroundColor="$backgroundPaper"
        borderRadius="$3"
        marginBottom="$3"
        paddingVertical="$3"
        paddingHorizontal="$3"
        flexDirection="row"
        alignItems="center"
      >
        <Logo
          logoUri={protocol_metadata.icon.url}
          accessibilityLabel={protocol_metadata.name}
          size="$8"
          fallbackIcon="apps"
        />
        <View flex={1} marginLeft="$3">
          <View flexDirection="row" alignItems="center" gap="$2">
            <Text fontSize="$4" fontWeight={600} color="$color" numberOfLines={1} lineHeight={20}>
              {protocol_metadata.name}
            </Text>
            <View backgroundColor="$backgroundSecondary" paddingHorizontal="$1" paddingVertical="$1" borderRadius="$2">
              <Text fontSize="$3" color="$color" fontWeight={400} lineHeight={16}>
                {formattedPercentage}
              </Text>
            </View>
          </View>
        </View>
        <View alignItems="flex-end" marginRight="$2">
          <Text fontSize="$4" fontWeight={600} color="$color">
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
        <SafeFontIcon name="chevron-right" size={16} color="$colorSecondary" />
      </View>
    </Pressable>
  )
}
