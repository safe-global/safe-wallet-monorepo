import React, { useState } from 'react'
import { Text, View, YStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Container } from '@/src/components/Container'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePasskeySetup } from '@/src/features/PasskeySetup/context/PasskeySetupProvider'
import { createPasskey as createPasskeyCredential } from '@/src/services/passkey/passkey.service'
import Safe from '@safe-global/protocol-kit'
import { addPasskeyMetadata } from '@/src/services/passkey/passkey-storage.service'
import { getAllPasskeyMetadata } from '@/src/services/passkey/passkey-storage.service'
import { Alert } from 'react-native'
import { useToastController } from '@tamagui/toast'
import logger from '@/src/utils/logger'
import { asError } from '@safe-global/utils/services/exceptions/utils'

function CheckItem({ text }: { text: string }) {
  return (
    <View flexDirection="row" alignItems="center" gap="$3" paddingVertical="$2">
      <SafeFontIcon name="check" size={16} color="$primary" />
      <Text fontSize="$4" color="$color">
        {text}
      </Text>
    </View>
  )
}

export default function PasskeyInfoScreen() {
  const router = useRouter()
  const { bottom } = useSafeAreaInsets()
  const toast = useToastController()
  const { setCredential } = usePasskeySetup()
  const [isLoading, setIsLoading] = useState(false)

  const handleContinue = async () => {
    setIsLoading(true)

    try {
      // Check if passkey already exists
      const existing = await getAllPasskeyMetadata()
      if (existing.length > 0) {
        const confirmed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Existing passkey found',
            'You already have a passkey. Creating another will generate a separate identity. Continue?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Continue', onPress: () => resolve(true) },
            ],
          )
        })
        if (!confirmed) {
          setIsLoading(false)
          return
        }
      }

      // 1. Create WebAuthn credential (triggers OS biometric prompt)
      const credential = await createPasskeyCredential()
      if (!credential) {
        throw new Error('Passkey creation cancelled')
      }

      // 2. Extract passkey data (protocol-kit converts rawId to hex)
      const signerData = await Safe.createPasskeySigner(credential)

      // 3. Persist minimal metadata immediately (prevents orphaned credentials).
      //    `identityContractAddresses` is empty here; the creating screen
      //    derives the per-chain addresses and re-persists.
      await addPasskeyMetadata({
        rawId: signerData.rawId,
        coordinates: signerData.coordinates,
        identityContractAddresses: {},
        deployedOnChains: [],
      })

      // 4. Store in context for next screens
      setCredential(signerData, signerData.rawId)

      // 5. Navigate to name screen
      router.push('/passkey-setup/name')
    } catch (err) {
      const message = asError(err).message
      logger.error('Failed to create passkey credential:', message)
      toast.show('Failed to create passkey', { message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <YStack flex={1} paddingHorizontal="$4" paddingBottom={Math.max(bottom, 16)}>
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$6">
        <View backgroundColor="$backgroundPaper" borderRadius="$4" padding="$5" alignItems="center">
          <SafeFontIcon name="fingerprint" size={48} color="$colorSecondary" />
        </View>

        <Container padding="$5" gap="$3">
          <Text fontSize="$6" fontWeight={700} textAlign="center">
            Create a passkey
          </Text>
          <YStack paddingTop="$2">
            <CheckItem text="Sign and approve transactions" />
            <CheckItem text="No password or seed phrase" />
            <CheckItem text="Securely stored on this device" />
          </YStack>
          <Text fontSize="$3" color="$primary" textAlign="center" paddingTop="$2">
            Learn more
          </Text>
        </Container>
      </YStack>

      <SafeButton onPress={handleContinue} disabled={isLoading} loading={isLoading}>
        Continue
      </SafeButton>
    </YStack>
  )
}
