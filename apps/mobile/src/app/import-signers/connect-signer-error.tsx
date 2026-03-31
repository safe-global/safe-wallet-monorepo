import React, { useLayoutEffect, useCallback } from 'react'
import { useNavigation } from 'expo-router'
import { router } from 'expo-router'
import { getTokenValue, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ConnectSignerError } from '@/src/features/ImportSigner/components/ConnectSignerError'
import { CloseButton } from '@/src/components/CloseButton'

function ConnectSignerErrorScreen() {
  const { bottom } = useSafeAreaInsets()
  const navigation = useNavigation()

  const handleClose = useCallback(() => {
    router.dismissAll()
  }, [])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <CloseButton onPress={handleClose} testID="connect-signer-error-close" />,
    })
  }, [navigation, handleClose])

  return (
    <View flex={1} paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <ConnectSignerError />
    </View>
  )
}

export default ConnectSignerErrorScreen
