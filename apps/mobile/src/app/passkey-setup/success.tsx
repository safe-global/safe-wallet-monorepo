import React from 'react'
import { Text, View, XStack, YStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Container } from '@/src/components/Container'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePasskeySetup } from '@/src/features/PasskeySetup/context/PasskeySetupProvider'
import { useCopyAndDispatchToast } from '@/src/hooks/useCopyAndDispatchToast'
import { shortenAddress } from '@/src/utils/formatters'
import { TouchableOpacity, Pressable } from 'react-native'
import Share from 'react-native-share'

export default function PasskeySuccessScreen() {
  const router = useRouter()
  const { bottom } = useSafeAreaInsets()
  const { name, identityAddress } = usePasskeySetup()
  const copy = useCopyAndDispatchToast('Address copied. Share it with a Safe owner to finish setup.')

  const handleCopy = () => {
    if (identityAddress) {
      copy(identityAddress)
    }
  }

  const handleShare = async () => {
    if (!identityAddress) {
      return
    }
    try {
      await Share.open({ message: identityAddress })
    } catch {
      // User cancelled share
    }
  }

  const handleDone = () => {
    router.dismissAll()
  }

  return (
    <YStack flex={1} paddingHorizontal="$4" paddingBottom={Math.max(bottom, 16)}>
      <View paddingTop="$4" alignItems="flex-end">
        <Pressable onPress={handleDone} testID="close-passkey-success">
          <View
            backgroundColor="$backgroundSkeleton"
            alignItems="center"
            justifyContent="center"
            borderRadius={200}
            height={40}
            width={40}
          >
            <SafeFontIcon name="close" size={16} color="$color" />
          </View>
        </Pressable>
      </View>

      <YStack flex={1} gap="$4" paddingTop="$6">
        <Text fontSize="$7" fontWeight={700}>
          Your passkey is ready
        </Text>
        <Text fontSize="$4" color="$colorSecondary">
          Copy your activation key it in the web app to use it as a signer.
        </Text>

        <Container flexDirection="row" alignItems="center" gap="$3" padding="$4" marginTop="$2">
          <SafeFontIcon name="fingerprint" size={20} color="$primary" />
          <YStack flex={1}>
            <Text fontWeight={600} numberOfLines={1}>
              {name}
            </Text>
            <Text color="$colorSecondary" fontSize="$3">
              {identityAddress ? shortenAddress(identityAddress) : ''}
            </Text>
          </YStack>
          <XStack gap="$2">
            <TouchableOpacity onPress={handleCopy} testID="copy-passkey-address">
              <SafeFontIcon name="copy" size={18} color="$colorSecondary" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} testID="share-passkey-address">
              <SafeFontIcon name="export" size={18} color="$colorSecondary" />
            </TouchableOpacity>
          </XStack>
        </Container>

        <Text fontSize="$2" color="$colorSecondary" paddingHorizontal="$1">
          This is a public address. It's safe to share.
        </Text>
      </YStack>

      <SafeButton onPress={handleDone} testID="passkey-done-button">
        Done
      </SafeButton>
    </YStack>
  )
}
