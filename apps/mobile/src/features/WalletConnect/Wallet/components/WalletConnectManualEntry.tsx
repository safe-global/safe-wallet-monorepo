import React, { useState } from 'react'
import { KeyboardAvoidingView } from 'react-native'
import { Text, View, YStack, getTokenValue } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isPairingUri } from '@safe-global/utils/features/walletconnect/utils'
import { SafeInput } from '@/src/components/SafeInput/SafeInput'
import { SafeButton } from '@/src/components/SafeButton'
import { LargeHeaderTitle } from '@/src/components/Title/LargeHeaderTitle'

type Props = {
  onPair: (uri: string) => void
  isPairing?: boolean
  pairError?: string
}

const INVALID_MESSAGE = 'Enter a valid WalletConnect URI (wc:…)'

export const WalletConnectManualEntry: React.FC<Props> = ({ onPair, isPairing = false, pairError }) => {
  const { top, bottom } = useSafeAreaInsets()
  const [uri, setUri] = useState('')
  const [formatError, setFormatError] = useState<string | undefined>()

  const onChangeText = (text: string) => {
    setUri(text)
    if (formatError) {
      setFormatError(undefined)
    }
  }

  const onPairPress = () => {
    const trimmed = uri.trim()
    if (!isPairingUri(trimmed)) {
      setFormatError(INVALID_MESSAGE)
      return
    }
    setFormatError(undefined)
    onPair(trimmed)
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }} keyboardVerticalOffset={bottom + top}>
      <YStack flex={1} paddingHorizontal="$4" paddingTop="$4">
        <LargeHeaderTitle marginBottom="$4">Enter WalletConnect URI</LargeHeaderTitle>
        <Text marginBottom="$4">Paste the WalletConnect URI from the desktop dApp.</Text>
        <SafeInput
          value={uri}
          onChangeText={onChangeText}
          multiline
          autoFocus
          placeholder="wc:…"
          error={formatError ?? pairError}
        />
        <YStack flex={1} />
        <View paddingBottom={bottom || getTokenValue('$4')}>
          <SafeButton primary onPress={onPairPress} disabled={!uri.trim() || isPairing} testID="wc-manual-pair">
            {isPairing ? 'Connecting…' : 'Pair'}
          </SafeButton>
        </View>
      </YStack>
    </KeyboardAvoidingView>
  )
}
