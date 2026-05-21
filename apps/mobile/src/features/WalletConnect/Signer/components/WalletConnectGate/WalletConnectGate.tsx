import React from 'react'
import { View } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { useWalletConnectContext } from '@/src/features/WalletConnect/context/WalletConnectContext'
import { useWalletConnectStatus } from '@/src/features/WalletConnect/hooks/useWalletConnectStatus'

interface WalletConnectGateProps {
  signerAddress: string
  children: React.ReactNode
}

export function WalletConnectGate({ signerAddress, children }: WalletConnectGateProps) {
  const { switchNetworkIfNeeded, reconnect, isWrongNetwork, isWalletConnectSigner } = useWalletConnectContext()
  const isWcSigner = isWalletConnectSigner(signerAddress)
  const isSessionActive = useWalletConnectStatus(signerAddress)

  if (!isWcSigner) {
    return <>{children}</>
  }

  if (!isSessionActive) {
    return (
      <View gap="$3">
        <SafeButton
          onPress={() => reconnect(signerAddress)}
          testID="reconnect-wallet-button"
          outlined
          textColor="$primary"
          borderColor="$primary"
        >
          Reconnect wallet to continue
        </SafeButton>
      </View>
    )
  }

  if (isWrongNetwork) {
    return (
      <View gap="$3">
        <SafeButton
          onPress={switchNetworkIfNeeded}
          testID="switch-network-button"
          outlined
          textColor="$primary"
          borderColor="$primary"
        >
          Switch network to continue
        </SafeButton>
      </View>
    )
  }

  return <>{children}</>
}
