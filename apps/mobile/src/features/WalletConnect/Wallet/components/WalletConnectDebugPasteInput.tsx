import React, { useState } from 'react'
import { TextInput } from 'react-native'
import { XStack, View, useTheme } from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { isPairingUri } from '@safe-global/utils/features/walletconnect/utils'
import { SafeButton } from '@/src/components/SafeButton'

type Props = {
  onPair: (uri: string) => void
}

// Dev-only paste input — lets the iOS simulator (which has no camera) exercise pairing by
// pasting a wc: URI. Renders nothing in release builds, so it never reaches users.
export const WalletConnectDebugPasteInput: React.FC<Props> = ({ onPair }) => {
  const theme = useTheme()
  const toast = useToastController()
  const [uri, setUri] = useState('')

  if (!__DEV__) {
    return null
  }

  const onPress = () => {
    const trimmed = uri.trim()
    if (!trimmed || !isPairingUri(trimmed)) {
      toast.show('Not a wc: URI', { native: false, duration: 2000 })
      return
    }
    setUri('')
    onPair(trimmed)
  }

  return (
    <XStack gap="$2" alignItems="center">
      <View flex={1}>
        <TextInput
          value={uri}
          onChangeText={setUri}
          placeholder="wc:..."
          placeholderTextColor={theme.colorSecondary.get()}
          autoCapitalize="none"
          autoCorrect={false}
          style={{ fontSize: 16, color: theme.color.get() }}
        />
      </View>
      <SafeButton size="$sm" onPress={onPress} disabled={!uri}>
        Pair
      </SafeButton>
    </XStack>
  )
}
