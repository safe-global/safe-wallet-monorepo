import React from 'react'
import { View, Text, YStack, getTokenValue } from 'tamagui'
import { RefreshControl, ScrollView } from 'react-native'
import { Pressable } from 'react-native'
import type { DiscoveredDevice } from '@ledgerhq/device-management-kit'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useTheme } from '@/src/theme/hooks/useTheme'
interface LedgerDevice {
  id: string
  name: string
  device: DiscoveredDevice
}

interface DeviceListProps {
  devices: LedgerDevice[]
  onDevicePress: (device: LedgerDevice) => void
  onRefresh: () => void
  isRefreshing: boolean
}

const DeviceListItem = ({ device, onPress }: { device: LedgerDevice; onPress: () => void }) => {
  const { isDark } = useTheme()
  return (
    <Pressable onPress={onPress}>
      <View
        backgroundColor={isDark ? '$backgroundPaper' : '$background'}
        borderRadius="$2"
        padding="$4"
        marginBottom="$3"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <View flexDirection="row" alignItems="center" gap="$3">
          <View
            backgroundColor="$backgroundSecondary"
            borderRadius="$10"
            width={32}
            height={32}
            alignItems="center"
            justifyContent="center"
          >
            <SafeFontIcon name="hardware" size={16} color="$color" />
          </View>
          <Text fontSize="$5" fontWeight="700" color="$color">
            {device.name}
          </Text>
        </View>
        <SafeFontIcon name="chevron-right" size={16} color="$colorSecondary" />
      </View>
    </Pressable>
  )
}

export const DeviceList = ({ devices, onDevicePress, onRefresh, isRefreshing }: DeviceListProps) => {
  return (
    <View flex={1}>
      {/* Header */}
      <View paddingHorizontal="$4" paddingBottom="$4">
        <Text fontSize="$9" fontWeight="600" color="$color" marginBottom="$3">
          Available devices
        </Text>
        <Text fontSize="$4" color="$color" lineHeight={20}>
          Keep Ethereum app open and selected Ledger to connect.
        </Text>
      </View>

      {/* Device list */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={getTokenValue('$color.successMainDark')}
            colors={[getTokenValue('$color.successMainDark')]}
          />
        }
      >
        <YStack gap="$0">
          {devices.map((device) => (
            <DeviceListItem key={device.id} device={device} onPress={() => onDevicePress(device)} />
          ))}
        </YStack>
      </ScrollView>
    </View>
  )
}
