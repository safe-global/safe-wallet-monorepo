import { SafeProvider, getSafeWebAuthnSignerFactoryContract } from '@safe-global/protocol-kit'
import type { SafeVersion } from '@safe-global/types-kit'
import { LATEST_SAFE_VERSION } from '@safe-global/utils/config/constants'
import { RelayTxWatcher, RelayStatus, TIMEOUT_ERROR_CODE } from '@safe-global/utils/services/RelayTxWatcher'
import type { PasskeyCoordinates, RelayClient } from './types'
import { IdentityDeploymentError } from './types'
import { resolveVerifierAddress } from './identity'

/**
 * Encodes a `SafeWebAuthnSignerFactory.createSigner(x, y, verifiers)` call
 * for relay submission. Returns `{ to: <factory address>, data }` ready to
 * be passed to the relay endpoint.
 *
 * Pinned to factory v0.2.1 — same version CGW's relay endpoint validates
 * against (see safe-client-gateway PR #3061).
 */
export async function encodeCreateSignerCall(args: {
  rpcUrl: string
  chainId: string
  coordinates: PasskeyCoordinates
  safeVersion?: SafeVersion
}): Promise<{ to: string; data: string }> {
  const verifierAddress = resolveVerifierAddress(args.chainId)
  const safeProvider = new SafeProvider({ provider: args.rpcUrl })
  const safeVersion = args.safeVersion ?? (LATEST_SAFE_VERSION as SafeVersion)

  const factory = await getSafeWebAuthnSignerFactoryContract({ safeProvider, safeVersion })
  const data = factory.encode('createSigner', [
    BigInt(args.coordinates.x),
    BigInt(args.coordinates.y),
    BigInt(verifierAddress),
  ])
  return { to: factory.getAddress(), data }
}

/**
 * Submits a `createSigner` call to the CGW relay endpoint via the injected
 * `RelayClient`. Returns the relay task ID; callers should pass it to
 * `awaitDeployment` to block until the on-chain transaction is confirmed.
 */
export async function deployIdentity(args: {
  rpcUrl: string
  chainId: string
  coordinates: PasskeyCoordinates
  relay: RelayClient
  safeVersion?: SafeVersion
}): Promise<{ taskId: string }> {
  const { to, data } = await encodeCreateSignerCall({
    rpcUrl: args.rpcUrl,
    chainId: args.chainId,
    coordinates: args.coordinates,
    safeVersion: args.safeVersion,
  })
  return args.relay.relay({
    chainId: args.chainId,
    to,
    data,
    version: args.safeVersion ?? LATEST_SAFE_VERSION,
  })
}

/**
 * Polls the CGW relay status endpoint until the task reaches a terminal
 * state. Resolves on `Included` (200), throws `IdentityDeploymentError` on
 * `Rejected` (400), `Reverted` (500), or timeout. Delegates to the existing
 * `RelayTxWatcher` singleton so polling/timeout behaviour matches the rest
 * of the wallet.
 */
export async function awaitDeployment(args: {
  cgwBaseUrl: string
  chainId: string
  taskId: string
  onUpdate?: (status: RelayStatus) => void
}): Promise<{ transactionHash: string }> {
  const watcher = RelayTxWatcher.getInstance()
  try {
    const result = await watcher.watchTaskId(args.taskId, args.chainId, args.cgwBaseUrl, {
      onUpdate: (response) => args.onUpdate?.(response.status),
    })
    if (!result.receipt?.transactionHash) {
      throw new IdentityDeploymentError({
        chainId: args.chainId,
        taskId: args.taskId,
        status: result.status,
        message: 'Relay task included but receipt is missing',
      })
    }
    return { transactionHash: result.receipt.transactionHash }
  } catch (cause) {
    if (cause instanceof IdentityDeploymentError) {
      throw cause
    }
    const message = cause instanceof Error ? cause.message : String(cause)
    const isTimeout = cause instanceof Error && cause.cause === TIMEOUT_ERROR_CODE
    throw new IdentityDeploymentError({
      chainId: args.chainId,
      taskId: args.taskId,
      message: isTimeout ? `Identity contract deployment timed out: ${message}` : message,
    })
  }
}

export { RelayStatus }
