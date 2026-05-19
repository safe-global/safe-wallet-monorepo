/**
 * E2E override for WalletConnectContext.
 *
 * Included via RN_SRC_EXT=e2e.tsx Metro file override.
 * Replaces the real AppKit-based provider with a mock
 * controlled by walletConnectE2eState.
 *
 * - initiateConnection reads connectResult / isOwner from the e2e state and
 *   navigates directly — no real CGW API call needed. Mirrors
 *   useImportSignerFlow's collision-guard branch via the shared
 *   findCollidingSigner helper.
 * - reconnect is single-shot: when reconnectMismatch is true it routes to
 *   /import-signers/reconnect-error and clears the flag, so the retry
 *   succeeds. Mirrors useReconnectFlow's mismatch routing.
 * - Session/network state is driven by TestCtrls buttons.
 */
import React, { createContext, useCallback, useContext, useMemo } from 'react'
import { useSyncExternalStore } from 'react'
import { router } from 'expo-router'
import { getAddress } from 'ethers'
import { useAppSelector } from '@/src/store/hooks'
import { selectSigners } from '@/src/store/signersSlice'
import { findCollidingSigner } from '@/src/features/ImportSigner/utils/findCollidingSigner'
import { showCollisionAlert } from '@/src/features/ImportSigner/utils/showCollisionAlert'
import { walletConnectE2eState } from './walletConnectE2eState'
import Logger from '@/src/utils/logger'
import type { WalletConnectContextValue } from './types'

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

  const clearSession = useCallback(() => {
    walletConnectE2eState.set({
      isConnected: false,
      address: undefined,
      walletInfo: undefined,
      hasProvider: false,
    })
  }, [])

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
      // Mirror useImportSignerFlow's collision check via the shared helper.
      // When an existing signer of a *different* type lives at the address,
      // production calls Alert.alert + disconnects without navigating.
      const colliding = findCollidingSigner(signers, checksumAddress, 'walletconnect')
      if (colliding) {
        Logger.info(`[E2E] initiateConnection: collision with existing ${colliding.type} signer`)
        showCollisionAlert(colliding)
        // Disconnect — clear session state so the user can start over
        clearSession()
        return
      }

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
  }, [signers, clearSession])

  const reconnect = useCallback(
    async (signerAddress: string) => {
      const { reconnectMismatch } = walletConnectE2eState.get()
      if (reconnectMismatch) {
        Logger.info('[E2E] reconnect: simulating wrong-wallet mismatch')
        // Single-shot — clear so the next attempt (typically the retry from
        // ReconnectError) succeeds. Mirrors useReconnectFlow's mismatch routing.
        walletConnectE2eState.set({ reconnectMismatch: false })
        // Mirror production: useReconnectFlow disconnects before routing on
        // mismatch, so the session state stays consistent with the UI.
        clearSession()
        router.push({
          pathname: '/import-signers/reconnect-error',
          params: { address: getAddress(signerAddress) },
        })
        return
      }
      Logger.info('[E2E] reconnect — marking session active for', signerAddress)
      walletConnectE2eState.set({
        isConnected: true,
        address: getAddress(signerAddress),
      })
    },
    [clearSession],
  )

  const switchNetwork = useCallback(async (_chainId: string) => {
    Logger.info('[E2E] switchNetwork called')
  }, [])

  const switchNetworkIfNeeded = useCallback(async () => {
    Logger.info('[E2E] switchNetworkIfNeeded called — clearing isWrongNetwork')
    walletConnectE2eState.set({ isWrongNetwork: false })
  }, [])

  const sign = useCallback<WalletConnectContextValue['sign']>(async () => {
    throw new Error('E2E: Signing not implemented in test mode')
  }, [])

  const disconnect = useCallback(async () => {
    clearSession()
  }, [clearSession])

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
