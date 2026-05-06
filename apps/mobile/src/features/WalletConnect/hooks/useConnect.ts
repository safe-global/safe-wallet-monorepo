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

/**
 * QR-code pairing proposal expired before the wallet completed pairing
 * (default ~5 min). Treated as a benign, expected failure mode (downgraded
 * log severity, lighter cleanup messaging) but still requires the same
 * teardown as a generic ConnectError. Extends ConnectError so consumers
 * who only care about "any connect failure" still match via `instanceof`.
 */
export class ProposalExpiredError extends ConnectError {
  constructor(message: string) {
    super(message)
    this.name = 'ProposalExpiredError'
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
// the wallet completes pairing, surfacing as "Proposal expired" — sometimes
// wrapped (e.g. "Pairing already exists: Proposal expired"). Word boundaries
// keep the match tight enough to avoid promoting non-WC errors that happen
// to contain the substring. Used at the CONNECT_ERROR rejection site to
// upgrade plain ConnectError to ProposalExpiredError.
export const isProposalExpiredMessage = (message: string): boolean => /\bproposal\s+expired\b/i.test(message)

export interface WalletConnectErrorContext {
  /** Slug used in log messages, e.g. 'signer import' → "during signer import". */
  flow: string
  /** Title shown in the user-facing alert for unhandled errors. */
  alertTitle: string
  /** Body shown alongside `alertTitle`. */
  alertBody: string
  /** From `useAppKit()` — closes the modal sheet. */
  close: () => void
  /** From `useAppKit()` — typed `() => void` but returns a Promise at runtime. */
  disconnect: () => void
}

/**
 * Centralizes WalletConnect-flow error handling so logging, modal cleanup,
 * and user alerts stay consistent across consumers of `useConnect`.
 *
 * Behaviour by error class:
 * - `UnsupportedChainError` → `showUnsupportedChainAlert` (disconnect already
 *   handled inside `useConnect.rejectUnsupported`).
 * - `UserRejectedError` → `Logger.info` + `close()`. No alert (intentional
 *   cancellation).
 * - `ProposalExpiredError` → `Logger.warn` + cleanup + alert.
 * - Any other error → `Logger.error` + cleanup + alert.
 *
 * Cleanup runs `disconnect()` inside an awaited IIFE so async rejections from
 * AppKit don't escape as unhandled rejections. `close()` is called before
 * `Alert.alert` so the alert isn't hosted by a dismissing modal on iOS.
 */
export const handleWalletConnectError = (error: unknown, ctx: WalletConnectErrorContext): void => {
  if (error instanceof UnsupportedChainError) {
    showUnsupportedChainAlert()
    return
  }

  if (error instanceof UserRejectedError) {
    Logger.info(`User rejected WC connect during ${ctx.flow}`)
    ctx.close()
    return
  }

  if (error instanceof ProposalExpiredError) {
    Logger.warn(`WalletConnect proposal expired during ${ctx.flow}:`, error)
  } else {
    Logger.error(`Error during ${ctx.flow}:`, error)
  }

  // Tear down any half-formed pairing before dismissing the modal so we
  // don't leak relay subscriptions or ghost sessions on retry. AppKit's
  // useAppKit narrows disconnect to () => void, but the underlying call
  // returns a Promise — await inside an IIFE so async rejections are
  // captured rather than escaping as unhandled rejections.
  void (async () => {
    try {
      await ctx.disconnect()
    } catch (disconnectError) {
      Logger.warn(`Failed to disconnect WC session after ${ctx.flow} error:`, disconnectError)
    }
  })()
  ctx.close()
  Alert.alert(ctx.alertTitle, ctx.alertBody, [{ text: 'OK' }])
}

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
    const message = data.properties?.message || 'Connection failed'
    reject(isProposalExpiredMessage(message) ? new ProposalExpiredError(message) : new ConnectError(message))
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
