import React from 'react'
import { YStack } from 'tamagui'
import { router } from 'expo-router'
import { SafeButton } from '@/src/components/SafeButton'
import { SelectSigner } from '@/src/components/SelectSigner'
import { useBiometrics } from '@/src/hooks/useBiometrics'
import { useGuard } from '@/src/context/GuardProvider'
import { Address } from '@/src/types/address'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ReviewFooterProps {
  signerAddress: Address
  txId: string
}

export function ReviewFooter({ signerAddress, txId }: ReviewFooterProps) {
  const { isBiometricsEnabled } = useBiometrics()
  const { setGuard } = useGuard()
  const insets = useSafeAreaInsets()
  const handleConfirmPress = async () => {
    try {
      // Set the signing guard to true before navigating to sign transaction
      setGuard('signing', true)

      if (isBiometricsEnabled) {
        router.push({
          pathname: '/sign-transaction',
          params: { txId, signerAddress },
        })
      } else {
        router.push({
          pathname: '/biometrics-opt-in',
          params: { txId, signerAddress, caller: '/sign-transaction' },
        })
      }
    } catch (error) {
      console.error('Error confirming transaction:', error)
    }
  }

  return (
    <YStack
      backgroundColor="$background"
      paddingHorizontal="$4"
      paddingVertical="$3"
      borderTopWidth={1}
      borderTopColor="$borderLight"
      space="$3"
      paddingBottom={insets.bottom ? insets.bottom : '$4'}
    >
      <SelectSigner address={signerAddress} txId={txId} />

      <SafeButton onPress={handleConfirmPress} width="100%">
        Confirm transaction
      </SafeButton>
    </YStack>
  )
}
