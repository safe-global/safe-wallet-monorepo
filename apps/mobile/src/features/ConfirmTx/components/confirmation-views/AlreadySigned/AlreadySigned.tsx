import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SAFE_WEB_TRANSACTIONS_URL } from '@/src/config/constants'
import { selectChainById } from '@/src/store/chains'
import { useAppSelector } from '@/src/store/hooks'
import React, { useCallback } from 'react'
import { Linking, TouchableOpacity } from 'react-native'
import { Text, View, YStack } from 'tamagui'

type Props = {
  txId: string
  safeAddress: string
  chainId: string
}

export function AlreadySigned({ txId, safeAddress, chainId }: Props) {
  const chain = useAppSelector((state) => selectChainById(state, chainId))
  const onPressGoToWebApp = useCallback(() => {
    const url = SAFE_WEB_TRANSACTIONS_URL.replace(
      ':safeAddressWithChainPrefix',
      `${chain?.shortName}:${safeAddress}`,
    ).replace(':txId', txId)

    Linking.openURL(url)
  }, [txId, safeAddress, chainId])

  return (
    <YStack justifyContent="center" gap="$4" alignItems="center" paddingHorizontal={'$4'}>
      <Text fontSize="$4" fontWeight={400} textAlign="center" color="$textSecondaryLight">
        This transaction can be executed in the web app only.
      </Text>
      <TouchableOpacity onPress={onPressGoToWebApp}>
        <View flexDirection="row" alignItems="center" gap="$2">
          <Text fontSize="$4" fontWeight={700} textAlign="center" color="$color">
            Go to Web app
          </Text>
          <SafeFontIcon name="external-link" size={16} color="$color" />
        </View>
      </TouchableOpacity>

      <View height={50} width="100%">
        <SafeButton height="100%" rounded fullscreen fontWeight={600} disabled testID="confirm-button">
          Confirm
        </SafeButton>
      </View>
    </YStack>
  )
}
