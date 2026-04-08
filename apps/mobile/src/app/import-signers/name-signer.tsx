import React, { useCallback, useLayoutEffect } from 'react'
import { useNavigation } from 'expo-router'
import { router } from 'expo-router'
import { getTokenValue, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HeaderBackButton } from '@react-navigation/elements'
import { NameSignerContainer } from '@/src/features/ImportSigner/components/NameSigner'
import { CloseButton } from '@/src/components/CloseButton'
import { HeaderLeft } from '@/src/navigation/hooks/utils'
import { useWalletConnect } from '@/src/features/WalletConnect/hooks/useWalletConnect'

function NameSigner() {
  const { bottom } = useSafeAreaInsets()
  const navigation = useNavigation()
  const { disconnect } = useWalletConnect()

  const handleDisconnectAndGoBack = useCallback(() => {
    disconnect()
    router.back()
  }, [disconnect])

  const handleDisconnectAndClose = useCallback(() => {
    disconnect()
    router.dismissAll()
  }, [disconnect])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: (props: React.ComponentProps<typeof HeaderBackButton>) => (
        <HeaderLeft props={props} goBack={handleDisconnectAndGoBack} />
      ),
      headerRight: () => <CloseButton onPress={handleDisconnectAndClose} testID="name-signer-close" />,
    })
  }, [navigation, handleDisconnectAndGoBack, handleDisconnectAndClose])

  return (
    <View paddingHorizontal="$4" flex={1} paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <NameSignerContainer />
    </View>
  )
}

export default NameSigner
