import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'expo-router'
import { Text, YStack, H2, ScrollView, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme, Animated } from 'react-native'
import { useDataImportContext } from './DataImportProvider'
import { Container } from '@/src/components/Container'
import { useAppDispatch } from '@/src/store/hooks'
import { addSafe } from '@/src/store/safesSlice'
import { addSignerWithEffects } from '@/src/store/signersSlice'
import { addContacts } from '@/src/store/addressBookSlice'
import { storePrivateKey } from '@/src/hooks/useSign/useSign'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Contact } from '@/src/store/addressBookSlice'
import Logger from '@/src/utils/logger'
import { Bar } from 'react-native-progress'

interface LegacyDataStructure {
  safes?: Array<{
    address: string
    chain: string
    name: string
    threshold?: number
    owners?: string[]
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

export const ImportProgressScreen = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const { importedData } = useDataImportContext()
  const dispatch = useAppDispatch()

  const [progress, setProgress] = useState(0)
  const [importedSafes, setImportedSafes] = useState<SafeOverview[]>([])
  const progressAnimation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!importedData?.data) {
      router.back()
      return
    }

    const performImport = async () => {
      try {
        const data = importedData.data as LegacyDataStructure
        let currentProgress = 0
        const totalSteps = 3 // Safes, Signers/Keys, Contacts

        // Animate progress bar
        const animateProgress = (targetProgress: number) => {
          setProgress(targetProgress)
        }

        // Step 1: Import Safe Accounts
        await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate loading
        if (data.safes) {
          const safesToImport: SafeOverview[] = []

          for (const safe of data.safes) {
            const safeOverview: SafeOverview = {
              address: {
                value: safe.address,
                name: safe.name || null,
              },
              chainId: safe.chain,
              threshold: safe.threshold || 1,
              owners: (safe.owners || []).map((owner) => ({
                value: owner,
                name: null,
              })),
              fiatTotal: '',
              queued: 0,
              awaitingConfirmation: null,
            }

            dispatch(
              addSafe({
                address: safe.address as `0x${string}`,
                info: { [safe.chain]: safeOverview },
              }),
            )

            safesToImport.push(safeOverview)
          }

          setImportedSafes(safesToImport)
          Logger.info(`Imported ${data.safes.length} safes`)
        }

        currentProgress = 33
        animateProgress(currentProgress)
        await new Promise((resolve) => setTimeout(resolve, 800))

        // Step 2: Import Signers/Private Keys
        if (data.keys) {
          for (const key of data.keys) {
            try {
              // Convert private key from base64 to hex format
              const hexPrivateKey = `0x${Buffer.from(key.key, 'base64').toString('hex')}`

              // Store the private key in hex format
              await storePrivateKey(key.address, hexPrivateKey)

              // Add signer to Redux
              const signerInfo: AddressInfo = {
                value: key.address,
                name: key.name || null,
              }

              dispatch(addSignerWithEffects(signerInfo))
              Logger.info(`Imported signer: ${key.address}`)
            } catch (error) {
              Logger.error(`Failed to import signer ${key.address}:`, error)
            }
          }
        }

        currentProgress = 66
        animateProgress(currentProgress)
        await new Promise((resolve) => setTimeout(resolve, 800))

        // Step 3: Import Address Book/Contacts
        if (data.contacts) {
          const contactsToAdd: Contact[] = data.contacts.map((contact) => ({
            value: contact.address,
            name: contact.name,
          }))

          dispatch(addContacts(contactsToAdd))
          Logger.info(`Imported ${data.contacts.length} contacts`)
        }

        currentProgress = 100
        animateProgress(currentProgress)
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Navigate to success screen
        router.push('/import-data/import-success')
      } catch (error) {
        Logger.error('Import failed:', error)
        // Navigate back to review screen on error
        router.back()
      }
    }

    performImport()
  }, [importedData, dispatch, router, progressAnimation])

  return (
    <ScrollView contentContainerStyle={{ flex: 1 }}>
      <YStack flex={1} testID="import-progress-screen">
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

        {/* Content */}
        <YStack flex={1} paddingHorizontal="$4" justifyContent="center" alignItems="center">
          <YStack gap="$6" alignItems="center" maxWidth={300}>
            {/* Title */}
            <H2 fontWeight={'600'} textAlign="center">
              Your file is being securely imported
            </H2>

            {/* Subtitle */}
            <Text fontSize="$4" textAlign="center" color="$colorSecondary">
              Hang on, it may take a few seconds
            </Text>

            {/* Progress Bar Container */}
            <View width="100%" height={8} borderRadius="$2" overflow="hidden" marginTop="$8">
              <Bar progress={progress / 100} borderWidth={0} color="#5FDDFF" useNativeDriver={true} />
            </View>

            {/* Progress Percentage */}
            <Text fontSize="$5" fontWeight="600" color="$color">
              {Math.round(progress)}%
            </Text>
          </YStack>
        </YStack>
      </YStack>
    </ScrollView>
  )
}
