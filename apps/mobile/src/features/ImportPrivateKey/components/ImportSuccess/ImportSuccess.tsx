import React from 'react'

import { Badge } from '@/src/components/Badge'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { LargeHeaderTitle } from '@/src/components/Title'
import { SignersCard } from '@/src/components/transactions-list/Card/SignersCard'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ScrollView } from 'react-native'
import { Button, Text, View } from 'tamagui'
import { ToastViewport } from '@tamagui/toast'
import { useCopyAndDispatchToast } from '@/src/hooks/useCopyAndDispatchToast'
import Logger from '@/src/utils/logger'

export function ImportSuccess() {
  const { address, name } = useLocalSearchParams<{ address: `0x${string}`; name: string }>()
  const router = useRouter()
  const copy = useCopyAndDispatchToast()

  const handleContinuePress = async () => {
    try {
      router.dismissAll()
      router.back()
    } catch (error) {
      Logger.error('Navigation error:', error)
    }
  }

  return (
    <View flex={1} justifyContent="space-between" testID={'import-success'}>
      <View flex={1}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View flex={1} flexGrow={1} alignItems="center" justifyContent="center" paddingHorizontal="$3">
            <Badge
              circleProps={{ backgroundColor: '$success' }}
              themeName="badge_success"
              circleSize={64}
              content={<SafeFontIcon size={32} color="$primary" name="check-filled" />}
            />

            <View margin="$10" width="100%" alignItems="center" gap="$4">
              <LargeHeaderTitle textAlign="center">Your signer is ready!</LargeHeaderTitle>

              <Text textAlign="center" fontSize="$4">
                You can now use it to interact with your Safe Account — sign and execute transactions seamlessly.
              </Text>
            </View>

            <SignersCard
              transparent={false}
              rightNode={
                <View flex={1} alignItems="flex-end">
                  <Button
                    maxWidth={120}
                    height="$10"
                    paddingHorizontal="$2"
                    borderRadius="$3"
                    backgroundColor="$borderLight"
                    fontWeight="500"
                    size="$5"
                    onPress={() => {
                      copy(address)
                    }}
                    icon={<SafeFontIcon name="copy" />}
                  >
                    Copy
                  </Button>
                </View>
              }
              name={name}
              address={address}
            />
          </View>
        </ScrollView>
        <ToastViewport multipleToasts={false} left={0} right={0} />
      </View>

      <View paddingHorizontal="$3">
        <SafeButton onPress={handleContinuePress} testID={'import-success-continue'}>
          Continue
        </SafeButton>
      </View>
    </View>
  )
}
