import React, { useMemo } from 'react'
import { useRouter } from 'expo-router'
import { Text, YStack, H2, XStack, ScrollView } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'react-native'
import { useDataImportContext } from './DataImportProvider'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Container } from '@/src/components/Container'
import { Badge } from '@/src/components/Badge'

interface ImportSummary {
  safeAccountsCount: number
  signersCount: number
  addressBookCount: number
}

interface LegacyDataStructure {
  safes?: Array<{
    address: string
    chain: string
    name: string
  }>
  contacts?: Array<{
    address: string
    name: string
    chain: string
  }>
  keys?: Array<{
    address: string
    name: string
    key: string
  }>
}

export const ReviewData = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const { importedData } = useDataImportContext()

  const importSummary = useMemo<ImportSummary>(() => {
    if (!importedData?.data) {
      return { safeAccountsCount: 0, signersCount: 0, addressBookCount: 0 }
    }

    const data = importedData.data as LegacyDataStructure

    // Count Safe Accounts from addedSafes
    const safeAccountsCount = data.safes ? data.safes.length : 0

    // Count signers from addedSafes owners
    const allSigners = new Set<string>()
    if (data.keys) {
      data.keys.forEach((key) => {
        allSigners.add(key.address)
      })
    }

    // Count address book entries
    const addressBookCount = data.contacts ? Object.keys(data.contacts).length : 0

    return {
      safeAccountsCount,
      signersCount: allSigners.size,
      addressBookCount,
    }
  }, [importedData])

  const handleContinue = () => {
    // Navigate to import progress screen to start the actual import
    router.push('/import-data/import-progress')
  }

  return (
    <ScrollView contentContainerStyle={{ flex: 1 }}>
      <YStack flex={1} testID="review-data-screen">
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

        {/* Content */}
        <YStack flex={1} paddingHorizontal="$4" justifyContent="space-between" marginTop={'$4'}>
          <YStack gap="$6">
            {/* Title */}
            <H2 fontWeight={'600'} textAlign="center" marginHorizontal={'$4'}>
              Review data
            </H2>

            {/* Subtitle */}
            <Text fontSize="$4" textAlign="center" marginHorizontal={'$4'}>
              Review the data you're about to import to ensure everything is correct.
            </Text>

            <Container gap="$4" marginTop="$8" padding="$4" backgroundColor="$background" borderRadius="$4">
              {/* Importing section */}
              <Text color="$colorSecondary" fontSize="$3" fontWeight="500">
                Importing:
              </Text>

              {/* Safe Accounts */}
              <XStack
                justifyContent="space-between"
                alignItems="center"
                paddingVertical="$3"
                testID="safe-accounts-summary"
              >
                <XStack alignItems="center" gap="$3">
                  <Badge
                    themeName="badge_background"
                    circleSize={32}
                    content={<SafeFontIcon name="wallet" size={16} color="$color" />}
                  />
                  <YStack>
                    <Text fontSize="$4" fontWeight="500">
                      Safe Accounts
                    </Text>
                    <Text fontSize="$3" color="$colorSecondary">
                      Including read-only
                    </Text>
                  </YStack>
                </XStack>
                <Text fontSize="$5" fontWeight="600">
                  {importSummary.safeAccountsCount}
                </Text>
              </XStack>

              {/* Signers */}
              <XStack justifyContent="space-between" alignItems="center" paddingVertical="$3" testID="signers-summary">
                <XStack alignItems="center" gap="$3">
                  <Badge
                    themeName="badge_background"
                    circleSize={32}
                    content={<SafeFontIcon name="key" size={16} color="$color" />}
                  />
                  <YStack>
                    <Text fontSize="$4" fontWeight="500">
                      Signers
                    </Text>
                    <Text fontSize="$3" color="$colorSecondary">
                      Generated and imported
                    </Text>
                  </YStack>
                </XStack>
                <Text fontSize="$5" fontWeight="600">
                  {importSummary.signersCount}
                </Text>
              </XStack>

              {/* Address Book */}
              <XStack
                justifyContent="space-between"
                alignItems="center"
                paddingVertical="$3"
                testID="address-book-summary"
              >
                <XStack alignItems="center" gap="$3">
                  <Badge
                    themeName="badge_background"
                    circleSize={32}
                    content={<SafeFontIcon name="address-book" size={16} color="$color" />}
                  />
                  <YStack>
                    <Text fontSize="$4" fontWeight="500">
                      Address Book
                    </Text>
                    <Text fontSize="$3" color="$colorSecondary">
                      All added contacts
                    </Text>
                  </YStack>
                </XStack>
                <Text fontSize="$5" fontWeight="600">
                  {importSummary.addressBookCount}
                </Text>
              </XStack>
            </Container>
          </YStack>

          {/* Bottom section */}
          <YStack gap="$4" paddingBottom={insets.bottom}>
            {/* Privacy notice */}
            <Text
              color="$colorSecondary"
              fontSize="$3"
              textAlign="center"
              marginHorizontal={'$4'}
              testID="privacy-notice"
            >
              Don't worry, all your data will stay private and secure during the transfer.
            </Text>

            {/* Continue button */}
            <SafeButton
              primary
              testID="continue-button"
              onPress={handleContinue}
              disabled={!importedData}
              opacity={!importedData ? 0.5 : 1}
            >
              Continue
            </SafeButton>
          </YStack>
        </YStack>
      </YStack>
    </ScrollView>
  )
}
