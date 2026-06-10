import { useCallback, useEffect, useRef } from 'react'
import { Alert } from 'react-native'
import { useAccount, useAppKit, useWalletInfo } from '@reown/appkit-react-native'
import { getEip155ChainId } from '@safe-global/utils/features/walletconnect/utils'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { useAppSelector } from '@/src/store/hooks'
import Logger from '@/src/utils/logger'
import { useStableAppKitEvent } from './useStableAppKitEvent'

export interface ConnectResult {
  address: string
  walletName: string
  walletIcon: string
}

/**
 * Catastrophic / unknown CONNECT_ERROR rejected to consumers. The known
 * benign cases (`UnsupportedChain`, `UserRejected`, `ProposalExpired`) are
 * handled inside `useConnect` itself and surfaced as `connect()` resolving
 * to `null` (handled cancellations) or transparently retrying.
 */
export class ConnectError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConnectError'
  }
}

const showUnsupportedChainAlert = () => {
  Alert.alert(
    'Unsupported network',
    "The connected wallet doesn't support the network of the active Safe. Please connect a wallet that supports it, or switch to a different Safe.",
    [{ text: 'OK' }],
  )
}

// AppKit forwards the underlying SignClient/Universal Provider message verbatim
// in CONNECT_ERROR. The QR-code pairing proposal expires (~5 min default) before
// the wallet completes pairing, surfacing as "Proposal expired" — sometimes
// wrapped (e.g. "Pairing already exists: Proposal expired"). Word boundaries
// keep the match tight enough to avoid false positives on non-WC errors that
// happen to contain the substring.
export const isProposalExpiredMessage = (message: string): boolean => /\bproposal\s+expired\b/i.test(message)

interface PendingConnect {
  resolve: (result: ConnectResult | null) => void
  reject: (error: Error) => void
}

// How long to wait after a successful `switchNetwork` before concluding the
// wallet silently ignored the switch. Covers the known Reown behavior where
// switchNetwork resolves without actually changing chain when the internal
// connection state is stale.
const SWITCH_SETTLE_TIMEOUT_MS = 8000

export interface UseConnectOptions {
  /** Slug used in internal log messages, e.g. 'signer import'. */
  flow: string
}

/**
 * Returns a `connect()` function that opens the AppKit modal and resolves
 * with the connected wallet's address and name. The known benign failure
 * modes are handled inside this hook:
 *
 * - **Unsupported chain**: shows "Unsupported network" alert, disconnects,
 *   resolves to `null`.
 * - **User rejection**: logs at info level, closes the modal, resolves to `null`.
 * - **Proposal expired**: logs at warn level, disconnects, transparently
 *   reopens the modal with a fresh proposal — promise stays pending until
 *   the user either succeeds or hits one of the other paths.
 *
 * Only catastrophic / unrecognised CONNECT_ERROR cases reject (with
 * `ConnectError`); consumers handle those via `showConnectFallbackAlert`.
 */
export function useConnect({ flow }: UseConnectOptions) {
  const { open, close, disconnect, switchNetwork } = useAppKit()
  const { address, isConnected, chain } = useAccount()
  const { walletInfo } = useWalletInfo()
  const activeSafe = useAppSelector(selectActiveSafe)
  const pendingRef = useRef<PendingConnect | null>(null)
  const switchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Normalize to a canonical decimal CAIP-2 id so comparisons against Reown's
  // `caipNetworkId` (e.g. `eip155:1`) don't silently fail on zero-padded or
  // hex-encoded chainId strings from upstream config.
  const expectedCaipId = activeSafe ? getEip155ChainId(String(parseInt(activeSafe.chainId, 10))) : null

  const clearSwitchTimeout = () => {
    if (switchTimeoutRef.current) {
      clearTimeout(switchTimeoutRef.current)
      switchTimeoutRef.current = null
    }
  }

  const resolveUnsupported = () => {
    if (!pendingRef.current) {
      return
    }
    const { resolve } = pendingRef.current
    pendingRef.current = null
    clearSwitchTimeout()
    void (async () => {
      try {
        await disconnect()
      } catch (error) {
        Logger.warn(`Failed to disconnect after unsupported-chain connection during ${flow}:`, error)
      }
    })()
    showUnsupportedChainAlert()
    resolve(null)
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

    // If the wallet is not connected, we don't need to switch network
    if (!caipNetworkId) {
      return
    }

    const wrongChain = caipNetworkId !== expectedCaipId

    // Wallet connected on the right chain with an account — resolver will handle it.
    if (data.address && !wrongChain) {
      return
    }

    // Wallet is on a different chain but has an account. Try to switch; if the
    // switch throws, mark unsupported. If it resolves, the resolver useEffect
    // handles success — with a timeout safety net for wallets that resolve
    // without actually switching.
    switchNetwork(expectedCaipId)
      .then(() => {
        if (!pendingRef.current) {
          return
        }
        switchTimeoutRef.current = setTimeout(() => {
          Logger.warn('switchNetwork resolved but chain did not settle in time')
          resolveUnsupported()
        }, SWITCH_SETTLE_TIMEOUT_MS)
      })
      .catch((switchError) => {
        Logger.warn('Failed to switch network after unsupported-chain connection:', switchError)
        resolveUnsupported()
      })
  })

  useStableAppKitEvent('CONNECT_ERROR', ({ data }) => {
    if (!pendingRef.current) {
      return
    }
    const message = data.properties?.message || 'Connection failed'

    // Proposal expiry is benign and recoverable: tear down the stale pairing
    // and reopen the modal with a fresh proposal. pendingRef stays set so
    // the same promise can resolve once the user successfully scans.
    if (isProposalExpiredMessage(message)) {
      Logger.warn(`WalletConnect proposal expired during ${flow}, reopening connect modal`)
      void (async () => {
        try {
          await disconnect()
        } catch (disconnectError) {
          Logger.warn(`Failed to disconnect WC session after ${flow} error:`, disconnectError)
        }
        if (pendingRef.current) {
          open({ view: 'Connect' })
        }
      })()
      return
    }

    // Catastrophic / unrecognised error — surface to caller.
    const { reject } = pendingRef.current
    pendingRef.current = null
    clearSwitchTimeout()
    reject(new ConnectError(message))
  })

  useStableAppKitEvent('USER_REJECTED', () => {
    if (!pendingRef.current) {
      return
    }
    Logger.info(`User rejected WC connect during ${flow}`)
    close()
    const { resolve } = pendingRef.current
    pendingRef.current = null
    clearSwitchTimeout()
    resolve(null)
  })

  const connect = useCallback((): Promise<ConnectResult | null> => {
    return new Promise<ConnectResult | null>((resolve, reject) => {
      pendingRef.current = { resolve, reject }
      open({ view: 'Connect' })
    })
  }, [open])

  return connect
}
