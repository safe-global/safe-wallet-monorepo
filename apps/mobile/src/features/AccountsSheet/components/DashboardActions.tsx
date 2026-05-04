import React from 'react'
import { Text, View, XStack, YStack } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'

function DashboardActionButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof SafeFontIcon>['name']
  label: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flex: 1 }}>
      <YStack backgroundColor="$backgroundPaper" borderRadius="$3" paddingVertical="$3" alignItems="center" gap="$2">
        <SafeFontIcon name={icon} size={20} color="$color" />
        <Text fontSize="$3" fontWeight={500} color="$color">
          {label}
        </Text>
      </YStack>
    </TouchableOpacity>
  )
}

export function DashboardActions({ onClose }: { onClose: () => void }) {
  const router = useRouter()

  const handleYourSigners = () => {
    onClose()
    requestAnimationFrame(() => router.push('/your-signers'))
  }

  const handleAppSettings = () => {
    onClose()
    requestAnimationFrame(() => router.push('/(tabs)/settings'))
  }

  return (
    <View paddingHorizontal="$2" paddingBottom="$4">
      <XStack gap="$3">
        <DashboardActionButton icon="owners" label="Your Signers" onPress={handleYourSigners} />
        <DashboardActionButton icon="settings" label="App Settings" onPress={handleAppSettings} />
      </XStack>
    </View>
  )
}
