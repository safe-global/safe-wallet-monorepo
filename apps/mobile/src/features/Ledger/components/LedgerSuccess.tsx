import React from 'react'
import { ScrollView } from 'react-native'
import { View, Text, Button } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ToastViewport } from '@tamagui/toast'

import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Badge } from '@/src/components/Badge'
import { LargeHeaderTitle } from '@/src/components/Title'
import { SignersCard } from '@/src/components/transactions-list/Card/SignersCard'
import { AbsoluteLinearGradient } from '@/src/components/LinearGradient'

interface LedgerSuccessProps {
  address: string
  name: string
  onDone: () => void
  onCopyAddress: () => void
}

export const LedgerSuccess = ({ address, name, onDone, onCopyAddress }: LedgerSuccessProps) => {
  const { bottom } = useSafeAreaInsets()

  return (
    <View flex={1} justifyContent="space-between" testID="ledger-import-success">
      <AbsoluteLinearGradient />

      <View flex={1}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View flex={1} flexGrow={1} alignItems="center" justifyContent="center" paddingHorizontal="$4">
            <Badge
              circleProps={{ backgroundColor: '$success' }}
              themeName="badge_success"
              circleSize={64}
              content={<SafeFontIcon size={32} color="white" name="check-filled" />}
            />

            <View margin="$10" width="100%" alignItems="center" gap="$4">
              <LargeHeaderTitle textAlign="center">Pairing successful!</LargeHeaderTitle>

              <Text textAlign="center" fontSize="$4" color="$colorSecondary">
                You successfully paired Ledger
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
                    onPress={onCopyAddress}
                    icon={<SafeFontIcon name="copy" />}
                  >
                    Copy
                  </Button>
                </View>
              }
              name={name || 'My Signer'}
              address={address as `0x${string}`}
            />

            {address && (
              <View
                marginTop="$4"
                paddingHorizontal="$4"
                paddingVertical="$3"
                backgroundColor="$backgroundSecondary"
                borderRadius="$3"
                width="100%"
              >
                <Text fontSize="$3" color="$colorSecondary" textAlign="center">
                  {address}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        <ToastViewport multipleToasts={false} left={0} right={0} />
      </View>

      <View paddingHorizontal="$4" paddingBottom={bottom}>
        <SafeButton onPress={onDone} testID="ledger-success-done">
          Done
        </SafeButton>
      </View>
    </View>
  )
}
