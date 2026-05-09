import { Badge } from '@/src/components/Badge/Badge'
import { Identicon } from '@/src/components/Identicon'
import { SafeButton } from '@/src/components/SafeButton/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { LargeHeaderTitle } from '@/src/components/Title/LargeHeaderTitle'
import { Link, useLocalSearchParams } from 'expo-router'
import React from 'react'
import { ScrollView } from 'react-native'
import { Text, View } from 'tamagui'

export function ImportError() {
  const { address } = useLocalSearchParams<{ address: `0x${string}` }>()

  return (
    <View flex={1} justifyContent="space-between">
      <View flex={1}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View flex={1} flexGrow={1} alignItems="center" justifyContent="center" paddingHorizontal="$3">
            <View flexDirection="row" alignItems="center" gap="$3">
              <Identicon address={address} size={64} />

              <Text fontSize="$4" color="$error">
                . . . .
              </Text>

              <Badge
                themeName="badge_error"
                circleSize={64}
                content={<SafeFontIcon size={32} color="$error" name="close-filled" />}
              />
            </View>

            <View margin="$10" width="100%" alignItems="center" gap="$4">
              <LargeHeaderTitle textAlign="center">Private key couldn't be imported</LargeHeaderTitle>

              <Text textAlign="center" fontSize="$4">
                This private key does not belong to any signer of this Safe Account. Double-check the address and try to
                import again.
              </Text>

              <Text textAlign="center" fontSize="$4">
                Don’t worry, your private key was not stored!
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      <View paddingHorizontal="$3" gap="$6">
        <Link href={'../'} asChild>
          <SafeButton>Import again</SafeButton>
        </Link>
      </View>
    </View>
  )
}
