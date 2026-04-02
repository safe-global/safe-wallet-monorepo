import React, { useLayoutEffect, useCallback } from 'react'
import { useNavigation } from 'expo-router'
import { router } from 'expo-router'
import { getTokenValue, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ReconnectError } from '@/src/features/ImportSigner/components/ReconnectError'
import { CloseButton } from '@/src/components/CloseButton'

function ReconnectErrorScreen() {
  const { bottom } = useSafeAreaInsets()
  const navigation = useNavigation()

  const handleClose = useCallback(() => {
    router.dismiss()
  }, [])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <CloseButton onPress={handleClose} testID="reconnect-error-close" />,
    })
  }, [navigation, handleClose])

  return (
    <View flex={1} paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <ReconnectError />
    </View>
  )
}

export default ReconnectErrorScreen
