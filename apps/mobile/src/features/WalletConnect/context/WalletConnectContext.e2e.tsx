/**
 * E2E override for WalletConnectContext.
 *
 * Included via RN_SRC_EXT=e2e.tsx Metro file override.
 * Replaces the real AppKit-based provider with a mock
 * controlled by walletConnectE2eState.
 *
 * - initiateConnection reads connectResult and isOwner from the e2e state
 *   and navigates directly — no real CGW API call needed.
 * - Session/network state is driven by TestCtrls buttons.
 */
import React, { createContext, useCallback, useContext, useMemo } from 'react'
import { useSyncExternalStore } from 'react'
import { router } from 'expo-router'
import { getAddress } from 'ethers'
import { useAppSelector } from '@/src/store/hooks'
import { selectSigners } from '@/src/store/signersSlice'
import { walletConnectE2eState } from './walletConnectE2eState'
import Logger from '@/src/utils/logger'

interface WalletConnectContextValue {
  initiateConnection: () => Promise<void>
  reconnect: (signerAddress: string) => Promise<void>
  switchNetwork: (chainId: string) => Promise<void>
  switchNetworkIfNeeded: () => Promise<void>
  isWrongNetwork: boolean
  sign: (params: unknown) => Promise<unknown>
  hasProvider: boolean
  provider: undefined
  isWalletConnectSigner: (address: string) => boolean
  isConnected: boolean
  address: string | undefined
  chainId: number | undefined
  walletInfo: { name: string; icon?: string } | undefined
  disconnect: () => Promise<void>
  open: () => Promise<void>
}

const WalletConnectContext = createContext<WalletConnectContextValue | null>(null)

export function useWalletConnectContext(): WalletConnectContextValue {
  const value = useContext(WalletConnectContext)

  if (!value) {
    throw new Error('useWalletConnectContext must be used within a WalletConnectProvider')
  }

  return value
}

export function useOptionalWalletConnectContext(): WalletConnectContextValue | null {
  return useContext(WalletConnectContext)
}

interface WalletConnectProviderProps {
  children: React.ReactNode
  instance?: unknown
}

export function WalletConnectProvider({ children }: WalletConnectProviderProps) {
  const e2eState = useSyncExternalStore(walletConnectE2eState.subscribe, walletConnectE2eState.get)
  const signers = useAppSelector(selectSigners)

  const isWalletConnectSigner = useCallback(
    (signerAddress: string) => signers[signerAddress]?.type === 'walletconnect',
    [signers],
  )

  const initiateConnection = useCallback(async () => {
    const currentState = walletConnectE2eState.get()
    const { connectResult, connectError, isOwner } = currentState

    if (connectError) {
      Logger.info('[E2E] initiateConnection rejected:', connectError)
      return
    }

    if (!connectResult) {
      Logger.info('[E2E] initiateConnection: no connectResult configured')
      return
    }

    const { address, walletName, walletIcon } = connectResult
    const checksumAddress = getAddress(address)

    // Update session state so downstream components see the "connected" wallet
    walletConnectE2eState.set({
      isConnected: true,
      address: checksumAddress,
      walletInfo: { name: walletName, icon: walletIcon },
      hasProvider: true,
    })

    // Use isOwner flag from e2e state — no CGW API call needed
    if (isOwner) {
      router.push({
        pathname: '/import-signers/name-signer',
        params: { address: checksumAddress, walletName },
      })
    } else {
      router.push({
        pathname: '/import-signers/connect-signer-error',
        params: { address: checksumAddress, walletIcon },
      })
    }
  }, [])

  const reconnect = useCallback(async (signerAddress: string) => {
    Logger.info('[E2E] reconnect called — marking session active for', signerAddress)
    walletConnectE2eState.set({
      isConnected: true,
      address: getAddress(signerAddress),
    })
  }, [])

  const switchNetwork = useCallback(async (_chainId: string) => {
    Logger.info('[E2E] switchNetwork called')
  }, [])

  const switchNetworkIfNeeded = useCallback(async () => {
    Logger.info('[E2E] switchNetworkIfNeeded called — clearing isWrongNetwork')
    walletConnectE2eState.set({ isWrongNetwork: false })
  }, [])

  const sign = useCallback(async (_params: unknown): Promise<unknown> => {
    throw new Error('E2E: Signing not implemented in test mode')
  }, [])

  const disconnect = useCallback(async () => {
    walletConnectE2eState.set({
      isConnected: false,
      address: undefined,
      walletInfo: undefined,
      hasProvider: false,
    })
  }, [])

  const open = useCallback(async () => {
    Logger.info('[E2E] open called')
  }, [])

  const value = useMemo<WalletConnectContextValue>(
    () => ({
      initiateConnection,
      reconnect,
      switchNetwork,
      switchNetworkIfNeeded,
      isWrongNetwork: e2eState.isWrongNetwork,
      sign,
      hasProvider: e2eState.hasProvider,
      provider: undefined,
      isWalletConnectSigner,
      isConnected: e2eState.isConnected,
      address: e2eState.address,
      chainId: e2eState.chainId,
      walletInfo: e2eState.walletInfo,
      disconnect,
      open,
    }),
    [
      initiateConnection,
      reconnect,
      switchNetwork,
      switchNetworkIfNeeded,
      e2eState.isWrongNetwork,
      sign,
      e2eState.hasProvider,
      isWalletConnectSigner,
      e2eState.isConnected,
      e2eState.address,
      e2eState.chainId,
      e2eState.walletInfo,
      disconnect,
      open,
    ],
  )

  return <WalletConnectContext.Provider value={value}>{children}</WalletConnectContext.Provider>
}
