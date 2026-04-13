import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AppKit, AppKitProvider, useAccount, useAppKit, useWalletInfo } from '@reown/appkit-react-native'
import { Platform } from 'react-native'
import { FullWindowOverlay } from 'react-native-screens'
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
 * Mounts all WalletConnect hooks once and pushes the combined API into
 * the given callback. Must be rendered inside AppKitProvider.
 */
function WalletConnectContextBridge({ onContextReady }: { onContextReady: (v: WalletConnectContextValue) => void }) {
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

  // Stabilize via ref so these callbacks never change identity.
  // appKitHook is a valtio snapshot — new reference every render —
  // which would otherwise cause an infinite setState loop in the
  // bridge/provider cycle.
  const appKitRef = useRef(appKitHook)
  appKitRef.current = appKitHook

  const disconnect = useCallback(() => appKitRef.current.disconnect(), [])
  const open = useCallback((...args: Parameters<typeof appKitHook.open>) => appKitRef.current.open(...args), [])

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

  const onContextReadyRef = useRef(onContextReady)
  onContextReadyRef.current = onContextReady

  useEffect(() => {
    onContextReadyRef.current(value)
  }, [value])

  return null
}

interface WalletConnectProviderProps {
  children: React.ReactNode
  instance: React.ComponentProps<typeof AppKitProvider>['instance'] | null
}

/**
 * Provides WalletConnect context to the app.
 *
 * Children always occupy the same tree position so React never remounts
 * them when AppKit initializes (which would cause a visible flash).
 * The AppKit bridge and modal are rendered as siblings above children.
 */
export function WalletConnectProvider({ children, instance }: WalletConnectProviderProps) {
  const [contextValue, setContextValue] = useState<WalletConnectContextValue | null>(null)

  return (
    <WalletConnectContext.Provider value={contextValue}>
      {instance && (
        <AppKitProvider instance={instance}>
          <WalletConnectContextBridge onContextReady={setContextValue} />
          <AppKit modalContentWrapper={Platform.OS === 'ios' ? FullWindowOverlay : undefined} />
        </AppKitProvider>
      )}
      {children}
    </WalletConnectContext.Provider>
  )
}
