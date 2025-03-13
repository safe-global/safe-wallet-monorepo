import { Badge } from '@/src/components/Badge'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { LargeHeaderTitle } from '@/src/components/Title'
import { SignersCard } from '@/src/components/transactions-list/Card/SignersCard'
import Clipboard from '@react-native-clipboard/clipboard'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React from 'react'
import { ScrollView } from 'react-native'
import { Button, Text, View } from 'tamagui'

export function ImportSuccess() {
  const { address, name } = useLocalSearchParams<{ address: `0x${string}`; name: string }>()
  const router = useRouter()

  const handleContinuePress = () => {
    // Go to top of the navigator stack
    router.dismissAll()
    // now close it
    router.back()
  }

  return (
    <View flex={1} justifyContent="space-between" testID={'import-success'}>
      <View flex={1}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View flex={1} flexGrow={1} alignItems="center" justifyContent="center" paddingHorizontal="$3">
            <Badge
              circleProps={{ backgroundColor: '#1B2A22' }}
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
                      Clipboard.setString(address)
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
      </View>

      <View paddingHorizontal="$3">
        <SafeButton onPress={handleContinuePress} testID={'import-success-continue'}>
          Continue
        </SafeButton>
      </View>
    </View>
  )
}
