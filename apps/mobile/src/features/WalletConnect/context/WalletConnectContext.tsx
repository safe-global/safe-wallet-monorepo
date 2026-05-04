import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  AppKit,
  AppKitProvider,
  useAccount,
  useAppKit,
  useAppKitState,
  useProvider,
  useWalletInfo,
} from '@reown/appkit-react-native'
import { Platform } from 'react-native'
import { FullWindowOverlay } from 'react-native-screens'
import { useAppSelector } from '@/src/store/hooks'
import { selectSigners } from '@/src/store/signersSlice'
import { useImportSignerFlow } from '../hooks/useImportSignerFlow'
import { useReconnectFlow } from '../hooks/useReconnectFlow'
import { useSwitchNetwork } from '../hooks/useSwitchNetwork'
import { useWalletConnectSigning } from '../hooks/useWalletConnectSigning'
import { useChainSync } from '../hooks/useChainSync'
import type { WalletConnectContextValue } from './types'

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
function WalletConnectContextBridge({
  onContextReady,
  requestModalMount,
}: {
  onContextReady: (v: WalletConnectContextValue) => void
  requestModalMount: () => void
}) {
  const { initiateConnection } = useImportSignerFlow()
  const { reconnect } = useReconnectFlow()
  const { switchNetwork, switchNetworkIfNeeded, isWrongNetwork } = useSwitchNetwork()
  const { sign, hasProvider } = useWalletConnectSigning()
  const { provider } = useProvider()
  useChainSync()
  const appKitHook = useAppKit()
  const { address, chainId, isConnected } = useAccount()
  const { walletInfo } = useWalletInfo()
  const { isOpen } = useAppKitState()
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

  // Lazy-mount <AppKit /> the first time anything opens the modal
  useEffect(() => {
    if (isOpen) {
      requestModalMount()
    }
  }, [isOpen, requestModalMount])

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
      provider,
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
      provider,
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
 *
 * The `<AppKit />` modal is lazy-mounted the first time anything sets
 * `ModalController.state.open` to true (i.e. any caller of
 * `useAppKit().open()`). Mounting `<AppKit />` eagerly triggers
 * `ApiController.prefetch()` inside the SDK, which fires `/getWallets`,
 * network image requests to api.web3modal.org on cold start — which is not desired.
 * The first open() sets the modal state synchronously; the bridge observes that,
 * mounts `<AppKit />`, and the modal renders visible on the next paint.
 */
export function WalletConnectProvider({ children, instance }: WalletConnectProviderProps) {
  const [contextValue, setContextValue] = useState<WalletConnectContextValue | null>(null)
  const [modalMounted, setModalMounted] = useState(false)

  const requestModalMount = useCallback(() => setModalMounted(true), [])

  return (
    <WalletConnectContext.Provider value={contextValue}>
      {instance && (
        <AppKitProvider instance={instance}>
          <WalletConnectContextBridge onContextReady={setContextValue} requestModalMount={requestModalMount} />
          {modalMounted && <AppKit modalContentWrapper={Platform.OS === 'ios' ? FullWindowOverlay : undefined} />}
        </AppKitProvider>
      )}
      {children}
    </WalletConnectContext.Provider>
  )
}
