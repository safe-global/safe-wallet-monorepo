import React from 'react'
import { Button, Text, XStack, YStack } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { EthAddress } from '@/src/components/EthAddress'
import { PasskeyMetadata } from '@/src/services/passkey/passkey-storage.service'
import { useCopyAndDispatchToast } from '@/src/hooks/useCopyAndDispatchToast'
import { TouchableOpacity, Alert } from 'react-native'
import { Address } from '@/src/types/address'

interface PasskeyInfoProps {
  metadata: PasskeyMetadata
  onRemove: () => void
  isLoading: boolean
}

export function PasskeyInfo({ metadata, onRemove, isLoading }: PasskeyInfoProps) {
  const copy = useCopyAndDispatchToast()

  const handleRemove = () => {
    Alert.alert('Remove passkey', 'This will remove the passkey signer from this device. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onRemove },
    ])
  }

  return (
    <YStack gap="$3" padding="$4">
      <XStack alignItems="center" gap="$2">
        <SafeFontIcon name="fingerprint" size={20} color="$primary" />
        <Text fontWeight={600}>Passkey signer</Text>
      </XStack>

      <YStack gap="$2">
        <Text color="$colorSecondary" fontSize="$2">
          Identity contract address
        </Text>
        <TouchableOpacity onPress={() => copy(metadata.identityContractAddress)}>
          <XStack alignItems="center" gap="$2">
            <EthAddress address={metadata.identityContractAddress as Address} copy textProps={{ color: '$color' }} />
          </XStack>
        </TouchableOpacity>
      </YStack>

      {metadata.deployedOnChains.length > 0 && (
        <Text color="$colorSecondary" fontSize="$2">
          Deployed on {metadata.deployedOnChains.length} chain{metadata.deployedOnChains.length > 1 ? 's' : ''}
        </Text>
      )}

      <Button onPress={handleRemove} disabled={isLoading} backgroundColor="$backgroundDark" borderRadius="$3" size="$3">
        <Text color="$error">Remove passkey</Text>
      </Button>
    </YStack>
  )
}
