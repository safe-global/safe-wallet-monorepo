import React, { createContext, useContext, useMemo } from 'react'
import { AppKit, AppKitProvider, useAccount, useAppKit, useWalletInfo } from '@reown/appkit-react-native'
import { appKit } from '@/src/config/appKit'
import { useImportSignerFlow } from '../hooks/useImportSignerFlow'
import { useReconnectFlow } from '../hooks/useReconnectFlow'
import { useSwitchNetwork } from '../hooks/useSwitchNetwork'
import { useWalletConnectSigning } from '../hooks/useWalletConnectSigning'

interface WalletConnectContextValue
  extends Pick<ReturnType<typeof useImportSignerFlow>, 'initiateConnection' | 'isConnected'>,
    Pick<ReturnType<typeof useReconnectFlow>, 'reconnect'>,
    Pick<ReturnType<typeof useSwitchNetwork>, 'switchNetwork' | 'switchNetworkIfNeeded' | 'isWrongNetwork'>,
    Pick<ReturnType<typeof useWalletConnectSigning>, 'sign' | 'hasProvider'> {
  address: ReturnType<typeof useAccount>['address']
  chainId: ReturnType<typeof useAccount>['chainId']
  walletInfo: ReturnType<typeof useWalletInfo>['walletInfo']
  disconnect: ReturnType<typeof useAppKit>['disconnect']
  open: ReturnType<typeof useAppKit>['open']
}

const WalletConnectContext = createContext<WalletConnectContextValue | null>(null)

export function useWalletConnectContext(): WalletConnectContextValue {
  const value = useContext(WalletConnectContext)

  if (!value) {
    throw new Error('useWalletConnectContext must be used within a WalletConnectProvider')
  }

  return value
}

/**
 * Inner component that mounts all WalletConnect hooks and provides their
 * combined API via context. Must be rendered inside AppKitProvider since
 * hooks like useAppKit() depend on it.
 */
function WalletConnectContextInner({ children }: { children: React.ReactNode }) {
  const { initiateConnection, isConnected } = useImportSignerFlow()
  const { reconnect } = useReconnectFlow()
  const { switchNetwork, switchNetworkIfNeeded, isWrongNetwork } = useSwitchNetwork()
  const { sign, hasProvider } = useWalletConnectSigning()
  const { open, disconnect } = useAppKit()
  const { address, chainId } = useAccount()
  const { walletInfo } = useWalletInfo()

  const value = useMemo<WalletConnectContextValue>(
    () => ({
      initiateConnection,
      isConnected,
      reconnect,
      switchNetwork,
      switchNetworkIfNeeded,
      isWrongNetwork,
      sign,
      hasProvider,
      address,
      chainId,
      walletInfo,
      disconnect,
      open,
    }),
    [
      initiateConnection,
      isConnected,
      reconnect,
      switchNetwork,
      switchNetworkIfNeeded,
      isWrongNetwork,
      sign,
      hasProvider,
      address,
      chainId,
      walletInfo,
      disconnect,
      open,
    ],
  )

  return <WalletConnectContext.Provider value={value}>{children}</WalletConnectContext.Provider>
}

/**
 * Wraps AppKitProvider and mounts all WalletConnect hooks once,
 * exposing their combined API via useWalletConnectContext().
 */
export function WalletConnectProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppKitProvider instance={appKit}>
      <WalletConnectContextInner>{children}</WalletConnectContextInner>
      <AppKit />
    </AppKitProvider>
  )
}
