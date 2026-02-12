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
        marginBottom="$2"
        height={64}
        paddingLeft="$3"
        paddingRight="$2"
        paddingVertical="$3"
        flexDirection="row"
        alignItems="center"
      >
        <Logo
          logoUri={protocol_metadata.icon.url}
          accessibilityLabel={protocol_metadata.name}
          size="$8"
          fallbackIcon="apps"
        />
        <View flex={1} marginLeft="$3" overflow="hidden">
          <View flexDirection="row" alignItems="center" gap="$2">
            <Text fontSize="$4" fontWeight={600} color="$color" numberOfLines={1} lineHeight={20} flexShrink={1}>
              {protocol_metadata.name}
            </Text>
            <View
              backgroundColor="$backgroundSecondary"
              paddingHorizontal="$2"
              paddingVertical={2}
              borderRadius="$2"
              flexShrink={0}
            >
              <Text fontSize={11} color="$color" fontWeight={400} lineHeight={16} letterSpacing={1}>
                {formattedPercentage}
              </Text>
            </View>
          </View>
        </View>
        <View flexDirection="row" alignItems="center" gap="$2" flexShrink={0}>
          <View alignItems="flex-end">
            <Text fontSize="$4" fontWeight={600} color="$color" lineHeight={20}>
              {formattedFiatTotal}
            </Text>
            {fiatChange !== null && (
              <Text
                fontSize="$4"
                fontWeight={400}
                color={fiatChange > 0 ? '$success' : fiatChange < 0 ? '$error' : '$colorSecondary'}
                lineHeight={20}
              >
                {fiatChange > 0 ? '+' : fiatChange < 0 ? '-' : ''}
                {formatPercentage(fiatChange)}
              </Text>
            )}
          </View>
          <SafeFontIcon name="chevron-right" size={24} color="$colorSecondary" />
        </View>
      </View>
    </Pressable>
  )
}
