import React from 'react'
import { View, YStack, H3, Text, ScrollView, XStack } from 'tamagui'
import { SafeInfo } from '@/src/types/address'
import { Identicon } from '@/src/components/Identicon'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { OpenLVProvider } from '@openlv/react-native/provider'
import { useWalletSession } from '../hooks/useWalletSession'
import { SafeInput } from '@/src/components/SafeInput'
import { SafeButton } from '@/src/components/SafeButton'

type ShareViewProps = {
  activeSafe: SafeInfo
  availableChains: Chain[]
}

export const ConnectView = ({ activeSafe }: ShareViewProps) => {
  const { connectionUrl, setConnectionUrl, status, logLines, session, startSession, closeSession } = useWalletSession(
    activeSafe.address,
  )

  return (
    <OpenLVProvider>
      <YStack flex={1} paddingBottom={'$4'} alignItems={'center'} justifyContent={'space-between'}>
        <YStack flex={1} justifyContent={'center'} alignItems={'center'} width="100%" paddingHorizontal="$4">
          <H3 fontWeight={600} marginBottom={'$3'}>
            Connect
          </H3>
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Identicon address={activeSafe.address} size={80} />
          </View>
          <Text marginTop={'$4'} fontSize={16} color={'$colorLight'}>
            {activeSafe.address.substring(0, 6)}...{activeSafe.address.substring(activeSafe.address.length - 4)}
          </Text>

          <YStack width="100%" marginTop="$4" space="$3">
            <SafeInput
              placeholder="Paste connection URL"
              value={connectionUrl}
              onChangeText={setConnectionUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <XStack gap="$3">
              <SafeButton flex={1} onPress={startSession} disabled={!!session || !connectionUrl}>
                Connect
              </SafeButton>
              <SafeButton flex={1} onPress={closeSession} disabled={!session} danger>
                Disconnect
              </SafeButton>
            </XStack>
            <Text textAlign="center">Status: {status}</Text>

            {logLines.length > 0 && (
              <ScrollView maxHeight={150} backgroundColor="$backgroundHover" padding="$2" borderRadius="$2">
                {logLines.map((line, i) => (
                  <Text key={i} fontSize={10} fontFamily="$mono">
                    {line}
                  </Text>
                ))}
              </ScrollView>
            )}
          </YStack>
        </YStack>
        <YStack>
          <Text color={'$colorLight'} textAlign={'center'} fontSize={'$3'}>
            Powered by OpenLV
          </Text>
        </YStack>
      </YStack>
    </OpenLVProvider>
  )
}

export default ConnectView
