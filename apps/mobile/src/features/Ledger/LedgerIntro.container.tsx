import React from 'react'
import { ScrollView } from 'react-native'
import { View, Text, XStack, YStack } from 'tamagui'
import { router } from 'expo-router'
import { NavBarTitle } from '@/src/components/Title'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { SafeButton } from '@/src/components/SafeButton'
import { LedgerIcon, PhoneIcon, BluetoothIcon, DashIcon } from './icons'
import { Badge } from '@/src/components/Badge'

const title = 'Connect Ledger'

export const LedgerIntroContainer = () => {
  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle paddingRight={5}>{title}</NavBarTitle>,
  })

  const handleContinue = () => {
    router.push('/import-signers/ledger-connect')
  }

  return (
    <View flex={1}>
      <ScrollView onScroll={handleScroll} style={{ flex: 1 }}>
        <View height={200} flexDirection="row" justifyContent="center">
          <View width="343" alignItems="center" justifyContent="center" flexDirection="row">
            <View>
              <LedgerIcon />
            </View>
            <View paddingHorizontal="$3">
              <DashIcon />
            </View>
            <View>
              <BluetoothIcon />
            </View>

            <View paddingHorizontal="$3">
              <DashIcon />
            </View>

            <View>
              <PhoneIcon />
            </View>
          </View>
        </View>

        <YStack paddingHorizontal="$4" paddingTop="$6" gap="$6">
          <Text fontSize="$9" fontWeight="600" color="$color" textAlign="center">
            {title}
          </Text>

          <YStack gap="$4">
            <XStack gap="$3" alignItems="flex-start">
              <Badge content="1" themeName="badge_background" textContentProps={{ fontWeight: 600 }} />
              <YStack flex={1} gap="$1">
                <Text fontSize="$5" fontWeight="700" color="$color" lineHeight={22}>
                  Unlock your device
                </Text>
                <Text fontSize="$4" color="$colorSecondary" lineHeight={20}>
                  Connect it to Bluetooth and enable location services
                </Text>
              </YStack>
            </XStack>

            <XStack gap="$3" alignItems="flex-start">
              <Badge content="2" themeName="badge_background" textContentProps={{ fontWeight: 600 }} />
              <YStack flex={1} gap="$1">
                <Text fontSize="$5" fontWeight="700" color="$color" lineHeight={22}>
                  Open Ethereum app
                </Text>
                <Text fontSize="$4" color="$colorSecondary" lineHeight={20}>
                  Ensure that the Ethereum app is installed and open
                </Text>
              </YStack>
            </XStack>
          </YStack>
        </YStack>

        {/* Spacer for bottom button */}
        <View height={100} />
      </ScrollView>

      <View position="absolute" bottom={0} left={0} right={0} paddingHorizontal="$4" paddingTop="$4" paddingBottom="$4">
        <SafeButton onPress={handleContinue}>Continue</SafeButton>
      </View>
    </View>
  )
}
