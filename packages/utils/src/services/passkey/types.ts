import type {
  ExtractedPasskeyData,
  GetPasskeyCredentialFn,
  PasskeyArgType,
  PasskeyCoordinates,
} from '@safe-global/protocol-kit'
import type { RelayTaskStatus } from '@safe-global/store/gateway/AUTO_GENERATED/relay'

export type { ExtractedPasskeyData, GetPasskeyCredentialFn, PasskeyArgType, PasskeyCoordinates, RelayTaskStatus }

/**
 * Persisted record of a passkey signer.
 *
 * Wire format follows the CGW coordinate-storage RFC (2026-04-27):
 * - `rawId` — base64url, no padding (matches `credentialId` in the RFC).
 * - `coordinates.x`, `coordinates.y` — protocol-kit's stringified BigInt form,
 *   passed straight back into `BigInt(x)` for factory calls.
 * - `identityContractAddresses` — chainId → EIP-55 address of the
 *   `SafeWebAuthnSignerProxy` on that chain. Per-chain because the proxy is
 *   CREATE2-derived from `(x, y, verifierAddress)` and the verifier address
 *   differs per chain. Lazily populated as the user signs on a new chain.
 * - `deployedOnChains` — chainId strings for which the proxy has been
 *   confirmed on-chain. Used to skip the relay round-trip on subsequent signs.
 */
export interface PasskeyMetadata {
  rawId: string
  coordinates: PasskeyCoordinates
  identityContractAddresses: Record<string, string>
  deployedOnChains: string[]
  name?: string
}

/**
 * Transport for the CGW relay endpoint. Both apps satisfy this with their
 * preferred binding (RTK Query mutation, direct fetch, etc.) — the shared
 * code never reaches into a global store.
 */
export interface RelayClient {
  relay(args: { chainId: string; to: string; data: string; version: string }): Promise<{ taskId: string }>
}

export type PasskeyGetFn = GetPasskeyCredentialFn

/**
 * Minimal storage contract. Both web (localStorage) and mobile (keychain)
 * implement this; shared code never imports either backend.
 */
export interface PasskeyStorage {
  getAll(): Promise<PasskeyMetadata[]>
  getByRawId(rawId: string): Promise<PasskeyMetadata | null>
  add(metadata: PasskeyMetadata): Promise<void>
  removeByRawId(rawId: string): Promise<void>
  markDeployedOnChain(rawId: string, chainId: string): Promise<void>
  setIdentityForChain(rawId: string, chainId: string, address: string): Promise<void>
}

/**
 * Thrown when `getP256VerifierAddress(chainId)` rejects because the chain
 * has no DaimoP256Verifier 0.2.1 deployment registered. Callers should
 * surface this as a chain-incompatibility error rather than a generic
 * signing failure.
 */
export class UnsupportedChainError extends Error {
  readonly chainId: string
  constructor(chainId: string, cause?: unknown) {
    super(`Passkey signing not supported on chain ${chainId}: missing DaimoP256Verifier deployment`)
    this.name = 'UnsupportedChainError'
    this.chainId = chainId
    if (cause !== undefined) {
      ;(this as { cause?: unknown }).cause = cause
    }
  }
}

/**
 * Thrown by `awaitDeployment` when the relay task reaches a terminal failure
 * status (Rejected = 400, Reverted = 500) or the watcher times out.
 */
export class IdentityDeploymentError extends Error {
  readonly chainId: string
  readonly taskId: string
  readonly status?: RelayTaskStatus['status']
  constructor(args: { chainId: string; taskId: string; status?: RelayTaskStatus['status']; message: string }) {
    super(args.message)
    this.name = 'IdentityDeploymentError'
    this.chainId = args.chainId
    this.taskId = args.taskId
    this.status = args.status
  }
}
