import React, { useState } from 'react'
import { KeyboardAvoidingView, Pressable } from 'react-native'
import { Text, View, YStack, getTokenValue } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Clipboard from '@react-native-clipboard/clipboard'
import { isPairingUri } from '@safe-global/utils/features/walletconnect/utils'
import { SafeInput } from '@/src/components/SafeInput/SafeInput'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
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

  const clearInput = () => {
    setUri('')
    setFormatError(undefined)
  }

  const attemptPair = (value: string) => {
    const trimmed = value.trim()
    if (!isPairingUri(trimmed)) {
      setFormatError(INVALID_MESSAGE)
      return
    }
    setFormatError(undefined)
    onPair(trimmed)
  }

  const onPairPress = () => attemptPair(uri)

  const onPasteThis = async () => {
    const text = await Clipboard.getString()
    setUri(text)
    attemptPair(text)
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
          textAlignVertical="top"
          alignSelf="stretch"
          style={{ paddingTop: getTokenValue('$2') }}
          placeholder="wc:…"
          error={formatError ?? pairError}
          right={
            uri ? (
              <YStack>
                <Pressable onPress={clearInput} hitSlop={12} testID="wc-manual-clear">
                  <SafeFontIcon name="close" size={16} color="$colorSecondary" />
                </Pressable>
              </YStack>
            ) : undefined
          }
        />
        <YStack flex={1} />
        <View paddingBottom={bottom || getTokenValue('$4')} gap="$3">
          <SafeButton primary onPress={onPairPress} disabled={!uri.trim() || isPairing} testID="wc-manual-pair">
            {isPairing ? 'Connecting…' : 'Pair'}
          </SafeButton>
          <SafeButton secondary onPress={onPasteThis} testID="wc-manual-paste">
            Paste
          </SafeButton>
        </View>
      </YStack>
    </KeyboardAvoidingView>
  )
}
