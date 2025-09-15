import React from 'react'
import { View, Text, H4, getTokenValue } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton/SafeButton'
import { LedgerIcon, PhoneIcon } from '@/src/features/Ledger/icons'
interface PairingErrorProps {
  deviceName: string
  errorMessage: string
  onRetry: () => void
}

export const PairingError = ({ deviceName, errorMessage, onRetry }: PairingErrorProps) => {
  return (
    <View flex={1} justifyContent="space-between">
      <View flex={1} justifyContent="center" alignItems="center">
        <View alignItems="center" gap="$6" paddingHorizontal="$4">
          <View position="relative" width={150} height={200} alignItems="center" justifyContent="center">
            <View
              position="absolute"
              alignItems="center"
              justifyContent="center"
              flexDirection="row"
              gap="$2"
              overflow="hidden"
              width={150}
              height={150}
              borderRadius={150}
              borderWidth={4}
              borderColor={getTokenValue('$color.errorMainDark')}
            >
              <LedgerIcon />
              <PhoneIcon />
            </View>
          </View>

          <View alignItems="center" gap="$3">
            <H4 fontWeight="600" color="$color" textAlign="center">
              Pairing unsuccessful
            </H4>
            <Text color="$colorSecondary" textAlign="center" fontSize="$4">
              Make sure your {deviceName} is close to your mobile phone, and try again.
            </Text>
            <Text color="$colorSecondary" textAlign="center" fontSize="$3" paddingTop="$2">
              {errorMessage}
            </Text>
          </View>
        </View>
      </View>

      <SafeButton onPress={onRetry} primary testID="retry-pairing-button">
        Retry pairing
      </SafeButton>
    </View>
  )
}
