import { useCallback, useEffect, useRef } from 'react'
import { Alert } from 'react-native'
import { useAccount, useAppKit, useWalletInfo } from '@reown/appkit-react-native'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { useAppSelector } from '@/src/store/hooks'
import Logger from '@/src/utils/logger'
import { useStableAppKitEvent } from './useStableAppKitEvent'

export interface ConnectResult {
  address: string
  walletName: string
  walletIcon: string
}

export class ConnectError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConnectError'
  }
}

export class UserRejectedError extends Error {
  constructor() {
    super('User rejected the connection request')
    this.name = 'UserRejectedError'
  }
}

export class UnsupportedChainError extends Error {
  constructor() {
    super('Wallet does not support the active chain')
    this.name = 'UnsupportedChainError'
  }
}

/**
 * Shared alert shown when a WalletConnect flow fails with
 * UnsupportedChainError. Colocated with the error class so the
 * copy stays in sync across consumers.
 */
export const showUnsupportedChainAlert = () => {
  Alert.alert(
    'Unsupported network',
    "The connected wallet doesn't support the network of the active Safe. Please connect a wallet that supports it, or switch to a different Safe.",
    [{ text: 'OK' }],
  )
}

// AppKit forwards the underlying SignClient/Universal Provider message verbatim
// in CONNECT_ERROR. The QR-code pairing proposal expires (~5 min default) before
// the wallet completes pairing, surfacing as "Proposal expired". We don't want
// these to page on-call as Logger.error.
//
export const isProposalExpiredError = (error: unknown): boolean =>
  error instanceof Error && /proposal\s+expired/i.test(error.message)

interface PendingConnect {
  resolve: (result: ConnectResult) => void
  reject: (error: Error) => void
}

// How long to wait after a successful `switchNetwork` before concluding the
// wallet silently ignored the switch. Covers the known Reown behavior where
// switchNetwork resolves without actually changing chain when the internal
// connection state is stale.
const SWITCH_SETTLE_TIMEOUT_MS = 8000

/**
 * Returns a `connect()` function that opens the AppKit modal and
 * returns a promise resolving with the connected wallet's address
 * and name. Rejects on CONNECT_ERROR, USER_REJECTED, or when the
 * wallet cannot honor the active Safe's chain (UnsupportedChainError).
 */
export function useConnect() {
  const { open, disconnect, switchNetwork } = useAppKit()
  const { address, isConnected, chain } = useAccount()
  const { walletInfo } = useWalletInfo()
  const activeSafe = useAppSelector(selectActiveSafe)
  const pendingRef = useRef<PendingConnect | null>(null)
  const switchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Normalize to a canonical decimal CAIP-2 id so comparisons against Reown's
  // `caipNetworkId` (e.g. `eip155:1`) don't silently fail on zero-padded or
  // hex-encoded chainId strings from upstream config.
  const expectedCaipId: `eip155:${number}` | null = activeSafe ? `eip155:${parseInt(activeSafe.chainId, 10)}` : null

  const clearSwitchTimeout = () => {
    if (switchTimeoutRef.current) {
      clearTimeout(switchTimeoutRef.current)
      switchTimeoutRef.current = null
    }
  }

  const rejectUnsupported = () => {
    if (!pendingRef.current) {
      return
    }
    const { reject } = pendingRef.current
    pendingRef.current = null
    clearSwitchTimeout()
    void (async () => {
      try {
        await disconnect()
      } catch (error) {
        Logger.warn('Failed to disconnect after unsupported-chain connection:', error)
      }
    })()
    reject(new UnsupportedChainError())
  }

  // Resolver: only resolve when state is fully connected AND the wallet is on
  // the active Safe's chain. The chain gate prevents a race where the state
  // effect fires before the CONNECT_SUCCESS handler's switchNetwork settles.
  useEffect(() => {
    if (!pendingRef.current || !isConnected || !address || !walletInfo?.name || !walletInfo?.icon) {
      return
    }
    if (expectedCaipId && chain?.caipNetworkId !== expectedCaipId) {
      return
    }

    const { resolve } = pendingRef.current
    pendingRef.current = null
    clearSwitchTimeout()
    resolve({ address, walletName: walletInfo.name, walletIcon: walletInfo.icon })
  }, [isConnected, address, walletInfo, chain, expectedCaipId])

  useEffect(() => {
    return () => {
      pendingRef.current = null
      clearSwitchTimeout()
    }
  }, [])

  useStableAppKitEvent('CONNECT_SUCCESS', ({ data }) => {
    if (!pendingRef.current || !activeSafe || !expectedCaipId) {
      return
    }

    const { caipNetworkId } = data.properties
    const wrongChain = caipNetworkId && caipNetworkId !== expectedCaipId

    // Wallet connected on the right chain with an account — resolver will handle it.
    if (data.address && !wrongChain) {
      return
    }

    // Wallet is on a different chain but has an account. Try to switch; if the
    // switch throws, reject. If it resolves, the resolver useEffect handles
    // success — with a timeout safety net for wallets that resolve without
    // actually switching.
    switchNetwork(expectedCaipId)
      .then(() => {
        if (!pendingRef.current) {
          return
        }
        switchTimeoutRef.current = setTimeout(() => {
          Logger.warn('switchNetwork resolved but chain did not settle in time')
          rejectUnsupported()
        }, SWITCH_SETTLE_TIMEOUT_MS)
      })
      .catch((switchError) => {
        Logger.warn('Failed to switch network after unsupported-chain connection:', switchError)
        rejectUnsupported()
      })
  })

  useStableAppKitEvent('CONNECT_ERROR', ({ data }) => {
    if (!pendingRef.current) {
      return
    }
    const { reject } = pendingRef.current
    pendingRef.current = null
    clearSwitchTimeout()
    reject(new ConnectError(data.properties?.message || 'Connection failed'))
  })

  useStableAppKitEvent('USER_REJECTED', () => {
    if (!pendingRef.current) {
      return
    }
    const { reject } = pendingRef.current
    pendingRef.current = null
    clearSwitchTimeout()
    reject(new UserRejectedError())
  })

  const connect = useCallback(() => {
    return new Promise<ConnectResult>((resolve, reject) => {
      pendingRef.current = { resolve, reject }
      open({ view: 'Connect' })
    })
  }, [open])

  return connect
}
