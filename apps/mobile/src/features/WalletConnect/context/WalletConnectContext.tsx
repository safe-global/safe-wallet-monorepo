import React, { createContext, useCallback, useContext, useMemo } from 'react'
import { AppKit, AppKitProvider, useAccount, useAppKit, useWalletInfo } from '@reown/appkit-react-native'
import { useAppSelector } from '@/src/store/hooks'
import { selectSigners } from '@/src/store/signersSlice'
import { useImportSignerFlow } from '../hooks/useImportSignerFlow'
import { useReconnectFlow } from '../hooks/useReconnectFlow'
import { useSwitchNetwork } from '../hooks/useSwitchNetwork'
import { useWalletConnectSigning } from '../hooks/useWalletConnectSigning'
import { useChainSync } from '../hooks/useChainSync'

interface WalletConnectContextValue
  extends Pick<ReturnType<typeof useImportSignerFlow>, 'initiateConnection' | 'isConnected'>,
    Pick<ReturnType<typeof useReconnectFlow>, 'reconnect'>,
    Pick<ReturnType<typeof useSwitchNetwork>, 'switchNetwork' | 'switchNetworkIfNeeded' | 'isWrongNetwork'>,
    Pick<ReturnType<typeof useWalletConnectSigning>, 'sign' | 'hasProvider'> {
  isWalletConnectSigner: (address: string) => boolean
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
 * Returns the WalletConnect context value, or `null` when AppKit
 * has not been initialized yet (e.g. before an active Safe is selected).
 */
export function useOptionalWalletConnectContext(): WalletConnectContextValue | null {
  return useContext(WalletConnectContext)
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
  useChainSync()
  const appKitHook = useAppKit()
  const { address, chainId } = useAccount()
  const { walletInfo } = useWalletInfo()
  const signers = useAppSelector(selectSigners)

  const isWalletConnectSigner = useCallback(
    (signerAddress: string) => signers[signerAddress]?.type === 'walletconnect',
    [signers],
  )

  const disconnect = useCallback(() => appKitHook.disconnect(), [appKitHook])
  const open = useCallback((...args: Parameters<typeof appKitHook.open>) => appKitHook.open(...args), [appKitHook])

  const value = useMemo<WalletConnectContextValue>(
    () => ({
      initiateConnection,
      isConnected,
      reconnect,
      isWalletConnectSigner,
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
      isWalletConnectSigner,
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

interface WalletConnectProviderProps {
  children: React.ReactNode
  instance: React.ComponentProps<typeof AppKitProvider>['instance'] | null
}

/**
 * Provides WalletConnect context to the app.
 *
 * When an AppKit instance is available, children are wrapped inside
 * AppKitProvider so that hooks like useAppKit() and the <AppKit /> modal
 * (rendered separately in the navigation tree) have access to context.
 */
export function WalletConnectProvider({ children, instance }: WalletConnectProviderProps) {
  if (instance) {
    return (
      <AppKitProvider instance={instance}>
        <WalletConnectContextInner>{children}</WalletConnectContextInner>
        <AppKit />
      </AppKitProvider>
    )
  }

  return <WalletConnectContext.Provider value={null}>{children}</WalletConnectContext.Provider>
}
