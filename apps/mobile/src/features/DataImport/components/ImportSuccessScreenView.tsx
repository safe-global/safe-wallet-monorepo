import React from 'react'
import { Text, YStack, H2, ScrollView, View, XStack } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { StyleSheet } from 'react-native'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Badge } from '@/src/components/Badge'
import { LinearGradient } from 'expo-linear-gradient'
import { NotImportedKey } from '../helpers/transforms'
import { Identicon } from '@/src/components/Identicon'
import { Container } from '@/src/components/Container'
import { InfoSheet } from '@/src/components/InfoSheet'

interface ImportSuccessScreenViewProps {
  bottomInset: number
  gradientColors: [string, string]
  onContinue: () => void
  notImportedKeys: NotImportedKey[]
}

export const ImportSuccessScreenView = ({
  bottomInset,
  gradientColors,
  onContinue,
  notImportedKeys,
}: ImportSuccessScreenViewProps) => {
  return (
    <View flex={1} paddingBottom={bottomInset} testID="import-success-screen">
      <LinearGradient colors={gradientColors} style={styles.background} />
      <View flex={1} justifyContent="space-between">
        <View flex={1}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View flex={1} flexGrow={1} alignItems="center" justifyContent="center" paddingHorizontal="$3">
              <Badge
                themeName="badge_success_variant1"
                circleSize={64}
                content={<SafeFontIcon size={32} name="check-filled" />}
              />

              <YStack margin="$4" width="100%" alignItems="center" gap="$4">
                {/* Title */}
                <H2 fontWeight={'600'} textAlign="center">
                  Import complete!
                </H2>

                {/* Subtitle */}
                <Text fontSize="$4" textAlign="center" marginHorizontal={'$4'} color="$colorSecondary">
                  Your data has been successfully imported. However, some signers are not associated with your Safe
                  accounts and won't be added
                </Text>

                {/* Not Imported Keys Section */}
                {notImportedKeys.length > 0 && (
                  <YStack width="100%" gap="$3" marginTop="$4" paddingHorizontal="$2">
                    <InfoSheet info="Those keys were not associated with any Safe account from your import.">
                      <XStack alignItems="center" justifyContent="center" gap="$2">
                        <SafeFontIcon size={16} name={'info'} color="$colorSecondary" />
                        <Text fontWeight="500" color="$colorSecondary">
                          Why did it happen?
                        </Text>
                      </XStack>
                    </InfoSheet>

                    <Container gap="$2" backgroundColor="$background" padding="$3" borderRadius="$3">
                      <Text fontWeight="500" marginBottom="$2">
                        Not imported:
                      </Text>
                      {notImportedKeys.map((key, index) => (
                        <XStack key={index} alignItems="center" gap="$3" paddingVertical="$1">
                          <Identicon address={key.address as `0x${string}`} size={32} />
                          <YStack flex={1}>
                            <Text fontSize="$3" fontWeight="500">
                              {key.name}
                            </Text>
                            <Text fontSize="$2" color="$colorSecondary">
                              {key.address.slice(0, 6)}...{key.address.slice(-4)}
                            </Text>
                          </YStack>
                        </XStack>
                      ))}
                    </Container>
                  </YStack>
                )}
              </YStack>
            </View>
          </ScrollView>
        </View>

        <View paddingHorizontal="$4">
          <Text fontSize="$2" color="$colorSecondary" marginBottom="$2" textAlign="center">
            This does not affect your imported accounts or the security of your data.
          </Text>
          <SafeButton primary testID="continue-button" onPress={onContinue}>
            Continue
          </SafeButton>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
  notImportedHeader: {
    alignSelf: 'center',
  },
})
